import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/app/theme-provider";
import { AuthProvider, useAuth } from "@/context/auth-context";

// Pages
import DashboardPage from "@/pages/dashboard";
import SignInPage from "@/pages/sign-in";
import TestsPage from "@/pages/tests";
import NewTestPage from "@/pages/new-test";
import QuestionPapersPage from "@/pages/question-papers";
import QuestionBankPage from "@/pages/question-bank";
import MistakeJournalPage from "@/pages/mistake-journal";
import WeakTopicsPage from "@/pages/weak-topics";
import RevisionPlannerPage from "@/pages/revision-planner";
import SettingsPage from "@/pages/settings";
import AnalyticsPage from "@/pages/analytics";
import { DashboardShell } from "@/components/app/dashboard-shell";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <span className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  return <DashboardShell>{children}</DashboardShell>;
}

export default function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false
          }
        }
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/sign-in" element={<SignInPage />} />

              {/* Protected App Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/tests" element={<ProtectedRoute><TestsPage /></ProtectedRoute>} />
              <Route path="/tests/new" element={<ProtectedRoute><NewTestPage /></ProtectedRoute>} />
              <Route path="/question-papers" element={<ProtectedRoute><QuestionPapersPage /></ProtectedRoute>} />
              <Route path="/question-bank" element={<ProtectedRoute><QuestionBankPage /></ProtectedRoute>} />
              <Route path="/mistake-journal" element={<ProtectedRoute><MistakeJournalPage /></ProtectedRoute>} />
              <Route path="/weak-topics" element={<ProtectedRoute><WeakTopicsPage /></ProtectedRoute>} />
              <Route path="/revision-planner" element={<ProtectedRoute><RevisionPlannerPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />

              {/* Fallback Redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
