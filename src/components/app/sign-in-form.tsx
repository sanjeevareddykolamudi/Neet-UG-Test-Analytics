import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    google?: any;
  }
}

export function SignInForm() {
  const { loginDemo, loginGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let checkInterval: NodeJS.Timeout;

    const initializeGoogleSignIn = async () => {
      try {
        const res = await fetch("/api/auth/config");
        if (!res.ok) return;
        const config = await res.json();

        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: config.googleClientId,
            callback: async (response: any) => {
              setLoading(true);
              setError("");
              try {
                await loginGoogle(response.credential);
                window.location.href = "/dashboard";
              } catch (err: any) {
                setError(err.message || "Failed to sign in with Google.");
                setLoading(false);
              }
            },
          });

          window.google.accounts.id.renderButton(
            document.getElementById("google-signin-btn"),
            { 
              theme: "outline", 
              size: "large", 
              width: 280,
              text: "continue_with",
              shape: "pill"
            }
          );
        }
      } catch (err) {
        console.error("Failed to load Google Auth configuration:", err);
      }
    };

    checkInterval = setInterval(() => {
      if (window.google?.accounts?.id) {
        initializeGoogleSignIn();
        clearInterval(checkInterval);
      }
    }, 100);

    return () => clearInterval(checkInterval);
  }, [loginGoogle]);

  const handleDemoSignIn = async () => {
    setDemoLoading(true);
    setError("");
    try {
      await loginDemo("demo@example.com");
      window.location.href = "/dashboard";
    } catch {
      setError("Failed to sign in with demo credentials.");
      setDemoLoading(false);
    }
  };

  // Determine if we should display the demo login bypass (only in development environment)
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div className="space-y-5 flex flex-col items-center w-full max-w-[280px]">
      {error && (
        <p className="text-xs font-semibold text-destructive text-center w-full bg-destructive/5 py-2 rounded-lg border border-destructive/10">
          {error}
        </p>
      )}

      {/* Main Google Login Button (Rendered by GIS SDK) */}
      <div className="w-full flex justify-center">
        {loading ? (
          <div className="flex h-10 items-center justify-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/30 border border-border/40 rounded-full px-4 w-full">
            <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Connecting to Google...
          </div>
        ) : (
          <div id="google-signin-btn" className="w-full flex justify-center min-h-[40px]" />
        )}
      </div>

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
