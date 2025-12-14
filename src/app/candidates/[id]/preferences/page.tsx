import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Heart } from "lucide-react";
import { db, candidates, candidatePreferences } from "@/db";
import { eq } from "drizzle-orm";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full">
        {/* Back Link */}
        <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
          <Link href={`/candidates/${id}`}>
            <ChevronLeft className="w-4 h-4" />
            Back to {candidate.name}
          </Link>
        </Button>

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
            <Button variant="outline" asChild>
              <Link href={`/candidates/${id}/profile`}>Profile</Link>
            </Button>
            <Button asChild>
              <Link href={`/candidates/${id}/preferences`}>Preferences</Link>
            </Button>
          </div>
        </div>

        {!preferences ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                No preference data yet
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                Preference information will be gathered through interviews and assessments.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Preference Summary */}
            {preferences.preferenceSummary && (
              <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                    AI Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-700 dark:text-zinc-300">{preferences.preferenceSummary}</p>
                </CardContent>
              </Card>
            )}

            {/* Value Ranking */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  价值排序
                </CardTitle>
              </CardHeader>
              <CardContent>
                {((preferences.valueRanking as Array<{value: string; rank: number}>) || []).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {((preferences.valueRanking as Array<{value: string; rank: number}>) || [])
                      .sort((a, b) => a.rank - b.rank)
                      .map((item, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                          <Badge variant="purple" className="w-6 h-6 rounded-full flex items-center justify-center p-0">
                            {item.rank}
                          </Badge>
                          <span className="text-zinc-700 dark:text-zinc-300">
                            {VALUE_LABELS[item.value] || item.value}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-zinc-400 dark:text-zinc-500 text-sm">No value ranking recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Motivation Structure */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  动机结构
                </CardTitle>
              </CardHeader>
              <CardContent>
                {preferences.motivation ? (
                  <div className="space-y-4">
                    {(preferences.motivation as { intrinsic?: string[]; extrinsic?: string[]; balance?: string }).intrinsic && (
                      <div>
                        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">内驱动因</h3>
                        <div className="flex flex-wrap gap-2">
                          {((preferences.motivation as { intrinsic?: string[] }).intrinsic || []).map((item, i) => (
                            <Badge key={i} variant="success">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {(preferences.motivation as { extrinsic?: string[] }).extrinsic && (
                      <div>
                        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">外驱动因</h3>
                        <div className="flex flex-wrap gap-2">
                          {((preferences.motivation as { extrinsic?: string[] }).extrinsic || []).map((item, i) => (
                            <Badge key={i} variant="info">
                              {item}
                            </Badge>
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
              </CardContent>
            </Card>

            {/* Goals */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  目标图景
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Risk Attitude */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  风险态度
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Cognitive Style */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  认知偏好
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Relationship Style */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  关系偏好
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Growth Style */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  成长偏好
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Boundaries */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  边界与底线
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                            <Badge key={i} variant="destructive">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {((preferences.boundaries as { triggers?: string[] }).triggers || []).length > 0 && (
                      <div>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400 block mb-2">触发负面反应</span>
                        <div className="flex flex-wrap gap-2">
                          {((preferences.boundaries as { triggers?: string[] }).triggers || []).map((item, i) => (
                            <Badge key={i} variant="warning">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-zinc-400 dark:text-zinc-500 text-sm">No boundary data recorded</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
