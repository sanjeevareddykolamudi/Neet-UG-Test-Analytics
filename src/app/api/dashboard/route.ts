import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const mockDashboardData = {
  summary: {
    totalTests: 12,
    averageMarks: 580,
    bestScore: 645,
    currentRank: 4235,
    weakTopicsCount: 8,
    pendingRevisionTasksCount: 4,
    questionBankSize: 342,
    recurringMistakesCount: 5,
  },
  marksTrend: [
    { testName: "Mock 1", score: 510, averageScore: 505, date: "03/01" },
    { testName: "Mock 2", score: 535, averageScore: 512, date: "03/15" },
    { testName: "Mock 3", score: 520, averageScore: 518, date: "04/01" },
    { testName: "Mock 4", score: 560, averageScore: 520, date: "04/15" },
    { testName: "Mock 5", score: 590, averageScore: 530, date: "05/01" },
    { testName: "Mock 6", score: 585, averageScore: 532, date: "05/15" },
    { testName: "Mock 7", score: 615, averageScore: 535, date: "06/01" },
    { testName: "Mock 8", score: 645, averageScore: 540, date: "06/08" },
  ],
  subjectAccuracy: [
    { subject: "Physics", accuracy: 68, totalQuestions: 360, correctAnswers: 245 },
    { subject: "Chemistry", accuracy: 78, totalQuestions: 360, correctAnswers: 281 },
    { subject: "Botany", accuracy: 88, totalQuestions: 360, correctAnswers: 317 },
    { subject: "Zoology", accuracy: 84, totalQuestions: 360, correctAnswers: 302 },
  ],
  topicAccuracy: [
    { topic: "Rotational Dynamics", subject: "Physics", accuracy: 45, weightage: "High" },
    { topic: "Thermodynamics", subject: "Physics", accuracy: 55, weightage: "High" },
    { topic: "Equilibrium", subject: "Chemistry", accuracy: 52, weightage: "High" },
    { topic: "Electrostatics", subject: "Physics", accuracy: 60, weightage: "Medium" },
    { topic: "Hydrocarbons", subject: "Chemistry", accuracy: 62, weightage: "Medium" },
    { topic: "Photosynthesis", subject: "Botany", accuracy: 74, weightage: "High" },
    { topic: "Genetics & Evolution", subject: "Botany", accuracy: 91, weightage: "High" },
    { topic: "Human Physiology", subject: "Zoology", accuracy: 88, weightage: "High" },
  ],
  chapterAccuracy: [
    { subject: "Physics", chapter: "Mechanics", accuracy: 65 },
    { subject: "Physics", chapter: "Thermodynamics", accuracy: 55 },
    { subject: "Physics", chapter: "Electrostatics", accuracy: 60 },
    { subject: "Chemistry", chapter: "Equilibrium", accuracy: 52 },
    { subject: "Chemistry", chapter: "Hydrocarbons", accuracy: 62 },
    { subject: "Botany", chapter: "Plant Physiology", accuracy: 74 },
    { subject: "Botany", chapter: "Genetics & Inheritance", accuracy: 91 },
    { subject: "Zoology", chapter: "Human Physiology", accuracy: 88 },
  ],
  topicMasteryTrend: [
    { date: "05/01", "Rotational Dynamics": 30, "Ionic Equilibrium": 40, "Thermodynamics": 45 },
    { date: "05/15", "Rotational Dynamics": 35, "Ionic Equilibrium": 45, "Thermodynamics": 48 },
    { date: "06/01", "Rotational Dynamics": 42, "Ionic Equilibrium": 50, "Thermodynamics": 50 },
    { date: "06/08", "Rotational Dynamics": 45, "Ionic Equilibrium": 52, "Thermodynamics": 55 },
  ],
  monthlyPerformance: [
    { month: "Mar", physics: 54, chemistry: 68, biology: 76 },
    { month: "Apr", physics: 58, chemistry: 72, biology: 80 },
    { month: "May", physics: 64, chemistry: 75, biology: 84 },
    { month: "Jun", physics: 68, chemistry: 78, biology: 86 },
  ],
  weakTopicsDistribution: [
    { subject: "Physics", count: 4, color: "hsl(var(--destructive))" },
    { subject: "Chemistry", count: 3, color: "hsl(var(--secondary))" },
    { subject: "Botany", count: 1, color: "hsl(var(--primary))" },
    { subject: "Zoology", count: 0, color: "hsl(var(--accent))" },
  ],
  recentActivities: [
    { id: "act-1", type: "upload", title: "Test Paper Uploaded", description: "Uploaded scanned NEET Mock 8 paper.", timestamp: "2 hours ago" },
    { id: "act-2", type: "grade", title: "Analysis Completed", description: "NEET Mock 8 analyzed. Score generated: 645/720.", timestamp: "3 hours ago" },
    { id: "act-3", type: "mistake", title: "Mistake Logged", description: "Added 4 incorrect questions in Thermodynamics to mistake journal.", timestamp: "1 day ago" },
    { id: "act-4", type: "revision", title: "Revision Task Completed", description: "Completed Chemical Kinetics active recall session.", timestamp: "2 days ago" },
  ],
  revisionTasks: [
    { id: "rev-1", topic: "Rotational Dynamics formulas review", subject: "Physics", dueDate: "2026-06-10", priority: "High", completed: false, notes: "Focus on moment of inertia and rolling motion torque questions." },
    { id: "rev-2", topic: "Ionic Equilibrium NCERT Exemplar", subject: "Chemistry", dueDate: "2026-06-11", priority: "High", completed: false, notes: "Practice buffer solution calculations and salt hydrolysis formulas." },
    { id: "rev-3", topic: "Thermodynamics Carnot Cycle graphs", subject: "Physics", dueDate: "2026-06-12", priority: "Medium", completed: false, notes: "Draw P-V diagrams for isothermal and adiabatic expansions." },
    { id: "rev-4", topic: "Plant Physiology photosynthesis reactions", subject: "Botany", dueDate: "2026-06-13", priority: "Medium", completed: true, notes: "Re-read light reaction steps and Z-scheme cycle." },
    { id: "rev-5", topic: "Human Digestion endocrine system chart", subject: "Zoology", dueDate: "2026-06-14", priority: "Low", completed: false, notes: "Memorize hormonal triggers for gastric and pancreatic secretions." },
  ],
  recentUploads: [
    { id: "doc-1", name: "NEET_2025_Original_Syllabus.pdf", size: "4.8 MB", uploadedAt: "2 hours ago", status: "completed" as const },
    { id: "doc-2", name: "Allen_All_India_Test_08_Scanned.pdf", size: "12.4 MB", uploadedAt: "3 hours ago", status: "completed" as const },
    { id: "doc-3", name: "Thermodynamics_Weekly_Test.png", size: "2.1 MB", uploadedAt: "1 day ago", status: "parsing" as const },
    { id: "doc-4", name: "Genetics_NCERT_Revision_Questions.pdf", size: "6.2 MB", uploadedAt: "2 days ago", status: "pending_review" as const },
  ],
  mostRepeatedMistakes: [
    { topic: "Rotational Dynamics & Torque", subject: "Physics", count: 4, lastSeen: "NEET Mock 8" },
    { topic: "Chemical & Ionic Equilibrium", subject: "Chemistry", count: 3, lastSeen: "NEET Mock 8" },
    { topic: "Thermodynamics Carnot Cycles", subject: "Physics", count: 3, lastSeen: "NEET Mock 7" },
    { topic: "Electrostatics & Capacitors", subject: "Physics", count: 2, lastSeen: "NEET Mock 6" },
  ]
};

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // In production, we'd query Mongo database for calculations.
  // For demo/dev mode, return mock data.
  return NextResponse.json(mockDashboardData);
}
