import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SummaryCardProps {
  title: string;
  summary: string;
  variant: "blue" | "purple";
}

const VARIANTS = {
  blue: {
    card: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    title: "text-blue-600 dark:text-blue-400",
  },
  purple: {
    card: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
    title: "text-purple-600 dark:text-purple-400",
  },
};

export function SummaryCard({ title, summary, variant }: SummaryCardProps) {
  const styles = VARIANTS[variant];

  return (
    <Card className={styles.card}>
      <CardHeader className="pb-2">
        <CardTitle className={`text-sm font-semibold ${styles.title} uppercase tracking-wide`}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-zinc-700 dark:text-zinc-300">{summary}</p>
      </CardContent>
    </Card>
  );
}
