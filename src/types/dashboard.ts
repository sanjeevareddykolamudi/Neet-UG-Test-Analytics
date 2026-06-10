export interface SummaryStats {
  totalTests: number;
  averageMarks: number; // e.g. out of 720
  bestScore: number; // e.g. out of 720
  currentRank: number;
  weakTopicsCount: number;
  pendingRevisionTasksCount: number;
}

export interface MarksTrendPoint {
  testName: string;
  score: number;
  averageScore: number;
  date: string;
}

export interface SubjectAccuracy {
  subject: string; // Physics, Chemistry, Botany, Zoology
  accuracy: number; // Percentage 0-100
  totalQuestions: number;
  correctAnswers: number;
}

export interface TopicAccuracy {
  topic: string; // e.g. Kinematics, Mole Concept, Genetics
  subject: string;
  accuracy: number; // Percentage
  weightage: "High" | "Medium" | "Low";
}

export interface MonthlyPerformance {
  month: string; // e.g. Jan, Feb
  physics: number;
  chemistry: number;
  biology: number; // Botany + Zoology
}

export interface WeakTopicDistribution {
  subject: string;
  count: number;
  color: string;
}

export interface RecentActivity {
  id: string;
  type: "upload" | "grade" | "mistake" | "revision";
  title: string;
  description: string;
  timestamp: string;
  link?: string;
}

export interface RevisionTask {
  id: string;
  topic: string;
  subject: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  completed: boolean;
  notes?: string;
}

export interface MistakeLog {
  id: string;
  testName: string;
  questionNumber: number;
  subject: string;
  topic: string;
  markedOption: "A" | "B" | "C" | "D" | "Unattempted";
  correctOption: "A" | "B" | "C" | "D";
  conceptsToRevise: string[];
  solvedStatus: "resolved" | "review_needed";
  createdAt: string;
}

export interface TestPaper {
  id: string;
  title: string;
  subjectCount: number;
  totalQuestions: number;
  maxMarks: number;
  score: number | null;
  status: "uploaded" | "queued" | "ocr_pending" | "review_required" | "ready_for_key" | "analyzed" | "failed";
  createdAt: string;
}

export interface DashboardData {
  summary: SummaryStats;
  marksTrend: MarksTrendPoint[];
  subjectAccuracy: SubjectAccuracy[];
  topicAccuracy: TopicAccuracy[];
  monthlyPerformance: MonthlyPerformance[];
  weakTopicsDistribution: WeakTopicDistribution[];
  recentActivities: RecentActivity[];
  revisionTasks: RevisionTask[];
}
