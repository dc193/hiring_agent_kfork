import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, User } from "lucide-react";
import { db, candidates, candidateProfiles } from "@/db";
import { eq } from "drizzle-orm";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
              Profile (档案画像)
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              {candidate.name} - 他是谁、能做什么
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/candidates/${id}/profile`}>Profile</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/candidates/${id}/preferences`}>Preferences</Link>
            </Button>
          </div>
        </div>

        {!profile ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                No profile data yet
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 mb-4">
                Profile information will be gathered through interviews and assessments.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Profile Summary */}
            {profile.profileSummary && (
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                    AI Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-zinc-700 dark:text-zinc-300">{profile.profileSummary}</p>
                </CardContent>
              </Card>
            )}

            {/* Basic Attributes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  基础属性
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Capability Map */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  能力图谱
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                        <Badge key={i} variant="secondary">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-400 dark:text-zinc-500 text-sm">No certifications recorded</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Behavior Patterns */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  行为模式
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Social Position */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  社会位置
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Resources */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  资源禀赋
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
