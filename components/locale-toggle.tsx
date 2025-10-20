"use client";

import { useParams } from "next/navigation";

import { Globe } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "@/i18n/routing";

export function LocaleToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  const currentLocale = params.locale as string;

  const toggleLocale = () => {
    const newLocale = currentLocale === "en" ? "zh" : "en";
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleLocale}>
      <Globe className="h-5 w-5" />
      <span className="sr-only">{currentLocale === "en" ? "中文" : "English"}</span>
    </Button>
  );
}
