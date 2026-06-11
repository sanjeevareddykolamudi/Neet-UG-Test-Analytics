"use client";

import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Database,
  BookOpen,
  AlertTriangle,
  Calendar,
  LineChart,
  Settings,
  ShieldCheck,
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Command
} from "lucide-react";

import { UserMenu } from "@/components/app/user-menu";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/app/theme-provider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tests", label: "Tests", icon: ClipboardList },
  { href: "/question-papers", label: "Question Papers", icon: FileText },
  { href: "/question-bank", label: "Question Bank", icon: Database },
  { href: "/mistake-journal", label: "Mistake Journal", icon: BookOpen, badge: "8" },
  { href: "/weak-topics", label: "Weak Topics", icon: AlertTriangle, badge: "Warning" },
  { href: "/revision-planner", label: "Revision Planner", icon: Calendar, badge: "5" },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Analysis Complete", body: "NEET Mock 8 results are now available.", read: false, time: "2h ago" },
    { id: 2, title: "Revision Reminder", body: "Thermodynamics Carnot Cycle revision is overdue.", read: false, time: "5h ago" },
    { id: 3, title: "Upload Success", body: "Chemistry Organic Paper processed successfully.", read: true, time: "1d ago" }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const navLinks = (
    <nav className="space-y-1.5 p-4">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={() => setMobileOpen(false)}
            className={`group relative flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 dark:shadow-none"
                : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-primary-foreground" : "text-muted-foreground/80 group-hover:text-foreground"}`} />
              <span>{item.label}</span>
            </div>
            {item.badge && (
              <Badge
                variant={
                  item.badge === "Warning"
                    ? "warning"
                    : isActive
                    ? "secondary"
                    : "default"
                }
                className="px-1.5 py-0 text-[10px] font-bold"
              >
                {item.badge}
              </Badge>
            )}
            {isActive && (
              <span className="absolute left-1 top-3 h-6 w-1 rounded-full bg-primary-foreground" />
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen">
      {/* Sidebar - Desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border/40 bg-card/60 backdrop-blur-xl lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-border/40 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-emerald-500 text-primary-foreground shadow-md shadow-primary/10">
            <ShieldCheck className="h-5.5 w-5.5" />
          </div>
          <div>
            <p className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent dark:to-emerald-400">
              NEET Analytics
            </p>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Exam Workspace
            </p>
          </div>
        </div>
        {navLinks}
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/40 bg-background/60 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile Navigation Toggle */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 border-r border-border/40 bg-card/90 backdrop-blur-xl">
                <SheetHeader className="h-16 items-center gap-3 border-b border-border/40 px-6 text-left flex flex-row">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <SheetTitle className="text-base font-bold text-foreground">NEET Analytics</SheetTitle>
                </SheetHeader>
                <div className="py-2">{navLinks}</div>
              </SheetContent>
            </Sheet>

            {/* Quick Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search topics, mistakes..."
                className="h-9 w-60 rounded-full border border-border/40 bg-muted/40 pl-9 pr-8 text-xs outline-none transition-all focus:w-72 focus:border-primary focus:bg-background/80 focus:ring-1 focus:ring-primary/20"
              />
              <kbd className="absolute right-2.5 top-2 hidden items-center gap-0.5 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
                <Command className="h-2.5 w-2.5" />K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:bg-muted/70 transition-all duration-200"
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-amber-400" />
              ) : (
                <Moon className="h-5 w-5 text-indigo-500" />
              )}
            </Button>

            {/* Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative rounded-xl hover:bg-muted/70 transition-all duration-200"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-destructive animate-ping">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                    </span>
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 align-end" align="end">
                <DropdownMenuLabel className="flex items-center justify-between py-2">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <Button variant="ghost" className="h-auto p-0 text-xs font-semibold text-primary hover:bg-transparent" onClick={markAllRead}>
                      Mark all read
                    </Button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3 cursor-default hover:bg-muted/50">
                        <div className="flex w-full items-center justify-between text-xs">
                          <span className={`font-semibold ${n.read ? "text-muted-foreground" : "text-foreground"}`}>
                            {n.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{n.time}</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-muted-foreground">{n.body}</p>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Dropdown */}
            <UserMenu />
          </div>
        </header>

        {/* Page Content */}
        <main className="w-full px-4 py-6 sm:px-6 lg:px-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden h-16 border-t border-border/40 bg-card/85 backdrop-blur-xl px-2 shadow-lg flex items-center justify-around">
        {[
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/tests", label: "Tests", icon: ClipboardList },
          { href: "/mistake-journal", label: "Mistakes", icon: BookOpen, badge: "8" },
          { href: "/revision-planner", label: "Revision", icon: Calendar, badge: "5" },
          { href: "/analytics", label: "Analytics", icon: LineChart }
        ].map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] font-semibold tracking-tight">{item.label}</span>
              {item.badge && !isActive && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[8px] font-extrabold text-destructive-foreground">
                  {item.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 h-1 w-5 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
