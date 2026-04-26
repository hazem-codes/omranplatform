import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { supervisorService } from "@/services/supervisorService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Ban, CheckCircle2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/supervisor/accounts")({
  component: ManageAccountsPage,
});

type ProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
  role: "client" | "engineering_office" | "supervisor";
  is_active?: boolean | null;
  is_verified?: boolean | null;
};

function ManageAccountsPage() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await supervisorService.getAllAccounts();
      setUsers((data ?? []) as ProfileRow[]);
    } catch (err: any) {
      console.error("accounts page error =>", err);
      toast.error(err?.message || (isRTL ? "تعذر تحميل الحسابات" : "Failed to load accounts"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const toggleStatus = async (userId: string, role: string, currentlyActive: boolean) => {
    try {
      setProcessingId(userId);
      const next = !currentlyActive;

      if (role === "client" || role === "engineering_office") {
        await supervisorService.setAccountActive(userId, role, next);
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_active: next } : u)));
        toast.success(
          next
            ? (isRTL ? "تم تفعيل الحساب" : "Account reactivated")
            : (isRTL ? "تم إيقاف الحساب" : "Account suspended"),
        );
      } else {
        toast.info(isRTL ? "غير متاح لهذا النوع" : "Not available for this account type");
      }

      await loadAccounts();
    } catch (err: any) {
      console.error("toggleStatus error =>", err);
      toast.error(err?.message || (isRTL ? "تعذر تحديث الحالة" : "Failed to update status"));
    } finally {
      setProcessingId(null);
    }
  };

  const openProfile = (u: ProfileRow) => {
    if (u.role === "engineering_office") {
      navigate({ to: "/supervisor/office/$id", params: { id: u.id } });
    }
  };

  const openContact = (u: ProfileRow, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate({ to: "/supervisor/chat/$id", params: { id: u.id } });
  };

  const roleLabel = (role: string) => {
    if (role === "client") return isRTL ? "عميل" : "Client";
    if (role === "engineering_office") return isRTL ? "مكتب هندسي" : "Office";
    if (role === "supervisor") return isRTL ? "مشرف" : "Supervisor";
    return role;
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;

    return users.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [users, search]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-black">{isRTL ? "إدارة الحسابات" : "Manage Accounts"}</h1>

      <div className="mt-6 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={isRTL ? "بحث بالاسم أو البريد..." : "Search by name or email..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card className="mt-4">
        <CardContent className="pt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRTL ? "الاسم" : "Name"}</TableHead>
                <TableHead>{isRTL ? "البريد" : "Email"}</TableHead>
                <TableHead>{isRTL ? "النوع" : "Role"}</TableHead>
                <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                <TableHead>{isRTL ? "إجراء" : "Action"}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {isRTL ? "جاري تحميل الحسابات..." : "Loading accounts..."}
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {isRTL ? "لا توجد حسابات" : "No accounts found"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u) => {
                  const isClient = u.role === "client";
                  const isOffice = u.role === "engineering_office";
                  const isSystem = !isClient && !isOffice;
                  const isActive = u.is_active !== false;
                  const isOfficeVerified = u.is_verified === true;
                  const canToggle = isClient || isOffice;

                  return (
                    <TableRow
                      key={u.id}
                      className={isOffice ? "cursor-pointer hover:bg-muted/50" : ""}
                      onClick={() => openProfile(u)}
                    >
                      <TableCell className="font-medium">{u.name || (isRTL ? "بدون اسم" : "No name")}</TableCell>
                      <TableCell>{u.email || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{roleLabel(u.role)}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {isSystem ? (
                            <Badge variant="secondary">{isRTL ? "حساب نظام" : "System"}</Badge>
                          ) : isActive ? (
                            <Badge className="bg-success text-success-foreground">{isRTL ? "نشط" : "Active"}</Badge>
                          ) : (
                            <Badge variant="destructive">{isRTL ? "موقوف" : "Suspended"}</Badge>
                          )}
                          {isOffice && (
                            isOfficeVerified ? (
                              <Badge variant="outline" className="border-success text-success">
                                {isRTL ? "موثّق" : "Verified"}
                              </Badge>
                            ) : (
                              <Badge variant="outline">{isRTL ? "قيد التحقق" : "Pending Verification"}</Badge>
                            )
                          )}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-wrap items-center gap-2">
                          {canToggle ? (
                            <Button
                              size="sm"
                              variant={isActive ? "destructive" : "default"}
                              onClick={() => toggleStatus(u.id, u.role, isActive)}
                              disabled={processingId === u.id}
                            >
                              {isActive ? <Ban className="me-1 h-3 w-3" /> : <CheckCircle2 className="me-1 h-3 w-3" />}
                              {processingId === u.id
                                ? (isRTL ? "جارٍ التحديث..." : "Updating...")
                                : isActive
                                  ? (isRTL ? "إيقاف" : "Suspend")
                                  : (isRTL ? "إعادة تفعيل" : "Reactivate")}
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled>
                              <CheckCircle2 className="me-1 h-3 w-3" />
                              {isRTL ? "عرض فقط" : "View only"}
                            </Button>
                          )}
                          {isOffice && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => openContact(u, e)}
                            >
                              <MessageSquare className="me-1 h-3 w-3" />
                              {isRTL ? "تواصل" : "Contact"}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
