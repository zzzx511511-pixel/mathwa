import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/employee", "/tenant", "/owner", "/finance", "/auth"]
      }
    ],
    sitemap: "/sitemap.xml"
  };
}

