import "dotenv/config";
import { readFileSync } from "node:fs";
import { Document } from "@langchain/core/documents";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { connectToDataBase, client } from "./connectDB.js";
import { documentEmbeddings } from "./gemini.js";

const BATCH_SIZE = 20;
const PAUSE_MS = 1500; // gentle on rate limits
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1. read the chunks saved by loadPdf.js (run node from Backend/)
const raw = JSON.parse(readFileSync("chunks-booklet.json", "utf-8"));
const chunks = raw.map(
  (c) => new Document({ pageContent: c.pageContent, metadata: c.metadata }),
);
console.log("Chunks to ingest:", chunks.length);

// 2. vector store
const collection = connectToDataBase();
const vectorStore = new MongoDBAtlasVectorSearch(documentEmbeddings, {
  collection,
  indexName: process.env.MONGODB_ATLAS_INDEX_NAME,
  textKey: "text",
  embeddingKey: "embedding",
});

// 3. remove old booklet chunks so re-running doesn't create duplicates
const del = await collection.deleteMany({ sourceType: "booklet" });
console.log("Old booklet chunks removed:", del.deletedCount);

// 4. embed + insert in small batches, with one retry per batch
for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
  const batch = chunks.slice(i, i + BATCH_SIZE);
  try {
    await vectorStore.addDocuments(batch);
  } catch (err) {
    console.warn(`Batch at ${i} failed (${err.message}). Retrying in 10s...`);
    await sleep(10000);
    await vectorStore.addDocuments(batch);
  }
  console.log(
    `Stored ${Math.min(i + BATCH_SIZE, chunks.length)} / ${chunks.length}`,
  );
  await sleep(PAUSE_MS);
}

// 5. sanity check
const sample = await collection.findOne({ sourceType: "booklet" });
console.log("Stored fields:", Object.keys(sample));
console.log("Embedding length:", sample.embedding?.length);
console.log(
  "Document count:",
  await collection.countDocuments({ sourceType: "booklet" }),
);

await client.close();
