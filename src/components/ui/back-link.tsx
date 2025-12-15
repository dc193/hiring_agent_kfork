import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "./button";

interface BackLinkProps {
  href: string;
  label: string;
}

export function BackLink({ href, label }: BackLinkProps) {
  return (
    <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
      <Link href={href}>
        <ChevronLeft className="w-4 h-4" />
        {label}
      </Link>
    </Button>
  );
}
