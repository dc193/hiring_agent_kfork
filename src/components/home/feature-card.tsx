import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

export function FeatureCard({ icon: Icon, title, description, color, bgColor }: FeatureCardProps) {
  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardContent className="text-center p-6">
        <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          {title}
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
