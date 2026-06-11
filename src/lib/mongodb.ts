import { MongoClient } from "mongodb";
import mongoose from "mongoose";

import { env } from "@/lib/env";

declare global {
  var mongooseConnection: Promise<typeof mongoose> | undefined;
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

export function getMongoClient() {
  if (!global.mongoClientPromise) {
    const client = new MongoClient(env.MONGODB_URI);
    global.mongoClientPromise = client.connect();
  }

  return global.mongoClientPromise;
}

export async function connectToDatabase() {
  if (!global.mongooseConnection) {
    console.log(`[MongoDB] Connecting to database... (URI length: ${env.MONGODB_URI ? env.MONGODB_URI.length : 0})`);
    global.mongooseConnection = mongoose.connect(env.MONGODB_URI, {
      bufferCommands: false,
      dbName: "neet_analytics",
      serverSelectionTimeoutMS: 5000
    }).then((m) => {
      console.log(`[MongoDB] Connected successfully to database: ${m.connection.name}`);
      return m;
    }).catch((err) => {
      console.error("[MongoDB] Connection failed:", err);
      global.mongooseConnection = undefined; // Allow subsequent attempts to retry
      throw err;
    });
  }

  return global.mongooseConnection;
}
