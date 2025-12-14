import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hiring Agent - AI-Powered Resume Parsing",
  description: "Parse and analyze resumes using AI to streamline your hiring process",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
