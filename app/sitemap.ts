import { eq } from "drizzle-orm";
import { MetadataRoute } from "next";

import { db, jobs } from "@/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://remotejobs.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/jobs`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/stats`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  // Get all published jobs
  const publishedJobs = await db
    .select({
      id: jobs.id,
      updatedAt: jobs.updatedAt,
    })
    .from(jobs)
    .where(eq(jobs.status, "PUBLISHED"));

  // Job detail pages
  const jobPages: MetadataRoute.Sitemap = publishedJobs.map((job) => ({
    url: `${baseUrl}/jobs/${job.id}`,
    lastModified: job.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...jobPages];
}
