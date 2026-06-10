/* eslint-disable @typescript-eslint/no-explicit-any */
import { createWorker } from "tesseract.js";
import { OcrPipelineConfig } from "./types";

export interface OcrWordInfo {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface OcrLineInfo {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  words: OcrWordInfo[];
}

export interface OcrResult {
  fullText: string;
  confidence: number;
  lines: OcrLineInfo[];
}

export class OcrEngine {
  private config: OcrPipelineConfig;

  constructor(config: OcrPipelineConfig) {
    this.config = config;
  }

  /**
   * Performs Tesseract.js OCR on an image buffer.
   * Extracts text, lines, bounding boxes, and word-level character confidence scores.
   */
  async recognizeText(imageBuffer: Buffer): Promise<OcrResult> {
    if (this.config.ocrLanguage === "simulated") {
      throw new Error("Simulated OCR engine requested.");
    }
    const worker = await createWorker(this.config.ocrLanguage);
    
    try {
      
      // Set configuration parameters (e.g. whitelist scientific symbols/numbers if needed)
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,?!():;+-*=/()[]{} \n",
      });

      // Execute OCR
      const { data } = await worker.recognize(imageBuffer);
      
      const lines: OcrLineInfo[] = (data.lines || []).map((line: any) => {
        const words: OcrWordInfo[] = (line.words || []).map((word: any) => ({
          text: word.text,
          confidence: word.confidence,
          bbox: {
            x0: word.bbox.x0,
            y0: word.bbox.y0,
            x1: word.bbox.x1,
            y1: word.bbox.y1,
          }
        }));

        return {
          text: line.text,
          confidence: line.confidence,
          bbox: {
            x0: line.bbox.x0,
            y0: line.bbox.y0,
            x1: line.bbox.x1,
            y1: line.bbox.y1,
          },
          words
        };
      });

      return {
        fullText: data.text,
        confidence: data.confidence,
        lines
      };
    } catch (error) {
      console.error("Tesseract OCR execution failed:", error);
      throw error;
    } finally {
      // Terminate worker to free memory
      await worker.terminate();
    }
  }
}
