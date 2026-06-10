import { NextResponse } from "next/server";

import { requireUser, parseJson } from "@/lib/api";
import { createUploadSignature } from "@/lib/cloudinary";
import { uploadSignatureSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const { user, response } = await requireUser();

  if (response) {
    return response;
  }

  const parsed = await parseJson(request, uploadSignatureSchema);

  if (parsed.response) {
    return parsed.response;
  }

  return NextResponse.json({
    ...createUploadSignature(user.id),
    resourceType: parsed.data.resourceType
  });
}
