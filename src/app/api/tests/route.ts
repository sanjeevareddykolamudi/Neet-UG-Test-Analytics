import { NextResponse } from "next/server";

import { requireUser, parseJson } from "@/lib/api";
import { connectToDatabase } from "@/lib/mongodb";
import { createQuestionPaperSchema } from "@/lib/validations";
import { Test } from "@/models/Test";

export async function GET() {
  const { user, response } = await requireUser();

  if (response) {
    return response;
  }

  await connectToDatabase();

  const tests = await Test.find({ userId: user.id, isDeleted: false })
    .sort({ createdAt: -1 })
    .select("testName subject testDate totalQuestions uploadedFile processingStatus createdAt updatedAt")
    .lean();

  return NextResponse.json({ tests });
}

export async function POST(request: Request) {
  const { user, response } = await requireUser();

  if (response) {
    return response;
  }

  const parsed = await parseJson(request, createQuestionPaperSchema);

  if (parsed.response) {
    return parsed.response;
  }

  await connectToDatabase();

  // Consolidate Test and QuestionPaper metadata into the redesigned Test model
  const test = await Test.create({
    userId: user.id,
    createdBy: user.id,
    testName: parsed.data.title,
    subject: "combined", // Default to combined for NEET full syllabus, can be customized
    testDate: parsed.data.examDate ? new Date(parsed.data.examDate) : new Date(),
    uploadedFile: parsed.data.assets[0]?.secureUrl || "",
    processingStatus: "pending",
    totalQuestions: 0,
    isDeleted: false
  });

  return NextResponse.json({ test, questionPaper: test }, { status: 201 });
}
