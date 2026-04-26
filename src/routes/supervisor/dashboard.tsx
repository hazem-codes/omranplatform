import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { supervisorService } from "@/services/supervisorService";
import { useAuth } from "@/context/AuthContext";
import { Building2, FileText, Briefcase, AlertTriangle, Shield, XCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/supervisor/dashboard")({
  component: SupervisorDashboard,
});

function SupervisorDashboard() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { role } = useAuth();
  const isSupervisor = role === 'supervisor';
  const navigate = useNavigate();

  const [pendingOffices, setPendingOffices] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [pendingTemplates, setPendingTemplates] = useState<any[]>([]);
  const [openReports, setOpenReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<{ type: string; id: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [offices, requests, templates, reports] = await Promise.all([
        supervisorService.getPendingOffices(),
        supervisorService.getPendingRequests(),
        supervisorService.getPendingTemplates(),
        supervisorService.getOpenReports(),
      ]);
      setPendingOffices(offices ?? []);
      setPendingRequests(requests ?? []);
      setPendingTemplates(templates ?? []);
      setOpenReports(reports ?? []);
    } catch (err: any) {
      toast.error(err?.message || (isRTL ? "تعذر تحميل بيانات لوحة التحكم" : "Failed to load dashboard data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const approveOffice = async (id: string) => {
    try {
      await supervisorService.approveOffice(id);
      toast.success(isRTL ? "تمت الموافقة على المكتب" : "Office approved");
      await loadDashboardData();
    } catch (err: any) { toast.error(err?.message || "Failed"); }
  };

  const approveRequest = async (id: string) => {
    try {
      await supervisorService.approveProjectRequest(id);
      toast.success(isRTL ? "تمت الموافقة على الطلب" : "Request approved");
      await loadDashboardData();
    } catch (err: any) { toast.error(err?.message || "Failed"); }
  };

  const approveTemplate = async (id: string) => {
    try {
      await supervisorService.approveTemplate(id);
      toast.success(isRTL ? "تمت الموافقة على القالب" : "Template approved");
      await loadDashboardData();
    } catch (err: any) { toast.error(err?.message || "Failed"); }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      if (rejectTarget.type === 'office') {
        await supervisorService.rejectOfficeRegistration(rejectTarget.id, rejectReason);
      } else if (rejectTarget.type === 'request') {
        await supervisorService.rejectProjectRequest(rejectTarget.id, rejectReason);
      } else if (rejectTarget.type === 'template') {
        await supervisorService.rejectTemplate(rejectTarget.id, rejectReason);
      }
      toast.success(isRTL ? "تم الرفض" : "Rejected");
      setRejectTarget(null);
      setRejectReason("");
      await loadDashboardData();
    } catch (err: any) { toast.error(err?.message || "Failed"); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
        <Shield className="h-8 w-8 text-gold" />
        {t("nav.dashboard")}
      </h1>

      <div className="grid gap-4 md:grid-cols-4 mb-8">
        {[
          { label: t("supervisor.review_registrations"), value: pendingOffices.length, icon: Building2, color: "text-warning" },
          { label: t("supervisor.review_requests"), value: pendingRequests.length, icon: FileText, color: "text-gold" },
          { label: t("supervisor.review_templates"), value: pendingTemplates.length, icon: Briefcase, color: "text-success" },
          { label: t("supervisor.manage_disputes"), value: openReports.length, icon: AlertTriangle, color: "text-destructive" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <span className="text-3xl font-black">{loading ? "..." : stat.value}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pending Offices */}
      <div className="rounded-2xl border bg-card mb-6">
        <div className="p-6 border-b"><h2 className="text-lg font-bold">{t("supervisor.review_registrations")}</h2></div>
        <div className="divide-y">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">{isRTL ? "جاري التحميل..." : "Loading..."}</div>
          ) : pendingOffices.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">{t("common.no_data")}</div>
          ) : (
            pendingOffices.map((office) => (
              <div key={office.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{t("auth.license_number")}: {office.license_number || "-"}</p>
                  <p className="text-sm text-muted-foreground">{office.coverage_area || "-"}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => approveOffice(office.id)} className="bg-success text-success-foreground hover:bg-success/90">{t("supervisor.approve")}</Button>
                  <Button size="sm" variant="destructive" onClick={() => setRejectTarget({ type: 'office', id: office.id })}>
                    <XCircle className="me-1 h-3 w-3" />{t("supervisor.reject") || (isRTL ? 'رفض' : 'Reject')}
                  </Button>
                  {isSupervisor && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate({ to: `/registrations/${office.id}/details` as '/' })}
                    >
                      <Eye className="me-1 h-3 w-3" />{isRTL ? 'التفاصيل' : 'Details'}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pending Requests */}
      <div className="rounded-2xl border bg-card mb-6">
        <div className="p-6 border-b"><h2 className="text-lg font-bold">{t("supervisor.review_requests")}</h2></div>
        <div className="divide-y">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">{isRTL ? "جاري التحميل..." : "Loading..."}</div>
          ) : pendingRequests.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">{t("common.no_data")}</div>
          ) : (
            pendingRequests.map((req) => (
              <div key={req.request_id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{req.title || "-"}</p>
                  <p className="text-sm text-muted-foreground">{req.location || "-"} • {req.budget_range || "-"}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => approveRequest(req.request_id)} className="bg-success text-success-foreground hover:bg-success/90">{t("supervisor.approve")}</Button>
                  <Button size="sm" variant="destructive" onClick={() => setRejectTarget({ type: 'request', id: req.request_id })}>
                    <XCircle className="me-1 h-3 w-3" />{t("supervisor.reject") || (isRTL ? 'رفض' : 'Reject')}
                  </Button>
                  {isSupervisor && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate({ to: `/requests/${req.request_id}/details` as '/' })}
                    >
                      <Eye className="me-1 h-3 w-3" />{isRTL ? 'التفاصيل' : 'Details'}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pending Templates */}
      <div className="rounded-2xl border bg-card">
        <div className="p-6 border-b"><h2 className="text-lg font-bold">{t("supervisor.review_templates")}</h2></div>
        <div className="divide-y">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">{isRTL ? "جاري التحميل..." : "Loading..."}</div>
          ) : pendingTemplates.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">{t("common.no_data")}</div>
          ) : (
            pendingTemplates.map((tpl) => (
              <div key={tpl.template_id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{tpl.title || "-"}</p>
                  <p className="text-sm text-muted-foreground">{tpl.price?.toLocaleString?.() ?? tpl.price ?? "-"} {t("common.sar")}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => approveTemplate(tpl.template_id)} className="bg-success text-success-foreground hover:bg-success/90">{t("supervisor.approve")}</Button>
                  <Button size="sm" variant="destructive" onClick={() => setRejectTarget({ type: 'template', id: tpl.template_id })}>
                    <XCircle className="me-1 h-3 w-3" />{t("supervisor.reject") || (isRTL ? 'رفض' : 'Reject')}
                  </Button>
                  {isSupervisor && (
                    <Button size="sm" variant="outline" onClick={() => navigate({ to: `/templates/${tpl.template_id}/details` as '/' })}>
                      <Eye className="me-1 h-3 w-3" />{isRTL ? 'التفاصيل' : 'Details'}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reject Dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={() => { setRejectTarget(null); setRejectReason(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{isRTL ? 'سبب الرفض' : 'Rejection Reason'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isRTL ? 'السبب (اختياري)' : 'Reason (optional)'}</Label>
              <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} />
            </div>
            <Button variant="destructive" className="w-full" onClick={handleReject}>
              <XCircle className="h-4 w-4 me-2" />{isRTL ? 'تأكيد الرفض' : 'Confirm Reject'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
