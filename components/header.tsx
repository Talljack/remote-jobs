"use client";

import { useState } from "react";

import { UserButton } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";

import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export function Header() {
  const t = useTranslations("nav");
  const { isSignedIn } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-2xl font-bold text-transparent">
              RemoteJobs
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/" className="hover:text-primary text-sm font-medium transition-colors">
              {t("home")}
            </Link>
            <Link href="/jobs" className="hover:text-primary text-sm font-medium transition-colors">
              {t("jobs")}
            </Link>
            <Link
              href="/stats"
              className="hover:text-primary text-sm font-medium transition-colors"
            >
              {t("stats")}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <LocaleToggle />

          {isSignedIn ? (
            <>
              <Link href="/console" className="hidden md:block">
                <Button variant="ghost" size="sm">
                  {t("console")}
                </Button>
              </Link>
              <Link href="/jobs/create" className="hidden md:block">
                <Button size="sm">{t("postJob")}</Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </>
          ) : (
            <>
              <Link href="/sign-in" className="hidden md:block">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up" className="hidden md:block">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <nav className="container flex flex-col gap-4 py-4">
            <Link href="/" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              {t("home")}
            </Link>
            <Link
              href="/jobs"
              className="text-sm font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("jobs")}
            </Link>
            <Link
              href="/stats"
              className="text-sm font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t("stats")}
            </Link>
            {isSignedIn && (
              <>
                <Link
                  href="/console"
                  className="text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("console")}
                </Link>
                <Link
                  href="/jobs/create"
                  className="text-sm font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t("postJob")}
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
