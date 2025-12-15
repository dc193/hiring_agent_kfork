import { Badge, BadgeProps } from "@/components/ui/badge";

type BadgeVariant = BadgeProps["variant"];

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  active: "success",
  archived: "secondary",
  rejected: "destructive",
  hired: "info",
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={STATUS_VARIANTS[status] || "secondary"}>
      {status}
    </Badge>
  );
}

export { STATUS_VARIANTS };
