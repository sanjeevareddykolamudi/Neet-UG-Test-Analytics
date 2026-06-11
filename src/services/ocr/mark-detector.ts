/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
import type Jimp from "jimp";
import { OcrQuestion, BoundingBox } from "./types";

// OpenCV loading wrapper
let cvInstance: any = null;
let cvLoadingPromise: Promise<{ cv: any } | null> | null = null;

function loadOpenCV(): Promise<{ cv: any } | null> {
  if (cvInstance) return Promise.resolve({ cv: cvInstance });
  if (cvLoadingPromise) return cvLoadingPromise;

  cvLoadingPromise = new Promise<{ cv: any } | null>((resolve) => {
    try {
      const cvModule = require("@techstark/opencv-js");
      if (cvModule.Mat) {
        cvInstance = cvModule;
        resolve({ cv: cvInstance });
        return;
      }

      const interval = setInterval(() => {
        if (cvModule.Mat) {
          clearInterval(interval);
          cvInstance = cvModule;
          resolve({ cv: cvInstance });
        }
      }, 50);

      setTimeout(() => {
        clearInterval(interval);
        console.warn("OpenCV loading timed out. Falling back to Jimp.");
        resolve(null);
      }, 5000);

    } catch (error) {
      console.warn("OpenCV.js loading failed. OCR pipeline will fall back to Jimp image processing:", error);
      resolve(null);
    }
  });

  return cvLoadingPromise;
}

export class MarkDetector {
  private markThreshold: number;

  constructor(markThreshold: number = 0.15) {
    // Threshold ratio of marked pixels relative to total ROI pixels
    this.markThreshold = markThreshold;
  }

  /**
   * Analyzes each option's Region of Interest (ROI) to detect student answers.
   * Supports ticks, circles, underlines, and filled circles.
   */
  async detectMarkedAnswers(
    questions: OcrQuestion[],
    enhancedBuffer: Buffer,
    rawMat?: any
  ): Promise<OcrQuestion[]> {
    const cvWrapper = await loadOpenCV();
    const cv = cvWrapper?.cv;
    const JimpVal = require("jimp");
    const jimpImage = await JimpVal.read(enhancedBuffer);
    
    for (const q of questions) {
      const rois = q.roiCoordinates;
      if (!rois) continue;

      const scores: Record<"A" | "B" | "C" | "D", number> = { A: 0, B: 0, C: 0, D: 0 };
      const keys = ["A", "B", "C", "D"] as const;

      for (const key of keys) {
        const bbox = rois[key];
        
        // Expand bounding box slightly to capture surrounding ticks, circles, or underlines
        const expandedBbox: BoundingBox = {
          x: Math.max(0, bbox.x - 12),
          y: Math.max(0, bbox.y - 12),
          width: Math.min(jimpImage.bitmap.width - bbox.x, bbox.width + 24),
          height: Math.min(jimpImage.bitmap.height - bbox.y, bbox.height + 24)
        };

        if (cv && rawMat) {
          // OpenCV contour and density analysis
          scores[key] = this.analyzeMarkOpenCV(cv, rawMat, expandedBbox);
        } else {
          // Jimp fallback density analysis (pixel contrast counting)
          scores[key] = this.analyzeMarkJimp(jimpImage, expandedBbox);
        }
      }

      // Find the option with the highest score
      let bestOption: "A" | "B" | "C" | "D" | null = null;
      let highestScore = 0;

      for (const key of keys) {
        if (scores[key] > highestScore) {
          highestScore = scores[key];
          bestOption = key;
        }
      }

      // Determine if the best score is high enough to count as an attempt
      // Baseline printed letter consumes some pixels, so threshold is normally around 15-20%
      const attemptThreshold = cv ? 25 : 20; // OpenCV score is calibrated 0-100, Jimp is raw pixel ratio

      if (bestOption && highestScore > attemptThreshold) {
        q.selectedAnswer = bestOption;
        q.confidence.markDetection = Math.round(Math.min(100, highestScore * (cv ? 1 : 4))); // scale confidence
      } else {
        q.selectedAnswer = "Unattempted";
        q.confidence.markDetection = 100; // high confidence it's unattempted
      }

      // Calculate overall confidence combining OCR text confidence and mark contrast
      q.confidence.overall = Math.round((q.confidence.ocr + q.confidence.markDetection) / 2);
    }

    return questions;
  }

