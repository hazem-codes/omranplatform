import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { supervisorService } from "@/services/supervisorService";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Shield, AlertTriangle, Ban, CheckCircle2, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/supervisor/disputes")({
  component: ManageDisputesPage,
});

type ReportRow = {
  report_id: string;
  description: string | null;
  status: string | null;
  project_id?: string | null;
  client_id?: string | null;
  created_at?: string | null;
};

function ManageDisputesPage() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const navigate = useNavigate();
  const { role } = useAuth();
  const isSupervisor = role === 'supervisor';

  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await supervisorService.getAllReports();
      console.log("disputes page data =>", data);
      setReports(data ?? []);
    } catch (err: any) {
      console.error("disputes page error =>", err);
      toast.error(err?.message || (isRTL ? "تعذر تحميل النزاعات" : "Failed to load disputes"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      setProcessingId(id);
      await supervisorService.resolveReport(id, status);
      toast.success(isRTL ? "تم تحديث حالة النزاع" : "Dispute status updated");
      await loadReports();
    } catch (err: any) {
      console.error("updateStatus error =>", err);
      toast.error(err?.message || (isRTL ? "تعذر تحديث الحالة" : "Failed to update status"));
    } finally {
      setProcessingId(null);
    }
  };

  const freezeEscrow = async () => {
    toast.warning(
      isRTL ? "اربط هذا الزر بصف escrow الحقيقي إذا لزم" : "Link this button to a real escrow record if needed",
    );
  };

  const warnUser = async () => {
    toast.warning(isRTL ? "تم إرسال تحذير" : "Warning sent");
  };

  const suspendUser = async () => {
    toast.error(
      isRTL
        ? "اربط هذا الإجراء بالحساب الفعلي إذا أردت الإيقاف"
        : "Link this action to the real account if you want suspension",
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-black">{isRTL ? "إدارة النزاعات" : "Manage Disputes"}</h1>

      <Card className="mt-6">
        <CardContent className="pt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isRTL ? "رقم المشروع" : "Project ID"}</TableHead>
                <TableHead>{isRTL ? "المُبلّغ" : "Reporter ID"}</TableHead>
                <TableHead>{isRTL ? "الوصف" : "Description"}</TableHead>
                <TableHead>{isRTL ? "الحالة" : "Status"}</TableHead>
                <TableHead>{isRTL ? "إجراءات" : "Actions"}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {isRTL ? "جاري تحميل النزاعات..." : "Loading disputes..."}
                  </TableCell>
                </TableRow>
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {isRTL ? "لا توجد نزاعات" : "No disputes found"}
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((r) => (
                  <TableRow key={r.report_id}>
                    <TableCell className="font-medium">{r.project_id || "-"}</TableCell>
                    <TableCell>{r.client_id || "-"}</TableCell>
                    <TableCell className="max-w-[240px] truncate">{r.description || "-"}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status || "open"} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(r.status === "open" || !r.status) && (
                          <>
                            <Button size="sm" variant="outline" onClick={freezeEscrow}>
                              <Shield className="me-1 h-3 w-3" />
                              {isRTL ? "تجميد" : "Freeze"}
                            </Button>

                            <Button size="sm" variant="outline" onClick={warnUser}>
                              <AlertTriangle className="me-1 h-3 w-3" />
                              {isRTL ? "تحذير" : "Warn"}
                            </Button>

                            <Button size="sm" variant="destructive" onClick={suspendUser}>
                              <Ban className="me-1 h-3 w-3" />
                              {isRTL ? "إيقاف" : "Suspend"}
                            </Button>

                            <Button
                              size="sm"
                              className="bg-success text-success-foreground"
                              onClick={() => updateStatus(r.report_id, "resolved")}
                              disabled={processingId === r.report_id}
                            >
                              <CheckCircle2 className="me-1 h-3 w-3" />
                              {processingId === r.report_id
                                ? isRTL
                                  ? "جارٍ الحفظ..."
                                  : "Saving..."
                                : isRTL
                                  ? "حل"
                                  : "Resolve"}
                            </Button>
                          </>
                        )}

                        {isSupervisor && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate({ to: `/disputes/${r.report_id}/details` as '/' })}
                          >
                            <Eye className="me-1 h-3 w-3" />
                            {isRTL ? "التفاصيل" : "Details"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
