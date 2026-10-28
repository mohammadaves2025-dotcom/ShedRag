import { fileURLToPath } from "url";
import path from "path";
import { writeFileSync } from "node:fs";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfPath = path.join(__dirname, "data", "ShED Forum Booklet.pdf");

// 1. LOAD: one Document per page

const loader = new PDFLoader(pdfPath);
const pages = await loader.load();
console.log(`\n===== ${path.basename(pdfPath)} =====`);

console.log("Pages loaded:", pages);
console.log("Pages loaded:", pages.length);
console.log("Raw metadata of page 1:", pages[0].metadata);

pages.forEach((p, i) =>
  console.log(`Page ${i + 1}: ${p.pageContent.length} chars`),
);

// 2. CLEAN + STANDARD METADATA

const MIN_CHARS = 50; // skips photo pages with almost no text
const docs = [];

for (const p of pages) {

  const text = p.pageContent.replace(/\s+\n/g, "\n").trim();
  if (text.length < MIN_CHARS) {
    console.warn("Skipped near-empty page:", p.metadata?.loc?.pageNumber);
    continue;
  }

  p.pageContent = text;
  p.metadata = {
    sourceType: "booklet",
    sourceName: "ShED Forum Booklet",
    pageOrUrl: p.metadata?.loc?.pageNumber ?? null, // confirm this key in the raw metadata printed above
    // docDate: "YYYY-MM",   // add the booklet's date when you know it
  };
  docs.push(p);
}
console.log("Pages kept:", docs.length);

// 3. SPLIT

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

const chunks = await splitter.splitDocuments(docs);
console.log("Total chunks:", chunks.length);

// 4. PREVIEW: read these yourself
const i = Math.min(3, chunks.length - 2);
console.log(`\n--- chunk ${i} ---\n${chunks[i].pageContent}`);
console.log(
  `\n--- chunk ${i + 1} (starts) ---\n${chunks[i + 1].pageContent.slice(0, 200)}`,
);
console.log("\nMetadata:", chunks[i].metadata);

// 5. SAVE for the embedding script
writeFileSync("chunks-booklet.json", JSON.stringify(chunks, null, 2));
console.log(`Saved ${chunks.length} chunks to chunks-booklet.json`);
