import { ReactNode } from "react";
import { Header, Footer } from "@/components/layout";

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-8 flex-1 w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}
