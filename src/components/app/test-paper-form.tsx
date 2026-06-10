"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  Loader2,
  CheckCircle2,
  Trash2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  X,
  RefreshCw,
  FileUp,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface UploadResult {
  success: boolean;
  message?: string;
  test?: {
    _id?: string;
    testName?: string;
    processingStatus?: string;
  };
  storageMetadata?: Array<{
    publicId: string;
    secureUrl: string;
    format: string;
    bytes: number;
    originalFilename: string;
  }>;
}

export function QuestionPaperForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("physics");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploaded, setUploaded] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up XHR on unmount
  useEffect(() => {
    return () => {
      if (xhrRef.current) {
        xhrRef.current.abort();
      }
    };
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (uploading || uploaded) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (uploading || uploaded) return;
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const addFiles = (newFiles: FileList | File[]) => {
    setValidationError(null);
    setUploadError(null);
    const filesArray = Array.from(newFiles);

    // Max 10MB per file
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    const hasPdf = filesArray.some(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    const hasImage = filesArray.some(
      f => f.type.startsWith("image/") || 
      /\.(jpe?g|png|webp)$/i.test(f.name)
    );

    const unsupported = filesArray.filter(f => {
      const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
      const isImg = f.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(f.name);
      return !isPdf && !isImg;
    });

    if (unsupported.length > 0) {
      setValidationError(
        `Unsupported file type(s): ${unsupported.map(u => u.name).join(", ")}. Only PDFs, JPG, PNG, and WebP are allowed.`
      );
      return;
    }

    if (hasPdf && hasImage) {
      setValidationError("Cannot upload both a PDF and image files together. Please select either a single PDF or multiple images.");
      return;
    }

    if (hasPdf) {
      if (selectedFiles.length > 0) {
        setValidationError("Cannot add a PDF to the current selection. Please clear selected files first.");
        return;
      }
      if (filesArray.length > 1) {
        setValidationError("You can only upload a single PDF file at a time.");
        return;
      }
      if (filesArray[0].size > MAX_SIZE) {
        setValidationError(`PDF file "${filesArray[0].name}" exceeds the 10MB size limit.`);
        return;
      }
      setSelectedFiles(filesArray);
      return;
    }

    if (hasImage) {
      // Check if there is already a PDF in the list
      const existingPdf = selectedFiles.some(f => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
      if (existingPdf) {
        setValidationError("Cannot add images when a PDF is selected. Clear the PDF first.");
        return;
      }

      const oversized = filesArray.filter(f => f.size > MAX_SIZE);
      if (oversized.length > 0) {
        setValidationError(`The following image(s) exceed the 10MB size limit: ${oversized.map(o => o.name).join(", ")}.`);
        return;
      }

      // Filter out duplicate files
      const uniqueNewImages = filesArray.filter(
        newFile => !selectedFiles.some(existing => existing.name === newFile.name && existing.size === newFile.size)
      );

      if (uniqueNewImages.length === 0) {
        return;
      }

      setSelectedFiles(prev => [...prev, ...uniqueNewImages]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    if (uploading || uploaded) return;
    setSelectedFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setValidationError(null);
    setUploadError(null);
    // Reset file input value to allow re-selection
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearFiles = () => {
    if (uploading || uploaded) return;
    setSelectedFiles([]);
    setValidationError(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const syncToLocalStorage = (test: { _id?: string; testName?: string }, files: File[]) => {
    if (typeof window === "undefined") return;

    const testId = test._id || `test-${Date.now()}`;
    const dateStr = new Date().toISOString().split("T")[0];
    const totalSizeStr = `${(files.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB`;

    // 1. Sync neet_tests
    let currentTests = [];
    const storedTestsStr = localStorage.getItem("neet_tests");
    if (storedTestsStr) {
      try {
        currentTests = JSON.parse(storedTestsStr);
      } catch (e) {
        console.error("Failed to parse neet_tests", e);
      }
    }
    const newTest = {
      id: testId,
      title: test.testName || title,
      date: dateStr,
      questionsCount: subject === "biology" ? 90 : subject === "combined" ? 180 : 45,
      score: null,
      maxMarks: subject === "biology" ? 360 : subject === "combined" ? 720 : 180,
      status: "ocr_pending" as const,
      subjectAccuracy: null
    };
    localStorage.setItem("neet_tests", JSON.stringify([newTest, ...currentTests]));

    // 2. Sync neet_papers
    let currentPapers = [];
    const storedPapersStr = localStorage.getItem("neet_papers");
    if (storedPapersStr) {
      try {
        currentPapers = JSON.parse(storedPapersStr);
      } catch (e) {
        console.error("Failed to parse neet_papers", e);
      }
    }
    const newPaper = {
      id: testId,
      name: files.map(f => f.name).join(", "),
      size: totalSizeStr,
      uploadedAt: `${dateStr} ${new Date().toTimeString().slice(0, 5)}`,
      pages: files.length,
      status: "parsing" as const, // displays as "AI Scanning"
      marksDetected: null,
      totalQuestions: subject === "biology" ? 90 : subject === "combined" ? 180 : 45
    };
    localStorage.setItem("neet_papers", JSON.stringify([newPaper, ...currentPapers]));
  };

  const cancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
  };

  const handleUploadSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim() || selectedFiles.length === 0 || uploading || uploaded) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setValidationError(null);

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("subject", subject);
    selectedFiles.forEach(file => {
      formData.append("files", file);
    });

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.open("POST", "/api/tests/upload", true);

    // Track native upload progress
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percentage = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentage);
      }
    });

    // Handle completed response
    xhr.addEventListener("load", () => {
      xhrRef.current = null;
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          setUploadResult(res);
          setUploaded(true);
          setUploading(false);

          // Update localStorage mock repository
          syncToLocalStorage(res.test, selectedFiles);

          // Trigger redirect
          setTimeout(() => {
            router.push("/tests");
            router.refresh();
          }, 3500);
        } catch {
          setUploadError("Successfully uploaded, but failed to parse API response metadata.");
          setUploading(false);
        }
      } else {
        try {
          const res = JSON.parse(xhr.responseText);
          setUploadError(res.error || `Upload failed (Status ${xhr.status})`);
        } catch {
          setUploadError(`Server returned an error status ${xhr.status}`);
        }
        setUploading(false);
      }
    });

    // Handle network errors
    xhr.addEventListener("error", () => {
      xhrRef.current = null;
      setUploadError("A network error occurred. Please check your connection and retry.");
      setUploading(false);
    });

    // Handle aborted connection
    xhr.addEventListener("abort", () => {
      xhrRef.current = null;
      setUploadError("Upload was cancelled.");
      setUploading(false);
    });

    xhr.send(formData);
  };

  const totalSize = selectedFiles.reduce((acc, f) => acc + f.size, 0);
  const formattedTotalSize = (totalSize / (1024 * 1024)).toFixed(2);

  return (
    <div className="w-full mx-auto space-y-6">
      {/* Upload State Overlays */}
      {uploaded && uploadResult ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center animate-in fade-in zoom-in-95 duration-300 backdrop-blur-md">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
              <CheckCircle2 className="relative h-14 w-14 text-emerald-500" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-emerald-400">Upload Successful!</h3>
          <p className="mt-2 text-xs text-muted-foreground max-w-md mx-auto">
            Your question paper has been stored securely in Cloudinary and registered in the database.
            The OCR processing pipeline is running asynchronously in the background.
          </p>

          {/* Cloudinary Storage Metadata */}
          {uploadResult.storageMetadata && (
            <div className="mt-6 border border-border/40 rounded-lg bg-background/50 p-4 text-left space-y-3">
              <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 border-b border-border/40 pb-2">
                <Info className="h-3.5 w-3.5 text-primary" />
                Cloudinary Storage Metadata
              </h4>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-[10px]">
                <div>
                  <span className="text-muted-foreground block font-medium">Test Name:</span>
                  <span className="font-mono text-foreground font-semibold truncate block">
                    {uploadResult.test?.testName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block font-medium">Processing Status:</span>
                  <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-semibold">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" /> {uploadResult.test?.processingStatus}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block font-medium mb-1">Cloudinary Assets:</span>
                  <div className="max-h-24 overflow-y-auto space-y-1.5 font-mono text-[9px] custom-scrollbar">
                    {uploadResult.storageMetadata.map((meta, idx: number) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-muted/30 p-2 rounded border border-border/20 gap-1">
                        <span className="truncate max-w-[280px] text-foreground font-medium" title={meta.originalFilename}>
                          {meta.originalFilename}
                        </span>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-border/60">
                            {(meta.format || meta.originalFilename.split(".").pop() || "pdf").toUpperCase()}
                          </Badge>
                          <span>•</span>
                          <span>{(meta.bytes / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
            <p className="text-[10px] text-muted-foreground">Redirecting you to the Test Workspace...</p>
          </div>
        </div>
      ) : uploading ? (
        <div className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-md p-8 text-center space-y-5 animate-in fade-in duration-300">
          <div className="flex justify-center">
            <div className="relative p-3 rounded-full bg-primary/10 border border-primary/20">
              <FileUp className="h-8 w-8 text-primary animate-bounce" />
            </div>
          </div>
          <div className="space-y-2 w-full max-w-sm mx-auto">
            <div className="flex justify-between text-xs font-semibold text-foreground">
              <span>Uploading Scanned Assets...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2.5 bg-muted/40" />
            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
              <span>{selectedFiles.length} file(s) • {formattedTotalSize} MB total</span>
              <span className="animate-pulse text-primary font-semibold">Do not close this tab</span>
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={cancelUpload}
              className="gap-1.5 text-xs h-8 px-4"
            >
              <X className="h-3.5 w-3.5" /> Cancel Upload
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUploadSubmit} className="space-y-6">
          <div className="space-y-5">
            {/* Title Input */}
            <div className="space-y-2">
              <Label htmlFor="title" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Test / Paper Title
              </Label>
              <Input
                id="title"
                placeholder="e.g. NEET UG Full Syllabus Mock - 09"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-background/50 border-border/40 focus:border-primary focus:ring-primary/20 placeholder:text-muted-foreground/50 text-xs h-10"
              />
            </div>

            {/* Subject Select */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Primary Subject / Scope
              </Label>
              <div className="relative">
                <select
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-10 w-full rounded-md border border-border/40 bg-background/50 px-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 appearance-none text-foreground cursor-pointer"
                >
                  <option value="combined">Full Syllabus (Physics + Chemistry + Biology)</option>
                  <option value="physics">Physics Sectional</option>
                  <option value="chemistry">Chemistry Sectional</option>
                  <option value="biology">Biology Sectional</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Drag & Drop File Zone */}
            <div className="space-y-2">
              <Label className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Scanned Paper (PDF or Images)
              </Label>
              
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/5 p-8 text-center cursor-pointer transition-all duration-200 hover:bg-muted/10 hover:border-primary/50"
              >
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                <div className="p-3 rounded-full bg-muted/40 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-200">
                  <UploadCloud className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                
                <p className="mt-4 text-xs font-bold text-foreground">
                  Drag & drop paper file or <span className="text-primary hover:underline">browse</span>
                </p>
                <p className="mt-1.5 text-[10px] text-muted-foreground max-w-sm">
                  Upload a single PDF or multiple images (JPG, PNG, WebP). Max size limit: 10MB per file.
                </p>
              </div>
            </div>

            {/* Validation & Server Error Display */}
            {(validationError || uploadError) && (
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-xs flex gap-3 items-start animate-in slide-in-from-top-1 duration-200">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="font-bold text-destructive">
                    {validationError ? "Validation Warning" : "Upload Failed"}
                  </p>
                  <p className="text-muted-foreground leading-relaxed text-[11px]">
                    {validationError || uploadError}
                  </p>
                  {uploadError && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleUploadSubmit()}
                      className="mt-1 h-8 text-[10px] border-destructive/25 hover:bg-destructive/10 hover:border-destructive/40 text-destructive gap-1.5 px-3 font-semibold"
                    >
                      <RefreshCw className="h-3 w-3 animate-spin-hover" /> Retry Upload
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Selected Files Metadata List */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2.5 border-t border-border/30 pt-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground">
                    Selected Files ({selectedFiles.length})
                  </h4>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      Total: {formattedTotalSize} MB
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearFiles}
                      className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive gap-1 hover:bg-destructive/10"
                    >
                      Clear All
                    </Button>
                  </div>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {selectedFiles.map((file, index) => {
                    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
                    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg border border-border/20 bg-background/40 hover:bg-background/60 transition group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isPdf ? (
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                          ) : (
                            <ImageIcon className="h-4 w-4 text-sky-400 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate max-w-[250px] sm:max-w-[320px]" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-[9px] text-muted-foreground">
                              {file.type || (isPdf ? "application/pdf" : "image/*")} • {sizeMb} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-70 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submission Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="submit"
                disabled={!title.trim() || selectedFiles.length === 0 || uploading || uploaded}
                className="w-full sm:w-auto font-semibold shadow-lg shadow-primary/10 px-6 gap-2 h-10 text-xs"
              >
                <FileUp className="h-4 w-4" /> Start OCR Analysis
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
