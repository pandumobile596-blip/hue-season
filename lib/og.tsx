/**
 * Shared Open Graph image layout (rendered at build time by next/og).
 * Note: every <div> with more than one child needs `display: flex` (Satori rule).
 */
import { site } from "@/config/site";
import type { NamedColor } from "@/content/palettes";

export const OG_SIZE = { width: 1200, height: 630 };

export function OgLayout({
  eyebrow,
  title,
  subtitle,
  colors,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  colors: NamedColor[];
}) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#fbf7f2", padding: 64, gap: 56 }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
        <div style={{ display: "flex", fontSize: 30, color: "#2b2623", fontWeight: 600 }}>{site.name}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, color: "#7d3a32", fontWeight: 600 }}>
            {eyebrow.toUpperCase()}
          </div>
          <div style={{ display: "flex", fontSize: title.length > 14 ? 76 : 92, color: "#2b2623", lineHeight: 1.05, marginTop: 12 }}>
            {title}
          </div>
          <div style={{ display: "flex", fontSize: 32, color: "#4a423d", marginTop: 20, lineHeight: 1.3 }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: "#6b625b" }}>
          Free AI color analysis · your photo never leaves your phone
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", width: 420, gap: 12, alignContent: "center" }}>
        {colors.slice(0, 12).map((c) => (
          <div key={c.hex + c.name} style={{ display: "flex", width: 128, height: 128, borderRadius: 24, background: c.hex }} />
        ))}
      </div>
    </div>
  );
}
