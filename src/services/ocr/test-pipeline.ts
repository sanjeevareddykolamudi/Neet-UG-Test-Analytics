import Jimp from "jimp";
import * as fs from "fs";
import * as path from "path";
import { OcrPipelineService } from "./pipeline";

async function runTestPipeline() {
  console.log("=== STARTING OCR & CV PIPELINE TEST RUN ===");

  // 1. Create a mock scanned question paper image using Jimp
  console.log("Generating mock exam paper image...");
  const width = 1200;
  const height = 1600;
  const paper = new Jimp(width, height, 0xFFFFFFFF); // White background

  // Load standard font to print text
  const font = await Jimp.loadFont(Jimp.FONT_SANS_16_BLACK);

  // Print Question 1
  paper.print(font, 100, 150, "Q1. What is the efficiency of a Carnot engine working between 127 C and 27 C?");
  paper.print(font, 120, 200, "A) 25%       B) 50%       C) 75%       D) 33.3%");

  // Print Question 2 (vertical options)
  paper.print(font, 100, 350, "Q2. Which of the following Mendelian disorders is sex-linked recessive?");
  paper.print(font, 120, 400, "A) Sickle-cell anemia");
  paper.print(font, 120, 440, "B) Haemophilia");
  paper.print(font, 120, 480, "C) Phenylketonuria");
  paper.print(font, 120, 520, "D) Thalassemia");

  // 2. Draw mock handwritten markings directly on the paper
  // For Q1, let's CIRCLE option A
  console.log("Drawing mock student circle marking around Q1 option A...");
  drawMockCircle(paper, 128, 208, 18); // center x=128, y=208, radius=18 (covers A)

  // For Q2, let's draw a TICK mark next to option B
  console.log("Drawing mock student tick marking next to Q2 option B...");
  drawMockTick(paper, 105, 448); // tick at x=105, y=448 (near option B)

  // Export mock image for inspection/debug
  const outputPath = path.join(process.cwd(), "src/services/ocr/mock_scanned_paper.png");
  await paper.writeAsync(outputPath);
  console.log(`Saved mock paper asset to: ${outputPath}`);

  // 3. Process the mock paper through the OCR Pipeline
  console.log("Executing OCR Pipeline Service...");
  const pipeline = new OcrPipelineService({
    deskewEnabled: false, // mock paper has no skew
    denoiseEnabled: false,
    debugMode: true
  });

  const imgBuffer = fs.readFileSync(outputPath);
  const result = await pipeline.processDocument(imgBuffer, "image/png");

  // 4. Output results
  console.log("\n=== PIPELINE EXECUTION RESULTS ===");
  console.log(`Success: ${result.success}`);
  console.log(`Processed Pages: ${result.processedPagesCount}`);
  console.log(`Overall Confidence: ${result.overallConfidence}%`);
  console.log(`Processing Time: ${result.processingTimeMs}ms`);
  
  if (result.error) {
    console.error(`Error: ${result.error}`);
  }

  console.log("\nExtracted Structured Data (JSON):");
  console.log(JSON.stringify(result.questions, null, 2));

  // Save JSON output
  const jsonOutputPath = path.join(process.cwd(), "src/services/ocr/output_structured_data.json");
  fs.writeFileSync(jsonOutputPath, JSON.stringify(result.questions, null, 2));
  console.log(`Saved extracted JSON payload to: ${jsonOutputPath}`);

  console.log("\n=== TEST RUN FINISHED ===");
}

/**
 * Draws a mock pencil circle stroke on the Jimp image
 */
function drawMockCircle(image: Jimp, cx: number, cy: number, r: number) {
  const thickness = 2;
  for (let th = 0; th < thickness; th++) {
    const currentRadius = r + th;
    // Circle drawing using mid-point algorithm or trigonometric points
    for (let theta = 0; theta < 360; theta += 1) {
      const rad = (theta * Math.PI) / 180;
      const x = Math.round(cx + currentRadius * Math.cos(rad));
      const y = Math.round(cy + currentRadius * Math.sin(rad));
      // Draw dark pencil grey color (RGBA)
      image.setPixelColor(Jimp.rgbaToInt(50, 50, 60, 255), x, y);
    }
  }
}

/**
 * Draws a mock pen tick stroke on the Jimp image
 */
function drawMockTick(image: Jimp, x: number, y: number) {
  // Draw left short leg of tick
  for (let i = 0; i < 6; i++) {
    image.setPixelColor(Jimp.rgbaToInt(30, 40, 90, 255), x + i, y + i);
  }
  // Draw right long leg of tick
  for (let i = 0; i < 14; i++) {
    image.setPixelColor(Jimp.rgbaToInt(30, 40, 90, 255), x + 5 + i, y + 5 - i);
  }
}

// Run test
runTestPipeline().catch((err) => {
  console.error("Test pipeline script crashed:", err);
});
