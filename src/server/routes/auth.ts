import { Router, Response } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { userService } from "../../services/user.service";
import { connectToDatabase } from "../../lib/mongodb";
import { AuthenticatedRequest } from "../middleware/auth";

const router = Router();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || "a_very_long_secret_key_at_least_32_characters_for_nextauth";
let googleClient: OAuth2Client | null = null;
function getGoogleClient() {
  if (!googleClient) {
    const clientId = (process.env.GOOGLE_CLIENT_ID || "mock_google_client_id_for_neet_analytics").trim();
    googleClient = new OAuth2Client(clientId);
  }
  return googleClient;
}
const isProduction = process.env.APP_ENV === "production" || process.env.NODE_ENV === "production";

// Helper to set cookie
function setSessionCookie(res: Response, token: string) {
  res.cookie("session_token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
}

// 1. Google OAuth token sign-in
router.post("/login/google", async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: "Missing Google ID token" });
  }

  try {
    // Verify Google ID token
    const client = getGoogleClient();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: (process.env.GOOGLE_CLIENT_ID || "mock_google_client_id_for_neet_analytics").trim()
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({ error: "Invalid Google token payload" });
    }

    // Connect to database and sync user profile
    await connectToDatabase();
    const dbUser = await userService.syncGoogleUser({
      email: payload.email,
      name: payload.name || undefined,
      image: payload.picture || undefined
    });

    const userId = dbUser._id.toString();

    // Create session JWT
    const sessionToken = jwt.sign(
      { id: userId, email: payload.email, name: dbUser.name },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Set cookie
    setSessionCookie(res, sessionToken);

    return res.status(200).json({
      success: true,
      user: {
        id: userId,
        email: dbUser.email,
        name: dbUser.name,
        image: dbUser.image
      }
    });
  } catch (error) {
    console.error("[AuthRouter] Google login failed:", error);
    return res.status(500).json({ error: "Authentication failed with Google" });
  }
});

// 2. Demo bypass credentials sign-in
router.post("/login/demo", async (req, res) => {
  const { email } = req.body;

  // Only allow demo login in development or non-strict environments
  if (isProduction && email !== "demo@example.com") {
    return res.status(403).json({ error: "Demo login is disabled in production" });
  }

  try {
    const demoEmail = email || "demo@example.com";
    const demoName = "Demo Student";
    const demoId = "demo-user-id";

    // Create session JWT
    const sessionToken = jwt.sign(
      { id: demoId, email: demoEmail, name: demoName },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Set cookie
    setSessionCookie(res, sessionToken);

    return res.status(200).json({
      success: true,
      user: {
        id: demoId,
        email: demoEmail,
        name: demoName,
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
      }
    });
  } catch (error) {
    console.error("[AuthRouter] Demo login failed:", error);
    return res.status(500).json({ error: "Demo authentication failed" });
  }
});

// 2.5. Config endpoint for client ID retrieval
router.get("/config", (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  return res.status(200).json({
    googleClientId: (process.env.GOOGLE_CLIENT_ID || "mock_google_client_id_for_neet_analytics").trim()
  });
});

// 3. Get session details
router.get("/session", async (req: AuthenticatedRequest, res) => {
  const token = req.cookies?.session_token;

  if (!token) {
    return res.status(200).json({ user: null });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; name?: string };
    
    // Return decoded JWT info
    return res.status(200).json({
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name
      }
    });
  } catch (err) {
    res.clearCookie("session_token");
    return res.status(200).json({ user: null });
  }
});

// 4. Logout
router.post("/logout", (req, res) => {
  res.clearCookie("session_token", {
    path: "/",
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax"
  });
  return res.status(200).json({ success: true });
});

export default router;
