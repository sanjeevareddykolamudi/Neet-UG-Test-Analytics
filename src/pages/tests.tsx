import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileUp, Search, Calendar, ChevronRight, Award, Trash2, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MockTest {
  id: string;
  title: string;
  date: string;
  questionsCount: number;
  score: number | null;
  maxMarks: number;
  status: "uploaded" | "queued" | "ocr_pending" | "review_required" | "ready_for_key" | "analyzed" | "failed";
  subjectAccuracy: { Physics: number; Chemistry: number; Biology: number } | null;
  statusMessage?: string;
}

const initialMockTests: MockTest[] = [];

export default function TestsPage() {
  const [tests, setTests] = useState<MockTest[]>(initialMockTests);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchTests = async () => {
    try {
      const res = await fetch("/api/tests");
      if (res.ok) {
        const data = await res.json();
        if (data.tests) {
          interface DbTest {
            _id: string;
            id?: string;
            testName: string;
            testDate: string;
            totalQuestions: number;
            score: number | null;
            maxMarks?: number;
            processingStatus: string;
            statusMessage?: string;
            subjectAccuracy: { Physics: number; Chemistry: number; Biology: number } | null;
          }

          // Map MongoDB tests to UI MockTest shape
          const dbTestsMapped: MockTest[] = (data.tests as DbTest[]).map((t) => ({
            id: t._id || t.id || "",
            title: t.testName,
            date: new Date(t.testDate).toISOString().split("T")[0],
            questionsCount: t.totalQuestions,
            score: t.score,
            maxMarks: t.maxMarks || 720,
            status: t.processingStatus === "completed" ? "analyzed" : 
                    t.processingStatus === "failed" ? "failed" : 
                    t.processingStatus === "processing" ? "ocr_pending" : "queued",
            subjectAccuracy: t.subjectAccuracy,
            statusMessage: t.statusMessage || ""
          }));

          const stored = localStorage.getItem("neet_tests");
          let localTests: MockTest[] = stored ? JSON.parse(stored) : initialMockTests;
          
          // Filter out mock tests that have database IDs
          const dbIds = new Set(dbTestsMapped.map((t) => t.id));
          localTests = localTests.filter((lt) => !dbIds.has(lt.id));

          // Combine them
          const combined = [...dbTestsMapped, ...localTests];
          setTests(combined);
          localStorage.setItem("neet_tests", JSON.stringify(combined));
        }
      }
    } catch (e) {
      console.error("Failed to fetch tests:", e);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("neet_tests");
      if (stored) {
        try {
          setTests(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      } else {
        localStorage.setItem("neet_tests", JSON.stringify(initialMockTests));
      }
    }

    // Initial fetch from database
    fetchTests();

    // Start polling every 4 seconds to sync status changes
    const interval = setInterval(fetchTests, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this test paper and all its analyzed data?")) {
      try {
        const res = await fetch(`/api/tests?id=${id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Failed with status ${res.status}`);
        }

        const updated = tests.filter((t) => t.id !== id);
        setTests(updated);
        localStorage.setItem("neet_tests", JSON.stringify(updated));

        // Sync neet_papers mock repository
        const storedPapersStr = localStorage.getItem("neet_papers");
        if (storedPapersStr) {
          try {
            const currentPapers = JSON.parse(storedPapersStr);
            const updatedPapers = currentPapers.filter((p: { id: string }) => p.id !== id);
            localStorage.setItem("neet_papers", JSON.stringify(updatedPapers));
          } catch (e) {
            console.error("Failed to sync neet_papers during deletion:", e);
          }
        }
      } catch (err: unknown) {
        console.error("Delete test error:", err);
        const errMsg = err instanceof Error ? err.message : String(err);
        alert(`Failed to delete the test paper: ${errMsg}`);
      }
    }
  };

  const filteredTests = tests.filter((test) => {
    const matchesSearch = test.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || test.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: MockTest["status"]) => {
    switch (status) {
      case "analyzed":
        return <Badge variant="success">Analyzed</Badge>;
      case "ocr_pending":
        return <Badge variant="warning" className="animate-pulse">OCR Parsing</Badge>;
      case "queued":
        return <Badge variant="outline" className="animate-pulse bg-amber-500/10 text-amber-500 border-amber-500/25">In Queue</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "ready_for_key":
        return <Badge variant="info">Pending Key</Badge>;
      case "review_required":
        return <Badge variant="destructive">Needs Review</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Test Papers Workspace</h1>
          <p className="text-sm text-muted-foreground">
            Manage your mock exams, check OCR status, and review topic scoring breakdowns.
          </p>
        </div>
        <Button asChild className="shadow-lg shadow-primary/15 font-semibold">
          <Link to="/tests/new">
            <FileUp className="mr-2 h-4 w-4" />
            Upload Scanned Paper
          </Link>
        </Button>
      </div>

      {/* Overview Cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-muted-foreground">Tests Attempted</span>
            <span className="text-xs font-bold text-primary">Active</span>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-2xl font-extrabold">{tests.filter(t => t.status === "analyzed").length}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Full and Sectional mocks</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-muted-foreground">Highest Mock Score</span>
            <Award className="h-4.5 w-4.5 text-amber-500" />
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-2xl font-extrabold">645 <span className="text-xs font-normal text-muted-foreground">/720</span></p>
            <p className="text-[10px] text-muted-foreground mt-1">Percentile: 99.1%</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-muted-foreground">Pending Processing</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-2xl font-extrabold">{tests.filter(t => t.status !== "analyzed" && t.status !== "failed").length}</p>
            <p className="text-[10px] text-muted-foreground mt-1">OCR Queue & Answer Keys</p>
          </CardContent>
        </Card>
      </section>

      {/* Filter Toolbar */}
      <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background/50 pl-9 pr-4 text-xs outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pr-2">
              <Filter className="h-3.5 w-3.5" />
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background/50 px-3 text-xs outline-none focus:border-primary"
            >
              <option value="all">All Statuses</option>
              <option value="analyzed">Analyzed</option>
              <option value="ocr_pending">OCR Parsing</option>
              <option value="ready_for_key">Pending Key</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Test List Grid */}
      <div className="space-y-3">
        {filteredTests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-12 text-center">
            <p className="text-sm font-semibold text-muted-foreground">No test papers found</p>
            <p className="text-xs text-muted-foreground/80 mt-1">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          filteredTests.map((test) => (
            <div
              key={test.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl border border-border/40 bg-card/60 p-4 shadow-sm backdrop-blur-sm transition hover:shadow hover:border-primary/20"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-sm font-bold text-foreground truncate">{test.title}</h3>
                  {getStatusBadge(test.status)}
                  {test.statusMessage && (test.status === "ocr_pending" || test.status === "queued") && (
                    <span className="text-[11px] text-amber-500 font-medium animate-pulse ml-1">
                      — {test.statusMessage}
                    </span>
                  )}
                  {test.statusMessage && test.status === "failed" && (
                    <span className="text-[11px] text-destructive font-medium ml-1">
                      — {test.statusMessage}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {test.date}
                  </span>
                  <span>•</span>
                  <span>{test.questionsCount} Questions</span>
                  {test.subjectAccuracy && (
                    <>
                      <span>•</span>
                      <span className="hidden sm:inline">
                        Accuracy: P:{test.subjectAccuracy.Physics}% | C:{test.subjectAccuracy.Chemistry}% | B:{test.subjectAccuracy.Biology}%
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 sm:mt-0 w-full sm:w-auto justify-end border-t border-border/20 pt-3 sm:border-0 sm:pt-0">
                {test.score !== null ? (
                  <div className="text-right pr-4 hidden sm:block">
                    <p className="text-sm font-extrabold text-primary">{test.score} <span className="text-[10px] text-muted-foreground font-normal">/ {test.maxMarks}</span></p>
                    <p className="text-[10px] text-muted-foreground font-medium">Scored</p>
                  </div>
                ) : null}

                <div className="flex items-center gap-2">
                  {test.status === "analyzed" ? (
                    <Button asChild size="sm" variant="outline" className="h-8.5 font-semibold text-xs border-primary/20 hover:bg-primary/5">
                      <Link to="/analytics">
                        Review Marks
                        <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  ) : test.status === "ready_for_key" ? (
                    <Button size="sm" variant="outline" className="h-8.5 font-semibold text-xs border-primary/25 hover:bg-primary/5 text-primary">
                      Add Answer Key
                    </Button>
                  ) : test.status === "failed" ? (
                    <Button size="sm" variant="ghost" disabled className="h-8.5 text-xs text-destructive font-semibold">
                      Failed
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" disabled className="h-8.5 text-xs text-muted-foreground">
                      Processing...
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(test.id)}
                    className="h-8.5 w-8.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
