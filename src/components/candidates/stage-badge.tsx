import { Badge, BadgeProps } from "@/components/ui/badge";

const STAGE_LABELS: Record<string, string> = {
  resume_review: "简历筛选",
  phone_screen: "电话面试",
  homework: "作业",
  team_interview: "Team 面试",
  consultant_review: "外部顾问",
  final_interview: "终面",
  offer: "Offer",
};

type BadgeVariant = BadgeProps["variant"];

const STAGE_VARIANTS: Record<string, BadgeVariant> = {
  resume_review: "secondary",
  phone_screen: "info",
  homework: "warning",
  team_interview: "purple",
  consultant_review: "outline",
  final_interview: "destructive",
  offer: "success",
};

interface StageBadgeProps {
  stage: string;
}

export function StageBadge({ stage }: StageBadgeProps) {
  return (
    <Badge variant={STAGE_VARIANTS[stage] || "secondary"}>
      {STAGE_LABELS[stage] || stage}
    </Badge>
  );
}

export { STAGE_LABELS, STAGE_VARIANTS };
