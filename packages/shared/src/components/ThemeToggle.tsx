'use client';

import * as React from 'react';
import { Button } from './ui/button';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      onClick={(e) => toggleTheme(e)}
      variant="ghost"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`flex items-center justify-center w-9 h-9 rounded-lg bg-transparent! hover:bg-transparent! active:bg-transparent! focus-visible:bg-transparent! focus-visible:ring-0! shadow-none text-muted-foreground ${className}`}
    >
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}
