/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { FileText, Eye, RefreshCw, Cpu, CheckCircle2, AlertCircle, Clock, FileDown, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PaperDoc {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  pages: number;
  status: "completed" | "parsing" | "failed" | "pending_review";
  marksDetected: number | null;
  totalQuestions: number;
}

const initialPapers: PaperDoc[] = [
  {
    id: "doc-1",
    name: "NEET_2025_Original_Syllabus.pdf",
    size: "4.8 MB",
    uploadedAt: "2026-06-08 14:32",
    pages: 24,
    status: "completed",
    marksDetected: 172,
    totalQuestions: 180
  },
  {
    id: "doc-2",
    name: "Allen_All_India_Test_08_Scanned.pdf",
    size: "12.4 MB",
    uploadedAt: "2026-06-01 09:15",
    pages: 28,
    status: "completed",
    marksDetected: 168,
    totalQuestions: 180
  },
  {
    id: "doc-3",
    name: "Thermodynamics_Weekly_Test.png",
    size: "2.1 MB",
    uploadedAt: "2026-06-09 21:05",
    pages: 1,
    status: "parsing",
    marksDetected: null,
    totalQuestions: 45
  },
  {
    id: "doc-4",
    name: "Genetics_NCERT_Revision_Questions.pdf",
    size: "6.2 MB",
    uploadedAt: "2026-06-09 22:00",
    pages: 8,
    status: "pending_review",
    marksDetected: 35,
    totalQuestions: 90
  }
];

export default function QuestionPapersPage() {
  const [papers, setPapers] = useState<PaperDoc[]>(initialPapers);
  const [search, setSearch] = useState("");
  const [scanningId, setScanningId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("neet_papers");
      if (stored) {
        try {
          setPapers(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      } else {
        localStorage.setItem("neet_papers", JSON.stringify(initialPapers));
      }
    }
  }, []);

  const triggerScan = async (id: string) => {
    setScanningId(id);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setPapers((prev) => {
      const updated = prev.map((doc) =>
        doc.id === id
          ? {
              ...doc,
              status: "completed" as const,
              marksDetected: doc.totalQuestions - 5,
            }
          : doc
      );
      localStorage.setItem("neet_papers", JSON.stringify(updated));
      return updated;
    });

    // Also update matching test status in neet_tests
    const storedTestsStr = localStorage.getItem("neet_tests");
    if (storedTestsStr) {
      try {
        const currentTests = JSON.parse(storedTestsStr);
        const updatedTests = currentTests.map((t: any) =>
          t.id === id
            ? { ...t, status: "analyzed" as const, score: (t.questionsCount - 5) * 4 } // mock scoring physics/chemistry details
            : t
        );
        localStorage.setItem("neet_tests", JSON.stringify(updatedTests));
      } catch (e) {
        console.error(e);
      }
    }

    setScanningId(null);
  };

  const getStatusBadge = (status: PaperDoc["status"]) => {
    switch (status) {
      case "completed":
        return <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Indexed</Badge>;
      case "parsing":
        return <Badge variant="warning" className="gap-1 animate-pulse"><Clock className="h-3 w-3" /> AI Scanning</Badge>;
      case "pending_review":
        return <Badge variant="info" className="gap-1"><AlertCircle className="h-3 w-3" /> OCR Review</Badge>;
      default:
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  const filteredPapers = papers.filter((doc) =>
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Original Question Papers</h1>
        <p className="text-sm text-muted-foreground">
          View uploaded scanned PDF/Image papers, trigger the option-marking detection model, and download source files.
        </p>
      </div>

      <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <CardTitle className="text-base font-bold">Scanned Repository</CardTitle>
            <CardDescription className="text-xs">Original exam files processed via OCR parser</CardDescription>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search repository..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background/50 pl-9 pr-4 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30 text-muted-foreground uppercase font-bold tracking-wider">
                  <th className="p-4">File Name</th>
                  <th className="p-4">Pages</th>
                  <th className="p-4">Uploaded At</th>
                  <th className="p-4">OCR Status</th>
                  <th className="p-4">Detected Marks</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPapers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      No matching paper documents in database.
                    </td>
                  </tr>
                ) : (
                  filteredPapers.map((paper) => (
                    <tr
                      key={paper.id}
                      className="border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4 font-bold flex items-center gap-2 max-w-xs sm:max-w-md">
                        <FileText className="h-4.5 w-4.5 text-primary flex-shrink-0" />
                        <span className="truncate">{paper.name}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">({paper.size})</span>
                      </td>
                      <td className="p-4 font-medium text-muted-foreground">{paper.pages} pages</td>
                      <td className="p-4 font-medium text-muted-foreground">{paper.uploadedAt}</td>
                      <td className="p-4">{getStatusBadge(paper.status)}</td>
                      <td className="p-4 font-bold">
                        {paper.marksDetected !== null ? (
                          <span>{paper.marksDetected} / {paper.totalQuestions} questions</span>
                        ) : (
                          <span className="text-muted-foreground font-normal">N/A</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-muted" title="View Source File">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-muted" title="Download Paper">
                            <FileDown className="h-3.5 w-3.5" />
                          </Button>
                          {paper.status === "pending_review" && (
                            <Button
                              size="sm"
                              className="h-7 px-2 font-semibold text-[10px] bg-primary/90 hover:bg-primary shadow"
                              onClick={() => triggerScan(paper.id)}
                              disabled={scanningId === paper.id}
                            >
                              {scanningId === paper.id ? (
                                <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                              ) : (
                                <Cpu className="mr-1 h-3 w-3" />
                              )}
                              Run Model
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
