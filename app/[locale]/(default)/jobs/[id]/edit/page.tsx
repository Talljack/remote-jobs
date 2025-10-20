"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Plus, X, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/routing";

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [jobId, setJobId] = useState<string>("");

  const [formData, setFormData] = useState({
    title: "",
    companyName: "",
    companyWebsite: "",
    type: "",
    remoteType: "",
    location: "",
    salaryMin: "",
    salaryMax: "",
    salaryCurrency: "USD",
    description: "",
    requirements: "",
    applyMethod: "",
    status: "PUBLISHED",
  });

  useEffect(() => {
    params.then((resolvedParams) => {
      setJobId(resolvedParams.id);
      fetchJob(resolvedParams.id);
    });
  }, [params]);

  const fetchJob = async (id: string) => {
    try {
      const response = await fetch(`/api/jobs/${id}`);
      const data = await response.json();

      if (data.success) {
        const job = data.data;
        setFormData({
          title: job.title || "",
          companyName: job.companyName || "",
          companyWebsite: job.companyWebsite || "",
          type: job.type || "",
          remoteType: job.remoteType || "",
          location: job.location || "",
          salaryMin: job.salaryMin?.toString() || "",
          salaryMax: job.salaryMax?.toString() || "",
          salaryCurrency: job.salaryCurrency || "USD",
          description: job.description || "",
          requirements: job.requirements || "",
          applyMethod: job.applyMethod || "",
          status: job.status || "PUBLISHED",
        });
        setTags(job.tags?.map((tag: { name: string }) => tag.name) || []);
      } else {
        toast.error("Job not found");
        router.push("/console");
      }
    } catch (error) {
      console.error("Error fetching job:", error);
      toast.error("Failed to fetch job");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Job updated successfully!");
        router.push("/console");
      } else {
        toast.error(data.error || "Failed to update job");
      }
    } catch (error) {
      console.error("Error updating job:", error);
      toast.error("Failed to update job");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Link href="/console">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <CardTitle className="text-3xl">Edit Job</CardTitle>
              <CardDescription>Update your job posting details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Job Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                {t("postJob.form.jobTitle")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder={t("postJob.form.jobTitlePlaceholder")}
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
              />
            </div>

            {/* Company Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">
                  {t("postJob.form.companyName")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyWebsite">{t("postJob.form.companyWebsite")}</Label>
                <Input
                  id="companyWebsite"
                  type="url"
                  placeholder="https://company.com"
                  value={formData.companyWebsite}
                  onChange={(e) => handleChange("companyWebsite", e.target.value)}
                />
              </div>
            </div>

            {/* Job Type and Remote Type */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">
                  {t("postJob.form.jobType")} <span className="text-destructive">*</span>
                </Label>
                <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_TIME">{t("jobs.jobTypes.FULL_TIME")}</SelectItem>
                    <SelectItem value="PART_TIME">{t("jobs.jobTypes.PART_TIME")}</SelectItem>
                    <SelectItem value="CONTRACT">{t("jobs.jobTypes.CONTRACT")}</SelectItem>
                    <SelectItem value="INTERNSHIP">{t("jobs.jobTypes.INTERNSHIP")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="remoteType">
                  {t("postJob.form.remoteType")} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.remoteType}
                  onValueChange={(value) => handleChange("remoteType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select remote type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULLY_REMOTE">
                      {t("jobs.remoteTypes.FULLY_REMOTE")}
                    </SelectItem>
                    <SelectItem value="HYBRID">{t("jobs.remoteTypes.HYBRID")}</SelectItem>
                    <SelectItem value="OCCASIONAL">{t("jobs.remoteTypes.OCCASIONAL")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">{t("postJob.form.location")}</Label>
              <Input
                id="location"
                placeholder={t("postJob.form.locationPlaceholder")}
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
              />
            </div>

            {/* Salary Range */}
            <div className="space-y-2">
              <Label>{t("postJob.form.salaryRange")}</Label>
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  type="number"
                  placeholder={t("postJob.form.salaryMin")}
                  value={formData.salaryMin}
                  onChange={(e) => handleChange("salaryMin", e.target.value)}
                />
                <Input
                  type="number"
                  placeholder={t("postJob.form.salaryMax")}
                  value={formData.salaryMax}
                  onChange={(e) => handleChange("salaryMax", e.target.value)}
                />
                <Select
                  value={formData.salaryCurrency}
                  onValueChange={(value) => handleChange("salaryCurrency", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CNY">CNY</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Job Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                {t("postJob.form.description")} <span className="text-destructive">*</span>
              </Label>
              <RichTextEditor
                content={formData.description}
                onChange={(value) => handleChange("description", value)}
              />
            </div>

            {/* Requirements */}
            <div className="space-y-2">
              <Label htmlFor="requirements">{t("postJob.form.requirements")}</Label>
              <RichTextEditor
                content={formData.requirements}
                onChange={(value) => handleChange("requirements", value)}
                placeholder="List the requirements for this position..."
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">{t("postJob.form.tags")}</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder={t("postJob.form.tagsPlaceholder")}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-1">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Apply Method */}
            <div className="space-y-2">
              <Label htmlFor="applyMethod">
                {t("postJob.form.applyMethod")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="applyMethod"
                placeholder={t("postJob.form.applyMethodPlaceholder")}
                value={formData.applyMethod}
                onChange={(e) => handleChange("applyMethod", e.target.value)}
                required
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Job
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/console")}
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
