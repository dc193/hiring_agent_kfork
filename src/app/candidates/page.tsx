import Link from "next/link";
import { db, candidates } from "@/db";
import { desc } from "drizzle-orm";
import { PIPELINE_STAGES } from "@/db/schema";

const STAGE_LABELS: Record<string, string> = {
  resume_review: "简历筛选",
  phone_screen: "电话面试",
  homework: "作业",
  team_interview: "Team 面试",
  final_interview: "终面",
  offer: "Offer",
};

const STAGE_COLORS: Record<string, string> = {
  resume_review: "bg-gray-100 text-gray-700",
  phone_screen: "bg-blue-100 text-blue-700",
  homework: "bg-yellow-100 text-yellow-700",
  team_interview: "bg-purple-100 text-purple-700",
  final_interview: "bg-orange-100 text-orange-700",
  offer: "bg-green-100 text-green-700",
};

export default async function CandidatesPage() {
  const allCandidates = await db
    .select()
    .from(candidates)
    .orderBy(desc(candidates.createdAt));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  Hiring Agent
                </h1>
              </Link>
            </div>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                Resume Parser
              </Link>
              <Link href="/candidates" className="text-blue-500 font-medium">
                Candidates
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Candidates ({allCandidates.length})
          </h2>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            + Upload Resume
          </Link>
        </div>

        {allCandidates.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <svg className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">No candidates yet</p>
            <Link
              href="/"
              className="text-blue-500 hover:underline"
            >
              Upload your first resume
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Skills
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {allCandidates.map((candidate) => (
                  <tr key={candidate.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {candidate.name}
                        </div>
                        <div className="text-sm text-zinc-500 dark:text-zinc-400">
                          {candidate.email || "No email"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${STAGE_COLORS[candidate.pipelineStage] || "bg-gray-100 text-gray-700"}`}>
                        {STAGE_LABELS[candidate.pipelineStage] || candidate.pipelineStage}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {((candidate.skills as string[]) || []).slice(0, 3).map((skill, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded"
                          >
                            {skill}
                          </span>
                        ))}
                        {((candidate.skills as string[]) || []).length > 3 && (
                          <span className="text-xs text-zinc-400">
                            +{((candidate.skills as string[]) || []).length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                      {new Date(candidate.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/candidates/${candidate.id}`}
                        className="text-blue-500 hover:text-blue-600 text-sm font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
