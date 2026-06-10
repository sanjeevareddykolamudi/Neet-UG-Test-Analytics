export interface OcrQuestion {
  questionNo: number;
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  selectedAnswer: "A" | "B" | "C" | "D" | "Unattempted";
  confidence: {
    ocr: number; // 0-100 percentage
    markDetection: number; // 0-100 percentage
    overall: number; // calculated overall confidence
  };
  roiCoordinates?: {
    A: BoundingBox;
    B: BoundingBox;
    C: BoundingBox;
    D: BoundingBox;
  };
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrPipelineConfig {
  deskewEnabled: boolean;
  denoiseEnabled: boolean;
  contrastThreshold: number;
  markDensityThreshold: number; // pixel ratio above which it's considered marked
  ocrLanguage: string; // e.g. 'eng'
  dpiScale: number; // DPI scaling factor (default 1.0)
  debugMode: boolean; // if true, saves intermediate CV mats as images
}

export interface OcrPipelineResult {
  success: boolean;
  questions: OcrQuestion[];
  processedPagesCount: number;
  overallConfidence: number;
  processingTimeMs: number;
  error?: string;
}
