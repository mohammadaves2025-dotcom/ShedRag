import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_ATLAS_URI;
if (!uri) {
  throw new Error("MONGODB_ATLAS_URI is not defined in .env");
}

export const client = new MongoClient(uri);

export function connectToDataBase() {
  const dbName = process.env.MONGODB_ATLAS_DB_NAME;
  const collName = process.env.MONGODB_ATLAS_COLLECTION_NAME;
  if (!dbName || !collName) {
    throw new Error("MONGODB_ATLAS_DB_NAME and MONGODB_ATLAS_COLLECTION_NAME must be set in .env");
  }
  return client.db(dbName).collection(collName);
}