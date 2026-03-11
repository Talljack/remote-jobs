"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useSearchParams, useRouter } from "next/navigation";

import { Loader2, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { JobCard } from "./job-card";

interface Job {
  id: string;
  title: string;
  companyName: string;
  companyLogo: string | null;
  type: string;
  remoteType: string;
  location: string | null;
  description: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  publishedAt: string;
  source: string;
  tags: Array<{ id: string; name: string; slug: string }>;
}

export function JobList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  // Search state
  const currentKeyword = searchParams.get("q") || searchParams.get("keyword") || "";
  const [searchInput, setSearchInput] = useState(currentKeyword);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync search input when URL params change externally
  useEffect(() => {
    setSearchInput(currentKeyword);
  }, [currentKeyword]);

  const updateSearchParam = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
        params.delete("keyword");
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [searchParams, router]
  );

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      updateSearchParam(value);
    }, 400);
  };

  const clearSearch = () => {
    setSearchInput("");
    updateSearchParam("");
  };

  const fetchJobs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", page.toString());

      const url = `/api/jobs?${params.toString()}`;
      const response = await fetch(url);
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

  useEffect(() => {
    fetchJobs(1);
  }, [searchParams]);

  const loadMore = () => {
    if (pagination.page < pagination.totalPages) {
      fetchJobs(pagination.page + 1);
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t("search.placeholder")}
            className="pl-10 pr-10"
          />
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={t("search.placeholder")}
            className="pl-10 pr-10"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="py-20 text-center">
          <p className="text-lg font-medium text-muted-foreground">{t("list.noResults")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("list.noResultsHint")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t("search.placeholder")}
          className="pl-10 pr-10"
        />
        {searchInput && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("list.title", { count: pagination.total })}</h1>
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
                {t("list.loading")}
              </>
            ) : (
              t("list.loadMore")
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
