import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Mail, Phone, MapPin, Linkedin, Github, ExternalLink } from "lucide-react";
import { db, candidates, workExperiences, educations, projects } from "@/db";
import { eq, desc } from "drizzle-orm";
import { Header, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const STAGE_LABELS: Record<string, string> = {
  resume_review: "简历筛选",
  phone_screen: "电话面试",
  homework: "作业",
  team_interview: "Team 面试",
  final_interview: "终面",
  offer: "Offer",
};

const PIPELINE_STAGES = [
  "resume_review",
  "phone_screen",
  "homework",
  "team_interview",
  "final_interview",
  "offer",
];

export default async function CandidateDetailPage({
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

  const [work, education, project] = await Promise.all([
    db.select().from(workExperiences).where(eq(workExperiences.candidateId, id)).orderBy(desc(workExperiences.createdAt)),
    db.select().from(educations).where(eq(educations.candidateId, id)),
    db.select().from(projects).where(eq(projects.candidateId, id)),
  ]);

  const currentStageIndex = PIPELINE_STAGES.indexOf(candidate.pipelineStage);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full">
        {/* Back Link */}
        <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
          <Link href="/candidates">
            <ChevronLeft className="w-4 h-4" />
            Back to Candidates
          </Link>
        </Button>

        {/* Candidate Header */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  {candidate.name}
                </h1>
                <div className="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {candidate.email && (
                    <a href={`mailto:${candidate.email}`} className="flex items-center gap-1 hover:text-blue-500">
                      <Mail className="w-4 h-4" />
                      {candidate.email}
                    </a>
                  )}
                  {candidate.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {candidate.phone}
                    </span>
                  )}
                  {candidate.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {candidate.location}
                    </span>
                  )}
                </div>
                <div className="flex gap-3 mt-3">
                  {candidate.linkedin && (
                    <a href={candidate.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline text-sm">
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </a>
                  )}
                  {candidate.github && (
                    <a href={candidate.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline text-sm">
                      <Github className="w-4 h-4" />
                      GitHub
                    </a>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  ID: {candidate.id.slice(0, 8)}
                </span>
              </div>
            </div>

            {candidate.summary && (
              <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <p className="text-zinc-700 dark:text-zinc-300">{candidate.summary}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pipeline Progress */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              Interview Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {PIPELINE_STAGES.map((stage, index) => (
                <div key={stage} className="flex items-center">
                  <Badge
                    variant={index <= currentStageIndex ? "default" : "secondary"}
                    className={index <= currentStageIndex ? "bg-blue-500 hover:bg-blue-500" : ""}
                  >
                    {STAGE_LABELS[stage]}
                  </Badge>
                  {index < PIPELINE_STAGES.length - 1 && (
                    <div
                      className={`w-8 h-0.5 ${
                        index < currentStageIndex
                          ? "bg-blue-500"
                          : "bg-zinc-200 dark:bg-zinc-700"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-6">
          <Button variant="outline" asChild>
            <Link href={`/candidates/${id}/profile`}>
              Profile (档案画像)
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/candidates/${id}/preferences`}>
              Preferences (偏好画像)
            </Link>
          </Button>
        </div>

        {/* Skills */}
        {((candidate.skills as string[]) || []).length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {((candidate.skills as string[]) || []).map((skill, i) => (
                  <Badge key={i} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Work Experience */}
        {work.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Work Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {work.map((exp, index) => (
                  <div key={exp.id} className={index > 0 ? "pt-6 border-t border-zinc-100 dark:border-zinc-800" : ""}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{exp.title}</h3>
                        <p className="text-zinc-600 dark:text-zinc-400">
                          {exp.company}
                          {exp.location && ` · ${exp.location}`}
                        </p>
                      </div>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                        {exp.startDate} - {exp.endDate || "Present"}
                      </span>
                    </div>
                    {((exp.description as string[]) || []).length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {((exp.description as string[]) || []).map((item, i) => (
                          <li key={i} className="text-zinc-600 dark:text-zinc-400 text-sm pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-zinc-400">
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Education */}
        {education.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Education
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {education.map((edu) => (
                  <div key={edu.id} className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{edu.school}</h3>
                      <p className="text-zinc-600 dark:text-zinc-400">
                        {edu.degree} in {edu.major}
                        {edu.gpa && ` · GPA: ${edu.gpa}`}
                      </p>
                    </div>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {edu.startDate} - {edu.endDate || "Present"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects */}
        {project.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.map((proj) => (
                  <div key={proj.id}>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      {proj.name}
                      {proj.url && (
                        <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </h3>
                    {proj.description && (
                      <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">{proj.description}</p>
                    )}
                    {((proj.technologies as string[]) || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {((proj.technologies as string[]) || []).map((tech, i) => (
                          <Badge key={i} variant="info" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
