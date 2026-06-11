import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const { connectToDatabase } = await import("../lib/mongodb");
  const mongoose = (await import("mongoose")).default;

  await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) {
    console.error("DB connection not established.");
    process.exit(1);
  }
  
  const tests = await db.collection("tests").find({}).toArray();
  console.log("--- Tests isDeleted status ---");
  for (const t of tests) {
    console.log({
      id: t._id,
      testName: t.testName,
      userId: t.userId,
      isDeleted: t.isDeleted,
      processingStatus: t.processingStatus
    });
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
