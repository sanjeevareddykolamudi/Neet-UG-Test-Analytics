import { useState } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const detailSubjectStats = [
  { subject: "Physics", attempted: 360, correct: 245, incorrect: 98, unattempted: 17, accuracy: 68 },
  { subject: "Chemistry", attempted: 360, correct: 281, incorrect: 64, unattempted: 15, accuracy: 78 },
  { subject: "Botany", attempted: 360, correct: 317, incorrect: 34, unattempted: 9, accuracy: 88 },
  { subject: "Zoology", attempted: 360, correct: 302, incorrect: 47, unattempted: 11, accuracy: 84 }
];

const mockTopicRadar = [
  { topic: "Mechanics", A: 65, fullMark: 100 },
  { topic: "Thermodynamics", A: 55, fullMark: 100 },
  { topic: "Inorganic", A: 78, fullMark: 100 },
  { topic: "Organic", A: 82, fullMark: 100 },
  { topic: "Genetics", A: 91, fullMark: 100 },
  { topic: "Human Physio", A: 88, fullMark: 100 }
];

const mockMonthlyTrend = [
  { month: "Jan", score: 490 },
  { month: "Feb", score: 520 },
  { month: "Mar", score: 535 },
  { month: "Apr", score: 560 },
  { month: "May", score: 590 },
  { month: "Jun", score: 645 }
];

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState("3m");

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Advanced Analytics Portal</h1>
          <p className="text-sm text-muted-foreground">
            A comprehensive, deep-dive examination of your NEET syllabus accuracy, trend models, and weak subject clusters.
          </p>
        </div>
        <div className="flex gap-1 bg-muted/40 p-1 rounded-xl border border-border/20 self-start">
          {[
            { key: "1m", label: "Last Month" },
            { key: "3m", label: "Last 3 M" },
            { key: "6m", label: "Last 6 M" },
            { key: "all", label: "All Time" }
          ].map((item) => (
            <Button
              key={item.key}
              variant={timeframe === item.key ? "default" : "ghost"}
              size="sm"
              className="h-8 text-xs font-semibold rounded-lg"
              onClick={() => setTimeframe(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid: Extended stats */}
      <section className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
        {/* Deep Syllabus breakdown chart */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Monthly Score Growth</CardTitle>
            <CardDescription className="text-xs">Highest test score achieved in each of the past months</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockMonthlyTrend} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.3)" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} domain={[400, 720]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border)/0.5)",
                      borderRadius: "8px",
                      fontSize: "11px"
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name="Max score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Radar topic distribution */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">Syllabus Area Strengths</CardTitle>
            <CardDescription className="text-xs">Accuracy percentage mapping across core NEET blocks</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 flex items-center justify-center">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={mockTopicRadar}>
                  <PolarGrid stroke="hsl(var(--border)/0.4)" />
                  <PolarAngleAxis dataKey="topic" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: "bold" }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Radar
                    name="Accuracy %"
                    dataKey="A"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border)/0.5)",
                      borderRadius: "8px",
                      fontSize: "11px"
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Grid: Tabular breakdown */}
      <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold">Detailed Subject Metrics</CardTitle>
          <CardDescription className="text-xs">Exhaustive correct, incorrect, and unattempted count analysis by syllabus categories</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/40 bg-muted/30 text-muted-foreground uppercase font-bold tracking-wider">
                  <th className="p-4">Subject</th>
                  <th className="p-4">Attempted</th>
                  <th className="p-4">Correct Answers</th>
                  <th className="p-4">Incorrect Answers</th>
                  <th className="p-4">Unattempted</th>
                  <th className="p-4">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {detailSubjectStats.map((item) => (
                  <tr
                    key={item.subject}
                    className="border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4 font-bold text-foreground">{item.subject}</td>
                    <td className="p-4 font-medium text-muted-foreground">{item.attempted} questions</td>
                    <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">{item.correct}</td>
                    <td className="p-4 font-bold text-destructive">{item.incorrect}</td>
                    <td className="p-4 font-medium text-muted-foreground">{item.unattempted}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold w-8">{item.accuracy}%</span>
                        <div className="h-2 w-24 bg-muted/60 dark:bg-muted/20 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.accuracy >= 80 ? "bg-emerald-500" : item.accuracy >= 70 ? "bg-amber-500" : "bg-destructive"
                            }`}
                            style={{ width: `${item.accuracy}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
