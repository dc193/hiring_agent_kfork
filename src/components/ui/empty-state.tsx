import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "./card";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  children?: ReactNode;
}

export function EmptyState({ icon: Icon, message, children }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="text-center py-16">
        <Icon className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
        <p className="text-zinc-500 dark:text-zinc-400 mb-4">{message}</p>
        {children}
      </CardContent>
    </Card>
  );
}
