import { MongoClient, Db } from "mongodb";

const DB_NAME = "elobot";

let clientPromise: Promise<MongoClient> | null = null;

function getClient(): Promise<MongoClient> {
  if (!clientPromise) {
    const uri = process.env.MONGO_URL;
    if (!uri) throw new Error("MONGO_URL is not set");
    clientPromise = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      retryReads: true,
    }).connect();
  }
  return clientPromise;
}

/** Shared connection to the bot's `elobot` database. Read-only by convention. */
export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(DB_NAME);
}
