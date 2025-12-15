import Link from "next/link";
import { Button } from "@/components/ui/button";

interface SubPageHeaderProps {
  title: string;
  subtitle: string;
  candidateId: string;
  activeTab: "profile" | "preferences";
}

export function SubPageHeader({ title, subtitle, candidateId, activeTab }: SubPageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          {title}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          {subtitle}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant={activeTab === "profile" ? "default" : "outline"} asChild>
          <Link href={`/candidates/${candidateId}/profile`}>Profile</Link>
        </Button>
        <Button variant={activeTab === "preferences" ? "default" : "outline"} asChild>
          <Link href={`/candidates/${candidateId}/preferences`}>Preferences</Link>
        </Button>
      </div>
    </div>
  );
}
