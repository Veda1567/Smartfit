import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AICoachDrawer } from "@/components/ai/ai-coach-drawer";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  title: "SmartFit | Unified Physical, Mental & Cognitive Platform",
  description:
    "Harmonize physical strength, mental wellness, meditation, mudras, chess, cognitive fitness, and gamified progress tracking in one unified experience.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased flex flex-col selection:bg-brand-500 selection:text-slate-950">
        <Navbar session={session} />
        <main className="flex-1">{children}</main>
        <Footer />
        <AICoachDrawer />
      </body>
    </html>
  );
}
