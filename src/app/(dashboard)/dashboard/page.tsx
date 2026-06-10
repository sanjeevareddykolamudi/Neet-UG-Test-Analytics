"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FileText,
  Award,
  TrendingUp,
  Target,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  BookOpen,
  RefreshCw,
  Database,
  Activity,
  FileUp,
  Sparkles
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";

import { useDashboardData } from "@/hooks/use-dashboard-data";
import { ErrorBoundary } from "@/components/app/error-boundary";
import { DashboardSkeletons } from "@/components/app/skeletons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}

function DashboardContent() {
  const {
    dashboardData,
    isLoading,
    error,
    toggleRevision,
    isUpdatingRevision,
    refetch
  } = useDashboardData();

  const [activeTab, setActiveTab] = useState<"trends" | "accuracy" | "weakness">("trends");

  if (isLoading) {
    return <DashboardSkeletons />;
  }

  if (error || !dashboardData) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center backdrop-blur-sm">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <h2 className="mt-4 text-lg font-bold">Failed to load dashboard data</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          There was an error communicating with the NEET analytics API. Please try again.
        </p>
        <Button onClick={() => refetch()} variant="outline" className="mt-6">
          <RefreshCw className="mr-2 h-4 w-4" /> Try again
        </Button>
      </div>
    );
  }

  const {
    summary,
    marksTrend,
    subjectAccuracy,
    topicAccuracy,
    chapterAccuracy,
    topicMasteryTrend,
    weakTopicsDistribution,
    recentActivities,
    revisionTasks,
    recentUploads,
    mostRepeatedMistakes
  } = dashboardData;

  // Custom colors for charts
  const PIE_COLORS = ["hsl(var(--destructive))", "hsl(var(--warning))", "hsl(var(--primary))", "hsl(var(--accent))"];
  const SUBJECT_COLORS: Record<string, string> = {
    Physics: "hsl(var(--accent))",
    Chemistry: "hsl(var(--secondary))",
    Botany: "#10b981",
    Zoology: "#06b6d4"
  };

  // Revision progress calculations
  const totalTasks = revisionTasks.length;
  const completedTasks = revisionTasks.filter((t) => t.completed).length;
  const revisionProgressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Goal Target */}
      <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/40 p-6 shadow-lg backdrop-blur-xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl" />
        
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="success" className="font-bold">Target: NEET-UG 2026</Badge>
              <span className="text-xs text-muted-foreground">Exam Date: May 3, 2026</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text flex items-center gap-2">
              Welcome back, Student! <Sparkles className="h-5 w-5 text-amber-400" />
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Your average marks are at <span className="font-bold text-foreground">{summary.averageMarks}</span>/720. 
              You need <span className="font-bold text-primary dark:text-teal-400">100 more marks</span> to reach your dream college cutoff (680+). 
              Focus on rotational motion and equilibrium mistakes today.
            </p>
          </div>
          <div className="w-full md:w-72 space-y-2 bg-muted/40 p-4 rounded-xl border border-border/30">
            <div className="flex justify-between text-xs font-semibold">
              <span>Cutoff Target Progress</span>
              <span className="text-primary">{Math.round((summary.averageMarks / 680) * 100)}%</span>
            </div>
            <Progress value={Math.round((summary.averageMarks / 680) * 100)} className="h-2" />
            <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
              <span>Avg: {summary.averageMarks}</span>
              <span>Cutoff Target: 680</span>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Cards Grid - 8 Cards */}
      <section className="grid gap-4 grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
        {/* Total Tests */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-3.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Tests</span>
            <div className="rounded-lg bg-primary/10 p-1 text-primary">
              <FileText className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-extrabold">{summary.totalTests}</div>
            <p className="text-[9px] text-muted-foreground font-medium">Graded Mocks</p>
          </CardContent>
        </Card>

        {/* Average Marks */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-3.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Avg Marks</span>
            <div className="rounded-lg bg-emerald-500/10 p-1 text-emerald-500">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-extrabold">{summary.averageMarks}</div>
            <p className="text-[9px] text-muted-foreground font-medium flex items-center gap-1">
              <span className="text-emerald-500 font-bold">+15</span> last 3 tests
            </p>
          </CardContent>
        </Card>

        {/* Best Score */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-3.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Best Score</span>
            <div className="rounded-lg bg-amber-500/10 p-1 text-amber-500">
              <Award className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-extrabold">{summary.bestScore}</div>
            <p className="text-[9px] text-muted-foreground font-medium">Mock 8</p>
          </CardContent>
        </Card>

        {/* Current Rank */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-3.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Current Rank</span>
            <div className="rounded-lg bg-sky-500/10 p-1 text-sky-500">
              <Target className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-extrabold">#{summary.currentRank}</div>
            <p className="text-[9px] text-muted-foreground font-medium">Top 2.5% national</p>
          </CardContent>
        </Card>

        {/* Question Bank Size */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-3.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-semibold">Q-Bank Size</span>
            <div className="rounded-lg bg-indigo-500/10 p-1 text-indigo-500">
              <Database className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-extrabold">{summary.questionBankSize}</div>
            <p className="text-[9px] text-muted-foreground font-medium">Indexed Items</p>
          </CardContent>
        </Card>

        {/* Weak Topics */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-3.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Weak Topics</span>
            <div className="rounded-lg bg-destructive/10 p-1 text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-extrabold">{summary.weakTopicsCount}</div>
            <p className="text-[9px] text-muted-foreground font-medium">Accuracy &lt; 60%</p>
          </CardContent>
        </Card>

        {/* Recurring Mistakes */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-3.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Recurring</span>
            <div className="rounded-lg bg-rose-500/10 p-1 text-rose-500">
              <Activity className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-extrabold">{summary.recurringMistakesCount}</div>
            <p className="text-[9px] text-muted-foreground font-medium">Repetitive Patterns</p>
          </CardContent>
        </Card>

        {/* Pending Revisions */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-1 space-y-0 p-3.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Revisions</span>
            <div className="rounded-lg bg-violet-500/10 p-1 text-violet-500">
              <Calendar className="h-3.5 w-3.5" />
            </div>
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-xl font-extrabold">{summary.pendingRevisionTasksCount}</div>
            <p className="text-[9px] text-muted-foreground font-medium">Due Tasks</p>
          </CardContent>
        </Card>
      </section>

      {/* Tabbed Chart Panel - Interactive Charts */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/45 pb-1">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">Diagnostics Visualizations</h2>
          <div className="flex gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/20">
            <Button
              variant={activeTab === "trends" ? "default" : "ghost"}
              size="sm"
              className="h-8.5 rounded-lg text-xs font-semibold"
              onClick={() => setActiveTab("trends")}
            >
              Performance & Mastery Trends
            </Button>
            <Button
              variant={activeTab === "accuracy" ? "default" : "ghost"}
              size="sm"
              className="h-8.5 rounded-lg text-xs font-semibold"
              onClick={() => setActiveTab("accuracy")}
            >
              Accuracy Breakdown
            </Button>
            <Button
              variant={activeTab === "weakness" ? "default" : "ghost"}
              size="sm"
              className="h-8.5 rounded-lg text-xs font-semibold"
              onClick={() => setActiveTab("weakness")}
            >
              Weakness Distribution
            </Button>
          </div>
        </div>

        {/* Tab contents */}
        {activeTab === "trends" && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Marks Trend Chart */}
            <Card className="border-border/40 bg-card/60 shadow-sm backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <span>Marks Trend</span>
                  <Badge variant="outline" className="font-semibold text-[10px] py-0">Last 8 Tests</Badge>
                </CardTitle>
                <CardDescription className="text-xs">Progression curve vs average peer benchmarks</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={marksTrend} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.3)" />
                      <XAxis dataKey="testName" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} domain={[400, 720]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border)/0.5)",
                          borderRadius: "8px",
                          fontSize: "11px"
                        }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                      <Line
                        type="monotone"
                        dataKey="score"
                        name="My Score"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 1 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="averageScore"
                        name="Peer Avg"
                        stroke="hsl(var(--muted-foreground)/0.6)"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Topic Mastery Trend Chart */}
            <Card className="border-border/40 bg-card/60 shadow-sm backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center justify-between">
                  <span>Topic Mastery Trend</span>
                  <Badge variant="outline" className="font-semibold text-[10px] py-0">Syllabus Weak Modules</Badge>
                </CardTitle>
                <CardDescription className="text-xs">Accuracy over time for primary vulnerable topics</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={topicMasteryTrend} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.3)" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border)/0.5)",
                          borderRadius: "8px",
                          fontSize: "11px"
                        }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                      <Line type="monotone" dataKey="Rotational Dynamics" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Ionic Equilibrium" stroke="hsl(var(--secondary))" strokeWidth={2.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="Thermodynamics" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "accuracy" && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Subject Accuracy */}
            <Card className="border-border/40 bg-card/60 shadow-sm backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Subject Accuracy</CardTitle>
                <CardDescription className="text-xs">Accuracy percentage by primary field</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectAccuracy} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.3)" />
                      <XAxis dataKey="subject" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border)/0.5)",
                          borderRadius: "8px",
                          fontSize: "11px"
                        }}
                      />
                      <Bar dataKey="accuracy" name="Accuracy %" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]}>
                        {subjectAccuracy.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SUBJECT_COLORS[entry.subject] || "hsl(var(--primary))"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chapter Accuracy */}
            <Card className="border-border/40 bg-card/60 shadow-sm backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Chapter Performance</CardTitle>
                <CardDescription className="text-xs">Accuracy percentage mapping for key chapters</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chapterAccuracy} layout="vertical" margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border)/0.3)" />
                      <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fontSize: 9 }} />
                      <YAxis dataKey="chapter" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 8 }} width={90} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border)/0.5)",
                          borderRadius: "8px",
                          fontSize: "11px"
                        }}
                      />
                      <Bar dataKey="accuracy" name="Accuracy %" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={12}>
                        {chapterAccuracy.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SUBJECT_COLORS[entry.subject] || "hsl(var(--primary))"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Topic Accuracy */}
            <Card className="border-border/40 bg-card/60 shadow-sm backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">Topic Detail Accuracy</CardTitle>
                <CardDescription className="text-xs">Performance in high/medium weightage subtopics</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topicAccuracy} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.3)" />
                      <XAxis dataKey="topic" tickLine={false} axisLine={false} tick={{ fontSize: 8 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9 }} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border)/0.5)",
                          borderRadius: "8px",
                          fontSize: "11px"
                        }}
                      />
                      <Bar dataKey="accuracy" name="Accuracy %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                        {topicAccuracy.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.accuracy < 60 ? "hsl(var(--destructive))" : "hsl(var(--primary))"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "weakness" && (
          <Card className="border-border/40 bg-card/60 shadow-sm backdrop-blur-md max-w-xl mx-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-center">Weak Topics Distribution</CardTitle>
              <CardDescription className="text-xs text-center">Count of weak chapters grouped by subject (Accuracy below 60%)</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col items-center justify-center">
              <div className="h-56 w-full max-w-[300px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={weakTopicsDistribution.filter((d) => d.count > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="subject"
                    >
                      {weakTopicsDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border)/0.5)",
                        borderRadius: "8px",
                        fontSize: "11px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-extrabold">{summary.weakTopicsCount}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Chapters</span>
                </div>
              </div>
              {/* Custom Legend */}
              <div className="grid grid-cols-2 gap-4 w-full mt-4 text-xs font-semibold px-4">
                {weakTopicsDistribution.map((entry, idx) => (
                  <div key={entry.subject} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }} />
                    <span className="text-muted-foreground">{entry.subject}:</span>
                    <span>{entry.count} weak areas</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Grid: Widgets */}
      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Widget 1: Revision Progress & Tasks */}
        <Card className="border-border/40 bg-card/60 shadow-sm backdrop-blur-md xl:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Revision Progress</span>
              <Badge variant="outline" className="text-[10px] font-bold py-0">{revisionProgressPercent}% Done</Badge>
            </CardTitle>
            <CardDescription className="text-xs">Your progress on active recall targets</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 space-y-4">
            <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-xl border border-border/20">
              <div className="flex-1 space-y-1">
                <span className="text-xs text-muted-foreground font-semibold">Sessions completed</span>
                <p className="text-lg font-extrabold">{completedTasks} <span className="text-xs font-normal text-muted-foreground">/ {totalTasks} scheduled</span></p>
              </div>
              <div className="w-12 h-12 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Completed", value: completedTasks },
                        { name: "Pending", value: totalTasks - completedTasks }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={16}
                      outerRadius={22}
                      dataKey="value"
                    >
                      <Cell fill="hsl(var(--primary))" />
                      <Cell fill="hsl(var(--muted))" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground">Upcoming due tasks</p>
              <div className="space-y-2">
                {revisionTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => !isUpdatingRevision && toggleRevision(task.id)}
                    className={`flex items-start gap-2.5 rounded-lg border border-border/20 p-2.5 cursor-pointer transition hover:border-primary/30 ${
                      task.completed ? "bg-muted/10 opacity-60 line-through" : "bg-background/40"
                    }`}
                  >
                    <div className="mt-0.5">
                      {task.completed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary fill-primary/10" />
                      ) : (
                        <div className="h-3.5 w-3.5 rounded border border-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-[11px] font-semibold">
                      <p className="truncate text-foreground leading-snug">{task.topic}</p>
                      <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-1">
                        <span>{task.subject}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Widget 2: Most Repeated Mistakes */}
        <Card className="border-border/40 bg-card/60 shadow-sm backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Repeated Mistakes</span>
              <Badge variant="destructive" className="text-[10px] font-bold py-0">Critical</Badge>
            </CardTitle>
            <CardDescription className="text-xs">Conceptual gaps solved incorrectly on multiple tests</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2.5">
              {mostRepeatedMistakes.map((mis, index) => (
                <div key={index} className="flex items-center justify-between rounded-xl border border-border/20 p-3 bg-background/40">
                  <div className="space-y-0.5 flex-1 min-w-0 pr-2 text-[11px] font-semibold">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="px-1 py-0 text-[8px] font-bold">{mis.subject}</Badge>
                      <span className="text-[9px] text-muted-foreground font-medium">Last: {mis.lastSeen}</span>
                    </div>
                    <p className="text-foreground truncate mt-1 leading-snug">{mis.topic}</p>
                  </div>
                  <div className="rounded-lg bg-destructive/10 px-2.5 py-1 text-center flex-shrink-0 border border-destructive/20">
                    <span className="text-sm font-extrabold text-destructive">{mis.count}x</span>
                    <p className="text-[8px] text-destructive font-bold uppercase tracking-wider">Wrong</p>
                  </div>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" size="sm" className="w-full mt-4 text-xs font-semibold h-8.5 hover:bg-muted">
              <Link href="/mistake-journal">
                <BookOpen className="mr-1.5 h-3.5 w-3.5" /> Full Mistake Journal
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Widget 3: Question Processing & Uploads */}
        <Card className="border-border/40 bg-card/60 shadow-sm backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Question OCR Status</span>
              <Badge variant="secondary" className="text-[10px] font-bold py-0">Pipeline</Badge>
            </CardTitle>
            <CardDescription className="text-xs">Realtime scanned document processing queue</CardDescription>
          </CardHeader>
          <CardContent className="pt-2 space-y-4">
            <div className="space-y-2.5">
              {recentUploads.map((up) => (
                <div key={up.id} className="flex items-center justify-between rounded-xl border border-border/20 p-3 bg-background/40">
                  <div className="space-y-0.5 flex-1 min-w-0 pr-2 text-[11px] font-semibold">
                    <p className="text-foreground truncate leading-snug">{up.name}</p>
                    <p className="text-[9px] text-muted-foreground font-medium">{up.size} • {up.uploadedAt}</p>
                  </div>
                  <div>
                    {up.status === "completed" ? (
                      <Badge variant="success" className="px-1.5 py-0 text-[9px] font-bold">Indexed</Badge>
                    ) : up.status === "parsing" ? (
                      <Badge variant="warning" className="px-1.5 py-0 text-[9px] font-bold animate-pulse">Scanning</Badge>
                    ) : up.status === "pending_review" ? (
                      <Badge variant="info" className="px-1.5 py-0 text-[9px] font-bold">OCR Review</Badge>
                    ) : (
                      <Badge variant="destructive" className="px-1.5 py-0 text-[9px] font-bold">Failed</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button asChild size="sm" className="w-full mt-1 text-xs font-semibold h-8.5 shadow">
              <Link href="/question-papers">
                <FileUp className="mr-1.5 h-3.5 w-3.5" /> Manage PDF Uploads
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Row 4: Recent Activities */}
      <section className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
        {/* Recent graded tests list */}
        <Card className="border-border/40 bg-card/60 shadow-sm backdrop-blur-md">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base font-bold">Recent Mock Exams</CardTitle>
              <CardDescription className="text-xs">Grades, scores, and analytical reviews</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="h-8 text-xs font-semibold">
              <Link href="/tests">View All Tests</Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30 text-muted-foreground uppercase font-bold tracking-wider">
                    <th className="p-3 pl-4">Mock Paper Title</th>
                    <th className="p-3">Graded Score</th>
                    <th className="p-3">Accuracy</th>
                    <th className="p-3 text-right pr-4">Review</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { title: "NEET Full Syllabus Mock 08", score: 645, total: 720, accuracy: 89, date: "06/08" },
                    { title: "NEET Full Syllabus Mock 07", score: 615, total: 720, accuracy: 85, date: "06/01" },
                    { title: "NEET Physics Mechanics Sectional", score: 145, total: 180, accuracy: 80, date: "05/24" },
                    { title: "NEET Chemistry Organic Sectional", score: 152, total: 180, accuracy: 84, date: "05/18" },
                  ].map((exam, i) => (
                    <tr key={i} className="border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 pl-4 font-bold text-foreground">
                        {exam.title}
                        <span className="text-[10px] text-muted-foreground font-normal block sm:inline sm:ml-2">({exam.date})</span>
                      </td>
                      <td className="p-3 font-extrabold text-primary">{exam.score} <span className="text-[10px] text-muted-foreground font-normal">/ {exam.total}</span></td>
                      <td className="p-3 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span>{exam.accuracy}%</span>
                          <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${exam.accuracy}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right pr-4">
                        <Button asChild size="icon" variant="ghost" className="h-7 w-7 rounded-lg">
                          <Link href="/analytics"><ArrowUpRight className="h-3.5 w-3.5" /></Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Activity log */}
        <Card className="border-border/40 bg-card/60 shadow-sm backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Workspace System Logs</CardTitle>
            <CardDescription className="text-xs">Your system actions, logs, and OCR status updates</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-4">
              {recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs leading-normal">
                  <div className="mt-1 flex h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <span className="font-semibold text-foreground truncate">{act.title}</span>
                      <span className="text-[9px] text-muted-foreground font-medium flex-shrink-0">{act.timestamp}</span>
                    </div>
                    <p className="text-muted-foreground/80 text-[10px] truncate">{act.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
