/* eslint-disable no-console */
import { connectToDatabase } from "../lib/mongodb";
import { User } from "../models/User";
import { QuestionBank } from "../models/QuestionBank";
import { Test } from "../models/Test";
import { TestAttempt } from "../models/TestAttempt";
import { MistakeJournal } from "../models/MistakeJournal";
import { RevisionTask } from "../models/RevisionTask";
import { UserTopicStats } from "../models/UserTopicStats";
import { UserChapterStats } from "../models/UserChapterStats";
import mongoose from "mongoose";

async function main() {
  console.log("Connecting to Database to clear all data...");
  await connectToDatabase();

  console.log("Emptying database collections...");

  const r1 = await Test.deleteMany({});
  console.log(`✓ Deleted ${r1.deletedCount} tests.`);

  const r2 = await TestAttempt.deleteMany({});
  console.log(`✓ Deleted ${r2.deletedCount} test attempts.`);

  const r3 = await QuestionBank.deleteMany({});
  console.log(`✓ Deleted ${r3.deletedCount} question bank entries.`);

  const r4 = await MistakeJournal.deleteMany({});
  console.log(`✓ Deleted ${r4.deletedCount} mistake journal logs.`);

  const r5 = await RevisionTask.deleteMany({});
  console.log(`✓ Deleted ${r5.deletedCount} revision tasks.`);

  const r6 = await UserTopicStats.deleteMany({});
  console.log(`✓ Deleted ${r6.deletedCount} topic stats.`);

  const r7 = await UserChapterStats.deleteMany({});
  console.log(`✓ Deleted ${r7.deletedCount} chapter stats.`);

  const r8 = await User.deleteMany({});
  console.log(`✓ Deleted ${r8.deletedCount} users.`);

  console.log("Database cleared successfully!");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Failed to clear database:", err);
  process.exit(1);
});
