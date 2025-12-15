import { Check, Clock, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RoadmapItem {
  id: string;
  version: string;
  title: string;
  status: string;
  features: string[] | null;
}

interface RoadmapSectionProps {
  items: RoadmapItem[];
}

const STATUS_ICONS = {
  completed: Check,
  in_progress: Clock,
  planned: Target,
};

const STATUS_COLORS = {
  completed: "text-green-500",
  in_progress: "text-yellow-500",
  planned: "text-zinc-400",
};

// Default roadmap if database is empty
const DEFAULT_ROADMAP: RoadmapItem[] = [
  {
    id: "1",
    version: "v0.1",
    title: "Core Foundation",
    status: "completed",
    features: ["Resume parsing", "Candidate CRUD", "Basic pipeline"],
  },
  {
    id: "2",
    version: "v0.2",
    title: "Profile & Preference Framework",
    status: "in_progress",
    features: ["Profile dimensions", "Preference dimensions", "AI analysis"],
  },
  {
    id: "3",
    version: "v0.3",
    title: "Interview Assistant",
    status: "planned",
    features: ["Interview notes", "Question bank", "Evaluation templates"],
  },
  {
    id: "4",
    version: "v0.4",
    title: "Team Collaboration",
    status: "planned",
    features: ["Multi-user support", "Comments", "Notifications"],
  },
];

export function RoadmapSection({ items }: RoadmapSectionProps) {
  const roadmap = items.length > 0 ? items : DEFAULT_ROADMAP;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <span>🗺️</span> Roadmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {roadmap.map((item) => {
            const Icon = STATUS_ICONS[item.status as keyof typeof STATUS_ICONS] || Target;
            const color = STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || "text-zinc-400";

            return (
              <div key={item.id} className="flex gap-3">
                <div className={`mt-1 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {item.version}
                    </Badge>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(item.features || []).map((feature, i) => (
                      <span
                        key={i}
                        className="text-xs text-zinc-500 dark:text-zinc-400"
                      >
                        {feature}
                        {i < (item.features || []).length - 1 && " · "}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
