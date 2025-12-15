import { notFound } from "next/navigation";
import { User } from "lucide-react";
import { db, candidates, candidateProfiles } from "@/db";
import { eq } from "drizzle-orm";
import { PageLayout, BackLink, Section, EmptyState, Badge, SkillBars, DataGrid } from "@/components/ui";
import { SummaryCard, SubPageHeader } from "@/components/profile";

const CAREER_STAGE_LABELS: Record<string, string> = {
  junior: "新手期",
  growth: "成长期",
  senior: "成熟期",
  transition: "转型期",
};

export default async function CandidateProfilePage({
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

  const [profile] = await db
    .select()
    .from(candidateProfiles)
    .where(eq(candidateProfiles.candidateId, id));

  return (
    <PageLayout>
      <BackLink href={`/candidates/${id}`} label={`Back to ${candidate.name}`} />

      <SubPageHeader
        title="Profile (档案画像)"
        subtitle={`${candidate.name} - 他是谁、能做什么`}
        candidateId={id}
        activeTab="profile"
      />

      {!profile ? (
        <EmptyState icon={User} message="No profile data yet">
          <p className="text-sm">
            Profile information will be gathered through interviews and assessments.
          </p>
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {profile.profileSummary && (
            <SummaryCard
              title="AI Summary"
              summary={profile.profileSummary}
              variant="blue"
            />
          )}

          <Section title="基础属性">
            <DataGrid
              data={{
                "Career Stage": profile.careerStage
                  ? CAREER_STAGE_LABELS[profile.careerStage] || profile.careerStage
                  : "Not set",
                "Years of Experience": profile.yearsOfExperience
                  ? `${profile.yearsOfExperience} years`
                  : "Not set",
              }}
            />
          </Section>

          <Section title="能力图谱">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Hard Skills</h3>
                <SkillBars
                  skills={(profile.hardSkills as Array<{ name: string; level: number }>) || []}
                  color="blue"
                  emptyText="No hard skills recorded"
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Soft Skills</h3>
                <SkillBars
                  skills={(profile.softSkills as Array<{ name: string; level: number }>) || []}
                  color="green"
                  emptyText="No soft skills recorded"
                />
              </div>

              <div>
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Certifications</h3>
                {((profile.certifications as string[]) || []).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {((profile.certifications as string[]) || []).map((cert, i) => (
                      <Badge key={i} variant="secondary">{cert}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400 dark:text-zinc-500 text-sm">No certifications recorded</p>
                )}
              </div>
            </div>
          </Section>

          <Section title="行为模式">
            {profile.behaviorPatterns ? (
              <DataGrid data={profile.behaviorPatterns as Record<string, string>} />
            ) : (
              <p className="text-zinc-400 dark:text-zinc-500 text-sm">No behavior patterns recorded</p>
            )}
          </Section>

          <Section title="社会位置">
            {profile.socialPosition ? (
              <DataGrid data={profile.socialPosition as Record<string, string>} />
            ) : (
              <p className="text-zinc-400 dark:text-zinc-500 text-sm">No social position data recorded</p>
            )}
          </Section>

          <Section title="资源禀赋">
            {profile.resources ? (
              <DataGrid data={profile.resources as Record<string, string>} />
            ) : (
              <p className="text-zinc-400 dark:text-zinc-500 text-sm">No resource data recorded</p>
            )}
          </Section>
        </div>
      )}
    </PageLayout>
  );
}
