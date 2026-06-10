"use client";

import { useState } from "react";
import { User, Bell, Shield, Keyboard, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const [name, setName] = useState("Demo Student");
  const [email, setEmail] = useState("demo@example.com");
  const [targetScore, setTargetScore] = useState("680");
  const [targetCollege, setTargetCollege] = useState("Maulana Azad Medical College (MAMC), New Delhi");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account & Platform Settings</h1>
        <p className="text-sm text-muted-foreground">
          Update your NEET target scores, configure profile credentials, and adjust display layouts.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Student Profile Card */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-primary" /> Profile Credentials
            </CardTitle>
            <CardDescription className="text-xs">Update your student information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs font-semibold">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background/50 border-border/40"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/50 border-border/40"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* NEET Target configuration card */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Shield className="h-4.5 w-4.5 text-primary" /> NEET Cutoff Metrics
            </CardTitle>
            <CardDescription className="text-xs">Configure exam targets to update progress meters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs font-semibold">
            <div className="space-y-2">
              <Label htmlFor="score">Target NEET Score (out of 720)</Label>
              <Input
                id="score"
                type="number"
                min="300"
                max="720"
                value={targetScore}
                onChange={(e) => setTargetScore(e.target.value)}
                className="bg-background/50 border-border/40"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="college">Dream Medical College Cutoff</Label>
              <Input
                id="college"
                value={targetCollege}
                onChange={(e) => setTargetCollege(e.target.value)}
                className="bg-background/50 border-border/40"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Platform preferences */}
        <Card className="border-border/40 bg-card/60 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Bell className="h-4.5 w-4.5 text-primary" /> Notifications & Interface
            </CardTitle>
            <CardDescription className="text-xs">Manage updates preferences and UI shortcuts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs font-semibold text-muted-foreground">
            <div className="flex items-center justify-between py-2 border-b border-border/20">
              <div>
                <p className="font-bold text-foreground">Email Reminders</p>
                <p className="font-medium text-[11px]">Receive daily notifications for pending revision tasks.</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border bg-background accent-primary" />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/20">
              <div>
                <p className="font-bold text-foreground">Analysis Alerts</p>
                <p className="font-medium text-[11px]">Get notified when uploaded papers have completed OCR extraction.</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border bg-background accent-primary" />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-bold text-foreground flex items-center gap-1.5"><Keyboard className="h-4 w-4 text-muted-foreground/60" /> Command Center Shortcut</p>
                <p className="font-medium text-[11px]">Open search command palette using the standard Ctrl+K keys.</p>
              </div>
              <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border bg-background accent-primary" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center pt-2">
          {saved ? (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 animate-in fade-in duration-200">
              <CheckCircle2 className="h-4.5 w-4.5" />
              Settings saved successfully!
            </span>
          ) : (
            <span />
          )}
          <Button type="submit" className="font-semibold shadow shadow-primary/10 w-full sm:w-auto">
            Save Settings Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
