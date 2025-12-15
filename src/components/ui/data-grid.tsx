import { ReactNode } from "react";

interface DataGridItemProps {
  label: string;
  children: ReactNode;
}

export function DataGridItem({ label, children }: DataGridItemProps) {
  return (
    <div>
      <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
      <p className="font-medium text-zinc-900 dark:text-zinc-100">{children}</p>
    </div>
  );
}

interface DataGridProps {
  data: Record<string, string | undefined | null>;
  columns?: 2 | 3;
}

export function DataGrid({ data, columns = 2 }: DataGridProps) {
  const entries = Object.entries(data).filter(([, value]) => value);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className={`grid grid-cols-${columns} gap-4`}>
      {entries.map(([key, value]) => (
        <DataGridItem key={key} label={formatLabel(key)}>
          {value}
        </DataGridItem>
      ))}
    </div>
  );
}

function formatLabel(key: string): string {
  return key.replace(/([A-Z])/g, " $1").trim();
}
