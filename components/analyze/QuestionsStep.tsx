"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { Jewelry, UserAnswers } from "@/lib/analysis/dimensions";
import { cn } from "@/lib/cn";

interface Option<T> {
  value: T;
  label: string;
}

function Choice<T extends string | boolean>({
  legend,
  hint,
  options,
  value,
  onChange,
}: {
  legend: string;
  hint: string;
  options: Option<T>[];
  value: T | undefined;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="rounded-card bg-surface p-5 text-left ring-1 ring-line">
      <legend className="sr-only">{legend}</legend>
      <p aria-hidden="true" className="font-serif text-xl font-medium">
        {legend}
      </p>
      <p className="mt-1 text-sm text-muted">{hint}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <button
              key={String(o.value)}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={cn(
                "min-h-12 rounded-full px-5 text-[0.95rem] font-medium ring-1 transition-colors",
                active ? "bg-accent text-white ring-accent" : "bg-cream text-ink ring-line hover:ring-accent/50",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Two optional one-tap questions that refine close calls. */
export function QuestionsStep({
  hairDetected,
  onDone,
}: {
  hairDetected: boolean;
  onDone: (answers: UserAnswers) => void;
}) {
  const [naturalHair, setNaturalHair] = useState<boolean | undefined>(undefined);
  const [jewelry, setJewelry] = useState<Jewelry | undefined>(undefined);

  return (
    <div className="text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-ink">Almost there</p>
      <h1 className="mt-3 text-3xl leading-tight font-medium sm:text-4xl">Two quick questions</h1>
      <p className="mt-2 text-ink-soft">Optional — they help with close calls.</p>
      <div className="mt-7 space-y-4">
        {hairDetected && (
          <Choice
            legend="Is your hair its natural color?"
            hint="Dyed hair can confuse the AI, so we'll leave it out."
            options={[
              { value: true, label: "Yes, natural" },
              { value: false, label: "No, it's dyed" },
            ]}
            value={naturalHair}
            onChange={setNaturalHair}
          />
        )}
        <Choice
          legend="Which jewelry looks better on you?"
          hint="Go with your gut — or skip if you're not sure."
          options={[
            { value: "gold", label: "Gold" },
            { value: "silver", label: "Silver" },
            { value: "both", label: "Both / not sure" },
          ]}
          value={jewelry}
          onChange={setJewelry}
        />
      </div>
      <div className="mt-7 flex flex-col items-center gap-2">
        <Button size="lg" className="w-full max-w-xs" onClick={() => onDone({ naturalHair, jewelry })}>
          Reveal my season
        </Button>
        <button type="button" onClick={() => onDone({})} className="min-h-12 text-ink-soft underline underline-offset-4 hover:text-ink">
          Skip
        </button>
      </div>
    </div>
  );
}
