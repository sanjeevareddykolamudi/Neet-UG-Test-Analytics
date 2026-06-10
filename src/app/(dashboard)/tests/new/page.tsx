import { FileImage, FileText, LockKeyhole } from "lucide-react";

import { QuestionPaperForm } from "@/components/app/test-paper-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewTestPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload test paper</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This screen is ready for the upload workflow. Client-side Cloudinary upload logic and OCR processors can be attached in the business-logic phase.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Paper details</CardTitle>
          <CardDescription>Accept scanned question paper images or PDFs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <QuestionPaperForm />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border bg-background/70 p-4">
              <FileImage className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-semibold">Images</p>
              <p className="mt-1 text-sm text-muted-foreground">JPG, PNG, WEBP scans.</p>
            </div>
            <div className="rounded-md border bg-background/70 p-4">
              <FileText className="h-5 w-5 text-primary" />
              <p className="mt-3 text-sm font-semibold">PDFs</p>
              <p className="mt-1 text-sm text-muted-foreground">Single or multi-page papers.</p>
            </div>
          </div>
          <div className="rounded-md border border-dashed bg-muted/50 p-6 text-center">
            <LockKeyhole className="mx-auto h-6 w-6 text-primary" />
            <p className="mt-3 text-sm font-medium">Signed upload endpoint is available.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The interactive upload component belongs in the next business-logic pass.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
