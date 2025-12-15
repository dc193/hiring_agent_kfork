import { notFound } from "next/navigation";
import { db, candidates, interviewSessions, sessionQuestions, interviewEvaluations } from "@/db";
import { eq } from "drizzle-orm";
import { PageLayout, BackLink, Section, Badge, Card, CardContent } from "@/components/ui";
import { InterviewDetailClient } from "@/components/interviews";
import { Clock, Users, MapPin, Link as LinkIcon, Calendar, MessageSquare } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  phone_screen: "Phone Screen",
  video: "Video Call",
  in_person: "In Person",
  panel: "Panel Interview",
  technical: "Technical",
  behavioral: "Behavioral",
  case_study: "Case Study",
};

const STATUS_VARIANTS: Record<string, "default" | "info" | "success" | "warning" | "destructive" | "secondary"> = {
  scheduled: "info",
  in_progress: "warning",
  completed: "success",
  cancelled: "secondary",
  no_show: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

export default async function InterviewDetailPage({
  params,
}: {
  params: Promise<{ id: string; sessionId: string }>;
}) {
  const { id, sessionId } = await params;

  const [candidate] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, id));

  if (!candidate) {
    notFound();
  }

  const [session] = await db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.id, sessionId));

  if (!session) {
    notFound();
  }

  const [questions, evaluations] = await Promise.all([
    db.select().from(sessionQuestions).where(eq(sessionQuestions.sessionId, sessionId)),
    db.select().from(interviewEvaluations).where(eq(interviewEvaluations.sessionId, sessionId)),
  ]);

  const formatDate = (date: Date | null) => {
    if (!date) return "Not scheduled";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const interviewers = (session.interviewers as Array<{ name: string; role?: string }>) || [];

  return (
    <PageLayout>
      <BackLink href={`/candidates/${id}`} label={`Back to ${candidate.name}`} />

      {/* Session Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                {session.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {TYPE_LABELS[session.interviewType] || session.interviewType}
                </span>
                <Badge variant={STATUS_VARIANTS[session.status] || "default"}>
                  {STATUS_LABELS[session.status] || session.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-zinc-400" />
              <div>
                <p className="text-sm text-zinc-500">Scheduled</p>
                <p className="text-zinc-900 dark:text-zinc-100">{formatDate(session.scheduledAt)}</p>
              </div>
            </div>

            {interviewers.length > 0 && (
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-zinc-400" />
                <div>
                  <p className="text-sm text-zinc-500">Interviewers</p>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {interviewers.map((i) => `${i.name}${i.role ? ` (${i.role})` : ""}`).join(", ")}
                  </p>
                </div>
              </div>
            )}

            {session.location && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-zinc-400" />
                <div>
                  <p className="text-sm text-zinc-500">Location</p>
                  <p className="text-zinc-900 dark:text-zinc-100">{session.location}</p>
                </div>
              </div>
            )}

            {session.meetingLink && (
              <div className="flex items-center gap-3">
                <LinkIcon className="w-5 h-5 text-zinc-400" />
                <div>
                  <p className="text-sm text-zinc-500">Meeting Link</p>
                  <a
                    href={session.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Join Meeting
                  </a>
                </div>
              </div>
            )}

            {session.duration && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-zinc-400" />
                <div>
                  <p className="text-sm text-zinc-500">Duration</p>
                  <p className="text-zinc-900 dark:text-zinc-100">{session.duration} minutes</p>
                </div>
              </div>
            )}
          </div>

          {session.notes && (
            <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 mb-2">Notes</p>
              <p className="text-zinc-700 dark:text-zinc-300">{session.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Component for Interactive Parts */}
      <InterviewDetailClient
        candidateId={id}
        sessionId={sessionId}
        sessionStatus={session.status}
        initialQuestions={questions}
        initialEvaluations={evaluations}
      />
    </PageLayout>
  );
}
