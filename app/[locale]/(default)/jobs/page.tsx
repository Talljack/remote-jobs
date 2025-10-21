import { Suspense } from "react";

import { JobFilters } from "@/components/jobs/job-filters";
import { JobList } from "@/components/jobs/job-list";
import { JobListSkeleton } from "@/components/jobs/job-list-skeleton";

export default function JobsPage() {
  return (
    <div className="container py-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Filters Sidebar */}
        <aside className="flex-shrink-0 lg:w-64">
          <div className="sticky top-20">
            <JobFilters />
          </div>
        </aside>

        {/* Job List */}
        <div className="flex-1">
          <Suspense fallback={<JobListSkeleton />}>
            <JobList />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
