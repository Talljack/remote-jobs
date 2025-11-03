"use client";

import { useEffect, useState } from "react";

import { Loader2, Search, ShieldCheck, ShieldOff, UserCog } from "lucide-react";
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
import { formatDate } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isBanned: boolean;
  bannedReason: string | null;
  createdAt: string;
  _count?: {
    jobs: number;
    bookmarks: number;
  };
}

export default function AdminUsersPage() {
  const t = useTranslations();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [unbanDialogOpen, setUnbanDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");
  const [newRole, setNewRole] = useState<string>("USER");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter, searchQuery]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        toast.error(t("admin.users.messages.error"));
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(t("admin.users.messages.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBan = async () => {
    if (!selectedUserId || !banReason.trim()) {
      toast.error(t("admin.users.banReasonRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUserId}/ban`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: banReason }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t("admin.users.messages.banSuccess"));
        setBanDialogOpen(false);
        setBanReason("");
        fetchUsers();
      } else {
        toast.error(data.error || t("admin.users.messages.error"));
      }
    } catch (error) {
      console.error("Error banning user:", error);
      toast.error(t("admin.users.messages.error"));
    } finally {
      setIsSubmitting(false);
      setSelectedUserId(null);
    }
  };

  const handleUnban = async () => {
    if (!selectedUserId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUserId}/unban`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t("admin.users.messages.unbanSuccess"));
        setUnbanDialogOpen(false);
        fetchUsers();
      } else {
        toast.error(data.error || t("admin.users.messages.error"));
      }
    } catch (error) {
      console.error("Error unbanning user:", error);
      toast.error(t("admin.users.messages.error"));
    } finally {
      setIsSubmitting(false);
      setSelectedUserId(null);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUserId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUserId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(t("admin.users.messages.roleChangeSuccess"));
        setRoleDialogOpen(false);
        fetchUsers();
      } else {
        toast.error(data.error || t("admin.users.messages.error"));
      }
    } catch (error) {
      console.error("Error changing user role:", error);
      toast.error(t("admin.users.messages.error"));
    } finally {
      setIsSubmitting(false);
      setSelectedUserId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    return role === "ADMIN" ? (
      <Badge variant="default">{t("admin.users.role.admin")}</Badge>
    ) : (
      <Badge variant="secondary">{t("admin.users.role.user")}</Badge>
    );
  };

  const getStatusBadge = (isBanned: boolean) => {
    return isBanned ? (
      <Badge variant="destructive">{t("admin.users.status.banned")}</Badge>
    ) : (
      <Badge variant="default">{t("admin.users.status.active")}</Badge>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.users.title")}</CardTitle>
          <CardDescription>{t("admin.users.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("admin.users.searchPlaceholder")}
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
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.users.role.all")}</SelectItem>
                <SelectItem value="user">{t("admin.users.role.user")}</SelectItem>
                <SelectItem value="admin">{t("admin.users.role.admin")}</SelectItem>
              </SelectContent>
            </Select>
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
                <SelectItem value="all">{t("admin.users.status.all")}</SelectItem>
                <SelectItem value="active">{t("admin.users.status.active")}</SelectItem>
                <SelectItem value="banned">{t("admin.users.status.banned")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No users found matching your filters.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.users.table.name")}</TableHead>
                    <TableHead>{t("admin.users.table.email")}</TableHead>
                    <TableHead>{t("admin.users.table.role")}</TableHead>
                    <TableHead>{t("admin.users.table.status")}</TableHead>
                    <TableHead>{t("admin.users.table.joinedAt")}</TableHead>
                    <TableHead className="text-right">{t("admin.users.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{user.name || "No name"}</span>
                          {user._count && (
                            <span className="text-xs text-muted-foreground">
                              {user._count.jobs} jobs • {user._count.bookmarks} bookmarks
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(user.isBanned)}
                          {user.isBanned && user.bannedReason && (
                            <span className="text-xs text-muted-foreground">
                              {user.bannedReason}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setNewRole(user.role);
                              setRoleDialogOpen(true);
                            }}
                          >
                            <UserCog className="h-4 w-4" />
                          </Button>
                          {user.isBanned ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setUnbanDialogOpen(true);
                              }}
                            >
                              <ShieldCheck className="h-4 w-4 text-green-600" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setBanDialogOpen(true);
                              }}
                            >
                              <ShieldOff className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
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

      {/* Ban Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.users.actions.ban")}</DialogTitle>
            <DialogDescription>{t("admin.users.confirmBan")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="banReason">
              {t("admin.users.banReason")} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="banReason"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder={t("admin.users.banReasonPlaceholder")}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBanDialogOpen(false);
                setBanReason("");
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleBan} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("admin.users.actions.ban")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unban Dialog */}
      <Dialog open={unbanDialogOpen} onOpenChange={setUnbanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.users.actions.unban")}</DialogTitle>
            <DialogDescription>{t("admin.users.confirmUnban")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnbanDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleUnban} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("admin.users.actions.unban")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("admin.users.actions.changeRole")}</DialogTitle>
            <DialogDescription>{t("admin.users.changeRoleTo")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">{t("admin.users.role.user")}</SelectItem>
                <SelectItem value="ADMIN">{t("admin.users.role.admin")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleRoleChange} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
