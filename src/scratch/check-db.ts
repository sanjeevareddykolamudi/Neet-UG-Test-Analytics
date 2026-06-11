import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const { connectToDatabase } = await import("../lib/mongodb");
  const { Test } = await import("../models/Test");
  const mongoose = (await import("mongoose")).default;

  await connectToDatabase();
  console.log("Connected to MongoDB.");
  console.log("DB Host:", mongoose.connection.host);
  console.log("DB Name:", mongoose.connection.name);
  
  const count = await Test.countDocuments({});
  console.log("Total tests count:", count);

  const tests = await Test.find({}).lean();
  console.log("--- Tests in DB ---");
  for (const t of tests) {
    console.log({
      id: t._id,
      testName: t.testName,
      processingStatus: t.processingStatus,
      statusMessage: t.statusMessage || "(no message)",
      uploadedFile: t.uploadedFile ? t.uploadedFile.slice(0, 60) + "..." : "(none)",
      createdAt: t.createdAt
    });
  }
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
