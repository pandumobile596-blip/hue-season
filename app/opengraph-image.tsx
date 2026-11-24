import { ImageResponse } from "next/og";
import { site } from "@/config/site";
import { seasonPalettes } from "@/content/palettes";
import { OG_SIZE, OgLayout } from "@/lib/og";

export const alt = `${site.name} — find your color season in 30 seconds`;
export const size = OG_SIZE;
export const contentType = "image/png";

// One signature color from each season makes a 12-color mosaic.
const mosaic = seasonPalettes.map((s) => s.palette[1]);

export default async function Image() {
  return new ImageResponse(
    <OgLayout eyebrow="Free AI color analysis" title={site.headline} subtitle="Free. Your photo never leaves your phone." colors={mosaic} />,
    { ...size },
  );
}
