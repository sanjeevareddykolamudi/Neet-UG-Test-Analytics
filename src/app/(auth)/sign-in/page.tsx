import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { SignInForm } from "@/components/app/sign-in-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  console.log("[SignInPage] Rendering sign-in page, checking session...");
  let session = null;
  try {
    session = await getServerSession(authOptions);
    console.log("[SignInPage] Session checked, user logged in:", !!session?.user?.id);
  } catch (err) {
    console.error("[SignInPage] Error retrieving server session:", err);
  }

  if (session?.user?.id) {
    console.log("[SignInPage] Redirecting logged-in user to /dashboard");
    redirect("/dashboard");
  }

  console.log("[SignInPage] Returning sign-in page component markup");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 md:py-24">
      {/* Background gradients */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-500/10 via-amber-500/5 to-transparent dark:from-teal-500/20 dark:via-amber-500/10" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      <Card className="w-full max-w-md border-border/40 bg-card/60 shadow-2xl shadow-primary/5 backdrop-blur-xl transition-all duration-300 hover:shadow-primary/10">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-300 hover:scale-105 hover:bg-primary/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent dark:to-emerald-400">
              NEET Analytics
            </CardTitle>
            <CardDescription className="text-sm font-medium text-muted-foreground/80">
              NEET-UG Exam Analytics & Revision Planner
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <SignInForm />
        </CardContent>
      </Card>
    </main>
  );
}

