"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Cpu, BookOpen, Search, PieChart, Users, Database, LayoutDashboard, ChevronRight } from "lucide-react";

export default function SystemDesignLayout({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const syncTheme = () => setIsDark(root.getAttribute("data-theme") === "dark");
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/system-design", icon: LayoutDashboard },
    { name: "Modules", href: "/system-design/modules", icon: BookOpen },
    { name: "Case Studies", href: "/system-design/cases", icon: Database },
    { name: "Company Paths", href: "/system-design/company-paths", icon: Users },
    { name: "Mock Interviews", href: "/system-design/mock-interview", icon: PieChart },
  ];

  return (
    <div className={`min-h-screen ${isDark ? "bg-black text-white" : "bg-slate-50 text-black"} transition-colors duration-300 flex flex-col md:flex-row`}>
      
      {/* Sidebar Navigation */}
      <aside className={`w-full md:w-64 border-b md:border-b-0 md:border-r ${isDark ? "border-white/10 bg-zinc-950/20" : "border-black/5 bg-white"} p-4 md:h-screen sticky top-0 flex flex-col gap-6 overflow-y-auto`}>
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-400">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg tracking-tight">System Design</h2>
            <p className="text-[10px] opacity-70">FAANG Prep Ecosystem</p>
          </div>
        </div>

        {/* Global Search Bar Placeholder */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50" />
          <input
            type="text"
            placeholder="Search concepts, DBs..."
            className={`w-full rounded-lg border pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? "bg-zinc-900 border-white/10 text-white" : "bg-slate-50 border-black/10 text-black"}`}
          />
        </div>

        <nav className="flex flex-col gap-1 mt-2">
          {navItems.map(item => {
            const isActive = pathname === item.href || (item.href !== "/system-design" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive 
                    ? (isDark ? "bg-cyan-500/10 text-cyan-400" : "bg-cyan-50 text-cyan-600") 
                    : (isDark ? "text-white/60 hover:bg-white/5 hover:text-white" : "text-black/60 hover:bg-slate-100 hover:text-black")
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
                {isActive && <ChevronRight className="h-4 w-4 ml-auto opacity-50" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-foreground/10">
           <Link
              href="/placement-hub"
              className={`flex items-center justify-center rounded-lg border px-4 py-2 text-xs font-bold transition-all ${isDark ? "border-white/20 bg-white/5 hover:bg-white/10" : "border-black/10 bg-white hover:bg-slate-100"}`}
            >
              Back to Hub
            </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
