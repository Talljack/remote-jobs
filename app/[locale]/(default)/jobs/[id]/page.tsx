import { notFound } from "next/navigation";

import { JobDetailContent } from "@/components/jobs/job-detail-content";
import { RelatedJobs } from "@/components/jobs/related-jobs";
import { JobTag } from "@/db/schema";

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

  return (
    <div className="container py-8">
      <JobDetailContent job={job} />
      <RelatedJobs currentJobId={id} tags={job.tags.map((t: JobTag) => t.id)} />
    </div>
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

  return {
    title: `${job.title} at ${job.companyName} | RemoteJobs`,
    description: job.description.slice(0, 160),
  };
}
