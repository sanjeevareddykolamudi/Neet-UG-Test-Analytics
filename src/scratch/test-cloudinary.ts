/* eslint-disable no-console */
import { cloudinary } from "../lib/cloudinary";

async function main() {
  console.log("Verifying Cloudinary connection...");
  console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
  console.log("API Key:", process.env.CLOUDINARY_API_KEY ? `${process.env.CLOUDINARY_API_KEY.slice(0, 4)}...` : "not set");

  try {
    const result = await cloudinary.api.ping();
    console.log("=================================");
    console.log("🎉 CLOUDINARY CONNECTION SUCCESS! 🎉");
    console.log("Response:", result);
    console.log("=================================");
    process.exit(0);
  } catch (error) {
    console.error("=================================");
    console.error("❌ CLOUDINARY CONNECTION FAILED! ❌");
    console.error("Error details:", error);
    console.error("=================================");
    process.exit(1);
  }
}

main();
