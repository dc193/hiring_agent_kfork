interface Education {
  id: string;
  school: string;
  degree?: string | null;
  major?: string | null;
  gpa?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

interface EducationListProps {
  educations: Education[];
}

export function EducationList({ educations }: EducationListProps) {
  if (educations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {educations.map((edu) => (
        <div key={edu.id} className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
              {edu.school}
            </h3>
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
  );
}
