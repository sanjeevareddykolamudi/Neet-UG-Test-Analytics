import { Router } from "express";
import { createUploadSignature } from "../../lib/cloudinary";
import { AuthenticatedRequest, requireUser } from "../middleware/auth";

const router = Router();

router.post("/signature", requireUser, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;
  const { resourceType } = req.body;

  try {
    const signature = createUploadSignature(userId);
    return res.status(200).json({
      ...signature,
      resourceType: resourceType || "image"
    });
  } catch (error) {
    console.error("[UploadsRouter] Signature generation error:", error);
    return res.status(500).json({ error: "Failed to generate upload signature" });
  }
});

export default router;
