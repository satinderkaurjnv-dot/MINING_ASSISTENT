import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

const MONGODB_DB =
  process.env.MONGODB_DB || "mining_discovery";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongoDB(): Promise<Db> {
  if (db) {
    return db;
  }

  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is missing in .env.local"
    );
  }

  client = new MongoClient(MONGODB_URI);

  await client.connect();

  db = client.db(MONGODB_DB);

  console.log(
    `MongoDB connected successfully: ${MONGODB_DB}`
  );

  return db;
}