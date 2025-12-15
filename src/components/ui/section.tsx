import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

interface SectionProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Section({ title, children, className = "" }: SectionProps) {
  return (
    <Card className={className}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={!title ? "pt-6" : ""}>{children}</CardContent>
    </Card>
  );
}
