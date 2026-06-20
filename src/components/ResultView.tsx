"use client";

interface ResultViewProps {
  imageUrl: string;
  styleLabel: string;
  onReset: () => void;
}

export function ResultView({ imageUrl, styleLabel, onReset }: ResultViewProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `ink-n-motion-${styleLabel.toLowerCase().replace(/\s+/g, "-")}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(imageUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <section className="px-4 pb-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-accent">
            Result
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Your comic still is ready
          </h2>
          <p className="mt-2 text-sm text-muted">
            Rendered in {styleLabel} style
          </p>
        </div>

        <div className="glass-panel overflow-hidden rounded-3xl p-3">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={`Comic render in ${styleLabel} style`}
              className="w-full object-contain"
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleDownload}
              className="btn-primary flex-1 rounded-xl px-6 py-3.5 text-sm font-semibold text-white"
            >
              Download
            </button>
            <button
              type="button"
              onClick={onReset}
              className="btn-secondary flex-1 rounded-xl px-6 py-3.5 text-sm font-medium text-white"
            >
              Create another
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
