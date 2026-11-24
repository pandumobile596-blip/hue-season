import { ImageResponse } from "next/og";
import { getSeasonPalette, seasonPalettes } from "@/content/palettes";
import { OG_SIZE, OgLayout } from "@/lib/og";

export const alt = "Season color palette";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return seasonPalettes.map((s) => ({ slug: s.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = getSeasonPalette(slug) ?? seasonPalettes[0];
  return new ImageResponse(
    <OgLayout eyebrow="Color season guide" title={s.name} subtitle={s.summary} colors={s.palette} />,
    { ...size },
  );
}
