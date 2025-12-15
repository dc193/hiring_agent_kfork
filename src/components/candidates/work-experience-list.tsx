interface WorkExperience {
  id: string;
  title: string;
  company: string;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  description?: string[] | null;
}

interface WorkExperienceListProps {
  experiences: WorkExperience[];
}

export function WorkExperienceList({ experiences }: WorkExperienceListProps) {
  if (experiences.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {experiences.map((exp, index) => (
        <div
          key={exp.id}
          className={index > 0 ? "pt-6 border-t border-zinc-100 dark:border-zinc-800" : ""}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                {exp.title}
              </h3>
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
                <li
                  key={i}
                  className="text-zinc-600 dark:text-zinc-400 text-sm pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-zinc-400"
                >
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
