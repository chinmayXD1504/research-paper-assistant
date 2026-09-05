import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Intelligent Research Paper Assistant",
  description: "AI-powered RAG assistant for literature review, citation extraction, and paper summarization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#F4EEE1] text-[#1c1917] antialiased min-h-screen">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
