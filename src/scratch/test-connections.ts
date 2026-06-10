/* eslint-disable no-console */
import mongoose from "mongoose";
import { cloudinary } from "../lib/cloudinary";

async function testMongo() {
  console.log("--- Testing MongoDB Connection ---");
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/neet_analytics";
  console.log("URI:", uri.replace(/\/\/.*@/, "//***:***@")); // Hide credentials in log

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      dbName: "neet_analytics"
    });
    console.log("✓ MongoDB Connected Successfully!");
    console.log("Host:", conn.connection.host);
    console.log("Database Name:", conn.connection.db?.databaseName);
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.error("❌ MongoDB Connection Failed!");
    console.error("Error:", error);
    return false;
  }
}

async function testCloudinary() {
  console.log("\n--- Testing Cloudinary Connection ---");
  console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
  console.log("API Key:", process.env.CLOUDINARY_API_KEY ? `${process.env.CLOUDINARY_API_KEY.slice(0, 4)}...` : "not set");

  try {
    const result = await cloudinary.api.ping();
    console.log("✓ Cloudinary Connected Successfully!");
    console.log("Response:", result);
    return true;
  } catch (error) {
    console.error("❌ Cloudinary Connection Failed!");
    console.error("Error:", error);
    return false;
  }
}

async function main() {
  const mongoOk = await testMongo();
  const cloudinaryOk = await testCloudinary();

  console.log("\n=================================");
  if (mongoOk && cloudinaryOk) {
    console.log("🎉 ALL CONNECTIONS SUCCESSFUL! 🎉");
    process.exit(0);
  } else {
    console.log("❌ SOME CONNECTIONS FAILED. CHECK LOGS ABOVE. ❌");
    process.exit(1);
  }
}

main();
