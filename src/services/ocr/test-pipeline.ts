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
  // For Q1, circle option A (student marking) and add a red teacher correction mark next to it
  console.log("Drawing mock student circle marking around Q1 option A...");
  drawMockCircle(paper, 128, 208, 18); // center x=128, y=208, radius=18 (covers A)
  
  console.log("Drawing mock red teacher correction check next to Q1 option A...");
  drawRedCorrectionMark(paper, 115, 205); // red check at x=115, y=205 (inside expanded box [108, 167])

  // For Q2, let's draw a TICK mark next to option B
  console.log("Drawing mock student tick marking next to Q2 option B...");
  drawMockTick(paper, 110, 445); // tick at x=110, y=445 (inside expanded box [108, 192])

  // Draw an X-mark next to/over Option C to verify X-mark rejection
  console.log("Drawing mock student X-mark (cross-out) over Q2 option C...");
  drawMockXMark(paper, 128, 488); // X mark directly over C label (inside expanded box [108, 192])

  // Draw a red correction mark next to Option D to verify red ink eraser on Q2
  console.log("Drawing mock red teacher correction mark next to Q2 option D...");
  drawRedCorrectionMark(paper, 115, 528); // red check next to D (inside expanded box [108, 192])

  // Export mock image for inspection/debug
  const outputPath = path.join(process.cwd(), "src/services/ocr/mock_scanned_paper.png");
  await paper.writeAsync(outputPath);
  console.log(`Saved mock paper asset to: ${outputPath}`);

  // 3. Process the mock paper through the OCR Pipeline
  console.log("Executing OCR Pipeline Service...");
  const pipeline = new OcrPipelineService({
    deskewEnabled: false, // mock paper has no skew
    denoiseEnabled: false,
    ocrLanguage: "simulated",
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

  // 5. Verification Assertions
  console.log("\n=== VERIFYING IGNORE LOGIC ===");
  if (!result.success || result.questions.length < 2) {
    throw new Error("Pipeline execution failed or did not return 2 questions.");
  }

  const q1 = result.questions[0];
  const q2 = result.questions[1];

  console.log(`Q1 Selected Answer: ${q1.selectedAnswer} (Expected: A)`);
  console.log(`Q2 Selected Answer: ${q2.selectedAnswer} (Expected: B)`);

  if (q1.selectedAnswer !== "A") {
    throw new Error(`Assertion Failed: Q1 selected answer is ${q1.selectedAnswer}, expected 'A'. Red ink or circle detection issue.`);
  }

  if (q2.selectedAnswer !== "B") {
    throw new Error(`Assertion Failed: Q2 selected answer is ${q2.selectedAnswer}, expected 'B'. X-mark rejection or red-ink eraser issue.`);
  }

  console.log("✓ OCR Pipeline successfully erased red ink and rejected X-marks!");
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
  // Draw thick left short leg of tick (8 pixels long, 2px wide)
  for (let i = 0; i < 8; i++) {
    image.setPixelColor(Jimp.rgbaToInt(30, 40, 90, 255), x + i, y + i);
    image.setPixelColor(Jimp.rgbaToInt(30, 40, 90, 255), x + i + 1, y + i);
  }
  // Draw thick right long leg of tick (18 pixels long, 2px wide)
  for (let i = 0; i < 18; i++) {
    image.setPixelColor(Jimp.rgbaToInt(30, 40, 90, 255), x + 7 + i, y + 7 - i);
    image.setPixelColor(Jimp.rgbaToInt(30, 40, 90, 255), x + 7 + i + 1, y + 7 - i);
  }
}

/**
 * Draws a mock pen X-mark stroke on the Jimp image
 */
function drawMockXMark(image: Jimp, x: number, y: number) {
  // Draw top-left to bottom-right line of X
  for (let i = 0; i < 12; i++) {
    image.setPixelColor(Jimp.rgbaToInt(30, 40, 90, 255), x + i, y + i);
    image.setPixelColor(Jimp.rgbaToInt(30, 40, 90, 255), x + i + 1, y + i);
  }
  // Draw bottom-left to top-right line of X
  for (let i = 0; i < 12; i++) {
    image.setPixelColor(Jimp.rgbaToInt(30, 40, 90, 255), x + i, y + 12 - i);
    image.setPixelColor(Jimp.rgbaToInt(30, 40, 90, 255), x + i + 1, y + 12 - i);
  }
}

/**
 * Draws a mock red correction check/X mark on the Jimp image (bright red)
 */
function drawRedCorrectionMark(image: Jimp, x: number, y: number) {
  // A red checkmark in bright red
  for (let i = 0; i < 10; i++) {
    image.setPixelColor(Jimp.rgbaToInt(240, 10, 10, 255), x + i, y + i);
  }
  for (let i = 0; i < 20; i++) {
    image.setPixelColor(Jimp.rgbaToInt(240, 10, 10, 255), x + 9 + i, y + 9 - i);
  }
}

// Run test
runTestPipeline().catch((err) => {
  console.error("Test pipeline script crashed:", err);
  process.exit(1);
});
