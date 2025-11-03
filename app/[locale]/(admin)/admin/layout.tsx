"use client";

import { ReactNode } from "react";

import { usePathname } from "next/navigation";

import { FileText, Settings, ShieldAlert, Users } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";

export default function AdminSubLayout({ children }: { children: ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();

  const isActive = (path: string) => pathname.includes(path);

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">{t("admin.title")}</h1>
        <p className="text-muted-foreground">Manage jobs, users, and system settings</p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto">
        <Link href="/admin/jobs">
          <Button variant={isActive("/admin/jobs") ? "default" : "outline"}>
            <ShieldAlert className="mr-2 h-4 w-4" />
            {t("admin.nav.jobs")}
          </Button>
        </Link>
        <Link href="/admin/users">
          <Button variant={isActive("/admin/users") ? "default" : "outline"}>
            <Users className="mr-2 h-4 w-4" />
            {t("admin.nav.users")}
          </Button>
        </Link>
        <Link href="/admin/audit-logs">
          <Button variant={isActive("/admin/audit-logs") ? "default" : "outline"}>
            <FileText className="mr-2 h-4 w-4" />
            {t("admin.nav.auditLogs")}
          </Button>
        </Link>
        <Link href="/admin/settings">
          <Button variant={isActive("/admin/settings") ? "default" : "outline"}>
            <Settings className="mr-2 h-4 w-4" />
            {t("admin.nav.settings")}
          </Button>
        </Link>
      </div>

      {children}
    </div>
  );
}
