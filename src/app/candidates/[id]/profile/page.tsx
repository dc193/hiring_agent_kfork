import Link from "next/link";
import { notFound } from "next/navigation";
import { db, candidates, candidateProfiles } from "@/db";
import { eq } from "drizzle-orm";

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
              Profile (档案画像)
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              {candidate.name} - 他是谁、能做什么
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/candidates/${id}/profile`}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
            >
              Profile
            </Link>
            <Link
              href={`/candidates/${id}/preferences`}
              className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium hover:border-blue-500 hover:text-blue-500 transition-colors"
            >
              Preferences
            </Link>
          </div>
        </div>

        {!profile ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <svg className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              No profile data yet
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">
              Profile information will be gathered through interviews and assessments.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Summary */}
            {profile.profileSummary && (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
                <h2 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-3">
                  AI Summary
                </h2>
                <p className="text-zinc-700 dark:text-zinc-300">{profile.profileSummary}</p>
              </div>
            )}

            {/* Basic Attributes */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
                基础属性
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Career Stage</span>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {profile.careerStage ? CAREER_STAGE_LABELS[profile.careerStage] || profile.careerStage : "Not set"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Years of Experience</span>
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {profile.yearsOfExperience ? `${profile.yearsOfExperience} years` : "Not set"}
                  </p>
                </div>
              </div>
            </div>

            {/* Capability Map */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
                能力图谱
              </h2>

              {/* Hard Skills */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Hard Skills</h3>
                {((profile.hardSkills as Array<{name: string; level: number}>) || []).length > 0 ? (
                  <div className="space-y-2">
                    {((profile.hardSkills as Array<{name: string; level: number}>) || []).map((skill, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400 w-32">{skill.name}</span>
                        <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(skill.level / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-zinc-500 w-8">{skill.level}/5</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400 dark:text-zinc-500 text-sm">No hard skills recorded</p>
                )}
              </div>

              {/* Soft Skills */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Soft Skills</h3>
                {((profile.softSkills as Array<{name: string; level: number}>) || []).length > 0 ? (
                  <div className="space-y-2">
                    {((profile.softSkills as Array<{name: string; level: number}>) || []).map((skill, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm text-zinc-600 dark:text-zinc-400 w-32">{skill.name}</span>
                        <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(skill.level / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-zinc-500 w-8">{skill.level}/5</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400 dark:text-zinc-500 text-sm">No soft skills recorded</p>
                )}
              </div>

              {/* Certifications */}
              <div>
                <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Certifications</h3>
                {((profile.certifications as string[]) || []).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {((profile.certifications as string[]) || []).map((cert, i) => (
                      <span key={i} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full text-sm">
                        {cert}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400 dark:text-zinc-500 text-sm">No certifications recorded</p>
                )}
              </div>
            </div>

            {/* Behavior Patterns */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
                行为模式
              </h2>
              {profile.behaviorPatterns ? (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(profile.behaviorPatterns as Record<string, string>).map(([key, value]) => (
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
                <p className="text-zinc-400 dark:text-zinc-500 text-sm">No behavior patterns recorded</p>
              )}
            </div>

            {/* Social Position */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
                社会位置
              </h2>
              {profile.socialPosition ? (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(profile.socialPosition as Record<string, string>).map(([key, value]) => (
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
                <p className="text-zinc-400 dark:text-zinc-500 text-sm">No social position data recorded</p>
              )}
            </div>

            {/* Resources */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
                资源禀赋
              </h2>
              {profile.resources ? (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(profile.resources as Record<string, string>).map(([key, value]) => (
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
                <p className="text-zinc-400 dark:text-zinc-500 text-sm">No resource data recorded</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
