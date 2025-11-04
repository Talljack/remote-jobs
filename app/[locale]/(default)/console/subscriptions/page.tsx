"use client";

import { useEffect, useState } from "react";

import { Bell, BellOff, Edit, Loader2, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Link } from "@/i18n/routing";
import { formatDate } from "@/lib/utils";

interface Subscription {
  id: string;
  name: string;
  isActive: boolean;
  frequency: string;
  keywords: string[] | null;
  jobTypes: string[] | null;
  remoteTypes: string[] | null;
  sources: string[] | null;
  salaryMin: number | null;
  categoryId: string | null;
  experienceLevel: string | null;
  createdAt: string;
  updatedAt: string;
  tags: Array<{ id: string; name: string }>;
  _count?: {
    notifications: number;
  };
}

interface SubscriptionFormData {
  name: string;
  frequency: string;
  keywords: string;
  jobTypes: string[];
  remoteTypes: string[];
  sources: string[];
  salaryMin: string;
  categoryId: string;
  experienceLevel: string;
  tagIds: string[];
}

const JOB_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"];
const REMOTE_TYPES = ["FULLY_REMOTE", "HYBRID", "OCCASIONAL"];
const SOURCES = [
  "V2EX",
  "ELEDUCK",
  "REMOTEOK",
  "WEWORKREMOTELY",
  "VUEJOBS",
  "RUANYF_WEEKLY",
  "HIMALAYAS",
  "REMOTIVE",
  "JOBICY",
  "WORKING_NOMADS",
  "FOURDAYWEEK",
  "REMOTEBASE",
];

