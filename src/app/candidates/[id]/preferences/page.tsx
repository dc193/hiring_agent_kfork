import { notFound } from "next/navigation";
import { Heart } from "lucide-react";
import { db, candidates, candidatePreferences } from "@/db";
import { eq } from "drizzle-orm";
import { PageLayout, BackLink, Section, EmptyState, Badge, DataGrid, DataGridItem } from "@/components/ui";
import { SummaryCard, SubPageHeader, PreferencesPageClient } from "@/components/profile";

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
    <PageLayout>
      <BackLink href={`/candidates/${id}`} label={`Back to ${candidate.name}`} />

      <SubPageHeader
        title="Preferences (偏好画像)"
        subtitle={`${candidate.name} - 他要什么、会做什么`}
        candidateId={id}
        activeTab="preferences"
      />

      <PreferencesPageClient
        candidateId={id}
        preferencesData={preferences ? {
          valueRanking: preferences.valueRanking as Array<{ value: string; rank: number }> | null,
          motivation: preferences.motivation as { intrinsic?: string[]; extrinsic?: string[]; balance?: string } | null,
          goals: preferences.goals as { shortTerm?: string; midTerm?: string; longTerm?: string } | null,
          riskAttitude: preferences.riskAttitude,
          cognitiveStyle: preferences.cognitiveStyle as Record<string, string> | null,
          relationshipStyle: preferences.relationshipStyle as Record<string, string> | null,
          growthStyle: preferences.growthStyle as Record<string, string> | null,
          boundaries: preferences.boundaries as { moralBoundaries?: string; professionalPrinciples?: string; nonNegotiables?: string[]; triggers?: string[] } | null,
          preferenceSummary: preferences.preferenceSummary,
        } : null}
      >
        {!preferences ? (
          <EmptyState icon={Heart} message="No preference data yet">
            <p className="text-sm">
              Preference information will be gathered through interviews and assessments.
            </p>
          </EmptyState>
        ) : (
          <div className="space-y-6">
            {preferences.preferenceSummary && (
              <SummaryCard
                title="AI Summary"
                summary={preferences.preferenceSummary}
                variant="purple"
              />
            )}

            <Section title="价值排序">
              <ValueRanking values={(preferences.valueRanking as Array<{ value: string; rank: number }>) || []} />
            </Section>

            <Section title="动机结构">
              <MotivationStructure motivation={preferences.motivation as { intrinsic?: string[]; extrinsic?: string[]; balance?: string } | null} />
            </Section>

            <Section title="目标图景">
              <GoalsDisplay goals={preferences.goals as { shortTerm?: string; midTerm?: string; longTerm?: string } | null} />
            </Section>

            <Section title="风险态度">
              <div className="grid grid-cols-2 gap-4">
                <DataGridItem label="Risk Attitude">
                  {preferences.riskAttitude ? RISK_ATTITUDE_LABELS[preferences.riskAttitude] || preferences.riskAttitude : "Not set"}
                </DataGridItem>
                {preferences.riskDetails && Object.entries(preferences.riskDetails as Record<string, string>).map(([key, value]) => (
                  value && (
                    <DataGridItem key={key} label={formatLabel(key)}>
                      {value}
                    </DataGridItem>
                  )
                ))}
              </div>
            </Section>

            <Section title="认知偏好">
              {preferences.cognitiveStyle ? (
                <DataGrid data={preferences.cognitiveStyle as Record<string, string>} />
              ) : (
                <EmptyText>No cognitive style data recorded</EmptyText>
              )}
            </Section>

            <Section title="关系偏好">
              {preferences.relationshipStyle ? (
                <DataGrid data={preferences.relationshipStyle as Record<string, string>} />
              ) : (
                <EmptyText>No relationship style data recorded</EmptyText>
              )}
            </Section>

            <Section title="成长偏好">
              {preferences.growthStyle ? (
                <DataGrid data={preferences.growthStyle as Record<string, string>} />
              ) : (
                <EmptyText>No growth style data recorded</EmptyText>
              )}
            </Section>

            <Section title="边界与底线">
              <BoundariesDisplay boundaries={preferences.boundaries as {
                moralBoundaries?: string;
                professionalPrinciples?: string;
                nonNegotiables?: string[];
                triggers?: string[];
              } | null} />
            </Section>
          </div>
        )}
      </PreferencesPageClient>
    </PageLayout>
  );
}

