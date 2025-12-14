import Link from "next/link";
import { notFound } from "next/navigation";
import { db, candidates, workExperiences, educations, projects } from "@/db";
import { eq, desc } from "drizzle-orm";

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
        {/* Back Link */}
        <Link
          href="/candidates"
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Candidates
        </Link>

        {/* Candidate Header */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                {candidate.name}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-zinc-600 dark:text-zinc-400">
                {candidate.email && (
                  <a href={`mailto:${candidate.email}`} className="hover:text-blue-500">
                    {candidate.email}
                  </a>
                )}
                {candidate.phone && <span>{candidate.phone}</span>}
                {candidate.location && <span>{candidate.location}</span>}
              </div>
              <div className="flex gap-3 mt-3">
                {candidate.linkedin && (
                  <a href={candidate.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
                    LinkedIn
                  </a>
                )}
                {candidate.github && (
                  <a href={candidate.github} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
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

          {/* Summary */}
          {candidate.summary && (
            <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-zinc-700 dark:text-zinc-300">{candidate.summary}</p>
            </div>
          )}
        </div>

        {/* Pipeline Progress */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
            Interview Pipeline
          </h2>
          <div className="flex items-center gap-2">
            {PIPELINE_STAGES.map((stage, index) => (
              <div key={stage} className="flex items-center">
                <div
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    index <= currentStageIndex
                      ? "bg-blue-500 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {STAGE_LABELS[stage]}
                </div>
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
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-6">
          <Link
            href={`/candidates/${id}/profile`}
            className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium hover:border-blue-500 hover:text-blue-500 transition-colors"
          >
            Profile (档案画像)
          </Link>
          <Link
            href={`/candidates/${id}/preferences`}
            className="px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium hover:border-blue-500 hover:text-blue-500 transition-colors"
          >
            Preferences (偏好画像)
          </Link>
        </div>

        {/* Skills */}
        {((candidate.skills as string[]) || []).length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {((candidate.skills as string[]) || []).map((skill, i) => (
                <span
                  key={i}
                  className="px-3 py-1 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Work Experience */}
        {work.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
              Work Experience
            </h2>
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
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
              Education
            </h2>
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
          </div>
        )}

        {/* Projects */}
        {project.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
              Projects
            </h2>
            <div className="space-y-4">
              {project.map((proj) => (
                <div key={proj.id}>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {proj.name}
                    {proj.url && (
                      <a href={proj.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-500 text-sm font-normal hover:underline">
                        Link
                      </a>
                    )}
                  </h3>
                  {proj.description && (
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">{proj.description}</p>
                  )}
                  {((proj.technologies as string[]) || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {((proj.technologies as string[]) || []).map((tech, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
