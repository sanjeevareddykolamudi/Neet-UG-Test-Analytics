import { Router, Response } from "express";
import { connectToDatabase } from "../../lib/mongodb";
import { RevisionTask } from "../../models/RevisionTask";
import { AuthenticatedRequest, requireUser } from "../middleware/auth";

const router = Router();

// 1. Fetch all revision tasks for the user
router.get("/", requireUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    await connectToDatabase();

    const tasks = await RevisionTask.find({ userId, isDeleted: false })
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    const mappedTasks = tasks.map((t) => ({
      id: t._id.toString(),
      topic: t.topic,
      subject: t.subject ? t.subject.charAt(0).toUpperCase() + t.subject.slice(1) : "Physics",
      dueDate: new Date(t.dueDate).toISOString().split("T")[0],
      priority: t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : "Medium",
      completed: t.status === "done",
      notes: t.notes || ""
    }));

    return res.status(200).json({ tasks: mappedTasks });
  } catch (error) {
    console.error("[RevisionRouter] Fetch tasks error:", error);
    return res.status(500).json({ error: "Failed to fetch revision tasks." });
  }
});

// 2. Create a new revision task
router.post("/", requireUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { topic, subject, dueDate, priority, notes } = req.body;

  if (!topic || !dueDate) {
    return res.status(400).json({ error: "Missing required fields: topic or dueDate." });
  }

  try {
    await connectToDatabase();

    const task = await RevisionTask.create({
      userId,
      topic,
      chapter: topic, // Fallback chapter to topic name
      subject: (subject || "physics").toLowerCase(),
      priority: (priority || "medium").toLowerCase(),
      dueDate: new Date(dueDate),
      status: "pending",
      notes: notes || "",
      isDeleted: false
    });

    return res.status(201).json({
      success: true,
      task: {
        id: task._id.toString(),
        topic: task.topic,
        subject: task.subject.charAt(0).toUpperCase() + task.subject.slice(1),
        dueDate: new Date(task.dueDate).toISOString().split("T")[0],
        priority: task.priority.charAt(0).toUpperCase() + task.priority.slice(1),
        completed: false,
        notes: task.notes
      }
    });
  } catch (error) {
    console.error("[RevisionRouter] Create task error:", error);
    return res.status(500).json({ error: "Failed to create revision task." });
  }
});

// 3. Toggle checklist completion or edit notes/dueDate
router.patch("/:id", requireUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { completed, notes, dueDate, priority } = req.body;

  try {
    await connectToDatabase();

    const task = await RevisionTask.findOne({ _id: id, userId, isDeleted: false });
    if (!task) {
      return res.status(404).json({ error: "Revision task not found." });
    }

    const updates: any = {};
    if (completed !== undefined) {
      updates.status = completed ? "done" : "pending";
      updates.completedAt = completed ? new Date() : null;
    }
    if (notes !== undefined) updates.notes = notes;
    if (dueDate !== undefined) updates.dueDate = new Date(dueDate);
    if (priority !== undefined) updates.priority = priority.toLowerCase();

    await RevisionTask.updateOne({ _id: id, userId }, { $set: updates });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[RevisionRouter] Update task error:", error);
    return res.status(500).json({ error: "Failed to update revision task." });
  }
});

// 4. Delete revision task
router.delete("/:id", requireUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    await connectToDatabase();

    const task = await RevisionTask.findOne({ _id: id, userId, isDeleted: false });
    if (!task) {
      return res.status(404).json({ error: "Revision task not found." });
    }

    // Soft delete
    await RevisionTask.updateOne({ _id: id, userId }, { $set: { isDeleted: true, deletedAt: new Date() } });

    return res.status(200).json({ success: true, message: "Revision task deleted successfully." });
  } catch (error) {
    console.error("[RevisionRouter] Delete task error:", error);
    return res.status(500).json({ error: "Failed to delete revision task." });
  }
});

export default router;
