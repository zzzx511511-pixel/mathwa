import type { MetadataRoute } from "next";
import { completedProjects } from "@/lib/site/completed-projects";

export default function sitemap(): MetadataRoute.Sitemap {
  const projectPages: MetadataRoute.Sitemap = completedProjects.map((p) => ({
    url: `/projects/${p.slug}`,
    changeFrequency: "monthly",
    priority: 0.75
  }));

  return [
    { url: "/", changeFrequency: "weekly", priority: 1 },
    { url: "/projects", changeFrequency: "weekly", priority: 0.85 },
    { url: "/offers", changeFrequency: "daily", priority: 0.9 },
    { url: "/services", changeFrequency: "monthly", priority: 0.7 },
    { url: "/board", changeFrequency: "monthly", priority: 0.6 },
    { url: "/login", changeFrequency: "monthly", priority: 0.3 },
    ...projectPages
  ];
}

