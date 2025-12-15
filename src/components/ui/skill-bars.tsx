interface Skill {
  name: string;
  level: number;
}

interface SkillBarsProps {
  skills: Skill[];
  maxLevel?: number;
  color?: "blue" | "green" | "purple";
  emptyText?: string;
}

const COLORS = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  purple: "bg-purple-500",
};

export function SkillBars({
  skills,
  maxLevel = 5,
  color = "blue",
  emptyText = "No skills recorded"
}: SkillBarsProps) {
  if (skills.length === 0) {
    return <p className="text-zinc-400 dark:text-zinc-500 text-sm">{emptyText}</p>;
  }

  return (
    <div className="space-y-2">
      {skills.map((skill, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-sm text-zinc-600 dark:text-zinc-400 w-32">{skill.name}</span>
          <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
            <div
              className={`${COLORS[color]} h-2 rounded-full`}
              style={{ width: `${(skill.level / maxLevel) * 100}%` }}
            />
          </div>
          <span className="text-sm text-zinc-500 w-8">{skill.level}/{maxLevel}</span>
        </div>
      ))}
    </div>
  );
}
