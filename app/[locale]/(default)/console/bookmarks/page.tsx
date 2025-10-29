"use client";

import { useEffect, useState } from "react";

import { Bookmark } from "lucide-react";

import { JobCard } from "@/components/jobs/job-card";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

interface BookmarkedJob {
  bookmarkId: string;
  bookmarkedAt: string;
  id: string;
  title: string;
  companyName: string;
  companyLogo: string | null;
  type: string;
  remoteType: string;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  publishedAt: string | Date | null;
  source: string;
  tags: Array<{ id: string; name: string; slug: string }>;
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchBookmarks();
  }, [page]);

  const fetchBookmarks = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/bookmarks?page=${page}&limit=20`);
      const data = await res.json();

      if (data.success) {
        setBookmarks(data.data.bookmarks);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch bookmarks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="mb-6 flex gap-2">
          <Link href="/console">
            <Button variant="outline">My Jobs</Button>
          </Link>
          <Link href="/console/bookmarks">
            <Button variant="default">
              <Bookmark className="mr-2 h-4 w-4" />
              Bookmarks
            </Button>
          </Link>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Bookmarked Jobs</h1>
          <p className="text-muted-foreground">Your saved job opportunities</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="container py-8">
        <div className="mb-6 flex gap-2">
          <Link href="/console">
            <Button variant="outline">My Jobs</Button>
          </Link>
          <Link href="/console/bookmarks">
            <Button variant="default">
              <Bookmark className="mr-2 h-4 w-4" />
              Bookmarks
            </Button>
          </Link>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Bookmarked Jobs</h1>
          <p className="text-muted-foreground">Your saved job opportunities</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Bookmark className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-xl font-semibold">No bookmarks yet</h3>
          <p className="mb-6 text-muted-foreground">
            Start bookmarking jobs you're interested in to keep track of them here.
          </p>
          <Link href="/jobs">
            <Button>Browse Jobs</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-6 flex gap-2">
        <Link href="/console">
          <Button variant="outline">My Jobs</Button>
        </Link>
        <Link href="/console/bookmarks">
          <Button variant="default">
            <Bookmark className="mr-2 h-4 w-4" />
            Bookmarks
          </Button>
        </Link>
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Bookmarked Jobs</h1>
        <p className="text-muted-foreground">
          You have {bookmarks.length} saved job{bookmarks.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {bookmarks.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
