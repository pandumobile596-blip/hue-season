import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { seasonPalettes } from "@/content/palettes";

/** /sitemap.xml — every public page. (/result is personal and excluded.) */
export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly") => ({
    url: `${site.url}${path}`,
    changeFrequency,
    priority,
  });
  return [
    page("", 1, "weekly"),
    page("/analyze", 0.9, "monthly"),
    page("/seasons", 0.9, "monthly"),
    ...seasonPalettes.map((s) => page(`/seasons/${s.slug}`, 0.8, "monthly")),
    page("/about", 0.4, "yearly"),
    page("/privacy", 0.3, "yearly"),
  ];
}
