import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle2, Award, CalendarPlus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface WeakTopic {
  id: string;
  topic: string;
  subject: string;
  accuracy: number;
  incorrectQuestions: number;
  unattemptedQuestions: number;
  weightage: "High" | "Medium" | "Low";
  status: "critical" | "warning";
}

const initialWeakTopics: WeakTopic[] = [];

export default function WeakTopicsPage() {
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>(initialWeakTopics);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [plannedIds, setPlannedIds] = useState<string[]>([]);

  const fetchWeakTopics = async () => {
    try {
      const res = await fetch("/api/analytics/weak-topics");
      if (res.ok) {
        const data = await res.json();
        if (data.weakTopics) {
          setWeakTopics(data.weakTopics);
        }
      }
    } catch (e) {
      console.error("Failed to fetch weak topics:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeakTopics();
  }, []);

  const planRevision = async (id: string, topic: string, subject: string, priority: string) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDateStr = tomorrow.toISOString().split("T")[0];

      const res = await fetch("/api/revision-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: `${topic} formulas active recall`,
          subject,
          dueDate: dueDateStr,
          priority: priority === "High" ? "High" : priority === "Medium" ? "Medium" : "Low",
          notes: `System planned revision task for weak topic ${topic} with ${priority} weightage.`
        })
      });

      if (res.ok) {
        setPlannedIds([...plannedIds, id]);
      }
    } catch (e) {
      console.error("Failed to plan revision:", e);
    }
  };

  const filteredTopics = weakTopics.filter((t) => {
    return subjectFilter === "all" || t.subject.toLowerCase() === subjectFilter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Weak Topics & Chapter Analysis</h1>
        <p className="text-sm text-muted-foreground">
          Identify chapters with accuracy below 60% based on your graded tests, sorted by subject weightage.
        </p>
      </div>

      {/* Summary Row */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-muted-foreground">Vulnerable Chapters</span>
            <AlertTriangle className="h-4.5 w-4.5 text-destructive" />
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-2xl font-extrabold">{weakTopics.filter(t => t.accuracy < 60).length}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Accuracy strictly under 60%</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-muted-foreground">High Weightage Focus</span>
            <Award className="h-4.5 w-4.5 text-amber-500" />
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-2xl font-extrabold">
              {weakTopics.filter(t => t.weightage === "High" && t.accuracy < 60).length}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">High-yield chapters to prioritize</p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader className="py-4 flex flex-row items-center justify-between space-y-0">
            <span className="text-xs font-semibold text-muted-foreground">Most Vulnerable Subject</span>
            <span className="text-xs font-bold text-destructive">Physics</span>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-2xl font-extrabold">3 Chapters</p>
            <p className="text-[10px] text-muted-foreground mt-1">Rotational, Thermo, Electrostatics</p>
          </CardContent>
        </Card>
      </section>

      {/* Filter toolbar */}
      <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-sm">
        <CardContent className="p-4 flex gap-2 justify-between items-center">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Filtered Syllabus Chapters</span>
          <div className="flex gap-1">
            {["All", "Physics", "Chemistry", "Botany", "Zoology"].map((sub) => (
              <Button
                key={sub}
                variant={subjectFilter === sub.toLowerCase() || (sub === "All" && subjectFilter === "all") ? "default" : "outline"}
                size="sm"
                className="h-8.5 text-xs font-semibold"
                onClick={() => setSubjectFilter(sub === "All" ? "all" : sub.toLowerCase())}
              >
                {sub}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Weak Chapter Progress Cards */}
      {loading ? (
        <div className="flex h-32 items-center justify-center text-xs text-muted-foreground font-semibold">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" /> Loading weak chapters...
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-12 text-center text-xs text-muted-foreground">
          No weak chapters identified (&lt;60% accuracy). Keep up the great work!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredTopics.map((item) => {
            const isCritical = item.accuracy < 60;
            const isPlanned = plannedIds.includes(item.id);

            return (
              <Card key={item.id} className="border-border/40 bg-card/60 backdrop-blur-sm shadow-sm transition hover:shadow-md">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-bold">{item.subject}</Badge>
                        <Badge
                          variant={item.weightage === "High" ? "destructive" : item.weightage === "Medium" ? "warning" : "info"}
                          className="px-1.5 py-0 text-[10px] font-bold"
                        >
                          {item.weightage} Weightage
                        </Badge>
                      </div>
                      <CardTitle className="text-sm font-extrabold mt-1.5">{item.topic}</CardTitle>
                    </div>
                    <Badge variant={isCritical ? "destructive" : "warning"} className="font-bold text-[10px]">
                      {item.accuracy}% Accuracy
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-4 text-xs font-semibold">
                  {/* Accuracy Loading Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                      <span>Performance Accuracy</span>
                      <span>{item.accuracy}%</span>
                    </div>
                    <Progress
                      value={item.accuracy}
                      className={`h-2 ${isCritical ? "[&>div]:bg-destructive" : "[&>div]:bg-amber-500"}`}
                    />
                  </div>

                  {/* Incorrect Details */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] bg-muted/30 p-2.5 rounded-lg border border-border/20">
                    <div className="text-center border-r border-border/20">
                      <span className="text-muted-foreground font-medium">Incorrect Answers</span>
                      <p className="text-sm font-extrabold text-destructive mt-0.5">{item.incorrectQuestions}</p>
                    </div>
                    <div className="text-center">
                      <span className="text-muted-foreground font-medium">Unattempted Questions</span>
                      <p className="text-sm font-extrabold text-muted-foreground mt-0.5">{item.unattemptedQuestions}</p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      variant={isPlanned ? "outline" : "default"}
                      onClick={() => planRevision(item.id, item.topic, item.subject, item.weightage)}
                      disabled={isPlanned}
                      className="h-8 text-[10px] font-bold gap-1 shadow shadow-primary/5"
                    >
                      {isPlanned ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          Added to Planner
                        </>
                      ) : (
                        <>
                          <CalendarPlus className="h-3.5 w-3.5" />
                          Plan Active Revision
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
