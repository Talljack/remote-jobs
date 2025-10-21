"use client";

import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";

import { Job, JobTag } from "@/db/schema";

import { JobCard } from "./job-card";

type JobWithTags = Job & { tags: JobTag[] };

interface RelatedJobsProps {
  currentJobId: string;
  tags: string[];
}

export function RelatedJobs({ currentJobId, tags }: RelatedJobsProps) {
  const t = useTranslations("jobDetail");
  const [relatedJobs, setRelatedJobs] = useState<JobWithTags[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedJobs();
  }, [currentJobId]);

  const fetchRelatedJobs = async () => {
    try {
      // Fetch jobs with similar tags
      const response = await fetch(`/api/jobs?tags=${tags.slice(0, 3).join(",")}&limit=3`);
      const data = await response.json();

      if (data.success) {
        // Filter out current job
        const filtered = data.data.jobs.filter((job: JobWithTags) => job.id !== currentJobId);
        setRelatedJobs(filtered.slice(0, 3));
      }
    } catch (error) {
      console.error("Error fetching related jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || relatedJobs.length === 0) {
    return null;
  }

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-6 text-2xl font-bold">{t("relatedJobs")}</h2>
        <div className="grid gap-4">
          {relatedJobs.map((job: JobWithTags) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </div>
  );
}
