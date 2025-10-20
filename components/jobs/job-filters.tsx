"use client";

import { useSearchParams, useRouter } from "next/navigation";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export function JobFilters() {
  const t = useTranslations("jobs.filters");
  const searchParams = useSearchParams();
  const router = useRouter();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/jobs");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("title")}</CardTitle>
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Job Type */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">{t("jobType")}</Label>
          <div className="space-y-2">
            {["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"].map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type}`}
                  checked={searchParams.get("type") === type}
                  onCheckedChange={(checked) => updateFilter("type", checked ? type : "")}
                />
                <label htmlFor={`type-${type}`} className="cursor-pointer text-sm font-normal">
                  {t(`../jobTypes.${type}`)}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Remote Type */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">{t("remoteType")}</Label>
          <div className="space-y-2">
            {["FULLY_REMOTE", "HYBRID", "OCCASIONAL"].map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`remote-${type}`}
                  checked={searchParams.get("remoteType") === type}
                  onCheckedChange={(checked) => updateFilter("remoteType", checked ? type : "")}
                />
                <label htmlFor={`remote-${type}`} className="cursor-pointer text-sm font-normal">
                  {t(`../remoteTypes.${type}`)}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Source */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">{t("source")}</Label>
          <div className="space-y-2">
            {["V2EX", "ELEDUCK", "USER_POSTED"].map((source) => (
              <div key={source} className="flex items-center space-x-2">
                <Checkbox
                  id={`source-${source}`}
                  checked={searchParams.get("source") === source}
                  onCheckedChange={(checked) => updateFilter("source", checked ? source : "")}
                />
                <label htmlFor={`source-${source}`} className="cursor-pointer text-sm font-normal">
                  {t(`../sources.${source}`)}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Published Date */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">{t("publishedDate")}</Label>
          <div className="space-y-2">
            {["today", "week", "month", "all"].map((date) => (
              <div key={date} className="flex items-center space-x-2">
                <Checkbox
                  id={`date-${date}`}
                  checked={searchParams.get("publishedDate") === date}
                  onCheckedChange={(checked) => updateFilter("publishedDate", checked ? date : "")}
                />
                <label htmlFor={`date-${date}`} className="cursor-pointer text-sm font-normal">
                  {t(date)}
                </label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
