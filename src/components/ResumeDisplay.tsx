"use client";

import { ParsedResume } from "@/types/resume";

interface ResumeDisplayProps {
  resume: ParsedResume;
  onReset: () => void;
}

export default function ResumeDisplay({ resume, onReset }: ResumeDisplayProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Parsed Resume
        </h2>
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
        >
          Parse Another
        </button>
      </div>

      {/* Basic Info Card */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              {resume.basicInfo.name || "Unknown"}
            </h1>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              {resume.basicInfo.email && (
                <a href={`mailto:${resume.basicInfo.email}`} className="hover:text-blue-500">
                  {resume.basicInfo.email}
                </a>
              )}
              {resume.basicInfo.phone && (
                <span>{resume.basicInfo.phone}</span>
              )}
              {resume.basicInfo.location && (
                <span>{resume.basicInfo.location}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {resume.basicInfo.linkedin && (
                <a
                  href={resume.basicInfo.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline"
                >
                  LinkedIn
                </a>
              )}
              {resume.basicInfo.github && (
                <a
                  href={resume.basicInfo.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline"
                >
                  GitHub
                </a>
              )}
              {resume.basicInfo.website && (
                <a
                  href={resume.basicInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 hover:underline"
                >
                  Website
                </a>
              )}
            </div>
          </div>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            ID: {resume.id.slice(0, 8)}
          </span>
        </div>

        {resume.summary && (
          <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
              Summary
            </h3>
            <p className="text-zinc-700 dark:text-zinc-300">{resume.summary}</p>
          </div>
        )}
      </div>

      {/* Skills */}
      {resume.skills.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
            Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Work Experience */}
      {resume.workExperience.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
            Work Experience
          </h3>
          <div className="space-y-6">
            {resume.workExperience.map((exp, index) => (
              <div key={index} className={index > 0 ? "pt-6 border-t border-zinc-100 dark:border-zinc-800" : ""}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {exp.title}
                    </h4>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {exp.company}
                      {exp.location && ` · ${exp.location}`}
                    </p>
                  </div>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {exp.startDate} - {exp.endDate}
                  </span>
                </div>
                {exp.description.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {exp.description.map((item, i) => (
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
      {resume.education.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
            Education
          </h3>
          <div className="space-y-6">
            {resume.education.map((edu, index) => (
              <div key={index} className={index > 0 ? "pt-6 border-t border-zinc-100 dark:border-zinc-800" : ""}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                      {edu.school}
                    </h4>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {edu.degree} in {edu.major}
                      {edu.gpa && ` · GPA: ${edu.gpa}`}
                    </p>
                  </div>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                    {edu.startDate} - {edu.endDate}
                  </span>
                </div>
                {edu.highlights && edu.highlights.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {edu.highlights.map((item, i) => (
                      <li key={i} className="text-zinc-600 dark:text-zinc-400 text-sm">
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

      {/* Projects */}
      {resume.projects && resume.projects.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-4">
            Projects
          </h3>
          <div className="space-y-4">
            {resume.projects.map((project, index) => (
              <div key={index} className={index > 0 ? "pt-4 border-t border-zinc-100 dark:border-zinc-800" : ""}>
                <div className="flex items-start justify-between">
                  <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {project.name}
                    {project.url && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-sm text-blue-500 hover:underline font-normal"
                      >
                        Link
                      </a>
                    )}
                  </h4>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
                  {project.description}
                </p>
                {project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {project.technologies.map((tech, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded"
                      >
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

      {/* Certifications & Languages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {resume.certifications && resume.certifications.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
              Certifications
            </h3>
            <ul className="space-y-2">
              {resume.certifications.map((cert, index) => (
                <li key={index} className="text-zinc-700 dark:text-zinc-300 text-sm">
                  {cert}
                </li>
              ))}
            </ul>
          </div>
        )}

        {resume.languages && resume.languages.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
              Languages
            </h3>
            <div className="flex flex-wrap gap-2">
              {resume.languages.map((lang, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Raw Text Toggle */}
      {resume.rawText && (
        <details className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
          <summary className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300">
            Raw Text
          </summary>
          <pre className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-xs text-zinc-600 dark:text-zinc-400 overflow-x-auto whitespace-pre-wrap">
            {resume.rawText}
          </pre>
        </details>
      )}
    </div>
  );
}
