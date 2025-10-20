"use client";

import { useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { JobCard } from "./job-card";

interface Job {
  id: string;
  title: string;
  companyName: string;
  companyLogo: string | null;
  type: string;
  remoteType: string;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  publishedAt: string;
  source: string;
  tags: Array<{ id: string; name: string; slug: string }>;
}

export function JobList() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  useEffect(() => {
    fetchJobs();
  }, [searchParams]);

  const fetchJobs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());

      const response = await fetch(`/api/jobs?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        if (page === 1) {
          setJobs(data.data.jobs);
        } else {
          setJobs((prev) => [...prev, ...data.data.jobs]);
        }
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (pagination.page < pagination.totalPages) {
      fetchJobs(pagination.page + 1);
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">No jobs found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{pagination.total} Remote Jobs Found</h1>
      </div>

      <div className="grid gap-4">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {pagination.page < pagination.totalPages && (
        <div className="flex justify-center pt-6">
          <Button onClick={loadMore} disabled={loading} size="lg">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
