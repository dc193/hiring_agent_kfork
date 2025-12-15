import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, User, Calendar, Clock, Users, MapPin, Link as LinkIcon, Video, Phone } from "lucide-react";
import { db, interviewSessions, candidates, sessionQuestions, interviewEvaluations } from "@/db";
import { eq, asc } from "drizzle-orm";
import { PageLayout, Section, Card, CardContent, Button, Badge } from "@/components/ui";
import { InterviewEditor } from "@/components/interviews/interview-editor";

const TYPE_ICONS: Record<string, typeof Video> = {
  phone_screen: Phone,
  video: Video,
  in_person: MapPin,
  panel: Users,
  technical: Calendar,
  behavioral: Users,
  case_study: Calendar,
};

const TYPE_LABELS: Record<string, string> = {
  phone_screen: "电话面试",
  video: "视频面试",
  in_person: "现场面试",
  panel: "群面",
  technical: "技术面试",
  behavioral: "行为面试",
  case_study: "案例分析",
};

const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  scheduled: "secondary",
  in_progress: "default",
  completed: "default",
  cancelled: "outline",
  no_show: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  scheduled: "已安排",
  in_progress: "进行中",
  completed: "已完成",
  cancelled: "已取消",
  no_show: "未出席",
};

const STAGE_LABELS: Record<string, string> = {
  resume_review: "简历筛选",
  phone_screen: "电话面试",
  homework: "作业",
  team_interview: "Team 面试",
  final_interview: "终面",
  offer: "Offer",
};

export default async function InterviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [session] = await db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.id, id));

  if (!session) {
    notFound();
  }

  // Get candidate info
  const [candidate] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, session.candidateId));

  // Get related data
  const [questions, evaluations] = await Promise.all([
    db.select().from(sessionQuestions).where(eq(sessionQuestions.sessionId, id)).orderBy(asc(sessionQuestions.orderIndex)),
    db.select().from(interviewEvaluations).where(eq(interviewEvaluations.sessionId, id)),
  ]);

  const formatDate = (date: Date | null) => {
    if (!date) return "未安排";
    return new Date(date).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const Icon = TYPE_ICONS[session.interviewType] || Video;
  const interviewers = (session.interviewers as Array<{ name: string; role?: string }>) || [];

  return (
    <PageLayout>
      {/* Back Link */}
      <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
        <Link href="/interviews">
          <ChevronLeft className="w-4 h-4" />
          返回面试列表
        </Link>
      </Button>

      {/* Interview Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <Icon className="w-8 h-8 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {session.title}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <Badge variant={STATUS_COLORS[session.status]}>
                    {STATUS_LABELS[session.status]}
                  </Badge>
                  <span className="text-sm text-zinc-500">
                    {TYPE_LABELS[session.interviewType]}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {STAGE_LABELS[session.pipelineStage]}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Candidate Info */}
          {candidate && (
            <Link
              href={`/candidates/${candidate.id}`}
              className="flex items-center gap-3 mt-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <User className="w-5 h-5 text-zinc-400" />
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {candidate.name}
                </p>
                <p className="text-sm text-zinc-500">
                  {candidate.email} · {STAGE_LABELS[candidate.pipelineStage]}
                </p>
              </div>
            </Link>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-zinc-400" />
              <div>
                <p className="text-sm text-zinc-500">安排时间</p>
                <p className="text-zinc-900 dark:text-zinc-100">
                  {formatDate(session.scheduledAt)}
                </p>
              </div>
            </div>

            {interviewers.length > 0 && (
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-zinc-400" />
                <div>
                  <p className="text-sm text-zinc-500">面试官</p>
                  <p className="text-zinc-900 dark:text-zinc-100">
                    {interviewers.map(i => `${i.name}${i.role ? ` (${i.role})` : ""}`).join(", ")}
                  </p>
                </div>
              </div>
            )}

            {session.location && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-zinc-400" />
                <div>
                  <p className="text-sm text-zinc-500">地点</p>
                  <p className="text-zinc-900 dark:text-zinc-100">{session.location}</p>
                </div>
              </div>
            )}

            {session.meetingLink && (
              <div className="flex items-center gap-3">
                <LinkIcon className="w-5 h-5 text-zinc-400" />
                <div>
                  <p className="text-sm text-zinc-500">会议链接</p>
                  <a
                    href={session.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    加入会议
                  </a>
                </div>
              </div>
            )}

            {session.duration && (
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-zinc-400" />
                <div>
                  <p className="text-sm text-zinc-500">时长</p>
                  <p className="text-zinc-900 dark:text-zinc-100">{session.duration} 分钟</p>
                </div>
              </div>
            )}
          </div>

          {session.notes && (
            <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-sm text-zinc-500 mb-2">备注</p>
              <p className="text-zinc-700 dark:text-zinc-300">{session.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interview Editor - Client Component */}
      <InterviewEditor
        interviewId={id}
        initialSession={session}
        initialQuestions={questions}
        initialEvaluations={evaluations}
      />
    </PageLayout>
  );
}
