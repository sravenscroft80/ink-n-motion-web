interface GenerationProgressProps {
  label: string;
}

/**
 * Indeterminate progress indicator shown while a render is in flight.
 * Pure visual — no timers or logic tied to real progress.
 */
export function GenerationProgress({ label }: GenerationProgressProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="space-y-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3"
    >
      <div className="flex items-center gap-2 text-sm text-white">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        <span>{label}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/3 animate-[progressSlide_1.4s_ease-in-out_infinite] rounded-full bg-accent" />
      </div>
      <p className="text-xs text-muted">
        This can take a little while — please keep this tab open.
      </p>
    </div>
  );
}
