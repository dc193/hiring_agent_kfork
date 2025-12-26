import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { db, candidates, workExperiences, educations, projects, templateStages } from "@/db";
import { eq, desc, asc } from "drizzle-orm";
import { PageLayout, Section, Card, CardContent, Button, Badge } from "@/components/ui";
import {
  CandidateActions,
  ContactInfo,
  InterviewSection,
  PipelineControls,
  SkillsList,
  WorkExperienceList,
  EducationList,
  ProjectsList,
  TemplateSelector,
} from "@/components/candidates";

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

  // Fetch template stages if candidate has a template
  let stages: { name: string; displayName: string }[] = [];
  const hasTemplate = !!candidate.templateId;

  if (candidate.templateId) {
    const templateStagesData = await db
      .select()
      .from(templateStages)
      .where(eq(templateStages.templateId, candidate.templateId))
      .orderBy(asc(templateStages.orderIndex));

    stages = templateStagesData.map(s => ({
      name: s.name,
      displayName: s.displayName,
    }));
  }

  const [work, education, project] = await Promise.all([
    db.select().from(workExperiences).where(eq(workExperiences.candidateId, id)).orderBy(desc(workExperiences.createdAt)),
    db.select().from(educations).where(eq(educations.candidateId, id)),
    db.select().from(projects).where(eq(projects.candidateId, id)),
  ]);

  return (
    <PageLayout>
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
              <ContactInfo
                email={candidate.email}
                phone={candidate.phone}
                location={candidate.location}
                linkedin={candidate.linkedin}
                github={candidate.github}
              />
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                ID: {candidate.id.slice(0, 8)}
              </span>
              {candidate.status === "archived" && (
                <Badge variant="secondary">Archived</Badge>
              )}
              <CandidateActions candidateId={candidate.id} currentStatus={candidate.status} />
            </div>
          </div>

          {candidate.summary && (
            <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-zinc-700 dark:text-zinc-300">{candidate.summary}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pipeline Controls or Template Selector */}
      <Section title="面试流程" className="mb-6">
        {hasTemplate && stages.length > 0 ? (
          <PipelineControls
            candidateId={candidate.id}
            currentStage={candidate.pipelineStage}
            currentStatus={candidate.status}
            stages={stages}
          />
        ) : (
          <TemplateSelector
            candidateId={candidate.id}
            candidateName={candidate.name}
          />
        )}
      </Section>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-4 mb-6">
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
        <Button variant="outline" asChild>
          <Link href={`/candidates/${id}/comprehensive`}>
            综合档案 (Comprehensive)
          </Link>
        </Button>
      </div>

      {/* Interview Section */}
      <div className="mb-6">
        <InterviewSection
          candidateId={id}
          candidateName={candidate.name}
          currentStage={candidate.pipelineStage}
        />
      </div>

      {/* Skills */}
      {((candidate.skills as string[]) || []).length > 0 && (
        <Section title="Skills" className="mb-6">
          <SkillsList skills={(candidate.skills as string[]) || []} />
        </Section>
      )}

      {/* Work Experience */}
      {work.length > 0 && (
        <Section title="Work Experience" className="mb-6">
          <WorkExperienceList experiences={work} />
        </Section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <Section title="Education" className="mb-6">
          <EducationList educations={education} />
        </Section>
      )}

      {/* Projects */}
      {project.length > 0 && (
        <Section title="Projects">
          <ProjectsList projects={project} />
        </Section>
      )}
    </PageLayout>
  );
}
