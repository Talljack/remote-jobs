"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { useAuth } from "@clerk/nextjs";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BookmarkButtonProps {
  jobId: string;
  variant?: "ghost" | "outline" | "default";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

export function BookmarkButton({
  jobId,
  variant = "ghost",
  size = "icon",
  className,
  showText = false,
}: BookmarkButtonProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const t = useTranslations("jobs.card");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check bookmark status on mount
  useEffect(() => {
    if (!isLoaded) return;

    const checkBookmarkStatus = async () => {
      try {
        const res = await fetch(`/api/bookmarks/check?jobId=${jobId}`);
        const data = await res.json();

        if (data.success) {
          setIsBookmarked(data.data.isBookmarked);
          setBookmarkId(data.data.bookmarkId);
        }
      } catch (error) {
        console.error("Failed to check bookmark status:", error);
      }
    };

    checkBookmarkStatus();
  }, [jobId, isLoaded]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoaded) return;

    // Redirect to sign in if not authenticated
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    setIsLoading(true);

    try {
      if (isBookmarked && bookmarkId) {
        // Remove bookmark
        const res = await fetch(`/api/bookmarks/${bookmarkId}`, {
          method: "DELETE",
        });

        const data = await res.json();

        if (data.success) {
          setIsBookmarked(false);
          setBookmarkId(null);
          toast.success(t("bookmarkRemoved"));
        } else {
          toast.error(data.error || t("bookmarkError"));
        }
      } else {
        // Add bookmark
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ jobId }),
        });

        const data = await res.json();

        if (data.success) {
          setIsBookmarked(true);
          setBookmarkId(data.data.id);
          toast.success(t("bookmarkAdded"));
        } else {
          toast.error(data.error || t("bookmarkError"));
        }
      }
    } catch (error) {
      console.error("Bookmark error:", error);
      toast.error(t("somethingWentWrong"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={cn("flex-shrink-0", className)}
      title={isBookmarked ? t("removeBookmark") : t("bookmarkThisJob")}
    >
      {isBookmarked ? (
        <BookmarkCheck className={cn("h-5 w-5", isBookmarked && "fill-current")} />
      ) : (
        <Bookmark className="h-5 w-5" />
      )}
      {showText && <span className="ml-2">{isBookmarked ? t("bookmarked") : t("bookmark")}</span>}
    </Button>
  );
}
