"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb, Plus, ThumbsUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  votes: number;
  status: string;
}

interface FeatureRequestSectionProps {
  features: FeatureRequest[];
}

export function FeatureRequestSection({ features }: FeatureRequestSectionProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    useCase: "",
    requestedBy: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setFormData({ title: "", description: "", useCase: "", requestedBy: "" });
        setShowForm(false);
        router.refresh();
      }
    } catch {
      // Handle error silently
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (id: string) => {
    setVotingId(id);
    try {
      await fetch(`/api/features/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: "up" }),
      });
      router.refresh();
    } catch {
      // Handle error silently
    } finally {
      setVotingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="w-5 h-5" /> Feature Requests
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus className="w-4 h-4" />
          Suggest Feature
        </Button>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg space-y-3">
            <input
              type="text"
              placeholder="Feature title *"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
              required
            />
            <textarea
              placeholder="Description *"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm h-20"
              required
            />
            <textarea
              placeholder="Use case - How would you use this feature? (optional)"
              value={formData.useCase}
              onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
              className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm h-16"
            />
            <input
              type="text"
              placeholder="Your name (optional)"
              value={formData.requestedBy}
              onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
              className="w-full px-3 py-2 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {features.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-sm py-4 text-center">
            No feature requests yet. Be the first to suggest one!
          </p>
        ) : (
          <div className="space-y-2">
            {features.slice(0, 5).map((feature) => (
              <div
                key={feature.id}
                className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50"
              >
                <span className="text-sm text-zinc-900 dark:text-zinc-100 flex-1">
                  {feature.title}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleVote(feature.id)}
                  disabled={votingId === feature.id}
                  className="flex items-center gap-1 text-zinc-500 hover:text-blue-500"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{feature.votes}</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
