import { Badge } from "@/components/ui/badge";

const PIPELINE_STAGES = [
  "resume_review",
  "phone_screen",
  "homework",
  "team_interview",
  "consultant_review",
  "final_interview",
  "offer",
] as const;

const STAGE_LABELS: Record<string, string> = {
  resume_review: "简历筛选",
  phone_screen: "电话面试",
  homework: "作业",
  team_interview: "Team 面试",
  consultant_review: "外部顾问",
  final_interview: "终面",
  offer: "Offer",
};

interface PipelineProgressProps {
  currentStage: string;
}

export function PipelineProgress({ currentStage }: PipelineProgressProps) {
  const currentStageIndex = PIPELINE_STAGES.indexOf(currentStage as typeof PIPELINE_STAGES[number]);

  return (
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
  );
}

export { PIPELINE_STAGES, STAGE_LABELS };
