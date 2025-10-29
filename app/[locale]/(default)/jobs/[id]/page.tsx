import { notFound } from "next/navigation";

import { JobDetailContent } from "@/components/jobs/job-detail-content";
import { RelatedJobs } from "@/components/jobs/related-jobs";
import { JobTag } from "@/db/schema";
import { stripHtml } from "@/lib/utils";

async function getJob(id: string) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/jobs/${id}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.success ? data.data : null;
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
