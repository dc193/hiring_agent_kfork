import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  count?: number;
  children?: ReactNode;
}

export function PageHeader({ title, count, children }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
        {title}
        {count !== undefined && ` (${count})`}
      </h2>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}
