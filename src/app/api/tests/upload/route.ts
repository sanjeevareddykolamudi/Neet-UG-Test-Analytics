import { NextResponse } from "next/server";
import { Buffer } from "buffer";
import { requireUser } from "@/lib/api";
import { connectToDatabase } from "@/lib/mongodb";
import { Test } from "@/models/Test";
import { uploadBuffer } from "@/lib/cloudinary";
import { validateUploadFile, MAX_FILE_SIZE_BYTES } from "@/lib/upload-validation";
import { OcrQueueService } from "@/services/ocr-queue.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const { user, response: authResponse } = await requireUser();
    if (authResponse) {
      return authResponse;
    }

    // 2. Parse FormData
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const subject = formData.get("subject") as string;
    const files = formData.getAll("files") as File[];

    if (!title || !subject || files.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: title, subject, or files." },
        { status: 400 }
      );
    }

    // 3. Connect to database
    await connectToDatabase();

    interface UploadMetadata {
      publicId: string;
      secureUrl: string;
      format: string;
      bytes: number;
      originalFilename: string;
    }
    const cloudinaryUrls: string[] = [];
    const storageMetadata: UploadMetadata[] = [];

    // 4. Validate and Upload each file
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Perform size, mime, and secure signature validation
      const validation = validateUploadFile(buffer, file.name, file.type, MAX_FILE_SIZE_BYTES);
      if (!validation.isValid && validation.error) {
        return NextResponse.json(
          {
            error: `Validation failed for file ${file.name}: ${validation.error.message}`,
            code: validation.error.code
          },
          { status: 400 }
        );
      }

      // Upload file buffer to Cloudinary
      const folder = `neet-test-analytics/${user.id}`;
      const uploadResult = await uploadBuffer(buffer, folder, file.name, file.type);

      cloudinaryUrls.push(uploadResult.secure_url);
      storageMetadata.push({
        publicId: uploadResult.public_id,
        secureUrl: uploadResult.secure_url,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        originalFilename: file.name
      });
    }

    // 5. Create the Test document in database
    const test = await Test.create({
      userId: user.id,
      createdBy: user.id,
      testName: title,
      subject: subject,
      testDate: new Date(),
      uploadedFile: cloudinaryUrls.join(","), // Commas split multiple images/files
      processingStatus: "pending",
      totalQuestions: 0,
      isDeleted: false
    });

    // 6. Queue/Trigger OCR background job (non-blocking)
    OcrQueueService.triggerOcrJob(
      test._id.toString(),
      user.id,
      cloudinaryUrls,
      subject,
      title
    );

    return NextResponse.json(
      {
        success: true,
        message: "Question paper uploaded and queued for OCR processing.",
        test,
        storageMetadata
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Question paper upload api error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Internal server error during upload processing.", details: errorMessage },
      { status: 500 }
    );
  }
}
