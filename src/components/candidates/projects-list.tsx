import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  name: string;
  description?: string | null;
  url?: string | null;
  technologies?: string[] | null;
}

interface ProjectsListProps {
  projects: Project[];
}

export function ProjectsList({ projects }: ProjectsListProps) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {projects.map((proj) => (
        <div key={proj.id}>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            {proj.name}
            {proj.url && (
              <a
                href={proj.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </h3>
          {proj.description && (
            <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
              {proj.description}
            </p>
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
  );
}
