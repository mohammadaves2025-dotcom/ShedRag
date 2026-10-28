import "dotenv/config";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const MODEL = "gemini-embedding-001"; // confirm the code on Google's models page

// used only when ingesting documents
export const documentEmbeddings = new GoogleGenerativeAIEmbeddings({
  model: MODEL,
  taskType: "RETRIEVAL_DOCUMENT",
  apiKey: process.env.GEMINI_API_KEY
});

// used only when embedding a user's question (later, in the chat route)
export const queryEmbeddings = new GoogleGenerativeAIEmbeddings({
  model: MODEL,
  taskType: "RETRIEVAL_QUERY",
  apiKey: process.env.GEMINI_API_KEY
});