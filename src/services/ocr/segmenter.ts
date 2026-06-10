/* eslint-disable @typescript-eslint/no-unused-vars */
import { OcrLineInfo, OcrResult, OcrWordInfo } from "./ocr-engine";
import { OcrQuestion, BoundingBox } from "./types";

export class Segmenter {
  /**
   * Parses OCR line details to segment questions and options.
   * Maps bounding boxes for options A, B, C, D coordinates.
   */
  segmentPage(ocrResult: OcrResult, pageWidth: number, pageHeight: number): OcrQuestion[] {
    const questions: OcrQuestion[] = [];
    const lines = ocrResult.lines;

    const questionRegex = /^(?:Q|q)?\s*(\d+)[\.\:\-\s]/;
    const optionRegex = /^[\[\(\s]*([A-D])[\]\)\.\:\-\s]/i; // E.g., "A)", "(B)", "C."

    let currentQuestion: OcrQuestion | null = null;
    let tempQuestionLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedText = line.text.trim();
      if (!trimmedText) continue;

      const qMatch = trimmedText.match(questionRegex);
      
      if (qMatch) {
        // We found a new question! Save the previous one first
        if (currentQuestion) {
          currentQuestion.questionText = tempQuestionLines.join(" ").trim();
          questions.push(currentQuestion);
        }

        const qNum = parseInt(qMatch[1]);
        const questionTextPart = trimmedText.substring(qMatch[0].length).trim();

        currentQuestion = {
          questionNo: qNum,
          questionText: "",
          options: { A: "", B: "", C: "", D: "" },
          selectedAnswer: "Unattempted",
          confidence: { ocr: line.confidence, markDetection: 0, overall: 0 },
          roiCoordinates: {
            A: { x: 0, y: 0, width: 0, height: 0 },
            B: { x: 0, y: 0, width: 0, height: 0 },
            C: { x: 0, y: 0, width: 0, height: 0 },
            D: { x: 0, y: 0, width: 0, height: 0 }
          }
        };

        tempQuestionLines = [questionTextPart];
      } else if (currentQuestion) {
        // Check if this line contains option identifiers
        // Sometimes options are formatted as a single line, e.g., "A) 12  B) 14  C) 16  D) 18"
        // Let's parse horizontal options
        const hasHorizontalOptions = this.parseHorizontalOptions(line, currentQuestion);
        
        if (!hasHorizontalOptions) {
          // Check if it is a single vertical option line, e.g., "A. Carnot Cycle"
          const optMatch = trimmedText.match(optionRegex);
          if (optMatch) {
            const optKey = optMatch[1].toUpperCase() as "A" | "B" | "C" | "D";
            const optText = trimmedText.substring(optMatch[0].length).trim();
            currentQuestion.options[optKey] = optText;

            // Define ROI coordinate relative to option letter
            currentQuestion.roiCoordinates![optKey] = {
              x: line.bbox.x0,
              y: line.bbox.y0,
              width: Math.min(60, line.bbox.x1 - line.bbox.x0), // small box around the letter A/B/C/D
              height: line.bbox.y1 - line.bbox.y0
            };
          } else {
            // Continuation of question text or previous option
            tempQuestionLines.push(trimmedText);
          }
        }
      }
    }

    // Save final question
    if (currentQuestion) {
      currentQuestion.questionText = tempQuestionLines.join(" ").trim();
      questions.push(currentQuestion);
    }

    // Adjust ROIs: If any ROI coordinates are empty/0, approximate them based on question block y-offset
    this.backfillMissingRois(questions, pageWidth, pageHeight);

    return questions;
  }

  /**
   * Scans a line for multiple options arranged horizontally (e.g. A) 10 B) 20 C) 30 D) 40).
   * Maps their word bounding boxes.
   */
  private parseHorizontalOptions(line: OcrLineInfo, question: OcrQuestion): boolean {
    const words = line.words;
    const optionIndicatorRegex = /^[\[\(\s]*([A-D])[\]\)\.\:\-\s]*$/i;
    
    // Find all indexes of words that match option indicators
    const optionIndices: { key: "A" | "B" | "C" | "D"; wordIndex: number }[] = [];
    
    for (let i = 0; i < words.length; i++) {
      const cleanWord = words[i].text.replace(/[\(\)\[\]\.\:\-\s]/g, "").toUpperCase();
      if (cleanWord === "A" || cleanWord === "B" || cleanWord === "C" || cleanWord === "D") {
        // Verify it looks like an option tag context
        const fullWord = words[i].text;
        if (fullWord.includes(")") || fullWord.includes("(") || fullWord.includes(".") || (i + 1 < words.length)) {
          optionIndices.push({
            key: cleanWord as "A" | "B" | "C" | "D",
            wordIndex: i
          });
        }
      }
    }

    if (optionIndices.length < 2) return false; // Not a horizontal option line

    // Parse options and map coordinates based on word columns
    for (let idx = 0; idx < optionIndices.length; idx++) {
      const current = optionIndices[idx];
      const next = optionIndices[idx + 1];
      
      const startWordIdx = current.wordIndex + 1;
      const endWordIdx = next ? next.wordIndex : words.length;

      // Extract option text
      const optionTextWords = words.slice(startWordIdx, endWordIdx).map(w => w.text);
      question.options[current.key] = optionTextWords.join(" ").trim();

      // Set ROI around the option indicator word
      const indicatorWord = words[current.wordIndex];
      question.roiCoordinates![current.key] = {
        x: indicatorWord.bbox.x0,
        y: indicatorWord.bbox.y0,
        width: indicatorWord.bbox.x1 - indicatorWord.bbox.x0 + 15, // extra margin
        height: indicatorWord.bbox.y1 - indicatorWord.bbox.y0
      };
    }

    return true;
  }

  /**
   * If some option boxes were not detected correctly, approximate them relative to the question boundaries.
   */
  private backfillMissingRois(questions: OcrQuestion[], pageWidth: number, pageHeight: number) {
    for (const q of questions) {
      const rois = q.roiCoordinates!;
      const keys = ["A", "B", "C", "D"] as const;
      
      // Calculate a base y position if we have at least one valid ROI, otherwise guess based on page position
      let baseHeight = 35;
      let baseWidth = 45;
      let firstValidY = 0;
      let firstValidX = 50;

      for (const k of keys) {
        if (rois[k].y > 0) {
          firstValidY = rois[k].y;
          firstValidX = rois[k].x;
          baseHeight = rois[k].height;
          baseWidth = rois[k].width;
          break;
        }
      }

      if (firstValidY === 0) {
        // Fallback: estimate y coordinate below the question text block if available
        firstValidY = pageHeight / 2; // rough default
      }

      // Backfill missing option boxes vertically
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        if (rois[k].x === 0 || rois[k].y === 0) {
          rois[k] = {
            x: firstValidX + (i * 120) % (pageWidth - 150), // grid offset
            y: firstValidY + Math.floor(i / 2) * 40,
            width: baseWidth || 45,
            height: baseHeight || 30
          };
        }
      }
    }
  }
}
