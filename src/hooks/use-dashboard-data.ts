"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardData } from "@/types/dashboard";

async function fetchDashboard(): Promise<DashboardData> {
  const response = await fetch("/api/dashboard");
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }
  return response.json();
}

export function useDashboardData() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    staleTime: 30_000,
  });

  // Client side simulation for updating revision tasks instantly
  const toggleRevisionMutation = useMutation({
    mutationFn: async (taskId: string) => {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 300));
      return taskId;
    },
    onMutate: async (taskId) => {
      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: ["dashboard"] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<DashboardData>(["dashboard"]);

      // Optimistically update to the new value
      if (previousData) {
        const updatedTasks = previousData.revisionTasks.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        );
        
        const pendingCount = updatedTasks.filter((t) => !t.completed).length;

        queryClient.setQueryData<DashboardData>(["dashboard"], {
          ...previousData,
          summary: {
            ...previousData.summary,
            pendingRevisionTasksCount: pendingCount,
          },
          revisionTasks: updatedTasks,
        });
      }

      return { previousData };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["dashboard"], context.previousData);
      }
    },
    onSettled: () => {
      // No database sync route exists, so we don't invalidate to avoid losing local mock states.
      // queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  // Client side simulation for adding a logged mistake
  const addMistakeMutation = useMutation({
    mutationFn: async (newMistake: {
      testName: string;
      questionNumber: number;
      subject: string;
      topic: string;
      markedOption: string;
      correctOption: string;
    }) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      return { id: `mistake-${Date.now()}`, ...newMistake };
    },
    onSuccess: (newMistake) => {
      const previousData = queryClient.getQueryData<DashboardData>(["dashboard"]);
      if (previousData) {
        // Add to activities
        const newActivity = {
          id: `act-${Date.now()}`,
          type: "mistake" as const,
          title: "Mistake Logged",
          description: `Added Q${newMistake.questionNumber} in ${newMistake.topic} (${newMistake.subject}).`,
          timestamp: "Just now",
        };

        // Increment weak topics count if accuracy was very low
        const updatedWeakCount = previousData.summary.weakTopicsCount + 1;

        queryClient.setQueryData<DashboardData>(["dashboard"], {
          ...previousData,
          summary: {
            ...previousData.summary,
            weakTopicsCount: updatedWeakCount,
          },
          recentActivities: [newActivity, ...previousData.recentActivities],
        });
      }
    },
  });

  return {
    dashboardData: data,
    isLoading,
    error,
    toggleRevision: toggleRevisionMutation.mutate,
    isUpdatingRevision: toggleRevisionMutation.isPending,
    addMistake: addMistakeMutation.mutate,
    isAddingMistake: addMistakeMutation.isPending,
    refetch,
  };
}
