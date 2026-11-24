import type { NamedColor } from "@/content/palettes";
import { cn } from "@/lib/cn";

/** A color chip with its name as text (never color-only). */
export function Swatch({
  color,
  size = "md",
  className,
}: {
  color: NamedColor;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const chip = { sm: "size-9", md: "size-12", lg: "size-16" }[size];
  return (
    <figure className={cn("flex flex-col items-center gap-1.5 text-center", className)}>
      <span
        aria-hidden="true"
        className={cn(chip, "rounded-soft ring-1 ring-black/5 shadow-soft")}
        style={{ backgroundColor: color.hex }}
      />
      <figcaption className="text-xs leading-tight text-ink-soft">{color.name}</figcaption>
    </figure>
  );
}

/** Decorative strip of colors (aria-hidden) — pair it with visible text names. */
export function ColorStrip({ colors, className }: { colors: NamedColor[]; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex overflow-hidden rounded-soft ring-1 ring-black/5", className)}>
      {colors.map((col) => (
        <span key={col.hex + col.name} className="h-full flex-1" style={{ backgroundColor: col.hex }} />
      ))}
    </div>
  );
}
