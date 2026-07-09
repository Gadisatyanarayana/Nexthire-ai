import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function LearningBreadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center text-sm text-zinc-400 mb-6 space-x-2">
      <Link href="/aptitude" className="hover:text-white flex items-center transition-colors">
        <Home className="w-4 h-4" />
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 text-zinc-600" />
          {item.href ? (
            <Link href={item.href} className="hover:text-white transition-colors truncate max-w-[200px]">
              {item.label}
            </Link>
          ) : (
            <span className="text-white font-medium truncate max-w-[200px]">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
