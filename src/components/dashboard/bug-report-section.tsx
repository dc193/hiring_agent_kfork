"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bug, Plus, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BugReport {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  createdAt: Date;
}

interface BugReportSectionProps {
  bugs: BugReport[];
}

const STATUS_ICONS = {
  open: AlertCircle,
  confirmed: Clock,
  in_progress: Clock,
  fixed: CheckCircle,
};

const STATUS_COLORS = {
  open: "text-red-500",
  confirmed: "text-yellow-500",
  in_progress: "text-blue-500",
  fixed: "text-green-500",
};

export function BugReportSection({ bugs }: BugReportSectionProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    stepsToReproduce: "",
    reportedBy: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bugs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ title: "", description: "", stepsToReproduce: "", reportedBy: "" });
        setShowForm(false);
        router.refresh();
      }
    } catch {
      // Handle error silently
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Bug className="w-5 h-5" /> Bug Reports
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="w-4 h-4" />
          Report Bug
        </Button>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg space-y-3">
            <input
              type="text"
              placeholder="Bug title *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
              required
            />
            <textarea
              placeholder="Description *"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm h-20"
              required
            />
            <textarea
              placeholder="Steps to reproduce (optional)"
              value={formData.stepsToReproduce}
              onChange={(e) => setFormData({ ...formData, stepsToReproduce: e.target.value })}
              className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm h-16"
            />
            <input
              type="text"
              placeholder="Your name (optional)"
              value={formData.reportedBy}
              onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
              className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {bugs.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-sm py-4 text-center">
            No bugs reported yet. 🎉
          </p>
        ) : (
          <div className="space-y-2">
            {bugs.slice(0, 5).map((bug) => {
              const Icon = STATUS_ICONS[bug.status as keyof typeof STATUS_ICONS] || AlertCircle;
              const color = STATUS_COLORS[bug.status as keyof typeof STATUS_COLORS] || "text-zinc-400";

              return (
                <div
                  key={bug.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-sm text-zinc-900 dark:text-zinc-100">
                      {bug.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={bug.status === "fixed" ? "success" : "secondary"}>
                      {bug.status}
                    </Badge>
                    <span className="text-xs text-zinc-400">
                      {formatTimeAgo(bug.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "just now";
}
