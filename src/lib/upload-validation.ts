import { Buffer } from "buffer";

// Configurable constants
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB default
export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
];

export interface FileValidationError {
  code: "FILE_TOO_LARGE" | "INVALID_MIME_TYPE" | "BAD_FILE_SIGNATURE" | "EMPTY_FILE";
  message: string;
}

/**
 * Detects MIME type of a buffer based on magic bytes.
 * Returns null if no match.
 */
export function detectMimeType(buffer: Buffer): "application/pdf" | "image/jpeg" | "image/png" | "image/webp" | null {
  if (!buffer || buffer.length < 4) return null;

  // 1. PDF signature (%PDF-)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return "application/pdf";
  }

  // 2. JPEG signature (FF D8 FF)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // 3. PNG signature (89 50 4E 47)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  // 4. WebP signature (RIFF .... WEBP)
  if (
    buffer[0] === 0x52 && // R
    buffer[1] === 0x49 && // I
    buffer[2] === 0x46 && // F
    buffer[3] === 0x46 && // F
    buffer.length >= 12 &&
    buffer[8] === 0x57 && // W
    buffer[9] === 0x45 && // E
    buffer[10] === 0x42 && // B
    buffer[11] === 0x50 // P
  ) {
    return "image/webp";
  }

  return null;
}

/**
 * Validates the file signature (magic numbers) of a file buffer against its claimed MIME type.
 * Prevents spoofing attacks where executables or scripts are renamed to .png/.pdf.
 */
export function validateFileSignature(
  buffer: Buffer,
  mimeType: string
): { isValid: boolean; error?: FileValidationError } {
  if (!buffer || buffer.length === 0) {
    return {
      isValid: false,
      error: { code: "EMPTY_FILE", message: "The file buffer is empty." }
    };
  }

  // Check magic numbers for security
  switch (mimeType) {
    case "application/pdf": {
      // PDF signature is %PDF- (hex: 25 50 44 46 2d)
      if (
        buffer[0] !== 0x25 ||
        buffer[1] !== 0x50 ||
        buffer[2] !== 0x44 ||
        buffer[3] !== 0x46
      ) {
        return {
          isValid: false,
          error: {
            code: "BAD_FILE_SIGNATURE",
            message: "File signature mismatch: expected PDF document headers."
          }
        };
      }
      break;
    }
    case "image/jpeg": {
      // JPEG signature starts with FF D8 FF
      if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
        return {
          isValid: false,
          error: {
            code: "BAD_FILE_SIGNATURE",
            message: "File signature mismatch: expected JPEG image headers."
          }
        };
      }
      break;
    }
    case "image/png": {
      // PNG signature starts with 89 50 4E 47 0D 0A 1A 0A
      const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
      for (let i = 0; i < pngHeader.length; i++) {
        if (buffer[i] !== pngHeader[i]) {
          return {
            isValid: false,
            error: {
              code: "BAD_FILE_SIGNATURE",
              message: "File signature mismatch: expected PNG image headers."
            }
          };
        }
      }
      break;
    }
    case "image/webp": {
      // WebP signature starts with RIFF (52 49 46 46) at 0, and WEBP (57 45 42 50) at 8
      if (
        buffer[0] !== 0x52 || // R
        buffer[1] !== 0x49 || // I
        buffer[2] !== 0x46 || // F
        buffer[3] !== 0x46 || // F
        buffer[8] !== 0x57 || // W
        buffer[9] !== 0x45 || // E
        buffer[10] !== 0x42 || // B
        buffer[11] !== 0x50 // P
      ) {
        return {
          isValid: false,
          error: {
            code: "BAD_FILE_SIGNATURE",
            message: "File signature mismatch: expected WebP image headers."
          }
        };
      }
      break;
    }
    default: {
      return {
        isValid: false,
        error: {
          code: "INVALID_MIME_TYPE",
          message: `MIME type "${mimeType}" is not supported.`
        }
      };
    }
  }

  return { isValid: true };
}

/**
 * Full file validation wrapper (size + mime type list + magic bytes check)
 */
export function validateUploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  maxSizeBytes: number = MAX_FILE_SIZE_BYTES
): { isValid: boolean; error?: FileValidationError } {
  // 1. Check file size
  if (buffer.length > maxSizeBytes) {
    const sizeMb = (maxSizeBytes / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: {
        code: "FILE_TOO_LARGE",
        message: `File exceeds maximum allowed size of ${sizeMb}MB.`
      }
    };
  }

  // 2. Check basic MIME type blacklist/whitelist
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      isValid: false,
      error: {
        code: "INVALID_MIME_TYPE",
        message: `Allowed formats are PDFs, JPEGs, PNGs, and WebPs only.`
      }
    };
  }

  // 3. Verify magic bytes for spoofing security
  return validateFileSignature(buffer, mimeType);
}
