import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { askQuestion, retrieve } from "./src/retrieval.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ShED Forum RAG Intelligence API",
    model: "Google Gemini 3.5 Flash / Flash Lite",
    database: "MongoDB Atlas Vector Search",
    timestamp: new Date().toISOString()
  });
});

// Chat endpoint (Conversational RAG: history-aware condense + retrieve + multi-turn synthesis)
app.post("/api/chat", async (req, res) => {
  const startTime = Date.now();
  const { question, chatHistory = [], sourceType, limit = 4 } = req.body;

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "question is required as a string" });
  }

  try {
    const { answer, sources, chunks, reformulatedQuery } = await askQuestion(question, {
      chatHistory,
      sourceType,
      limit
    });
    
    const latencyMs = Date.now() - startTime;

    res.json({
      answer,
      sources,
      chunks: (chunks || []).map(c => ({
        text: c.text,
        score: c.score,
        sourceName: c.sourceName,
        sourceType: c.sourceType,
        pageOrUrl: c.pageOrUrl
      })),
      reformulatedQuery,
      latencyMs,
      retrievedCount: (chunks || []).length
    });
  } catch (err) {
    console.error("Error in /api/chat:", err);
    res.status(500).json({
      error: err.message || "Failed to process question",
      latencyMs: Date.now() - startTime
    });
  }
});

// Retrieval only endpoint (Inspect vector search without LLM generation)
app.post("/api/retrieve", async (req, res) => {
  const startTime = Date.now();
  const { question, sourceType, limit = 5 } = req.body;

  if (!question) {
    return res.status(400).json({ error: "question is required" });
  }

  try {
    const chunks = await retrieve(question, { limit, sourceType });
    const latencyMs = Date.now() - startTime;

    res.json({
      chunks: chunks.map(c => ({
        text: c.text,
        score: c.score,
        sourceName: c.sourceName,
        sourceType: c.sourceType,
        pageOrUrl: c.pageOrUrl
      })),
      count: chunks.length,
      latencyMs
    });
  } catch (err) {
    console.error("Error in /api/retrieve:", err);
    res.status(500).json({
      error: err.message || "Vector retrieval failed",
      latencyMs: Date.now() - startTime
    });
  }
});

// Sample chunks for preview
app.get("/api/sample-chunks", (req, res) => {
  try {
    const bookletPath = path.join(__dirname, "chunks-booklet.json");
    if (fs.existsSync(bookletPath)) {
      const data = JSON.parse(fs.readFileSync(bookletPath, "utf-8"));
      return res.json({ success: true, count: data.length, sample: data.slice(0, 10) });
    }
    res.json({ success: false, message: "No chunks file found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 ShED RAG Server is listening on http://localhost:${PORT}`);
});