function EmptyText({ children }: { children: string }) {
  return <p className="text-zinc-400 dark:text-zinc-500 text-sm">{children}</p>;
}

function formatLabel(key: string): string {
  return key.replace(/([A-Z])/g, " $1").trim();
}

function ValueRanking({ values }: { values: Array<{ value: string; rank: number }> }) {
  if (values.length === 0) {
    return <EmptyText>No value ranking recorded</EmptyText>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.sort((a, b) => a.rank - b.rank).map((item, i) => (
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
  );
}

function MotivationStructure({ motivation }: { motivation: { intrinsic?: string[]; extrinsic?: string[]; balance?: string } | null }) {
  if (!motivation) {
    return <EmptyText>No motivation data recorded</EmptyText>;
  }

  return (
    <div className="space-y-4">
      {motivation.intrinsic && motivation.intrinsic.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">内驱动因</h3>
          <div className="flex flex-wrap gap-2">
            {motivation.intrinsic.map((item, i) => (
              <Badge key={i} variant="success">{item}</Badge>
            ))}
          </div>
        </div>
      )}
      {motivation.extrinsic && motivation.extrinsic.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">外驱动因</h3>
          <div className="flex flex-wrap gap-2">
            {motivation.extrinsic.map((item, i) => (
              <Badge key={i} variant="info">{item}</Badge>
            ))}
          </div>
        </div>
      )}
      {motivation.balance && (
        <div>
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">内外平衡</h3>
          <p className="text-zinc-600 dark:text-zinc-400">{motivation.balance}</p>
        </div>
      )}
    </div>
  );
}

function GoalsDisplay({ goals }: { goals: { shortTerm?: string; midTerm?: string; longTerm?: string } | null }) {
  if (!goals) {
    return <EmptyText>No goals recorded</EmptyText>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {goals.shortTerm && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">短期 (1年内)</span>
          <p className="mt-1 text-zinc-900 dark:text-zinc-100">{goals.shortTerm}</p>
        </div>
      )}
      {goals.midTerm && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">中期 (3-5年)</span>
          <p className="mt-1 text-zinc-900 dark:text-zinc-100">{goals.midTerm}</p>
        </div>
      )}
      {goals.longTerm && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">长期 (10年+)</span>
          <p className="mt-1 text-zinc-900 dark:text-zinc-100">{goals.longTerm}</p>
        </div>
      )}
    </div>
  );
}

function BoundariesDisplay({ boundaries }: {
  boundaries: {
    moralBoundaries?: string;
    professionalPrinciples?: string;
    nonNegotiables?: string[];
    triggers?: string[];
  } | null;
}) {
  if (!boundaries) {
    return <EmptyText>No boundary data recorded</EmptyText>;
  }

  return (
    <div className="space-y-4">
      {boundaries.moralBoundaries && (
        <DataGridItem label="道德底线">
          {boundaries.moralBoundaries}
        </DataGridItem>
      )}
      {boundaries.professionalPrinciples && (
        <DataGridItem label="职业原则">
          {boundaries.professionalPrinciples}
        </DataGridItem>
      )}
      {boundaries.nonNegotiables && boundaries.nonNegotiables.length > 0 && (
        <div>
          <span className="text-sm text-zinc-500 dark:text-zinc-400 block mb-2">不可谈判条件</span>
          <div className="flex flex-wrap gap-2">
            {boundaries.nonNegotiables.map((item, i) => (
              <Badge key={i} variant="destructive">{item}</Badge>
            ))}
          </div>
        </div>
      )}
      {boundaries.triggers && boundaries.triggers.length > 0 && (
        <div>
          <span className="text-sm text-zinc-500 dark:text-zinc-400 block mb-2">触发负面反应</span>
          <div className="flex flex-wrap gap-2">
            {boundaries.triggers.map((item, i) => (
              <Badge key={i} variant="warning">{item}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
