import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { SessionWrapper } from "@/components/SessionWrapper";
import { AppHeader } from "@/components/AppHeader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "NEXTHIRE",
  description: "Empower your career with AI-powered resume analysis, building, and job-matching",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
    children: React.ReactNode;
  }>) {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    // Suppress
  }
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className="h-full antialiased dark"
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SessionWrapper session={session}>
          <AppHeader />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </SessionWrapper>
      </body>
    </html>
  );
}
