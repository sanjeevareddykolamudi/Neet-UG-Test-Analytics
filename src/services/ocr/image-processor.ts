/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports, prefer-const */
import type Jimp from "jimp";
import { OcrPipelineConfig } from "./types";

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

export class ImageProcessor {
  private config: OcrPipelineConfig;

  constructor(config: OcrPipelineConfig) {
    this.config = config;
  }

  /**
   * Decodes PNG/JPG buffer using Jimp
   */
  async decodeImage(imageBuffer: Buffer): Promise<Jimp> {
    const JimpVal = require("jimp");
    return JimpVal.read(imageBuffer);
  }

  /**
   * Enhances image using OpenCV.js (deskew, denoise, contrast thresholding).
   * If OpenCV is unavailable, falls back to Jimp filters.
   */
  async enhanceImage(jimpImage: Jimp): Promise<{
    enhancedBuffer: Buffer;
    skewAngle: number;
    width: number;
    height: number;
    rawMat?: any; // Used if cv is loaded
  }> {
    const cvWrapper = await loadOpenCV();
    const cv = cvWrapper?.cv;
    const width = jimpImage.bitmap.width;
    const height = jimpImage.bitmap.height;

    if (!cv) {
      // Graceful degradation using pure-JS Jimp filters
      console.log("Using Jimp fallback filters...");
      let processedJimp = jimpImage.clone();
      
      // Erase red ink (teacher corrections) by turning red-ish pixels to white
      processedJimp.scan(0, 0, processedJimp.bitmap.width, processedJimp.bitmap.height, function(x, y, idx) {
        const r = this.bitmap.data[idx];
        const g = this.bitmap.data[idx + 1];
        const b = this.bitmap.data[idx + 2];
        if (r > 150 && g < 120 && b < 120) {
          this.bitmap.data[idx] = 255;
          this.bitmap.data[idx + 1] = 255;
          this.bitmap.data[idx + 2] = 255;
        }
      });

      if (this.config.denoiseEnabled) {
        processedJimp = processedJimp.blur(1);
      }
      
      // Simple contrast enhancement and greyscale
      processedJimp = processedJimp.greyscale().contrast(0.4);
      
      const JimpVal = require("jimp");
      const buffer = await processedJimp.getBufferAsync(JimpVal.MIME_PNG);
      return {
        enhancedBuffer: buffer,
        skewAngle: 0,
        width,
        height
      };
    }

    // OpenCV.js execution
    let src = this.jimpToCvMat(cv, jimpImage);

    // Erase red ink (teacher corrections) from color channels
    try {
      const channels = new cv.MatVector();
      cv.split(src, channels);
      const R = channels.get(0);
      const G = channels.get(1);
      const B = channels.get(2);

      const maskR = new cv.Mat();
      const maskG = new cv.Mat();
      const maskB = new cv.Mat();
      const tempMask = new cv.Mat();
      const redMask = new cv.Mat();

      // Threshold: high red, low green/blue
      cv.threshold(R, maskR, 150, 255, cv.THRESH_BINARY);
      cv.threshold(G, maskG, 120, 255, cv.THRESH_BINARY_INV);
      cv.threshold(B, maskB, 120, 255, cv.THRESH_BINARY_INV);

      cv.bitwise_and(maskR, maskG, tempMask);
      cv.bitwise_and(tempMask, maskB, redMask);

      // Convert matching pixels in source to white
      src.setTo(new cv.Scalar(255, 255, 255, 255), redMask);

      // Cleanup matrices
      channels.delete(); R.delete(); G.delete(); B.delete();
      maskR.delete(); maskG.delete(); maskB.delete();
      tempMask.delete(); redMask.delete();
    } catch (redErr) {
      console.warn("OpenCV red-ink filter warning:", redErr);
    }

    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // 1. Deskewing (rotation correction)
    let skewAngle = 0;
    if (this.config.deskewEnabled) {
      skewAngle = this.detectSkewAngle(cv, gray);
      if (Math.abs(skewAngle) > 0.5 && Math.abs(skewAngle) < 45) {
        const rotated = this.rotateMat(cv, src, skewAngle);
        src.delete();
        src = rotated;
        // Re-generate gray for binarization step
        gray.delete();
        gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
      }
    }

    // 2. Denoising
    if (this.config.denoiseEnabled) {
      const denoised = new cv.Mat();
      cv.medianBlur(gray, denoised, 3);
      gray.delete();
      gray = denoised;
    }

    // 3. Adaptive Thresholding (binarization for contrast enhancement)
    const thresholded = new cv.Mat();
    cv.adaptiveThreshold(
      gray,
      thresholded,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      15, // Block size
      this.config.contrastThreshold // Constant subtracted
    );

    // Output processed buffer
    const finalJimp = this.cvMatToJimp(cv, thresholded, width, height);
    if (this.config.debugMode) {
      try {
        await finalJimp.writeAsync("src/services/ocr/debug_enhanced.png");
        console.log("Saved debug enhanced image to: src/services/ocr/debug_enhanced.png");
      } catch (e) {
        console.warn("Failed to write debug enhanced image:", e);
      }
    }
    const JimpVal = require("jimp");
    const buffer = await finalJimp.getBufferAsync(JimpVal.MIME_PNG);

    // Cleanup OpenCV allocations
    gray.delete();
    thresholded.delete();
    // Keep src (fully enhanced RGB/RGBA mat) for marked-option contour extraction later, but delete original
    
    return {
      enhancedBuffer: buffer,
      skewAngle,
      width,
      height,
      rawMat: src
    };
  }

