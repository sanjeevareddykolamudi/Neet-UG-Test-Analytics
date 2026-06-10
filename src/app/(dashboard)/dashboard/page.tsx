"use client";

import Link from "next/link";
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
  RefreshCw
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  Area,
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
    monthlyPerformance,
    weakTopicsDistribution,
    recentActivities,
    revisionTasks
  } = dashboardData;

  // Custom colors for Donut chart
  const PIE_COLORS = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6"];

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
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Welcome back, Student!
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

      {/* KPI Cards Grid */}
      <section className="grid gap-4 grid-cols-2 lg:grid-cols-6">
        {/* Total Tests */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
            <span className="text-xs font-semibold text-muted-foreground">Total Tests</span>
            <div className="rounded-lg bg-primary/10 p-1.5 text-primary">
              <FileText className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold">{summary.totalTests}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Scanned and Graded</p>
          </CardContent>
        </Card>

        {/* Average Marks */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
            <span className="text-xs font-semibold text-muted-foreground">Average Marks</span>
            <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-500">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold">{summary.averageMarks} <span className="text-xs text-muted-foreground font-normal">/720</span></div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium flex items-center gap-1">
              <span className="text-emerald-500 font-bold">+15 marks</span> last 3 tests
            </p>
          </CardContent>
        </Card>

        {/* Best Score */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
            <span className="text-xs font-semibold text-muted-foreground">Best Score</span>
            <div className="rounded-lg bg-amber-500/10 p-1.5 text-amber-500">
              <Award className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold">{summary.bestScore} <span className="text-xs text-muted-foreground font-normal">/720</span></div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">NEET Mock 8</p>
          </CardContent>
        </Card>

        {/* Current Rank */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
            <span className="text-xs font-semibold text-muted-foreground">Current Rank</span>
            <div className="rounded-lg bg-sky-500/10 p-1.5 text-sky-500">
              <Target className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold">#{summary.currentRank}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">National percentile: 98.4%</p>
          </CardContent>
        </Card>

        {/* Weak Topics */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
            <span className="text-xs font-semibold text-muted-foreground">Weak Topics</span>
            <div className="rounded-lg bg-destructive/10 p-1.5 text-destructive">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold">{summary.weakTopicsCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Accuracy below 60%</p>
          </CardContent>
        </Card>

        {/* Pending Revisions */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-sm transition-all hover:scale-[1.02] hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
            <span className="text-xs font-semibold text-muted-foreground">Revision Tasks</span>
            <div className="rounded-lg bg-violet-500/10 p-1.5 text-violet-500">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold">{summary.pendingRevisionTasksCount}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-medium">Due in next 48 hours</p>
          </CardContent>
        </Card>
      </section>

      {/* Row 1: Charts (Trend & Accuracy) */}
      <section className="grid gap-6 md:grid-cols-2">
        {/* Marks Trend Chart */}
        <Card className="border-border/40 bg-card/60 shadow-sm backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Marks Trend</span>
              <Badge variant="outline" className="font-semibold text-[10px] py-0">Last 8 Tests</Badge>
            </CardTitle>
            <CardDescription className="text-xs">Your progression curve vs average peer benchmarks</CardDescription>
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
                      fontSize: "11px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
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

        {/* Subject Wise Accuracy */}
        <Card className="border-border/40 bg-card/60 shadow-sm backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center justify-between">
              <span>Subject Wise Accuracy</span>
              <Badge variant="outline" className="font-semibold text-[10px] py-0">Percentage</Badge>
            </CardTitle>
            <CardDescription className="text-xs">Correct vs total questions attempted across key subjects</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectAccuracy} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.3)" />
                  <XAxis dataKey="subject" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border)/0.5)",
                      borderRadius: "8px",
                      fontSize: "11px"
                    }}
                  />
                  <Bar dataKey="accuracy" name="Accuracy %" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]}>
                    {subjectAccuracy.map((entry, index) => {
                      // Physics is red if low, Botany emerald, etc.
                      let color = "hsl(var(--primary))";
                      if (entry.subject === "Physics") color = "hsl(var(--accent))";
                      if (entry.subject === "Chemistry") color = "hsl(var(--secondary))";
                      if (entry.subject === "Botany") color = "#10b981";
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Row 2: Secondary Charts (Topic Accuracy, Monthly Trend, Weak Distribution) */}
      <section className="grid gap-6 md:grid-cols-3">
        {/* Monthly Performance Trend */}
        <Card className="border-border/40 bg-card/60 shadow-sm backdrop-blur-md md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Monthly Subject Trends</CardTitle>
            <CardDescription className="text-xs">Monthly accuracy percentage breakdown by topic category</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyPerformance} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.3)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border)/0.5)",
                      borderRadius: "8px",
                      fontSize: "11px"
                    }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="rect" wrapperStyle={{ fontSize: "11px" }} />
                  <Area type="monotone" dataKey="biology" name="Biology Accuracy %" fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeWidth={2} />
                  <Bar dataKey="physics" name="Physics %" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} maxBarSize={25} />
                  <Bar dataKey="chemistry" name="Chemistry %" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} maxBarSize={25} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Weak Topics Distribution Donut */}
        <Card className="border-border/40 bg-card/60 shadow-sm backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Weak Topics Distribution</CardTitle>
            <CardDescription className="text-xs">Total count of weak modules by exam subject</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col items-center justify-between">
            <div className="h-44 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={weakTopicsDistribution.filter(d => d.count > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
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
                <span className="text-2xl font-extrabold">{summary.weakTopicsCount}</span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase">Chapters</span>
              </div>
            </div>
            {/* Legend info */}
            <div className="grid grid-cols-2 gap-2 w-full mt-4 text-xs font-semibold">
              {weakTopicsDistribution.map((entry, idx) => (
                <div key={entry.subject} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }} />
                  <span className="text-muted-foreground">{entry.subject}:</span>
                  <span>{entry.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Row 3: Activities & Revision Tasks */}
      <section className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        {/* Upcoming Revision Tasks checklist */}
        <Card className="border-border/40 bg-card/60 shadow-sm backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-bold">Upcoming Revision Tasks</CardTitle>
              <CardDescription className="text-xs">Mark completed after study sessions</CardDescription>
            </div>
            <Button asChild size="sm" variant="outline" className="h-8 gap-1 border-primary/20 hover:bg-primary/5">
              <Link href="/revision-planner">
                View Planner
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2.5">
              {revisionTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => !isUpdatingRevision && toggleRevision(task.id)}
                  className={`group flex items-start gap-3 rounded-xl border border-border/20 p-3.5 cursor-pointer transition-all duration-200 hover:border-primary/45 ${
                    task.completed 
                      ? "bg-muted/30 border-muted opacity-60" 
                      : "bg-background/40 hover:bg-background/80"
                  }`}
                >
                  <div className="mt-0.5">
                    {task.completed ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-primary fill-primary/10" />
                    ) : (
                      <div className="h-4.5 w-4.5 rounded-md border-2 border-muted-foreground/40 group-hover:border-primary transition-colors" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold leading-none ${task.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {task.topic}
                      </span>
                      <Badge variant="outline" className="px-1.5 py-0 text-[9px] font-semibold">
                        {task.subject}
                      </Badge>
                      <Badge
                        variant={task.priority === "High" ? "destructive" : task.priority === "Medium" ? "warning" : "info"}
                        className="px-1.5 py-0 text-[9px] font-bold"
                      >
                        {task.priority} Priority
                      </Badge>
                    </div>
                    {task.notes && (
                      <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                        {task.notes}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium pt-1">
                      <Clock className="h-3 w-3" />
                      <span>Due by {task.dueDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Section */}
        <Card className="border-border/40 bg-card/60 shadow-sm backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Recent Workspace Activities</CardTitle>
            <CardDescription className="text-xs">Your system actions, submissions, and logs</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-4">
              {recentActivities.map((act) => {
                return (
                  <div key={act.id} className="flex items-start gap-3 text-xs leading-normal">
                    <div className="mt-1 flex h-2 w-2 rounded-full bg-primary" />
                    <div className="flex-1 space-y-0.5">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-foreground">{act.title}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{act.timestamp}</span>
                      </div>
                      <p className="text-muted-foreground/80 text-[11px]">{act.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button asChild variant="outline" className="w-full mt-6 text-xs font-semibold hover:bg-muted">
              <Link href="/mistake-journal">
                <BookOpen className="mr-2 h-4 w-4" /> Go to Mistake Journal
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
