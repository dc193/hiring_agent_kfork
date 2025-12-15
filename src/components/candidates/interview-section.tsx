"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Plus,
  Video,
  Phone,
  Users,
  MapPin,
  Link as LinkIcon,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InterviewSession, INTERVIEW_TYPES, INTERVIEW_SESSION_STATUSES } from "@/db/schema";

interface InterviewSectionProps {
  candidateId: string;
  candidateName: string;
  currentStage: string;
}

const TYPE_ICONS: Record<string, typeof Video> = {
  phone_screen: Phone,
  video: Video,
  in_person: MapPin,
  panel: Users,
  technical: AlertCircle,
  behavioral: Users,
  case_study: AlertCircle,
};

const TYPE_LABELS: Record<string, string> = {
  phone_screen: "Phone Screen",
  video: "Video Call",
  in_person: "In Person",
  panel: "Panel Interview",
  technical: "Technical",
  behavioral: "Behavioral",
  case_study: "Case Study",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  in_progress: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
  no_show: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

export function InterviewSection({ candidateId, candidateName, currentStage }: InterviewSectionProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    interviewType: "video" as string,
    scheduledAt: "",
    interviewerName: "",
    interviewerRole: "",
    location: "",
    meetingLink: "",
    notes: "",
  });

  useEffect(() => {
    fetchSessions();
  }, [candidateId]);

  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/candidates/${candidateId}/interviews`);
      const data = await response.json();
      if (data.success) {
        setSessions(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch interviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/candidates/${candidateId}/interviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          interviewType: formData.interviewType,
          pipelineStage: currentStage,
          scheduledAt: formData.scheduledAt || null,
          interviewers: formData.interviewerName
            ? [{ name: formData.interviewerName, role: formData.interviewerRole }]
            : [],
          location: formData.location || null,
          meetingLink: formData.meetingLink || null,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        setFormData({
          title: "",
          interviewType: "video",
          scheduledAt: "",
          interviewerName: "",
          interviewerRole: "",
          location: "",
          meetingLink: "",
          notes: "",
        });
        setShowForm(false);
        fetchSessions();
      }
    } catch (error) {
      console.error("Failed to create interview:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Not scheduled";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Interview Sessions
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="w-4 h-4 mr-1" />
          Schedule Interview
        </Button>
      </CardHeader>
      <CardContent>
        {/* New Interview Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Interview Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., First Round Technical Interview"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Interview Type *
                </label>
                <select
                  value={formData.interviewType}
                  onChange={(e) => setFormData({ ...formData, interviewType: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                  required
                >
                  {INTERVIEW_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {TYPE_LABELS[type] || type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Scheduled Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Meeting Link
                </label>
                <input
                  type="url"
                  placeholder="https://zoom.us/j/..."
                  value={formData.meetingLink}
                  onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Interviewer Name
                </label>
                <input
                  type="text"
                  placeholder="Interviewer name"
                  value={formData.interviewerName}
                  onChange={(e) => setFormData({ ...formData, interviewerName: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Interviewer Role
                </label>
                <input
                  type="text"
                  placeholder="e.g., Engineering Manager"
                  value={formData.interviewerRole}
                  onChange={(e) => setFormData({ ...formData, interviewerRole: e.target.value })}
                  className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Notes
              </label>
              <textarea
                placeholder="Any notes or preparation instructions..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm h-20"
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Scheduling..." : "Schedule Interview"}
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

        {/* Sessions List */}
        {isLoading ? (
          <div className="text-center py-8 text-zinc-500">Loading interviews...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-zinc-500">
            No interviews scheduled yet
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const Icon = TYPE_ICONS[session.interviewType] || Video;
              const interviewers = (session.interviewers as Array<{ name: string; role?: string }>) || [];

              return (
                <div
                  key={session.id}
                  className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/candidates/${candidateId}/interviews/${session.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                        <Icon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                          {session.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                          <Clock className="w-4 h-4" />
                          {formatDate(session.scheduledAt)}
                        </div>
                        {interviewers.length > 0 && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            <Users className="w-4 h-4" />
                            {interviewers.map((i) => i.name).join(", ")}
                          </div>
                        )}
                        {session.meetingLink && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-blue-600 dark:text-blue-400">
                            <LinkIcon className="w-4 h-4" />
                            <span>Meeting link available</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[session.status] || STATUS_COLORS.scheduled}`}>
                        {STATUS_LABELS[session.status] || session.status}
                      </span>
                      <ChevronRight className="w-5 h-5 text-zinc-400" />
                    </div>
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