  /**
   * Helper to convert Jimp image to cv.Mat
   */
  private jimpToCvMat(cv: any, jimpImage: Jimp): any {
    const mat = new cv.Mat(jimpImage.bitmap.height, jimpImage.bitmap.width, cv.CV_8UC4);
    // Copy Jimp raw pixel buffer data directly into CV matrix
    mat.data.set(jimpImage.bitmap.data);
    return mat;
  }

  /**
   * Helper to convert cv.Mat to Jimp image
   */
  private cvMatToJimp(cv: any, mat: any, width: number, height: number): Jimp {
    // If grayscale, convert back to RGBA
    let rgbaMat = new cv.Mat();
    if (mat.channels() === 1) {
      cv.cvtColor(mat, rgbaMat, cv.COLOR_GRAY2RGBA);
    } else {
      rgbaMat = mat.clone();
    }
    
    const JimpVal = require("jimp");
    const jimp = new JimpVal(width, height);
    jimp.bitmap.data = Buffer.from(rgbaMat.data);
    rgbaMat.delete();
    return jimp;
  }

  /**
   * Detects the skew angle of the page using HoughLinesP
   */
  private detectSkewAngle(cv: any, grayMat: any): number {
    const edges = new cv.Mat();
    cv.Canny(grayMat, edges, 50, 200, 3, false);

    const lines = new cv.Mat();
    cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 100, 50, 10);

    let angles: number[] = [];
    for (let i = 0; i < lines.rows; ++i) {
      const x1 = lines.data32S[i * 4];
      const y1 = lines.data32S[i * 4 + 1];
      const x2 = lines.data32S[i * 4 + 2];
      const y2 = lines.data32S[i * 4 + 3];

      const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
      // We are looking for slight horizontal rotations
      if (Math.abs(angle) < 45) {
        angles.push(angle);
      }
    }

    edges.delete();
    lines.delete();

    if (angles.length === 0) return 0;
    // Return average/median angle
    angles.sort((a, b) => a - b);
    return angles[Math.floor(angles.length / 2)];
  }

  /**
   * Rotates a matrix by a specified angle
   */
  private rotateMat(cv: any, mat: any, angle: number): any {
    const center = new cv.Point(mat.cols / 2, mat.rows / 2);
    const M = cv.getRotationMatrix2D(center, angle, 1.0);
    const rotated = new cv.Mat();
    const dsize = new cv.Size(mat.cols, mat.rows);
    cv.warpAffine(
      mat,
      rotated,
      M,
      dsize,
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar(255, 255, 255, 255)
    );
    M.delete();
    return rotated;
  }
}
