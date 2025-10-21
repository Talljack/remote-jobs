"use client";

import { useState } from "react";

import { ArrowRight, Search, Sparkles, TrendingUp, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";

import HeroBg from "./hero-bg";

export function Hero() {
  const t = useTranslations("home.hero");
  const tStats = useTranslations("home.stats");
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/jobs?q=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push("/jobs");
    }
  };

  const title = t("title");
  const highlightWord = "Dream";
  const titleParts = title.split(highlightWord);

  return (
    <>
      <HeroBg />
      <section className="relative overflow-hidden py-20 md:py-28 lg:py-36">
        <div className="container">
          <div className="text-center">
            {/* Announcement Badge */}
            <Link
              href={t("announcement.url")}
              className="border-border bg-background/50 hover:bg-accent/50 mx-auto mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm backdrop-blur-sm transition-all hover:shadow-md"
            >
              <Badge variant="default" className="rounded-full px-2 py-0.5 text-xs">
                {t("announcement.label")}
              </Badge>
              <span className="text-muted-foreground text-sm">{t("announcement.title")}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            {/* Main Title with Gradient Highlight */}
            <h1 className="mx-auto mt-4 mb-6 max-w-5xl text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
              {titleParts[0]}
              <span className="from-primary via-primary bg-gradient-to-r to-blue-600 bg-clip-text text-transparent">
                {highlightWord}
              </span>
              {titleParts[1]}
            </h1>

            {/* Subtitle */}
            <p className="text-muted-foreground mx-auto mb-12 max-w-2xl text-base text-balance sm:text-lg md:text-xl">
              {t("subtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="mx-auto mb-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/jobs">
                <Button size="lg" className="h-12 w-full px-8 text-base sm:w-auto">
                  <Search className="mr-2 h-5 w-5" />
                  {t("search")}
                </Button>
              </Link>
              <Link href="/jobs/create">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-full px-8 text-base sm:w-auto"
                >
                  Post a Job
                </Button>
              </Link>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="mx-auto mb-16 max-w-2xl">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
                  <Input
                    type="text"
                    placeholder={t("searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 pl-12 text-base shadow-sm"
                  />
                </div>
                <Button type="submit" size="lg" className="h-14 px-8">
                  {t("search")}
                </Button>
              </div>
            </form>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
              <div className="group border-border/50 bg-background/50 hover:border-primary/30 relative overflow-hidden rounded-xl border p-6 backdrop-blur-sm transition-all hover:shadow-lg">
                <div className="flex items-center justify-center gap-4">
                  <div className="bg-primary/10 rounded-full p-3">
                    <Sparkles className="text-primary h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <div className="text-foreground text-3xl font-bold">2,500+</div>
                    <div className="text-muted-foreground text-sm">{tStats("totalJobs")}</div>
                  </div>
                </div>
              </div>

              <div className="group border-border/50 bg-background/50 hover:border-primary/30 relative overflow-hidden rounded-xl border p-6 backdrop-blur-sm transition-all hover:shadow-lg">
                <div className="flex items-center justify-center gap-4">
                  <div className="bg-primary/10 rounded-full p-3">
                    <Users className="text-primary h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <div className="text-foreground text-3xl font-bold">500+</div>
                    <div className="text-muted-foreground text-sm">{tStats("companies")}</div>
                  </div>
                </div>
              </div>

              <div className="group border-border/50 bg-background/50 hover:border-primary/30 relative overflow-hidden rounded-xl border p-6 backdrop-blur-sm transition-all hover:shadow-lg">
                <div className="flex items-center justify-center gap-4">
                  <div className="bg-primary/10 rounded-full p-3">
                    <TrendingUp className="text-primary h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <div className="text-foreground text-3xl font-bold">50+</div>
                    <div className="text-muted-foreground text-sm">{tStats("newToday")}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