  /**
   * OpenCV contour and pixel density analysis of the ROI.
   * Returns a score between 0 and 100 indicating marking likelihood.
   */
  private analyzeMarkOpenCV(cv: any, srcMat: any, bbox: BoundingBox): number {
    try {
      // 1. Crop Region of Interest (ROI)
      const rect = new cv.Rect(bbox.x, bbox.y, bbox.width, bbox.height);
      const roi = srcMat.roi(rect);

      // Convert to binary
      const gray = new cv.Mat();
      cv.cvtColor(roi, gray, cv.COLOR_RGBA2GRAY);
      
      const binary = new cv.Mat();
      cv.threshold(gray, binary, 127, 255, cv.THRESH_BINARY_INV); // invert: black marks become white pixels

      // 2. Count non-zero (white/marked) pixels
      const totalPixels = bbox.width * bbox.height;
      const whitePixelCount = cv.countNonZero(binary);
      const densityRatio = whitePixelCount / totalPixels;

      // 3. Find contours inside ROI to detect specific shapes (circles, ticks)
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat();
      cv.findContours(binary, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      let maxArea = 0;
      let hasCircleLikeContour = false;
      let hasTickLikeContour = false;
      let hasUnderlineContour = false;

      for (let i = 0; i < contours.size(); ++i) {
        const cnt = contours.get(i);
        const area = cv.contourArea(cnt);
        if (area > maxArea) {
          maxArea = area;
        }

        // Bounding rect details
        const r = cv.boundingRect(cnt);
        const aspectRatio = r.width / r.height;
        const solidity = r.width * r.height > 0 ? area / (r.width * r.height) : 0;

        // Circularity check (Circles)
        const perimeter = cv.arcLength(cnt, true);
        let circularity = 0;
        if (perimeter > 0) {
          circularity = (4 * Math.PI * area) / (perimeter * perimeter);
          if (circularity > 0.6 && area > 200) {
            hasCircleLikeContour = true;
          }
        }

        // Underline check (long horizontal contour in the lower half of ROI)
        if (aspectRatio > 3.0 && r.width > bbox.width * 0.5 && r.y > bbox.height * 0.5) {
          hasUnderlineContour = true;
        }

        // Reject/Ignore X marks (crossed out):
        // An X mark is a diagonal cross with square-ish aspect ratio but low solidity (lots of empty space inside bounding box)
        let isXMark = false;
        if (aspectRatio > 0.75 && aspectRatio < 1.25 && solidity < 0.25 && circularity < 0.4 && area > 30) {
          isXMark = true;
        }

        // Tick mark check (diagonal stroke aspect ratio)
        if (!isXMark && aspectRatio > 0.8 && aspectRatio < 1.8 && r.width > 10 && r.height > 10) {
          hasTickLikeContour = true;
        }
      }

      // Cleanup local mats
      roi.delete();
      gray.delete();
      binary.delete();
      contours.delete();
      hierarchy.delete();

      // 4. Calculate weighted score (0 - 100)
      let score = densityRatio * 100; // density base score

      if (hasCircleLikeContour) score += 30; // boost for circling
      if (hasTickLikeContour && maxArea > 80) score += 25; // boost for ticks
      if (hasUnderlineContour) score += 20; // boost for underlines

      return Math.min(100, score);
    } catch (e) {
      console.error("[DEBUG] Error in analyzeMarkOpenCV:", e);
      // Return 0 if rectangle lies outside image boundaries
      return 0;
    }
  }

  /**
   * Fallback pure-JS Jimp density analysis.
   * Measures ratio of dark pixels in binarized crop bounding box.
   */
  private analyzeMarkJimp(jimpImage: Jimp, bbox: BoundingBox): number {
    let darkPixels = 0;
    let totalPixels = 0;

    for (let dy = 0; dy < bbox.height; dy++) {
      for (let dx = 0; dx < bbox.width; dx++) {
        const px = bbox.x + dx;
        const py = bbox.y + dy;
        
        if (px >= 0 && px < jimpImage.bitmap.width && py >= 0 && py < jimpImage.bitmap.height) {
          const hex = jimpImage.getPixelColor(px, py);
          const JimpVal = require("jimp");
          const { r, g, b } = JimpVal.intToRGBA(hex);
          // Greyscale intensity
          const intensity = 0.299 * r + 0.587 * g + 0.114 * b;
          // In binarized enhanced scans, background is white (255) and print is black (0)
          if (intensity < 127) {
            darkPixels++;
          }
          totalPixels++;
        }
      }
    }

    if (totalPixels === 0) return 0;
    const ratio = darkPixels / totalPixels;
    
    // Character baseline ratio (printed text consumes ~5-12% of ROI box)
    // Ticks or circles push it above 15%
    return ratio * 100; // return percentage
  }
}
