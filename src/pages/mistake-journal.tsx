import { useState, useEffect } from "react";
import { Plus, Search, CheckCircle, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface JournalMistake {
  id: string;
  testName: string;
  questionNumber: number;
  subject: string;
  topic: string;
  markedOption: string;
  correctOption: string;
  conceptsToRevise: string;
  status: "review_needed" | "resolved";
}

const initialMistakes: JournalMistake[] = [];

export default function MistakeJournalPage() {
  const [mistakes, setMistakes] = useState<JournalMistake[]>(initialMistakes);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Form states for logging new mistakes
  const [showAddForm, setShowAddForm] = useState(false);
  const [testName, setTestName] = useState("");
  const [qNumber, setQNumber] = useState("");
  const [subject, setSubject] = useState("Physics");
  const [topic, setTopic] = useState("");
  const [marked, setMarked] = useState("A");
  const [correct, setCorrect] = useState("A");
  const [concepts, setConcepts] = useState("");

  const fetchMistakes = async () => {
    try {
      const res = await fetch("/api/mistakes");
      if (res.ok) {
        const data = await res.json();
        if (data.mistakes) {
          setMistakes(data.mistakes);
        }
      }
    } catch (e) {
      console.error("Failed to fetch mistakes:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMistakes();
  }, []);

  const handleAddMistake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName || !qNumber || !topic || !concepts) return;

    try {
      const res = await fetch("/api/mistakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testName,
          questionNumber: parseInt(qNumber),
          subject,
          topic,
          markedOption: marked,
          correctOption: correct,
          conceptsToRevise: concepts
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.mistake) {
          setMistakes([data.mistake, ...mistakes]);
          setShowAddForm(false);
          // Clear inputs
          setTestName("");
          setQNumber("");
          setTopic("");
          setConcepts("");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleStatus = async (id: string) => {
    const target = mistakes.find((m) => m.id === id);
    if (!target) return;

    const newStatus = target.status === "review_needed" ? "resolved" : "review_needed";
    try {
      const res = await fetch(`/api/mistakes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setMistakes(
          mistakes.map((m) =>
            m.id === id ? { ...m, status: newStatus } : m
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteMistake = async (id: string) => {
    if (confirm("Delete this mistake from your journal?")) {
      try {
        const res = await fetch(`/api/mistakes/${id}`, {
          method: "DELETE"
        });
        if (res.ok) {
          setMistakes(mistakes.filter((m) => m.id !== id));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredMistakes = mistakes.filter((m) => {
    const matchesSearch = m.topic.toLowerCase().includes(search.toLowerCase()) || m.testName.toLowerCase().includes(search.toLowerCase()) || m.conceptsToRevise.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = subjectFilter === "all" || m.subject.toLowerCase() === subjectFilter.toLowerCase();
    const matchesStatus = statusFilter === "all" || m.status === statusFilter;
    return matchesSearch && matchesSubject && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mistake Journal</h1>
          <p className="text-sm text-muted-foreground">
            A specialized registry for recording and revising questions you solved incorrectly on mock tests.
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="font-semibold shadow shadow-primary/10">
          <Plus className="mr-2 h-4 w-4" />
          {showAddForm ? "Close Form" : "Log New Mistake"}
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-border/40 bg-card/70 backdrop-blur-md shadow-md animate-in slide-in-from-top duration-300">
          <CardHeader>
            <CardTitle className="text-base font-bold">Log Incorrect Response</CardTitle>
            <CardDescription className="text-xs">Record question details to track conceptual gaps.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMistake} className="space-y-4 text-xs font-semibold">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="test">Mock Test Title</Label>
                  <Input
                    id="test"
                    placeholder="e.g. NEET Mock 8"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qnum">Question Number</Label>
                  <Input
                    id="qnum"
                    type="number"
                    placeholder="e.g. 15"
                    value={qNumber}
                    onChange={(e) => setQNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subj">Subject</Label>
                  <select
                    id="subj"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-background/50 px-3 text-xs outline-none focus:border-primary"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Botany">Botany</option>
                    <option value="Zoology">Zoology</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="top">Topic / Chapter</Label>
                  <Input
                    id="top"
                    placeholder="e.g. Thermodynamics"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mo">Marked Option</Label>
                  <select
                    id="mo"
                    value={marked}
                    onChange={(e) => setMarked(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-background/50 px-3 text-xs outline-none focus:border-primary"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="Unattempted">Unattempted</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="co">Correct Option</Label>
                  <select
                    id="co"
                    value={correct}
                    onChange={(e) => setCorrect(e.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-background/50 px-3 text-xs outline-none focus:border-primary"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="concepts">Core Concept Gaps & Lesson Notes</Label>
                <Input
                  id="concepts"
                  placeholder="Explain why the marked option was chosen and the formula correction needed..."
                  value={concepts}
                  onChange={(e) => setConcepts(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Mistake Log
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter toolbar */}
      <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search mistakes or topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-background/50 pl-9 pr-4 text-xs outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background/50 px-3 text-xs outline-none focus:border-primary"
            >
              <option value="all">All Subjects</option>
              <option value="physics">Physics</option>
              <option value="chemistry">Chemistry</option>
              <option value="botany">Botany</option>
              <option value="zoology">Zoology</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-border bg-background/50 px-3 text-xs outline-none focus:border-primary"
            >
              <option value="all">All Statuses</option>
              <option value="review_needed">Needs Review</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Mistake Entries List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex h-32 items-center justify-center text-xs text-muted-foreground font-semibold">
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" /> Loading mistake journal...
          </div>
        ) : filteredMistakes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-12 text-center text-xs text-muted-foreground">
            No logged mistakes fit the selected category filter.
          </div>
        ) : (
          filteredMistakes.map((mis) => (
            <Card
              key={mis.id}
              className={`border-border/40 bg-card/60 backdrop-blur-sm shadow-sm transition hover:shadow-md ${
                mis.status === "resolved" ? "opacity-60 border-muted bg-muted/20" : ""
              }`}
            >
              <CardHeader className="p-4 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-extrabold text-foreground">{mis.testName} (Q{mis.questionNumber})</span>
                    <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-bold">{mis.subject}</Badge>
                    <Badge
                      variant={mis.status === "resolved" ? "success" : "warning"}
                      className="px-1.5 py-0 text-[10px] font-bold"
                    >
                      {mis.status === "resolved" ? "Resolved" : "Needs Review"}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-extrabold">{mis.topic}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={mis.status === "resolved" ? "outline" : "default"}
                    onClick={() => toggleStatus(mis.id)}
                    className="h-7.5 px-2.5 font-bold text-[10px]"
                  >
                    {mis.status === "resolved" ? (
                      <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500" /> Re-open</span>
                    ) : (
                      "Mark Resolved"
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMistake(mis.id)}
                    className="h-7.5 w-7.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs">
                <div className="grid gap-3 sm:grid-cols-4 items-center">
                  <div className="sm:col-span-1 rounded-lg bg-muted/40 p-2.5 border border-border/20 text-center font-medium">
                    <div className="text-[10px] text-muted-foreground">Marked Answer</div>
                    <div className="text-base font-extrabold text-destructive mt-0.5">{mis.markedOption}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Correct: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{mis.correctOption}</span></div>
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <p className="font-bold text-muted-foreground">Concepts to revise & fix</p>
                    <p className="text-foreground leading-relaxed font-semibold bg-background/50 border border-border/20 p-2.5 rounded-lg">
                      {mis.conceptsToRevise}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
