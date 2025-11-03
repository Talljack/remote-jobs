"use client";

import { useEffect, useState } from "react";

import { Check, ExternalLink, Loader2, Search, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/routing";
import { formatDate } from "@/lib/utils";

interface Job {
  id: string;
  title: string;
  companyName: string;
  source: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  publisher: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export default function AdminJobsPage() {
  const t = useTranslations();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [page, statusFilter, sourceFilter, searchQuery]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (sourceFilter !== "all") params.append("source", sourceFilter);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/admin/jobs?${params}`);
      const data = await response.json();

      if (data.success) {
        setJobs(data.data.jobs);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        toast.error(t("admin.jobs.messages.error"));
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error(t("admin.jobs.messages.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedJobId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/jobs/${selectedJobId}/approve`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t("admin.jobs.messages.approveSuccess"));
        setApproveDialogOpen(false);
        fetchJobs();
      } else {
        toast.error(data.error || t("admin.jobs.messages.error"));
      }
    } catch (error) {
      console.error("Error approving job:", error);
      toast.error(t("admin.jobs.messages.error"));
    } finally {
      setIsSubmitting(false);
      setSelectedJobId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedJobId || !rejectReason.trim()) {
      toast.error(t("admin.jobs.rejectReasonRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/jobs/${selectedJobId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t("admin.jobs.messages.rejectSuccess"));
        setRejectDialogOpen(false);
        setRejectReason("");
        fetchJobs();
      } else {
        toast.error(data.error || t("admin.jobs.messages.error"));
      }
    } catch (error) {
      console.error("Error rejecting job:", error);
      toast.error(t("admin.jobs.messages.error"));
    } finally {
      setIsSubmitting(false);
      setSelectedJobId(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedJobId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/jobs/${selectedJobId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t("admin.jobs.messages.deleteSuccess"));
        setDeleteDialogOpen(false);
        fetchJobs();
      } else {
        toast.error(data.error || t("admin.jobs.messages.error"));
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error(t("admin.jobs.messages.error"));
    } finally {
      setIsSubmitting(false);
      setSelectedJobId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return <Badge variant="default">{t("admin.jobs.status.published")}</Badge>;
      case "DRAFT":
        return <Badge variant="secondary">{t("admin.jobs.status.draft")}</Badge>;
      case "CLOSED":
        return <Badge variant="outline">{t("admin.jobs.status.closed")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.jobs.title")}</CardTitle>
          <CardDescription>{t("admin.jobs.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("admin.jobs.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.jobs.status.all")}</SelectItem>
                <SelectItem value="draft">{t("admin.jobs.status.draft")}</SelectItem>
                <SelectItem value="published">{t("admin.jobs.status.published")}</SelectItem>
                <SelectItem value="closed">{t("admin.jobs.status.closed")}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sourceFilter}
              onValueChange={(value) => {
                setSourceFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.jobs.source.all")}</SelectItem>
                <SelectItem value="USER_POSTED">{t("admin.jobs.source.userPosted")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No jobs found matching your filters.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.jobs.table.title")}</TableHead>
                    <TableHead>{t("admin.jobs.table.company")}</TableHead>
                    <TableHead>{t("admin.jobs.table.source")}</TableHead>
                    <TableHead>{t("admin.jobs.table.status")}</TableHead>
                    <TableHead>{t("admin.jobs.table.publishedAt")}</TableHead>
                    <TableHead className="text-right">{t("admin.jobs.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{job.title}</span>
                          {job.publisher && (
                            <span className="text-xs text-muted-foreground">
                              by {job.publisher.name || job.publisher.email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{job.companyName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{t(`jobs.sources.${job.source}`)}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell>{job.publishedAt ? formatDate(job.publishedAt) : "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/jobs/${job.id}`} target="_blank">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                          {job.status === "DRAFT" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedJobId(job.id);
                                setApproveDialogOpen(true);
                              }}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {job.status === "DRAFT" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedJobId(job.id);
                                setRejectDialogOpen(true);
                              }}
                            >
                              <X className="h-4 w-4 text-orange-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedJobId(job.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.jobs.actions.approve")}</DialogTitle>
            <DialogDescription>{t("admin.jobs.confirmApprove")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("admin.jobs.actions.approve")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.jobs.actions.reject")}</DialogTitle>
            <DialogDescription>{t("admin.jobs.confirmReject")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejectReason">
              {t("admin.jobs.rejectReason")} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="rejectReason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t("admin.jobs.rejectReasonPlaceholder")}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason("");
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("admin.jobs.actions.reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.jobs.actions.delete")}</DialogTitle>
            <DialogDescription>{t("admin.jobs.confirmDelete")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
