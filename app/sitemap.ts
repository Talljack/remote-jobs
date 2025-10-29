import { eq } from "drizzle-orm";
import { MetadataRoute } from "next";

import { db, jobs } from "@/db";

// Force dynamic rendering to avoid database connection issues during build
export const dynamic = "force-dynamic";
export const revalidate = 3600; // Revalidate every hour

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

  try {
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
  } catch (error) {
    // If database is unavailable (e.g., during CI build), return only static pages
    console.error("Failed to fetch jobs for sitemap:", error);
    return staticPages;
  }
}
