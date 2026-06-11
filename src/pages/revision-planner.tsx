import { useState, useEffect } from "react";
import { Plus, Clock, CheckCircle2, Circle, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RevisionItem {
  id: string;
  topic: string;
  subject: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
  notes?: string;
}

const initialTasks: RevisionItem[] = [];

export default function RevisionPlannerPage() {
  const [tasks, setTasks] = useState<RevisionItem[]>(initialTasks);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [topic, setTopic] = useState("");
  const [subject, setSubject] = useState("Physics");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [notes, setNotes] = useState("");

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/revision-tasks");
      if (res.ok) {
        const data = await res.json();
        if (data.tasks) {
          setTasks(data.tasks);
        }
      }
    } catch (e) {
      console.error("Failed to fetch revision tasks:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;

    try {
      const res = await fetch("/api/revision-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          subject,
          dueDate,
          priority,
          notes
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.task) {
          setTasks([data.task, ...tasks]);
          setShowAddForm(false);
          setTopic("");
          setNotes("");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTask = async (id: string) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    const newCompleted = !target.completed;
    try {
      const res = await fetch(`/api/revision-tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: newCompleted })
      });

      if (res.ok) {
        setTasks(
          tasks.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id: string) => {
    if (confirm("Delete this revision task from your planner?")) {
      try {
        const res = await fetch(`/api/revision-tasks/${id}`, {
          method: "DELETE"
        });
        if (res.ok) {
          setTasks(tasks.filter((t) => t.id !== id));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Revision Planner & Scheduler</h1>
          <p className="text-sm text-muted-foreground">
            Schedule study tasks, check formulas, and coordinate active recall calendar schedules.
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="font-semibold shadow shadow-primary/10">
          <Plus className="mr-2 h-4 w-4" />
          {showAddForm ? "Close Planner Form" : "Schedule New Task"}
        </Button>
      </div>

      {showAddForm && (
        <Card className="border-border/40 bg-card/75 backdrop-blur-md shadow-md animate-in slide-in-from-top duration-300">
          <CardHeader>
            <CardTitle className="text-base font-bold">Create Active Recall Session</CardTitle>
            <CardDescription className="text-xs">Schedule upcoming formulas and NCERT revision passes.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTask} className="space-y-4 text-xs font-semibold">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="top">Task Description / Topic</Label>
                  <Input
                    id="top"
                    placeholder="e.g. Chemical Kinetics formulas active recall"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subj">Subject Category</Label>
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

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="due">Schedule Date</Label>
                  <Input
                    id="due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prio">Priority Status</Label>
                  <select
                    id="prio"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as "High" | "Medium" | "Low")}
                    className="h-9 w-full rounded-lg border border-border bg-background/50 px-3 text-xs outline-none focus:border-primary"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Subtopics & Study Notes</Label>
                <Input
                  id="notes"
                  placeholder="Notes, references, question numbers or NCERT page range..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Schedule Session
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Checklist Grid */}
      <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
        {/* Checklist */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Task Checklist</span>
              <span className="text-xs text-muted-foreground font-semibold">
                {tasks.filter((t) => !t.completed).length} items pending
              </span>
            </CardTitle>
            <CardDescription className="text-xs">Mark completed to adjust your weak topic statistics.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-3">
              {loading ? (
                <div className="flex h-32 items-center justify-center text-xs text-muted-foreground font-semibold">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" /> Loading revision checklist...
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No revision sessions scheduled.
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-start justify-between rounded-xl border border-border/20 p-4 transition duration-200 hover:border-primary/20 bg-background/40 ${
                      task.completed ? "bg-muted/10 opacity-60 border-muted" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleTask(task.id)}
                        className="h-6 w-6 mt-0.5 rounded-md text-primary hover:bg-primary/10"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-primary fill-primary/10" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </Button>
                      <div className="space-y-1 flex-1 min-w-0 pr-4">
                        <h4 className={`text-xs font-bold leading-snug ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                          {task.topic}
                        </h4>
                        {task.notes && (
                          <p className="text-[11px] text-muted-foreground/80 leading-normal">{task.notes}</p>
                        )}
                        <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground pt-1.5 font-medium">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due: {task.dueDate}
                          </span>
                          <Badge variant="outline" className="px-1.5 py-0 text-[9px] font-bold">{task.subject}</Badge>
                          <Badge
                            variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "warning" : "info"}
                            className="px-1.5 py-0 text-[9px] font-bold"
                          >
                            {task.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteTask(task.id)}
                      className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors rounded-lg flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Study tips & reminders */}
        <div className="space-y-6">
          <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold">Revision Framework</CardTitle>
              <CardDescription className="text-xs">Suggested scientific review schedule</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs leading-relaxed text-muted-foreground">
              <div className="flex gap-3 items-start">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] flex-shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-bold text-foreground">Day 1: Error Correction</p>
                  <p>Log mistakes. Re-solve incorrect mock test questions on paper immediately after grading.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] flex-shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-bold text-foreground">Day 3: Formula Audit</p>
                  <p>Practice active recall of core concepts (e.g. torque equations, solubility constants) without looking.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] flex-shrink-0 mt-0.5">3</span>
                <div>
                  <p className="font-bold text-foreground">Day 7: Parallel Practice</p>
                  <p>Attempt 5 similar NCERT Exemplar questions to confirm that the pattern mistake is fully resolved.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
