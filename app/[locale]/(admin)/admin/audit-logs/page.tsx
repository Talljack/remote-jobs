"use client";

import { useEffect, useState } from "react";

import { Eye, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  admin: {
    id: string;
    name: string | null;
    email: string;
  };
}

export default function AdminAuditLogsPage() {
  const t = useTranslations();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");
  const [targetTypeFilter, setTargetTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, targetTypeFilter]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (actionFilter !== "all") params.append("action", actionFilter);
      if (targetTypeFilter !== "all") params.append("targetType", targetTypeFilter);

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.data.logs);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        toast.error(t("admin.auditLogs.messages.error"));
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error(t("admin.auditLogs.messages.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      JOB_APPROVE: "default",
      JOB_REJECT: "destructive",
      JOB_DELETE: "destructive",
      USER_BAN: "destructive",
      USER_UNBAN: "default",
      USER_ROLE_CHANGE: "secondary",
      CRAWLER_CONFIG_UPDATE: "secondary",
      SYSTEM_CONFIG_UPDATE: "secondary",
    };

    return (
      <Badge variant={variants[action] || "outline"}>
        {t(`admin.auditLogs.action.${action.toLowerCase()}`)}
      </Badge>
    );
  };

  const getTargetTypeBadge = (targetType: string) => {
    const icons: Record<string, string> = {
      JOB: "💼",
      USER: "👤",
      CONFIG: "⚙️",
    };

    return (
      <Badge variant="outline">
        {icons[targetType] || "📄"} {t(`admin.auditLogs.targetType.${targetType.toLowerCase()}`)}
      </Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.auditLogs.title")}</CardTitle>
          <CardDescription>{t("admin.auditLogs.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 md:flex-row">
            <Select
              value={actionFilter}
              onValueChange={(value) => {
                setActionFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.auditLogs.action.all")}</SelectItem>
                <SelectItem value="JOB_APPROVE">
                  {t("admin.auditLogs.action.jobApprove")}
                </SelectItem>
                <SelectItem value="JOB_REJECT">{t("admin.auditLogs.action.jobReject")}</SelectItem>
                <SelectItem value="JOB_DELETE">{t("admin.auditLogs.action.jobDelete")}</SelectItem>
                <SelectItem value="USER_BAN">{t("admin.auditLogs.action.userBan")}</SelectItem>
                <SelectItem value="USER_UNBAN">{t("admin.auditLogs.action.userUnban")}</SelectItem>
                <SelectItem value="USER_ROLE_CHANGE">
                  {t("admin.auditLogs.action.userRoleChange")}
                </SelectItem>
                <SelectItem value="CRAWLER_CONFIG_UPDATE">
                  {t("admin.auditLogs.action.crawlerConfigUpdate")}
                </SelectItem>
                <SelectItem value="SYSTEM_CONFIG_UPDATE">
                  {t("admin.auditLogs.action.systemConfigUpdate")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={targetTypeFilter}
              onValueChange={(value) => {
                setTargetTypeFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.auditLogs.targetType.all")}</SelectItem>
                <SelectItem value="JOB">{t("admin.auditLogs.targetType.job")}</SelectItem>
                <SelectItem value="USER">{t("admin.auditLogs.targetType.user")}</SelectItem>
                <SelectItem value="CONFIG">{t("admin.auditLogs.targetType.config")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No audit logs found matching your filters.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.auditLogs.table.action")}</TableHead>
                    <TableHead>{t("admin.auditLogs.table.admin")}</TableHead>
                    <TableHead>{t("admin.auditLogs.table.target")}</TableHead>
                    <TableHead>{t("admin.auditLogs.table.timestamp")}</TableHead>
                    <TableHead className="text-right">
                      {t("admin.auditLogs.table.details")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{log.admin.name || "Admin"}</span>
                          <span className="text-xs text-muted-foreground">{log.admin.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getTargetTypeBadge(log.targetType)}
                          <span className="font-mono text-xs text-muted-foreground">
                            {log.targetId.slice(0, 8)}...
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{formatDate(log.createdAt)}</span>
                          {log.ipAddress && (
                            <span className="text-xs text-muted-foreground">
                              IP: {log.ipAddress}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log);
                            setDetailsDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("admin.auditLogs.viewDetails")}</DialogTitle>
            <DialogDescription>
              {selectedLog && formatDate(selectedLog.createdAt)}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 font-semibold">Action</h4>
                {getActionBadge(selectedLog.action)}
              </div>
              <div>
                <h4 className="mb-2 font-semibold">Admin</h4>
                <p>
                  {selectedLog.admin.name || "Admin"} ({selectedLog.admin.email})
                </p>
              </div>
              <div>
                <h4 className="mb-2 font-semibold">Target</h4>
                <div className="flex items-center gap-2">
                  {getTargetTypeBadge(selectedLog.targetType)}
                  <code className="rounded bg-muted px-2 py-1 text-xs">{selectedLog.targetId}</code>
                </div>
              </div>
              {selectedLog.details && (
                <div>
                  <h4 className="mb-2 font-semibold">Details</h4>
                  <pre className="overflow-auto rounded-lg bg-muted p-4 text-xs">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
              <div>
                <h4 className="mb-2 font-semibold">Request Info</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {selectedLog.ipAddress && <p>IP Address: {selectedLog.ipAddress}</p>}
                  {selectedLog.userAgent && (
                    <p className="break-all">User Agent: {selectedLog.userAgent}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
