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
    global.mongooseConnection = mongoose.connect(env.MONGODB_URI, {
      bufferCommands: false,
      dbName: "neet_analytics"
    });
  }

  return global.mongooseConnection;
}
