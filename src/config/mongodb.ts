import { MongoClient } from "mongodb";
import { env } from "@/config/env";

const client = new MongoClient(env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
});

export const mongoClient = client;
export const mongodb = client.db("nutrimind");
