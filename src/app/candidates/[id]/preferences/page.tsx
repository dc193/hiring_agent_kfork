import Link from "next/link";
import { notFound } from "next/navigation";
import { db, candidates, candidatePreferences } from "@/db";
import { eq } from "drizzle-orm";

const RISK_ATTITUDE_LABELS: Record<string, string> = {
  aggressive: "激进",
  moderate: "稳健",
  conservative: "保守",
};

const VALUE_LABELS: Record<string, string> = {
  money: "金钱",
  freedom: "自由",
  recognition: "认可",
  security: "安全",
  meaning: "意义",
  relationship: "关系",
  growth: "成长",
  power: "权力",
};

export default async function CandidatePreferencesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [candidate] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, id));

  if (!candidate) {
    notFound();
  }

  const [preferences] = await db
    .select()
    .from(candidatePreferences)
    .where(eq(candidatePreferences.candidateId, id));

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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Back Link */}
        <Link
          href={`/candidates/${id}`}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to {candidate.name}
        </Link>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              Preferences (偏好画像)
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              {candidate.name} - 他要什么、会做什么
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/candidates/${id}/profile`}
              className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium hover:border-blue-500 hover:text-blue-500 transition-colors"
            >
              Profile
            </Link>
            <Link
              href={`/candidates/${id}/preferences`}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
            >
              Preferences
            </Link>
          </div>
        </div>

        {!preferences ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <svg className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              No preference data yet
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">
              Preference information will be gathered through interviews and assessments.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Preference Summary */}
            {preferences.preferenceSummary && (
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-6">
                <h2 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-3">
                  AI Summary
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300">{preferences.preferenceSummary}</p>
              </div>
            )}

            {/* Value Ranking */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
                价值排序
              </h2>
              {((preferences.valueRanking as Array<{value: string; rank: number}>) || []).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {((preferences.valueRanking as Array<{value: string; rank: number}>) || [])
                    .sort((a, b) => a.rank - b.rank)
                    .map((item, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                          {item.rank}
                        </span>
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {VALUE_LABELS[item.value] || item.value}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-zinc-400 dark:text-zinc-500 text-sm">No value ranking recorded</p>
              )}
            </div>

            {/* Motivation Structure */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
                动机结构
              </h2>
              {preferences.motivation ? (
                <div className="space-y-4">
                  {(preferences.motivation as { intrinsic?: string[]; extrinsic?: string[]; balance?: string }).intrinsic && (
                    <div>
                      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">内驱动因</h3>
                      <div className="flex flex-wrap gap-2">
                        {((preferences.motivation as { intrinsic?: string[] }).intrinsic || []).map((item, i) => (
                          <span key={i} className="px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(preferences.motivation as { extrinsic?: string[] }).extrinsic && (
                    <div>
                      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">外驱动因</h3>
                      <div className="flex flex-wrap gap-2">
                        {((preferences.motivation as { extrinsic?: string[] }).extrinsic || []).map((item, i) => (
                          <span key={i} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(preferences.motivation as { balance?: string }).balance && (
                    <div>
                      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">内外平衡</h3>
                      <p className="text-zinc-600 dark:text-zinc-400">{(preferences.motivation as { balance?: string }).balance}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-zinc-400 dark:text-zinc-500 text-sm">No motivation data recorded</p>
              )}
            </div>

            {/* Goals */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
                目标图景
              </h2>
              {preferences.goals ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(preferences.goals as { shortTerm?: string }).shortTerm && (
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">短期 (1年内)</span>
                      <p className="mt-1 text-zinc-900 dark:text-zinc-100">{(preferences.goals as { shortTerm?: string }).shortTerm}</p>
                    </div>
                  )}
                  {(preferences.goals as { midTerm?: string }).midTerm && (
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">中期 (3-5年)</span>
                      <p className="mt-1 text-zinc-900 dark:text-zinc-100">{(preferences.goals as { midTerm?: string }).midTerm}</p>
                    </div>
                  )}
                  {(preferences.goals as { longTerm?: string }).longTerm && (
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">长期 (10年+)</span>
                      <p className="mt-1 text-zinc-900 dark:text-zinc-100">{(preferences.goals as { longTerm?: string }).longTerm}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-zinc-400 dark:text-zinc-500 text-sm">No goals recorded</p>
              )}
            </div>

            {/* Risk Attitude */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
                风险态度
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Risk Attitude</span>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {preferences.riskAttitude ? RISK_ATTITUDE_LABELS[preferences.riskAttitude] || preferences.riskAttitude : "Not set"}
                  </p>
                </div>
                {preferences.riskDetails && Object.entries(preferences.riskDetails as Record<string, string>).map(([key, value]) => (
                  value && (
                    <div key={key}>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{value}</p>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Cognitive Style */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
                认知偏好
              </h2>
              {preferences.cognitiveStyle ? (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(preferences.cognitiveStyle as Record<string, string>).map(([key, value]) => (
                    value && (
                      <div key={key}>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{value}</p>
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <p className="text-zinc-400 dark:text-zinc-500 text-sm">No cognitive style data recorded</p>
              )}
            </div>

            {/* Relationship Style */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
                关系偏好
              </h2>
              {preferences.relationshipStyle ? (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(preferences.relationshipStyle as Record<string, string>).map(([key, value]) => (
                    value && (
                      <div key={key}>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{value}</p>
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <p className="text-zinc-400 dark:text-zinc-500 text-sm">No relationship style data recorded</p>
              )}
            </div>

            {/* Growth Style */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
                成长偏好
              </h2>
              {preferences.growthStyle ? (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(preferences.growthStyle as Record<string, string>).map(([key, value]) => (
                    value && (
                      <div key={key}>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{value}</p>
                      </div>
                    )
                  ))}
                </div>
              ) : (
                <p className="text-zinc-400 dark:text-zinc-500 text-sm">No growth style data recorded</p>
              )}
            </div>

            {/* Boundaries */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
                边界与底线
              </h2>
              {preferences.boundaries ? (
                <div className="space-y-4">
                  {(preferences.boundaries as { moralBoundaries?: string }).moralBoundaries && (
                    <div>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">道德底线</span>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{(preferences.boundaries as { moralBoundaries?: string }).moralBoundaries}</p>
                    </div>
                  )}
                  {(preferences.boundaries as { professionalPrinciples?: string }).professionalPrinciples && (
                    <div>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">职业原则</span>
                      <p className="font-medium text-zinc-900 dark:text-zinc-100">{(preferences.boundaries as { professionalPrinciples?: string }).professionalPrinciples}</p>
                    </div>
                  )}
                  {((preferences.boundaries as { nonNegotiables?: string[] }).nonNegotiables || []).length > 0 && (
                    <div>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400 block mb-2">不可谈判条件</span>
                      <div className="flex flex-wrap gap-2">
                        {((preferences.boundaries as { nonNegotiables?: string[] }).nonNegotiables || []).map((item, i) => (
                          <span key={i} className="px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {((preferences.boundaries as { triggers?: string[] }).triggers || []).length > 0 && (
                    <div>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400 block mb-2">触发负面反应</span>
                      <div className="flex flex-wrap gap-2">
                        {((preferences.boundaries as { triggers?: string[] }).triggers || []).map((item, i) => (
                          <span key={i} className="px-3 py-1 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-zinc-400 dark:text-zinc-500 text-sm">No boundary data recorded</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
