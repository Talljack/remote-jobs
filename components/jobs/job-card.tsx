"use client";

import { Bookmark, MapPin, Briefcase, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { formatRelativeTime, formatSalary } from "@/lib/utils";

interface JobCardProps {
  job: {
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
  };
}

export function JobCard({ job }: JobCardProps) {
  const t = useTranslations("jobs");

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-1 gap-4">
            {/* Company Logo */}
            {job.companyLogo && (
              <div className="flex-shrink-0">
                <img
                  src={job.companyLogo}
                  alt={job.companyName}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              </div>
            )}

            {/* Job Info */}
            <div className="min-w-0 flex-1">
              <Link href={`/jobs/${job.id}`}>
                <h3 className="hover:text-primary line-clamp-2 text-xl font-semibold transition-colors">
                  {job.title}
                </h3>
              </Link>
              <p className="text-muted-foreground mt-1">{job.companyName}</p>

              {/* Meta Info */}
              <div className="text-muted-foreground mt-3 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  <span>{t(`remoteTypes.${job.remoteType}`)}</span>
                </div>
                {job.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{job.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{formatRelativeTime(job.publishedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bookmark Button */}
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <Bookmark className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {job.tags.slice(0, 5).map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
            {job.tags.length > 5 && <Badge variant="secondary">+{job.tags.length - 5}</Badge>}
          </div>

          {/* Bottom Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline">{t(`jobTypes.${job.type}`)}</Badge>
              <span className="text-primary text-sm font-semibold">
                {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
              </span>
            </div>
            <Link href={`/jobs/${job.id}`}>
              <Button size="sm">{t("card.viewDetails")}</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
