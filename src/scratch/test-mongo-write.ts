/* eslint-disable no-console */
import mongoose from "mongoose";
import { User } from "../models/User";
import { connectToDatabase } from "../lib/mongodb";

async function main() {
  console.log("Connecting to MongoDB Atlas...");
  await connectToDatabase();

  const mockEmail = `atlas-test-${Date.now()}@example.com`;
  console.log(`Testing write access by creating user: ${mockEmail}`);

  try {
    // 1. Create a user
    const user = await User.create({
      email: mockEmail,
      name: "Atlas Verification User",
      role: "student",
      googleId: "mock-atlas-id"
    });
    console.log("✓ Write Successful! User created with ID:", user._id);

    // 2. Read the user back
    console.log("Testing read access...");
    const foundUser = await User.findOne({ email: mockEmail }).lean();
    if (foundUser) {
      console.log("✓ Read Successful! Retrieved User:", foundUser.name);
    } else {
      throw new Error("Could not find the user that was just created!");
    }

    // 3. Clean up (delete the user)
    console.log("Cleaning up test user...");
    const deleteResult = await User.deleteOne({ email: mockEmail });
    console.log("✓ Delete Successful! Deleted count:", deleteResult.deletedCount);

    console.log("\n=================================");
    console.log("🎉 MONGO ATLAS READ/WRITE VALIDATED! 🎉");
    console.log("Your MongoDB Atlas connection is fully functional");
    console.log("with complete read, write, and delete permissions.");
    console.log("=================================\n");
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ MongoDB Atlas Test Failed!");
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

main();
