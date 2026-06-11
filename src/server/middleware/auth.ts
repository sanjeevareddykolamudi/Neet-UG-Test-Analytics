import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "a_very_long_secret_key_at_least_32_characters_for_nextauth";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export function requireUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.session_token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Missing session token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name?: string };
    req.user = decoded;
    next();
  } catch (err) {
    console.error("[AuthMiddleware] Session token verification failed:", err);
    return res.status(401).json({ error: "Unauthorized: Invalid session token" });
  }
}
