'use client';

import * as React from 'react';
import { Button } from './ui/button';
import { Languages } from 'lucide-react';
import { useTranslation, type Locale } from './LocaleProvider';
import { cn } from '@shared/lib/utils';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'segmented' | 'compact';
  label?: string;
}

export function LanguageSwitcher({
  className,
  variant = 'segmented',
  label,
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useTranslation();
  const locales: Locale[] = ['en', 'vi'];

  return (
    <div
      className={cn('inline-flex items-center gap-2', className)}
      role="group"
      aria-label={t('layout.language_switcher.aria_label', 'Language switcher')}
    >
      {label !== undefined && (
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      )}
      <div
        className={cn(
          'inline-flex items-center rounded-xl bg-muted p-1',
          variant === 'compact' && 'p-0.5'
        )}
      >
        {locales.map((loc) => {
          const isActive = loc === locale;
          return (
            <Button
              key={loc}
              type="button"
              onClick={() => setLocale(loc)}
              aria-pressed={isActive}
              lang={loc}
              variant="ghost"
              data-active={isActive}
              className={cn(
                'inline-flex items-center justify-center rounded-lg font-bold uppercase tracking-widest text-muted-foreground! hover:text-foreground! aria-pressed:!text-foreground aria-pressed:font-semibold bg-transparent! hover:bg-transparent! active:bg-transparent! focus-visible:bg-transparent! focus-visible:ring-0! shadow-none aria-pressed:bg-background! aria-pressed:shadow-sm',
                variant === 'segmented'
                  ? 'min-w-[56px] h-9 px-3 text-xs gap-1.5'
                  : 'min-w-[40px] h-8 px-2 text-[10px]',
              )}
            >
              {variant === 'segmented' && <Languages size={12} className="opacity-60" />}
              {loc}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
