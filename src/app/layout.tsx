import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { SessionWrapper } from "@/components/SessionWrapper";
import { AppHeader } from "@/components/AppHeader";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "NEXTHIRE AI",
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
  const session = await getServerSession(authOptions);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`(() => {
  try {
    const root = document.documentElement;
    const saved = localStorage.getItem('theme');
    const theme = saved === 'dark' || saved === 'light'
      ? saved
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
  } catch {}
})();`}
        </Script>
      </head>
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
