import type { MetadataRoute } from "next";
import { site } from "@/config/site";

/** /robots.txt */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/result"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
