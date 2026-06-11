import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const { connectToDatabase } = await import("../lib/mongodb");
  const { Test } = await import("../models/Test");
  const { detectMimeType } = await import("../lib/upload-validation");
  const { OcrPipelineService } = await import("../services/ocr/pipeline");
  const mongoose = (await import("mongoose")).default;

  await connectToDatabase();
  console.log("Connected to MongoDB.");
  console.log("DB Host:", mongoose.connection.host);
  console.log("DB Name:", mongoose.connection.name);

  const test = await Test.findOne({ processingStatus: "processing" }).lean();
  if (!test) {
    console.error("No processing test found in MongoDB Atlas.");
    process.exit(1);
  }
  
  console.log("Found test in Atlas:", test.testName);
  console.log("File URL:", test.uploadedFile);
  
  if (!test.uploadedFile) {
    console.error("No uploaded file url found.");
    process.exit(1);
  }

  const url = test.uploadedFile;
  console.log("Downloading file...");
  const response = await fetch(url);
  if (!response.ok) {
    console.error("Failed to fetch file:", response.statusText);
    process.exit(1);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  console.log("Downloaded buffer length:", buffer.length);
  
  let mimeType = detectMimeType(buffer);
  console.log("Detected MIME type:", mimeType);
  if (!mimeType) {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes(".pdf")) {
      mimeType = "application/pdf";
    } else if (lowerUrl.includes(".png")) {
      mimeType = "image/png";
    } else if (lowerUrl.includes(".webp")) {
      mimeType = "image/webp";
    } else {
      mimeType = "image/jpeg";
    }
    console.log("Fallback MIME type:", mimeType);
  }

  const ocrPipeline = new OcrPipelineService();
  console.log("Running OCR Pipeline...");
  const result = await ocrPipeline.processDocument(buffer, mimeType!);
  
  console.log("--- OCR Pipeline Result ---");
  console.log("Success:", result.success);
  console.log("Metadata:", {
    testName: result.testName,
    subject: result.subject,
    date: result.date
  });
  console.log("Questions extracted:", result.questions?.length);
  if (result.questions && result.questions.length > 0) {
    console.log("First question sample:", JSON.stringify(result.questions[0], null, 2));
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error("Execution failed:", err);
  process.exit(1);
});
