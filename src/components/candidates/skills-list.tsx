import { Badge } from "@/components/ui/badge";

interface SkillsListProps {
  skills: string[];
  maxDisplay?: number;
  variant?: "default" | "compact";
}

export function SkillsList({ skills, maxDisplay, variant = "default" }: SkillsListProps) {
  const displaySkills = maxDisplay ? skills.slice(0, maxDisplay) : skills;
  const remaining = maxDisplay ? skills.length - maxDisplay : 0;

  if (skills.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {displaySkills.map((skill, i) => (
        <Badge
          key={i}
          variant={variant === "compact" ? "outline" : "secondary"}
          className={variant === "compact" ? "text-xs" : ""}
        >
          {skill}
        </Badge>
      ))}
      {remaining > 0 && (
        <span className="text-xs text-zinc-400">+{remaining}</span>
      )}
    </div>
  );
}
