import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const { connectToDatabase } = await import("../lib/mongodb");
  const mongoose = (await import("mongoose")).default;

  await connectToDatabase();
  console.log("Connected to MongoDB.");
  
  const db = mongoose.connection.db;
  if (!db) {
    console.error("DB connection not established.");
    process.exit(1);
  }
  
  const tests = await db.collection("tests").find({}).toArray();
  console.log("--- Tests and UserIds ---");
  for (const t of tests) {
    console.log({
      id: t._id,
      testName: t.testName,
      userId: t.userId,
      userIdType: typeof t.userId,
      processingStatus: t.processingStatus,
      createdAt: t.createdAt
    });
  }
  
  const users = await db.collection("users").find({}).toArray();
  console.log("--- Users in DB ---");
  for (const u of users) {
    console.log({
      id: u._id,
      name: u.name,
      email: u.email
    });
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error("Execution failed:", err);
  process.exit(1);
});
