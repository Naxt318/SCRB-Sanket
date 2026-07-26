import React from 'react';
import { Database, Clock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

interface ProvenanceBadgeProps {
  /** Where the data came from, e.g. "Synthetic FIR Dataset" */
  source: string;
  /** When the underlying data was generated / fetched */
  timestamp?: Date | string;
  /** Marks the record as synthetic/demo data (always true in this build) */
  synthetic?: boolean;
  className?: string;
}

/**
 * Small badge that discloses where a piece of data came from and when it
 * was produced. Used to reinforce that everything shown is synthetic
 * demo data, never real case records.
 */
export function ProvenanceBadge({ source, timestamp, synthetic = true, className = '' }: ProvenanceBadgeProps) {
  const time = timestamp ? new Date(timestamp) : undefined;
  const timeLabel = time
    ? time.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : undefined;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1 rounded-sm border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wide text-muted-foreground cursor-default ${className}`}
          >
            <Database className="w-2.5 h-2.5" />
            {synthetic ? 'Synthetic' : 'Live'}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[220px]">
          <div className="font-semibold mb-0.5">{source}</div>
          {timeLabel && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              As of {timeLabel}
            </div>
          )}
          {synthetic && (
            <div className="text-muted-foreground mt-1">No real case records. Demo/evaluation data only.</div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
