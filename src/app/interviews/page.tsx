import Link from "next/link";
import { Suspense } from "react";
import { Calendar, Users, Video, Phone, MapPin, Clock } from "lucide-react";
import { db, interviewSessions, candidates, INTERVIEW_SESSION_STATUSES } from "@/db";
import { eq, desc } from "drizzle-orm";
import { PageLayout, Section, Card, CardContent } from "@/components/ui";
import { InterviewFilters, CreateInterviewModal } from "@/components/interviews";

// Force dynamic rendering - don't cache this page
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  in_progress: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  cancelled: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
  no_show: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
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
  consultant_review: "外部顾问",
  final_interview: "终面",
  offer: "Offer",
};

export default async function InterviewsPage() {
  // Fetch all interviews with candidate info
  const interviews = await db
    .select({
      interview: interviewSessions,
      candidate: {
        id: candidates.id,
        name: candidates.name,
        email: candidates.email,
        pipelineStage: candidates.pipelineStage,
        status: candidates.status,
      },
    })
    .from(interviewSessions)
    .leftJoin(candidates, eq(interviewSessions.candidateId, candidates.id))
    .orderBy(desc(interviewSessions.createdAt));

  // Fetch all candidates for the create modal
  const allCandidates = await db
    .select({
      id: candidates.id,
      name: candidates.name,
      pipelineStage: candidates.pipelineStage,
    })
    .from(candidates)
    .where(eq(candidates.status, "active"));

  const formatDate = (date: Date | null) => {
    if (!date) return "未安排";
    return new Date(date).toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Group by status for summary
  const statusCounts = interviews.reduce((acc, row) => {
    const status = row.interview.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <PageLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            面试管理
          </h1>
          <p className="text-zinc-500 mt-1">
            管理所有候选人的面试安排
          </p>
        </div>
        <CreateInterviewModal candidates={allCandidates} />
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {INTERVIEW_SESSION_STATUSES.map((status) => (
          <Card key={status}>
            <CardContent className="pt-4 pb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {statusCounts[status] || 0}
                </p>
                <p className="text-sm text-zinc-500">{STATUS_LABELS[status]}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="mb-6 h-10" />}>
        <InterviewFilters />
      </Suspense>

      {/* Interviews List */}
      <Section title={`所有面试 (${interviews.length})`}>
        {interviews.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
              <p className="text-zinc-500">暂无面试安排</p>
              <p className="text-sm text-zinc-400 mt-1">点击右上角按钮创建新的面试</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {interviews.map((row) => {
              const interview = row.interview;
              const candidate = row.candidate;
              const Icon = TYPE_ICONS[interview.interviewType] || Video;
              const interviewers = (interview.interviewers as Array<{ name: string; role?: string }>) || [];

              return (
                <Link
                  key={interview.id}
                  href={`/interviews/${interview.id}`}
                  className="block"
                >
                  <Card className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                          <Icon className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {interview.title}
                              </h3>
                              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                {candidate?.name || "Unknown Candidate"}
                                {candidate && (
                                  <span className="text-zinc-400 dark:text-zinc-500 ml-2">
                                    · {STAGE_LABELS[candidate.pipelineStage] || candidate.pipelineStage}
                                  </span>
                                )}
                              </p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[interview.status]}`}>
                              {STATUS_LABELS[interview.status]}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDate(interview.scheduledAt)}
                            </span>
                            <span>
                              {TYPE_LABELS[interview.interviewType] || interview.interviewType}
                            </span>
                            {interviewers.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {interviewers.map(i => i.name).join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </Section>
    </PageLayout>
  );
}
