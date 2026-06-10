"use client";

import { useState } from "react";
import { Search, BookOpen, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BankQuestion {
  id: string;
  code: string;
  text: string;
  subject: string;
  topic: string;
  difficulty: "Easy" | "Medium" | "Hard";
  status: "correct" | "incorrect" | "unattempted";
  options: { key: string; text: string }[];
  correctOption: string;
  explanation: string;
}

const mockQuestions: BankQuestion[] = [
  {
    id: "q-1",
    code: "NEET-26-P15",
    text: "Calculate the efficiency of a Carnot engine working between temperatures of 127°C and 27°C.",
    subject: "Physics",
    topic: "Thermodynamics",
    difficulty: "Hard",
    status: "incorrect",
    options: [
      { key: "A", text: "25%" },
      { key: "B", text: "50%" },
      { key: "C", text: "75%" },
      { key: "D", text: "33.3%" }
    ],
    correctOption: "A",
    explanation: "Carnot Efficiency = 1 - (T_cold / T_hot) where T must be in Kelvin. T_cold = 27 + 273 = 300K, T_hot = 127 + 273 = 400K. Efficiency = 1 - (300/400) = 1/4 = 25%."
  },
  {
    id: "q-2",
    code: "NEET-26-C43",
    text: "For a first-order reaction, the time required for 99% completion is how many times the half-life (t1/2) of the reaction?",
    subject: "Chemistry",
    topic: "Chemical Kinetics",
    difficulty: "Medium",
    status: "correct",
    options: [
      { key: "A", text: "2 times" },
      { key: "B", text: "10 times" },
      { key: "C", text: "6.6 times" },
      { key: "D", text: "4 times" }
    ],
    correctOption: "C",
    explanation: "t_99% = (2.303/k) * log(100/1) = 4.606/k. Half life t_1/2 = 0.693/k. t_99% / t_1/2 = 4.606 / 0.693 = 6.64 times."
  },
  {
    id: "q-3",
    code: "NEET-26-B89",
    text: "Which of the following Mendelian disorders is a sex-linked recessive genetic trait?",
    subject: "Botany",
    topic: "Genetics & Inheritance",
    difficulty: "Easy",
    status: "correct",
    options: [
      { key: "A", text: "Sickle-cell anemia" },
      { key: "B", text: "Haemophilia" },
      { key: "C", text: "Phenylketonuria" },
      { key: "D", text: "Thalassemia" }
    ],
    correctOption: "B",
    explanation: "Haemophilia and Color blindness are sex-linked (X-linked) recessive disorders. Sickle cell, PKU, and Thalassemia are autosomal recessive."
  },
  {
    id: "q-4",
    code: "NEET-26-Z121",
    text: "What is the partial pressure of oxygen (pO2) in the alveoli of the lungs compared to that in the atmosphere?",
    subject: "Zoology",
    topic: "Breathing & Respiration",
    difficulty: "Medium",
    status: "incorrect",
    options: [
      { key: "A", text: "Higher than atmospheric pO2" },
      { key: "B", text: "Lower than atmospheric pO2" },
      { key: "C", text: "Exactly equal to atmospheric pO2" },
      { key: "D", text: "Variable based on temperature" }
    ],
    correctOption: "B",
    explanation: "Atmospheric pO2 is approximately 159 mmHg, whereas alveolar pO2 is around 104 mmHg. Thus, alveolar pO2 is lower than atmospheric pO2 due to residual volume and gas exchange mixing."
  }
];

export default function QuestionBankPage() {
  const [questions] = useState<BankQuestion[]>(mockQuestions);
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedQuestion, setSelectedQuestion] = useState<BankQuestion | null>(null);

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.text.toLowerCase().includes(search.toLowerCase()) || q.topic.toLowerCase().includes(search.toLowerCase()) || q.code.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = subjectFilter === "all" || q.subject.toLowerCase() === subjectFilter.toLowerCase();
    const matchesDifficulty = difficultyFilter === "all" || q.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
    const matchesStatus = statusFilter === "all" || q.status === statusFilter;
    return matchesSearch && matchesSubject && matchesDifficulty && matchesStatus;
  });

  const getStatusIcon = (status: BankQuestion["status"]) => {
    switch (status) {
      case "correct":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "incorrect":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getDifficultyBadge = (diff: BankQuestion["difficulty"]) => {
    switch (diff) {
      case "Easy":
        return <Badge variant="success" className="text-[10px] font-bold">Easy</Badge>;
      case "Medium":
        return <Badge variant="warning" className="text-[10px] font-bold">Medium</Badge>;
      default:
        return <Badge variant="destructive" className="text-[10px] font-bold">Hard</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Question Bank</h1>
        <p className="text-sm text-muted-foreground">
          Explore and filter all extracted questions from past papers by syllabus, accuracy, and difficulty.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Left: Question List & Filters */}
        <div className="space-y-4">
          <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by text, topic or question code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-background/50 pl-9 pr-4 text-xs outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="h-9 rounded-lg border border-border bg-background/50 px-2 text-xs outline-none focus:border-primary"
                >
                  <option value="all">All Subjects</option>
                  <option value="physics">Physics</option>
                  <option value="chemistry">Chemistry</option>
                  <option value="botany">Botany</option>
                  <option value="zoology">Zoology</option>
                </select>

                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="h-9 rounded-lg border border-border bg-background/50 px-2 text-xs outline-none focus:border-primary"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-9 rounded-lg border border-border bg-background/50 px-2 text-xs outline-none focus:border-primary"
                >
                  <option value="all">All Statuses</option>
                  <option value="correct">Solved Correct</option>
                  <option value="incorrect">Mistakes</option>
                  <option value="unattempted">Unattempted</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {filteredQuestions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-12 text-center text-xs text-muted-foreground">
                No questions match the selected search criteria.
              </div>
            ) : (
              filteredQuestions.map((q) => (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuestion(q)}
                  className={`flex flex-col gap-2 rounded-xl border border-border/40 bg-card/60 p-4 shadow-sm backdrop-blur-sm cursor-pointer transition hover:border-primary/20 ${
                    selectedQuestion?.id === q.id ? "ring-2 ring-primary border-transparent" : ""
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-muted-foreground">{q.code}</span>
                      <Badge variant="outline" className="px-1.5 py-0 font-bold">{q.subject}</Badge>
                      <span className="text-muted-foreground font-semibold">{q.topic}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getDifficultyBadge(q.difficulty)}
                      {getStatusIcon(q.status)}
                    </div>
                  </div>
                  <p className="text-xs text-foreground font-semibold leading-relaxed line-clamp-2">
                    {q.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Question Inspector */}
        <div>
          {selectedQuestion ? (
            <Card className="border-border/40 bg-card/70 backdrop-blur-sm shadow-md sticky top-20">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-primary font-bold">{selectedQuestion.code}</span>
                  <div className="flex items-center gap-1.5">
                    {getDifficultyBadge(selectedQuestion.difficulty)}
                    <Badge variant={selectedQuestion.status === "correct" ? "success" : "destructive"}>
                      {selectedQuestion.status === "correct" ? "Solved Correct" : "Mistake Logged"}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-sm font-bold mt-2">Question Details</CardTitle>
                <CardDescription className="text-xs">{selectedQuestion.subject} &gt; {selectedQuestion.topic}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 text-xs">
                {/* Question Text */}
                <div className="rounded-lg bg-muted/30 p-3.5 border border-border/20 font-medium leading-relaxed text-foreground">
                  {selectedQuestion.text}
                </div>

                {/* Options list */}
                <div className="space-y-2">
                  <p className="font-bold text-muted-foreground">Options</p>
                  {selectedQuestion.options.map((opt) => {
                    const isCorrect = opt.key === selectedQuestion.correctOption;
                    return (
                      <div
                        key={opt.key}
                        className={`flex items-start gap-2.5 rounded-lg border p-3 font-medium transition ${
                          isCorrect
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                            : "bg-background/50 border-border/30"
                        }`}
                      >
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                          isCorrect ? "bg-emerald-500 text-white" : "bg-muted"
                        }`}>
                          {opt.key}
                        </span>
                        <span className="flex-1 leading-snug">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="space-y-2 border-t border-border/30 pt-4">
                  <p className="font-bold text-primary flex items-center gap-1">
                    <BookOpen className="h-4 w-4" /> Explanation / Key Concept
                  </p>
                  <p className="text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-lg border border-border/10">
                    {selectedQuestion.explanation}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/30 p-6 text-center text-xs text-muted-foreground">
              <BookOpen className="h-8 w-8 text-muted-foreground/60 mb-2" />
              <p className="font-semibold">Select a question to inspect details</p>
              <p className="text-muted-foreground/80 mt-1">Review correct choice, options, and concepts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