export default function SubscriptionsPage() {
  const t = useTranslations();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<string | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState<SubscriptionFormData>({
    name: "",
    frequency: "DAILY",
    keywords: "",
    jobTypes: [],
    remoteTypes: [],
    sources: [],
    salaryMin: "",
    categoryId: "",
    experienceLevel: "",
    tagIds: [],
  });

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/subscriptions");
      const data = await response.json();

      if (data.success) {
        setSubscriptions(data.data);
      } else {
        toast.error(t("subscriptions.messages.error"));
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast.error(t("subscriptions.messages.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenForm = (subscription?: Subscription) => {
    if (subscription) {
      setEditingSubscription(subscription);
      setFormData({
        name: subscription.name,
        frequency: subscription.frequency,
        keywords: subscription.keywords?.join(", ") || "",
        jobTypes: subscription.jobTypes || [],
        remoteTypes: subscription.remoteTypes || [],
        sources: subscription.sources || [],
        salaryMin: subscription.salaryMin?.toString() || "",
        categoryId: subscription.categoryId || "",
        experienceLevel: subscription.experienceLevel || "",
        tagIds: subscription.tags?.map((tag) => tag.id) || [],
      });
    } else {
      setEditingSubscription(null);
      setFormData({
        name: "",
        frequency: "DAILY",
        keywords: "",
        jobTypes: [],
        remoteTypes: [],
        sources: [],
        salaryMin: "",
        categoryId: "",
        experienceLevel: "",
        tagIds: [],
      });
    }
    setFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        frequency: formData.frequency,
        keywords: formData.keywords ? formData.keywords.split(",").map((k) => k.trim()) : null,
        jobTypes: formData.jobTypes.length > 0 ? formData.jobTypes : null,
        remoteTypes: formData.remoteTypes.length > 0 ? formData.remoteTypes : null,
        sources: formData.sources.length > 0 ? formData.sources : null,
        salaryMin: formData.salaryMin ? parseInt(formData.salaryMin) : null,
        categoryId: formData.categoryId || null,
        experienceLevel: formData.experienceLevel || null,
        tagIds: formData.tagIds.length > 0 ? formData.tagIds : null,
      };

      const url = editingSubscription
        ? `/api/subscriptions/${editingSubscription.id}`
        : "/api/subscriptions";
      const method = editingSubscription ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          editingSubscription
            ? t("subscriptions.messages.updateSuccess")
            : t("subscriptions.messages.createSuccess")
        );
        setFormOpen(false);
        fetchSubscriptions();
      } else {
        toast.error(data.error || t("subscriptions.messages.error"));
      }
    } catch (error) {
      console.error("Error saving subscription:", error);
      toast.error(t("subscriptions.messages.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!subscriptionToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionToDelete}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t("subscriptions.messages.deleteSuccess"));
        setSubscriptions(subscriptions.filter((sub) => sub.id !== subscriptionToDelete));
        setDeleteDialogOpen(false);
      } else {
        toast.error(data.error || t("subscriptions.messages.error"));
      }
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast.error(t("subscriptions.messages.error"));
    } finally {
      setIsDeleting(false);
      setSubscriptionToDelete(null);
    }
  };

  const toggleJobType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      jobTypes: prev.jobTypes.includes(type)
        ? prev.jobTypes.filter((t) => t !== type)
        : [...prev.jobTypes, type],
    }));
  };

  const toggleRemoteType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      remoteTypes: prev.remoteTypes.includes(type)
        ? prev.remoteTypes.filter((t) => t !== type)
        : [...prev.remoteTypes, type],
    }));
  };

  const toggleSource = (source: string) => {
    setFormData((prev) => ({
      ...prev,
      sources: prev.sources.includes(source)
        ? prev.sources.filter((s) => s !== source)
        : [...prev.sources, source],
    }));
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
      <div className="mb-6 flex gap-2">
        <Link href="/console">
          <Button variant="outline">My Jobs</Button>
        </Link>
        <Link href="/console/bookmarks">
          <Button variant="outline">Bookmarks</Button>
        </Link>
        <Link href="/console/subscriptions">
          <Button variant="default">
            <Bell className="mr-2 h-4 w-4" />
            {t("nav.subscriptions")}
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-3xl">{t("subscriptions.title")}</CardTitle>
              <CardDescription>{t("subscriptions.subtitle")}</CardDescription>
            </div>
            <Button onClick={() => handleOpenForm()}>
              <Plus className="mr-2 h-4 w-4" />
              {t("subscriptions.create")}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="py-12 text-center">
              <BellOff className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-muted-foreground">{t("subscriptions.noSubscriptions")}</p>
              <Button onClick={() => handleOpenForm()}>
                <Plus className="mr-2 h-4 w-4" />
                {t("subscriptions.create")}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("subscriptions.form.name")}</TableHead>
                  <TableHead>{t("subscriptions.form.frequency")}</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>{t("subscriptions.stats.notificationsSent")}</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((subscription) => (
                  <TableRow key={subscription.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{subscription.name}</span>
                        {subscription.keywords && subscription.keywords.length > 0 && (
                          <div className="mt-1 flex gap-1">
                            {subscription.keywords.slice(0, 3).map((keyword) => (
                              <Badge key={keyword} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {subscription.keywords.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{subscription.keywords.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {t(
                          `subscriptions.form.frequencyOptions.${subscription.frequency.toLowerCase()}`
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {subscription.isActive ? (
                        <Badge variant="default">{t("subscriptions.active")}</Badge>
                      ) : (
                        <Badge variant="outline">{t("subscriptions.inactive")}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{subscription._count?.notifications || 0}</TableCell>
                    <TableCell>{formatDate(subscription.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenForm(subscription)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSubscriptionToDelete(subscription.id);
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

      {/* Create/Edit Subscription Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSubscription ? t("subscriptions.edit") : t("subscriptions.create")}
            </DialogTitle>
            <DialogDescription>{t("subscriptions.subtitle")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                {t("subscriptions.form.name")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("subscriptions.form.namePlaceholder")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">{t("subscriptions.form.frequency")}</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IMMEDIATE">
                    {t("subscriptions.form.frequencyOptions.immediate")}
                  </SelectItem>
                  <SelectItem value="DAILY">
                    {t("subscriptions.form.frequencyOptions.daily")}
                  </SelectItem>
                  <SelectItem value="WEEKLY">
                    {t("subscriptions.form.frequencyOptions.weekly")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">{t("subscriptions.form.keywords")}</Label>
              <Input
                id="keywords"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder={t("subscriptions.form.keywordsPlaceholder")}
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple keywords with commas
              </p>
            </div>

            <div className="space-y-2">
              <Label>{t("subscriptions.form.jobTypes")}</Label>
              <div className="grid grid-cols-2 gap-2">
                {JOB_TYPES.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`jobType-${type}`}
                      checked={formData.jobTypes.includes(type)}
                      onCheckedChange={() => toggleJobType(type)}
                    />
                    <label
                      htmlFor={`jobType-${type}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t(`jobs.jobTypes.${type}`)}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("subscriptions.form.remoteTypes")}</Label>
              <div className="grid grid-cols-2 gap-2">
                {REMOTE_TYPES.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`remoteType-${type}`}
                      checked={formData.remoteTypes.includes(type)}
                      onCheckedChange={() => toggleRemoteType(type)}
                    />
                    <label
                      htmlFor={`remoteType-${type}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t(`jobs.remoteTypes.${type}`)}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("subscriptions.form.sources")}</Label>
              <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto">
                {SOURCES.map((source) => (
                  <div key={source} className="flex items-center space-x-2">
                    <Checkbox
                      id={`source-${source}`}
                      checked={formData.sources.includes(source)}
                      onCheckedChange={() => toggleSource(source)}
                    />
                    <label
                      htmlFor={`source-${source}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t(`jobs.sources.${source}`)}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="salaryMin">{t("subscriptions.form.salaryMin")}</Label>
              <Input
                id="salaryMin"
                type="number"
                value={formData.salaryMin}
                onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                placeholder={t("subscriptions.form.salaryMinPlaceholder")}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                {t("subscriptions.form.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("subscriptions.form.submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("subscriptions.delete")}</DialogTitle>
            <DialogDescription>{t("subscriptions.confirmDelete")}</DialogDescription>
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
