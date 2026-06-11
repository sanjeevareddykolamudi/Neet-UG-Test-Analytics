import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { connectToDatabase } from "../lib/mongodb";

// Routes
import authRouter from "./routes/auth";
import testsRouter from "./routes/tests";
import dashboardRouter from "./routes/dashboard";
import analyticsRouter from "./routes/analytics";
import uploadsRouter from "./routes/uploads";
import questionsRouter from "./routes/questions";
import mistakesRouter from "./routes/mistakes";
import revisionRouter from "./routes/revision";

import fs from "fs";

// Load local .env file natively if it exists (Node 20+)
if (fs.existsSync(".env")) {
  try {
    if (typeof (process as any).loadEnvFile === "function") {
      (process as any).loadEnvFile(".env");
      console.log("[Server] Loaded local .env file natively.");
    }
  } catch (err) {
    console.warn("[Server] Failed to load .env natively:", err);
  }
}

const isProduction = process.env.APP_ENV === "production" || process.env.NODE_ENV === "production";
const PORT = isProduction ? (process.env.PORT || 10000) : 5000;

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: true, // Allow dev client origin dynamically
  credentials: true
}));

// Express Health Check fast-path
app.get("/health", (req, res) => {
  return res.status(200).send("OK");
});

// API Routing
app.use("/api/auth", authRouter);
app.use("/api/tests", testsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api/questions", questionsRouter);
app.use("/api/mistakes", mistakesRouter);
app.use("/api/revision-tasks", revisionRouter);

// Serve Static React assets in Production
const clientPath = path.resolve(__dirname, "../../dist/client");
app.use(express.static(clientPath));

app.get("*", (req, res) => {
  // If request hits route that is not API, serve React App
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.resolve(clientPath, "index.html"));
  } else {
    res.status(404).json({ error: "API route not found" });
  }
});

// Database and Server Start
(async () => {
  try {
    console.log("[Server] Pre-connecting to database...");
    await connectToDatabase();
    console.log("[Server] Database connected successfully.");
  } catch (err) {
    console.error("[Server] Database connection failed at startup:", err);
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`[Server] Server is running on http://0.0.0.0:${PORT}`);
  });
})();
