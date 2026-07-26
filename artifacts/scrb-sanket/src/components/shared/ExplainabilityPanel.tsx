import React from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, Sparkles, Info } from 'lucide-react';

export interface ExplainabilityFactor {
  /** Short label, e.g. "Incident Volume" */
  label: string;
  /** 0-100 normalized contribution used for the bar */
  value: number;
  /** Human-readable detail, e.g. "18 incidents (raw)" */
  detail: string;
}

interface ExplainabilityPanelProps {
  factors: ExplainabilityFactor[];
  /** Optional one-line summary rendered above the factor bars */
  summary?: string;
  className?: string;
}

/**
 * Small "why is this flagged?" disclosure panel used next to AI-derived
 * scores (hotspot intensity, early-warning severity, etc). Factors are
 * always computed client-side from the same data already shown to the
 * user — this is a transparency aid, not a black-box confidence score.
 */
export function ExplainabilityPanel({ factors, summary, className = '' }: ExplainabilityPanelProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={className}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wider text-secondary hover:text-secondary/80 transition-colors py-1"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            Why is this flagged?
          </span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-2.5 border-t border-border/50 pt-2.5">
          {summary && (
            <p className="text-[11px] text-muted-foreground leading-snug">{summary}</p>
          )}
          {factors.map((factor) => (
            <div key={factor.label} className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-medium text-foreground/80">{factor.label}</span>
                <span className="font-mono text-muted-foreground">{factor.detail}</span>
              </div>
              <Progress value={Math.max(0, Math.min(100, factor.value))} className="h-1.5" />
            </div>
          ))}
          <p className="flex items-start gap-1.5 text-[10px] text-muted-foreground/70 pt-1">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            Simplified heuristic breakdown for demo purposes — not a certified risk score.
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
