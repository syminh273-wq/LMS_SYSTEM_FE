'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsiblePanel,
  CollapsibleTrigger,
} from '@shared/components/ui/collapsible';
import { useTranslation } from '@shared/components/LocaleProvider';

type Props = {
  summary: ReactNode;
  details: ReactNode;
  defaultOpen?: boolean;
  forceOpen?: boolean;
  hideSummaryWhenOpen?: boolean;
};

export function CollapsibleItem({
  summary,
  details,
  defaultOpen = false,
  forceOpen = false,
  hideSummaryWhenOpen = false,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(defaultOpen || forceOpen);
  const expanded = open || forceOpen;
  const hasDetails = Boolean(details);

  if (!hasDetails) {
    return <div>{summary}</div>;
  }

  const showSummary = !hideSummaryWhenOpen || !expanded;

  return (
    <Collapsible open={expanded} onOpenChange={setOpen}>
      {showSummary && <div>{summary}</div>}
      <CollapsibleTrigger className="text-xs font-semibold text-primary-brand hover:text-primary-brand-dark hover:underline mt-1 inline-flex items-center gap-1 group/trigger">
        {expanded ? t('portfolio.me.show_less') : t('portfolio.me.show_all')}
        <ChevronDown
          className={`size-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <div className="mt-2">{details}</div>
      </CollapsiblePanel>
    </Collapsible>
  );
}
