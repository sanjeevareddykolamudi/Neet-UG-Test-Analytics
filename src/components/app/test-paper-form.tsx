"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

export function QuestionPaperForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("physics");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploaded, setUploaded] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) return;

    setUploading(true);
    setUploadProgress(0);

    // Simulate Cloudinary upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 150);

    // Wait for upload simulation
    await new Promise((resolve) => setTimeout(resolve, 1800));
    clearInterval(progressInterval);
    setUploadProgress(100);
    setUploading(false);
    setUploaded(true);

    // Persist upload details to localStorage so they show in lists
    if (typeof window !== "undefined") {
      const newId = `test-${Date.now()}`;
      const dateStr = new Date().toISOString().split("T")[0];
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

      // 1. Save in neet_tests
      const storedTestsStr = localStorage.getItem("neet_tests");
      let currentTests = [];
      if (storedTestsStr) {
        try {
          currentTests = JSON.parse(storedTestsStr);
        } catch (e) {
          console.error(e);
        }
      }
      const newTest = {
        id: newId,
        title: title,
        date: dateStr,
        questionsCount: subject === "biology" ? 90 : subject === "all" ? 180 : 45,
        score: null,
        maxMarks: subject === "biology" ? 360 : subject === "all" ? 720 : 180,
        status: "ocr_pending" as const,
        subjectAccuracy: null
      };
      localStorage.setItem("neet_tests", JSON.stringify([newTest, ...currentTests]));

      // 2. Save in neet_papers
      const storedPapersStr = localStorage.getItem("neet_papers");
      let currentPapers = [];
      if (storedPapersStr) {
        try {
          currentPapers = JSON.parse(storedPapersStr);
        } catch (e) {
          console.error(e);
        }
      }
      const newPaper = {
        id: newId,
        name: file.name,
        size: sizeStr,
        uploadedAt: `${dateStr} ${new Date().toTimeString().slice(0, 5)}`,
        pages: Math.max(1, Math.round(Math.random() * 10)),
        status: "pending_review" as const,
        marksDetected: null,
        totalQuestions: subject === "biology" ? 90 : subject === "all" ? 180 : 45
      };
      localStorage.setItem("neet_papers", JSON.stringify([newPaper, ...currentPapers]));
    }

    // Redirect to tests page after showing success screen
    setTimeout(() => {
      router.push("/tests");
      router.refresh();
    }, 1200);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Title Input */}
        <div className="space-y-2">
          <Label htmlFor="title" className="font-semibold text-xs">Test Title</Label>
          <Input
            id="title"
            placeholder="e.g. NEET Full Syllabus Mock 09"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full bg-background/50 backdrop-blur-sm border-border/40 focus:border-primary focus:ring-primary/20"
          />
        </div>

        {/* Subject Select */}
        <div className="space-y-2">
          <Label htmlFor="subject" className="font-semibold text-xs">Primary Subject / Paper Scope</Label>
          <select
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="h-9 w-full rounded-lg border border-border/40 bg-background/50 px-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          >
            <option value="all">Full Syllabus (Physics + Chemistry + Biology)</option>
            <option value="physics">Physics Sectional</option>
            <option value="chemistry">Chemistry Sectional</option>
            <option value="biology">Biology Sectional</option>
          </select>
        </div>

        {/* Drag & Drop File Zone */}
        <div className="space-y-2">
          <Label className="font-semibold text-xs">Scanned Paper File (Image or PDF)</Label>
          
          {uploaded ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-primary/20 bg-primary/5 p-8 text-center animate-in fade-in duration-300">
              <CheckCircle2 className="h-10 w-10 text-primary animate-bounce" />
              <p className="mt-3 text-sm font-bold text-primary">Upload successful!</p>
              <p className="mt-1 text-xs text-muted-foreground">Redirecting to test workspace...</p>
            </div>
          ) : uploading ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border/40 bg-muted/20 p-8 text-center space-y-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <div className="space-y-1.5 w-full max-w-xs">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Uploading to Cloudinary...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
              <p className="text-[10px] text-muted-foreground">Do not close this page.</p>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="group relative flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 p-8 text-center cursor-pointer transition hover:bg-muted/30 hover:border-primary/40"
            >
              <input
                id="file-upload"
                type="file"
                accept="image/*,application/pdf"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
                required
              />
              <UploadCloud className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
              <p className="mt-3 text-xs font-bold text-foreground">
                {file ? file.name : "Drag & drop paper file or click to browse"}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : "Supports PDFs, JPG, PNG up to 10MB"}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          type="submit"
          disabled={!title || !file || uploading || uploaded}
          className="w-full sm:w-auto font-semibold shadow-lg shadow-primary/10"
        >
          {uploading ? "Uploading..." : "Start OCR Analysis"}
        </Button>
      </div>
    </form>
  );
}
