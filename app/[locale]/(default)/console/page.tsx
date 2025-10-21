"use client";

import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";

import { Plus, Edit, Trash2, Eye, Loader2, ExternalLink } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "@/i18n/routing";
import { formatDate } from "@/lib/utils";

interface Job {
  id: number;
  title: string;
  companyName: string;
  type: string;
  remoteType: string;
  status: string;
  publishedAt: string | null;
  views: number;
  createdAt: string;
  tags: Array<{ name: string }>;
}

export default function ConsolePage() {
  const router = useRouter();
  const t = useTranslations();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs/my");
      const data = await response.json();

      if (data.success) {
        setJobs(data.data.jobs);
      } else {
        toast.error("Failed to fetch jobs");
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to fetch jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!jobToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/jobs/${jobToDelete}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Job deleted successfully");
        setJobs(jobs.filter((job) => job.id !== jobToDelete));
        setDeleteDialogOpen(false);
      } else {
        toast.error(data.error || "Failed to delete job");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("Failed to delete job");
    } finally {
      setIsDeleting(false);
      setJobToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return <Badge variant="default">Published</Badge>;
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      case "CLOSED":
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl">{t("console.myJobs.title")}</CardTitle>
              <CardDescription>Manage your posted job listings</CardDescription>
            </div>
            <Link href="/jobs/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("nav.postJob")}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="py-12 text-center">
              <p className="mb-4 text-muted-foreground">{t("console.myJobs.noJobs")}</p>
              <Link href="/jobs/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Post Your First Job
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>{t("console.myJobs.status")}</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">{t("console.myJobs.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{job.title}</span>
                        {job.tags && job.tags.length > 0 && (
                          <div className="mt-1 flex gap-1">
                            {job.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag.name} variant="outline" className="text-xs">
                                {tag.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{job.companyName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t(`jobs.jobTypes.${job.type}`)}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span>{job.views}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(job.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/jobs/${job.id}`} target="_blank">
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/jobs/${job.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setJobToDelete(job.id);
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
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this job? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
