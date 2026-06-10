/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseRepository } from "./base.repository";
import { RevisionTask, RevisionTaskDocument } from "@/models/RevisionTask";

export class RevisionTaskRepository extends BaseRepository<RevisionTaskDocument> {
  constructor() {
    super(RevisionTask);
  }

  async getPendingTasks(userId: string): Promise<any[]> {
    return this.find(
      {
        userId,
        status: { $in: ["pending", "in_progress"] }
      },
      null,
      {
        sort: {
          dueDate: 1,
          priority: -1 // High, Medium, Low sort order
        }
      }
    );
  }

  async completeRevisionTask(userId: string, taskId: string): Promise<any | null> {
    return this.model.findOneAndUpdate(
      {
        _id: taskId,
        userId,
        isDeleted: false
      } as any,
      {
        $set: {
          status: "done",
          completedAt: new Date()
        }
      },
      {
        new: true,
        lean: true
      }
    ).exec();
  }

  async createRevisionTask(userId: string, task: {
    topic: string;
    chapter: string;
    priority: "low" | "medium" | "high";
    dueDate: Date;
  }): Promise<any> {
    return this.create({
      ...task,
      userId,
      status: "pending",
      isDeleted: false
    });
  }
}

export const revisionTaskRepository = new RevisionTaskRepository();
