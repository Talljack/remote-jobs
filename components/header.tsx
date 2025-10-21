"use client";

import { useState } from "react";

import { UserButton } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import { Briefcase, LayoutDashboard, Menu, PlusCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/routing";

export function Header() {
  const t = useTranslations("nav");
  const { isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex flex-1">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Briefcase className="h-6 w-6" />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-xl font-bold text-transparent">
              RemoteJobs
            </span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              {t("home")}
            </Link>
            <Link href="/jobs" className="text-sm font-medium transition-colors hover:text-primary">
              {t("jobs")}
            </Link>
            <Link
              href="/stats"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              {t("stats")}
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            <ThemeToggle />
            <LocaleToggle />
            {isSignedIn ? (
              <>
                <Link href="/console" className="hidden md:block">
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {t("console")}
                  </Button>
                </Link>
                <Link href="/jobs/create" className="hidden md:block">
                  <Button size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t("postJob")}
                  </Button>
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
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="pr-0">
                <SheetHeader>
                  <SheetTitle>
                    <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
                      <Briefcase className="mr-2 h-6 w-6" />
                      <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text font-bold text-transparent">
                        RemoteJobs
                      </span>
                    </Link>
                  </SheetTitle>
                  <SheetDescription>Navigate to different sections</SheetDescription>
                </SheetHeader>
                <div className="my-4 h-[calc(100vh-8rem)] overflow-y-auto pb-10 pl-6">
                  <div className="flex flex-col space-y-3">
                    <Link
                      href="/"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setOpen(false)}
                    >
                      {t("home")}
                    </Link>
                    <Link
                      href="/jobs"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setOpen(false)}
                    >
                      {t("jobs")}
                    </Link>
                    <Link
                      href="/stats"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setOpen(false)}
                    >
                      {t("stats")}
                    </Link>
                    {isSignedIn ? (
                      <>
                        <Link
                          href="/console"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => setOpen(false)}
                        >
                          {t("console")}
                        </Link>
                        <Link
                          href="/jobs/create"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => setOpen(false)}
                        >
                          {t("postJob")}
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/sign-in"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => setOpen(false)}
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/sign-up"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => setOpen(false)}
                        >
                          Sign Up
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </nav>
        </div>
      </div>
    </header>
  );
}
