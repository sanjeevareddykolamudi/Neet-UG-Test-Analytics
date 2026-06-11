import fs from "fs";

// Load local .env file natively if it exists (Node 20+)
if (fs.existsSync(".env")) {
  try {
    if (typeof (process as any).loadEnvFile === "function") {
      (process as any).loadEnvFile(".env");
      console.log("[Server] Loaded local .env file natively inside load-env.");
    }
  } catch (err) {
    console.warn("[Server] Failed to load .env natively inside load-env:", err);
  }
}
