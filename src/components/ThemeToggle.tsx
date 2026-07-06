'use client';

import { Moon, Sun } from 'lucide-react';

const THEME_STORAGE_KEY = 'theme';

export function ThemeToggle() {
  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  };

  return (
    <button
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-foreground/20 bg-background/80 text-foreground transition hover:bg-foreground/10"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <Sun className="theme-toggle-sun h-5 w-5" />
      <Moon className="theme-toggle-moon h-5 w-5" />
    </button>
  );
}
