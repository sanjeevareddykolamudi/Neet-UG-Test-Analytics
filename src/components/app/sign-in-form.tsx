"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignInForm() {
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignIn = () => {
    setLoading(true);
    setError("");
    signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleDemoSignIn = async () => {
    setDemoLoading(true);
    setError("");
    try {
      await signIn("credentials", {
        email: "demo@example.com",
        password: "demo",
        callbackUrl: "/dashboard",
      });
    } catch {
      setError("Failed to sign in with demo credentials.");
      setDemoLoading(false);
    }
  };

  // Determine if we should display the demo login bypass (only in development environment)
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div className="space-y-5 flex flex-col items-center">
      {error && (
        <p className="text-xs font-semibold text-destructive text-center w-full bg-destructive/5 py-2 rounded-lg border border-destructive/10">
          {error}
        </p>
      )}

      {/* Main Google Login Button */}
      <Button
        type="button"
        size="lg"
        disabled={loading || demoLoading}
        className="w-full h-12 text-sm font-semibold shadow-lg shadow-primary/20 flex items-center justify-center gap-2.5 rounded-xl transition-all duration-300 hover:scale-[1.01]"
        onClick={handleGoogleSignIn}
      >
        {loading ? (
          <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="h-5 w-5" aria-hidden="true" focusable="false" viewBox="0 0 488 512">
            <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
          </svg>
        )}
        {loading ? "Connecting to Google..." : "Continue with Google"}
      </Button>

      {/* Development / Review Fallback Bypass */}
      {isDev && (
        <div className="w-full flex flex-col items-center gap-3">
          <div className="relative flex py-2 items-center w-full">
            <div className="flex-grow border-t border-border/40"></div>
            <span className="flex-shrink mx-3 text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Preview Access</span>
            <div className="flex-grow border-t border-border/40"></div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={loading || demoLoading}
            className="w-full h-11 border-border/40 hover:bg-muted/70 transition-all font-semibold text-xs text-muted-foreground rounded-xl flex items-center justify-center gap-2"
            onClick={handleDemoSignIn}
          >
            {demoLoading && <span className="h-3 w-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />}
            Sign in as Demo Student
          </Button>
        </div>
      )}
    </div>
  );
}
