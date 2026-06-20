"use client";

export type TattooRenderMode = "on-skin" | "isolate";

interface TattooRenderModeToggleProps {
  value: TattooRenderMode;
  onChange: (value: TattooRenderMode) => void;
  id?: string;
}

export function tattooRenderModeToIsolate(mode: TattooRenderMode): boolean {
  return mode === "isolate";
}

export function TattooRenderModeToggle({
  value,
  onChange,
  id = "tattoo-render-mode",
}: TattooRenderModeToggleProps) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-white">Render mode</span>
      <div
        id={id}
        role="radiogroup"
        aria-label="Tattoo render mode"
        className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-surface p-1"
      >
        <button
          type="button"
          role="radio"
          aria-checked={value === "on-skin"}
          onClick={() => onChange("on-skin")}
          className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            value === "on-skin"
              ? "bg-accent text-white shadow-sm"
              : "text-muted hover:text-white"
          }`}
        >
          Keep on skin
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={value === "isolate"}
          onClick={() => onChange("isolate")}
          className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            value === "isolate"
              ? "bg-accent text-white shadow-sm"
              : "text-muted hover:text-white"
          }`}
        >
          Isolate tattoo
        </button>
      </div>
      <p className="text-xs text-muted">
        {value === "on-skin"
          ? "Stylize the full photo — tattoo, skin, and background."
          : "Remove skin and background first, then stylize the tattoo on a clean canvas."}
      </p>
    </div>
  );
}
