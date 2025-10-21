"use client";

import { Bookmark, MapPin, Briefcase, Clock, Eye, ExternalLink, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Job, JobTag } from "@/db/schema";
import { formatRelativeTime, formatSalary } from "@/lib/utils";

interface JobDetailContentProps {
  job: Job & { tags: JobTag[] };
}

export function JobDetailContent({ job }: JobDetailContentProps) {
  const t = useTranslations("jobDetail");

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job.title,
        text: `${job.title} at ${job.companyName}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleApply = () => {
    if (job.applyMethod.startsWith("http")) {
      window.open(job.applyMethod, "_blank");
    } else {
      window.location.href = `mailto:${job.applyMethod}`;
    }
  };

  return (
    <div className="container py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-1 gap-4">
                {job.companyLogo && (
                  <img
                    src={job.companyLogo}
                    alt={job.companyName}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <h1 className="mb-2 text-3xl font-bold">{job.title}</h1>
                  <p className="mb-4 text-xl text-muted-foreground">{job.companyName}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span>{useTranslations("jobs")(`remoteTypes.${job.remoteType}`)}</span>
                    </div>
                    {job.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                      </div>
                    )}
                    {job.publishedAt && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatRelativeTime(job.publishedAt)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>
                        {job.views} {t("views")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-shrink-0 gap-2">
                <Button variant="outline" size="icon" onClick={handleShare}>
                  <Share2 className="h-5 w-5" />
                </Button>
                <Button variant="outline" size="icon">
                  <Bookmark className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex gap-2">
                <Badge>{useTranslations("jobs")(`jobTypes.${job.type}`)}</Badge>
                <Badge variant="outline">{useTranslations("jobs")(`sources.${job.source}`)}</Badge>
              </div>
              <div className="text-lg font-semibold text-primary">
                {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency || "USD")}
              </div>
              <Button size="lg" className="ml-auto" onClick={handleApply}>
                {t("../jobs.card.apply")}
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Skills/Tags */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              {job.tags.map((tag: JobTag) => (
                <Badge key={tag.id} variant="secondary" className="text-sm">
                  {tag.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Job Description */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">{t("description")}</h2>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown>{job.description}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        {job.requirements && (
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-semibold">{t("requirements")}</h2>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown>{job.requirements}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* How to Apply */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold">{t("howToApply")}</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                {job.applyMethod.startsWith("http")
                  ? "Click the button below to apply:"
                  : "Send your application to:"}
              </p>
              <div className="flex gap-2">
                <Button size="lg" onClick={handleApply} className="w-full sm:w-auto">
                  {job.applyMethod.startsWith("http") ? "Apply Now" : "Send Email"}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
                {job.companyWebsite && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => job.companyWebsite && window.open(job.companyWebsite, "_blank")}
                  >
                    {t("companyWebsite")}
                  </Button>
                )}
              </div>
              {job.sourceUrl && (
                <p className="text-sm text-muted-foreground">
                  Original post:{" "}
                  <a
                    href={job.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View on {job.source}
                  </a>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
