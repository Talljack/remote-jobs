import { notFound } from "next/navigation";

import { eq } from "drizzle-orm";

import { JobDetailContent } from "@/components/jobs/job-detail-content";
import { RelatedJobs } from "@/components/jobs/related-jobs";
import { db, jobs, jobTags, jobTagRelations } from "@/db";
import { JobTag } from "@/db/schema";
import { stripHtml } from "@/lib/utils";

async function getJob(id: string) {
  try {
    // Fetch job directly from database
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id)).limit(1);

    if (!job) {
      return null;
    }

    // Increment views
    await db
      .update(jobs)
      .set({ views: job.views + 1 })
      .where(eq(jobs.id, id));

    // Fetch tags
    const tags = await db
      .select({ tag: jobTags })
      .from(jobTagRelations)
      .innerJoin(jobTags, eq(jobTagRelations.tagId, jobTags.id))
      .where(eq(jobTagRelations.jobId, id));

    return {
      ...job,
      views: job.views + 1,
      tags: tags.map((t) => t.tag),
    };
  } catch (error) {
    console.error("Error fetching job:", error);
    return null;
  }
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    notFound();
  }

  // Generate JSON-LD structured data
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.publishedAt,
    hiringOrganization: {
      "@type": "Organization",
      name: job.companyName,
      logo: job.companyLogo || undefined,
      sameAs: job.companyWebsite || undefined,
    },
    jobLocation: job.location
      ? {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: job.location,
          },
        }
      : undefined,
    employmentType: job.type,
    baseSalary:
      job.salaryMin && job.salaryMax
        ? {
            "@type": "MonetaryAmount",
            currency: job.salaryCurrency || "USD",
            value: {
              "@type": "QuantitativeValue",
              minValue: job.salaryMin,
              maxValue: job.salaryMax,
              unitText: "YEAR",
            },
          }
        : undefined,
    jobLocationType: job.remoteType === "FULLY_REMOTE" ? "TELECOMMUTE" : undefined,
    applicantLocationRequirements: job.location
      ? {
          "@type": "Country",
          name: job.location,
        }
      : undefined,
    identifier: {
      "@type": "PropertyValue",
      name: job.source,
      value: job.id,
    },
    url: `${baseUrl}/jobs/${job.id}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container py-8">
        <JobDetailContent job={job} />
        <RelatedJobs currentJobId={id} tags={job.tags.map((t: JobTag) => t.id)} />
      </div>
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    return {
      title: "Job Not Found",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const cleanDescription = stripHtml(job.description).slice(0, 160);

  return {
    title: `${job.title} at ${job.companyName} | RemoteJobs`,
    description: cleanDescription,
    keywords: "remote jobs,work from home,remote work,freelance,digital nomad",
    openGraph: {
      title: `${job.title} at ${job.companyName}`,
      description: cleanDescription,
      url: `${baseUrl}/jobs/${job.id}`,
      siteName: "RemoteJobs",
      images: job.companyLogo
        ? [
            {
              url: job.companyLogo,
              width: 800,
              height: 600,
              alt: job.companyName,
            },
          ]
        : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${job.title} at ${job.companyName}`,
      description: cleanDescription,
      images: job.companyLogo ? [job.companyLogo] : [],
    },
  };
}
