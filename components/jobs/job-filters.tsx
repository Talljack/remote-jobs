"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useSearchParams, useRouter } from "next/navigation";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface SourceCount {
  source: string;
  count: number;
}

interface CategoryChild {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  count: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  count: number;
  children: CategoryChild[];
}

export function JobFilters() {
  const t = useTranslations("jobs.filters");
  const tJobTypes = useTranslations("jobs.jobTypes");
  const tRemoteTypes = useTranslations("jobs.remoteTypes");
  const tSources = useTranslations("jobs.sources");
  const tCategories = useTranslations("jobs.categories");
  const searchParams = useSearchParams();
  const router = useRouter();

  const [availableSources, setAvailableSources] = useState<SourceCount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Helper function to get translated category name
  const getCategoryName = (slug: string, fallbackName: string) => {
    try {
      // Replace dots with underscores for translation keys
      const translationKey = slug.replace(/\./g, "_");
      return tCategories(translationKey);
    } catch {
      return fallbackName;
    }
  };

  const selectedTypes = useMemo(() => searchParams.getAll("type"), [searchParams]);
  const selectedRemoteTypes = useMemo(() => searchParams.getAll("remoteType"), [searchParams]);
  const selectedSources = useMemo(() => searchParams.getAll("source"), [searchParams]);
  const selectedCategories = useMemo(() => searchParams.getAll("category"), [searchParams]);

  const filtersKey = useMemo(() => {
    const sortedEntries = Array.from(searchParams.entries()).sort((a, b) => {
      if (a[0] === b[0]) {
        return a[1].localeCompare(b[1]);
      }
      return a[0].localeCompare(b[0]);
    });
    return new URLSearchParams(sortedEntries).toString();
  }, [searchParams]);

  const lastFiltersKeyRef = useRef<string | null>(null);

  // Debug: Log state changes
  useEffect(() => {
    console.log("[JobFilters] availableSources updated:", availableSources);
  }, [availableSources]);

  useEffect(() => {
    console.log("[JobFilters] categories updated:", categories);
  }, [categories]);

  // Fetch available sources and categories whenever filters change
  useEffect(() => {
    if (lastFiltersKeyRef.current === filtersKey) {
      return;
    }
    lastFiltersKeyRef.current = filtersKey;

    const controller = new AbortController();

    const fetchFilters = async () => {
      const baseParams = new URLSearchParams(filtersKey);
      baseParams.delete("page");

      const categoryParams = new URLSearchParams(baseParams.toString());
      categoryParams.delete("category");

      const sourceParams = new URLSearchParams(baseParams.toString());
      sourceParams.delete("source");

      try {
        const [sourcesRes, categoriesRes] = await Promise.all([
          fetch(
            `/api/jobs/sources${sourceParams.toString() ? `?${sourceParams.toString()}` : ""}`,
            { signal: controller.signal }
          ),
          fetch(
            `/api/jobs/categories${categoryParams.toString() ? `?${categoryParams.toString()}` : ""}`,
            { signal: controller.signal }
          ),
        ]);

        if (sourcesRes.ok) {
          const sourcesJson = await sourcesRes.json();
          if (sourcesJson.success) {
            const fetchedSources: SourceCount[] = sourcesJson.data;
            const mergedSourcesMap = new Map<string, SourceCount>();
            fetchedSources.forEach((item: SourceCount) => {
              mergedSourcesMap.set(item.source, item);
            });
            selectedSources.forEach((source) => {
              if (!mergedSourcesMap.has(source)) {
                mergedSourcesMap.set(source, { source, count: 0 });
              }
            });
            const sources = Array.from(mergedSourcesMap.values());
            console.log("Setting availableSources:", sources);
            setAvailableSources(sources);
          }
        }

        if (categoriesRes.ok) {
          const categoriesJson = await categoriesRes.json();
          if (categoriesJson.success) {
            const fetchedCategories: Category[] = categoriesJson.data;
            console.log("Setting categories:", fetchedCategories);
            setCategories(fetchedCategories);

            const autoExpanded = new Set<string>();
            fetchedCategories.forEach((cat) => {
              if (cat.children.some((child) => child.count > 0)) {
                autoExpanded.add(cat.id);
              }
            });

            setExpandedCategories((prev) => {
              if (prev.size === 0) {
                return autoExpanded;
              }
              const next = new Set(prev);
              autoExpanded.forEach((id) => next.add(id));
              return next;
            });
          }
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        console.error("Failed to fetch filters:", error);
      }
    };

    fetchFilters();

    return () => controller.abort();
  }, [filtersKey, selectedSources]);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const toggleMultiValue = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentValues = new Set(params.getAll(key));

    if (currentValues.has(value)) {
      currentValues.delete(value);
    } else {
      currentValues.add(value);
    }

    params.delete(key);
    currentValues.forEach((entry) => {
      if (entry) {
        params.append(key, entry);
      }
    });

    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/jobs");
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleAllCategories = () => {
    if (expandedCategories.size === categories.length) {
      // All expanded, collapse all
      setExpandedCategories(new Set());
    } else {
      // Some or none expanded, expand all
      setExpandedCategories(new Set(categories.map((c) => c.id)));
    }
  };

  return (
    <Card className="flex max-h-[calc(100vh-6rem)] flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0 flex-row items-center justify-between">
        <CardTitle>{t("title")}</CardTitle>
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          Clear
        </Button>
      </CardHeader>
      <CardContent className="flex-1 space-y-6 overflow-y-auto pb-4">
        {/* Job Type */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">{t("jobType")}</Label>
          <div className="space-y-2">
            {["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"].map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type}`}
                  checked={selectedTypes.includes(type)}
                  onCheckedChange={() => toggleMultiValue("type", type)}
                />
                <label htmlFor={`type-${type}`} className="cursor-pointer text-sm font-normal">
                  {tJobTypes(type)}
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
                  checked={selectedRemoteTypes.includes(type)}
                  onCheckedChange={() => toggleMultiValue("remoteType", type)}
                />
                <label htmlFor={`remote-${type}`} className="cursor-pointer text-sm font-normal">
                  {tRemoteTypes(type)}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-base font-semibold">{t("category")}</Label>
            {categories.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAllCategories}
                className="h-7 shrink-0 px-3 text-xs font-medium"
              >
                {expandedCategories.size === categories.length ? t("collapseAll") : t("expandAll")}
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id}>
                {/* Parent Category */}
                <div className="flex items-center justify-between">
                  <button
                    className="flex items-center space-x-1 text-sm font-medium hover:text-primary"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <span className="text-xs">
                      {expandedCategories.has(category.id) ? "▼" : "▶"}
                    </span>
                    <span>{getCategoryName(category.slug, category.name)}</span>
                    <span className="text-xs text-muted-foreground">({category.count})</span>
                  </button>
                </div>

                {/* Child Categories */}
                {expandedCategories.has(category.id) && (
                  <div className="ml-4 mt-2 space-y-2">
                    {category.children
                      .filter((child) => child.count > 0 || selectedCategories.includes(child.id))
                      .map((child) => (
                        <div key={child.id} className="flex items-center justify-between space-x-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-${child.id}`}
                              checked={selectedCategories.includes(child.id)}
                              onCheckedChange={() => toggleMultiValue("category", child.id)}
                            />
                            <label
                              htmlFor={`category-${child.id}`}
                              className="cursor-pointer text-sm font-normal"
                            >
                              {getCategoryName(child.slug, child.name)}
                            </label>
                          </div>
                          <span className="text-xs text-muted-foreground">({child.count})</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Source */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">{t("source")}</Label>
          <div className="space-y-2">
            {availableSources.map(({ source, count }) => (
              <div key={source} className="flex items-center justify-between space-x-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`source-${source}`}
                    checked={selectedSources.includes(source)}
                    onCheckedChange={() => toggleMultiValue("source", source)}
                  />
                  <label
                    htmlFor={`source-${source}`}
                    className="cursor-pointer text-sm font-normal"
                  >
                    {tSources(source)}
                  </label>
                </div>
                <span className="text-xs text-muted-foreground">({count})</span>
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
