"use client";

import Image from "next/image";
import { useState } from "react";
import { STYLE_PACKS } from "@/lib/style-packs";
import type { StylePack } from "@/lib/types";

interface StylePackPickerProps {
  value: StylePack;
  onChange: (style: StylePack) => void;
  id?: string;
}

function StyleSampleThumb({
  sample,
  label,
}: {
  sample?: string;
  label: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!sample || failed) {
    return (
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-elevated text-[10px] text-muted"
        aria-hidden
      >
        ···
      </div>
    );
  }

  return (
    <Image
      src={sample}
      alt={label}
      width={40}
      height={40}
      className="h-10 w-10 shrink-0 rounded-lg object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export function StylePackPicker({ value, onChange, id }: StylePackPickerProps) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-white">Style pack</span>
      <div
        id={id}
        role="listbox"
        aria-label="Style pack"
        className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-border bg-surface p-1"
      >
        {STYLE_PACKS.map((pack) => {
          const selected = value === pack.id;
          return (
            <button
              key={pack.id}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onChange(pack.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                selected
                  ? "bg-accent/20 ring-1 ring-accent/40"
                  : "hover:bg-surface-elevated"
              }`}
            >
              <StyleSampleThumb sample={pack.sample} label={pack.label} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-white">
                  {pack.label}
                </span>
                <span className="block truncate text-xs text-muted">
                  {pack.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
