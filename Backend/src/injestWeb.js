// Scrape the ShED Forum website, chunk it, embed it, and store it in Atlas.
import "dotenv/config";
import { writeFileSync } from "node:fs";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { documentEmbeddings } from "./gemini.js";
import { connectToDataBase, client } from "./connectDB.js";

const BASE = "https://theshedforum.vercel.app";
const CONTENT_SELECTOR = "main";
const SOURCE_TYPES = ["website", "story", "patron"];
const BATCH_SIZE = 20;
const PAUSE_MS = 1500;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const pages = [
  ...["/", "/about", "/centre", "/sgc-centre", "/projects", "/contact", "/units",
      "/manuu-unit", "/jmi-unit", "/amu-unit", "/jnu-unit", "/du-unit", "/hcu-unit", "/patna-unit",
      "/publications", "/news-and-events"].map((p) => ({ path: p, sourceType: "website" })),
  // add only after you've checked consent and content:
  // ...Array.from({ length: 10 }, (_, i) => ({ path: `/student-stories/story-${i + 1}`, sourceType: "story" })),
  // { path: "/patrons-message", sourceType: "patron" },
  // { path: "/donate", sourceType: "website" },
];

// ---------- SCRAPE ----------
const allDocs = [];

for (const { path, sourceType } of pages) {
  const url = BASE + path;
  try {
    const loader = new PuppeteerWebBaseLoader(url, {
      launchOptions: { headless: true },
      gotoOptions: { waitUntil: "networkidle2" },
      evaluate: async (page) => {
        await page.waitForSelector(CONTENT_SELECTOR, { timeout: 15000 });
        await new Promise((r) => setTimeout(r, 2000)); // let API data render
        return await page.evaluate(
          (sel) => document.querySelector(sel)?.innerText ?? "",
          CONTENT_SELECTOR
        );
      },
    });

    const docs = await loader.load();
    for (const d of docs) {
      if (!d.pageContent.trim()) {
        console.warn("Empty page, skipped:", url);
        continue;
      }
      d.metadata = {
        sourceType,
        sourceName: "ShED Forum website",
        pageOrUrl: url,
        scrapedAt: new Date().toISOString().slice(0, 10),
      };
      allDocs.push(d);
    }
    console.log("Scraped:", url);
  } catch (err) {
    console.warn("Failed to scrape", url, "-", err.message);
  }
}

if (allDocs.length === 0) {
  throw new Error("No pages scraped. Check CONTENT_SELECTOR and the URL list.");
}
console.log("Pages scraped:", allDocs.length);

// ---------- CHUNK ----------
const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
const chunks = await splitter.splitDocuments(allDocs);
console.log("Total chunks:", chunks.length);

writeFileSync("chunks.json", JSON.stringify(chunks, null, 2));
console.log(`Saved ${chunks.length} chunks to chunks.json. Read it before trusting the embeddings.`);

// ---------- VECTOR STORE ----------
const collection = connectToDataBase();
const vectorStore = new MongoDBAtlasVectorSearch(documentEmbeddings, {
  collection,
  indexName: process.env.MONGODB_ATLAS_INDEX_NAME,
  textKey: "text",
  embeddingKey: "embedding",
});

// ---------- STORE (only after a successful scrape and chunk) ----------
const del = await collection.deleteMany({ sourceType: { $in: SOURCE_TYPES } });
console.log("Old website chunks removed:", del.deletedCount);

for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
  const batch = chunks.slice(i, i + BATCH_SIZE);
  try {
    await vectorStore.addDocuments(batch);
  } catch (err) {
    console.warn(`Batch at ${i} failed (${err.message}). Retrying in 10s...`);
    await sleep(10000);
    await vectorStore.addDocuments(batch);
  }
  console.log(`Stored ${Math.min(i + BATCH_SIZE, chunks.length)} / ${chunks.length}`);
  await sleep(PAUSE_MS);
}

console.log("Stored website chunks:", await collection.countDocuments({ sourceType: { $in: SOURCE_TYPES } }));
await client.close();