import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

console.log("MONGODB_URI in process.env:", process.env.MONGODB_URI);
console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
