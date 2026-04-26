import { supabase } from "@/integrations/supabase/client";
import { notificationService } from "./notificationService";

export const supervisorService = {
  async getOfficeRegistrations() {
    const { data, error } = await supabase
      .from("engineering_offices")
      .select("*")
      .or("is_verified.eq.false,is_verified.is.null");

    console.log("getOfficeRegistrations =>", { data, error });
    if (error) throw error;
    return data;
  },

  async approveOfficeRegistration(officeId: string) {
    const { data, error } = await supabase
      .from("engineering_offices")
      .update({ is_verified: true })
      .eq("id", officeId)
      .select()
      .single();

    console.log("approveOfficeRegistration =>", { data, error });
    if (error) throw error;

    await notificationService.send(officeId, "تم قبول تسجيل مكتبك، يمكنك الآن استخدام المنصة");
    return data;
  },

  async rejectOfficeRegistration(officeId: string, reason: string) {
    const { data, error } = await supabase
      .from("engineering_offices")
      .update({ is_verified: false })
      .eq("id", officeId)
      .select()
      .single();

    console.log("rejectOfficeRegistration =>", { data, error });
    if (error) throw error;

    await notificationService.send(officeId, `تم رفض تسجيل مكتبك. السبب: ${reason}`);
    return data;
  },

  async getProjectRequests() {
    const { data, error } = await supabase
      .from("project_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    console.log("getProjectRequests =>", { data, error });
    if (error) throw error;
    return data;
  },

  async approveProjectRequest(requestId: string) {
    const { data, error } = await supabase
      .from("project_requests")
      .update({ status: "approved" })
      .eq("request_id", requestId)
      .select()
      .single();

    console.log("approveProjectRequest =>", { data, error });
    if (error) throw error;
    return data;
  },

  async rejectProjectRequest(requestId: string, feedback: string) {
    const { data, error } = await supabase
      .from("project_requests")
      .update({ status: "rejected" })
      .eq("request_id", requestId)
      .select()
      .single();

    console.log("rejectProjectRequest =>", { data, error, feedback });
    if (error) throw error;
    return data;
  },

  async getPendingTemplates() {
    const { data, error } = await supabase.from("templates").select("*").eq("is_approved", false);

    console.log("getPendingTemplates =>", { data, error });
    if (error) throw error;
    return data;
  },

  async approveTemplate(templateId: string) {
    const { data, error } = await supabase
      .from("templates")
      .update({ is_approved: true, is_available: true })
      .eq("template_id", templateId)
      .select()
      .single();

    console.log("approveTemplate =>", { data, error });
    if (error) throw error;
    return data;
  },

  async rejectTemplate(templateId: string, reason: string) {
    const { data, error } = await supabase
      .from("templates")
      .update({ is_approved: false })
      .eq("template_id", templateId)
      .select()
      .single();

    console.log("rejectTemplate =>", { data, error, reason });
    if (error) throw error;
    return data;
  },

  async getAllReports() {
    const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false });

    console.log("getAllReports =>", { data, error });
    if (error) throw error;
    return data;
  },

  async resolveReport(reportId: string, decision: string) {
    const { data, error } = await supabase
      .from("reports")
      .update({ status: decision })
      .eq("report_id", reportId)
      .select()
      .single();

    console.log("resolveReport =>", { data, error });
    if (error) throw error;
    return data;
  },

  async getAllAccounts() {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, name, email, role");

    console.log("getAllAccounts profiles =>", { profiles, error });
    if (error) throw error;

    const ids = (profiles ?? []).map((p: any) => p.id);
    if (!ids.length) return [];

    const [{ data: clients, error: clientsError }, { data: offices, error: officesError }] = await Promise.all([
      supabase.from("clients").select("id, is_active").in("id", ids),
      supabase.from("engineering_offices").select("id, is_verified, is_active").in("id", ids),
    ]);

    if (clientsError) throw clientsError;
    if (officesError) throw officesError;

    const clientsById = new Map((clients ?? []).map((c: any) => [c.id, c]));
    const officesById = new Map((offices ?? []).map((o: any) => [o.id, o]));

    return (profiles ?? []).map((p: any) => {
      let isActive: boolean | null = null;
      if (p.role === "client") {
        isActive = clientsById.get(p.id)?.is_active ?? null;
      } else if (p.role === "engineering_office") {
        isActive = officesById.get(p.id)?.is_active ?? null;
      }
      return {
        ...p,
        is_active: isActive,
        is_verified: officesById.get(p.id)?.is_verified ?? null,
      };
    });
  },

  async suspendAccount(userId: string) {
    return this.setAccountActive(userId, "client", false);
  },

  async setAccountActive(userId: string, role: string, active: boolean) {
    const table = role === "engineering_office" ? "engineering_offices" : "clients";
    const { data, error } = await supabase
      .from(table)
      .update({ is_active: active })
      .eq("id", userId)
      .select("id, is_active")
      .maybeSingle();

    console.log("setAccountActive =>", { table, userId, active, data, error });
    if (error) throw error;
    if (!data) throw new Error("No account row found for this user");
    return true;
  },

  async freezeEscrow(escrowId: string) {
    const { data, error } = await supabase
      .from("escrow")
      .update({ status: "frozen" })
      .eq("escrow_id", escrowId)
      .select()
      .single();

    console.log("freezeEscrow =>", { data, error });
    if (error) throw error;
    return data;
  },

  async getOfficeRegistrationById(officeId: string) {
    const { data: office, error } = await supabase
      .from("engineering_offices")
      .select("*")
      .eq("id", officeId)
      .maybeSingle();
    if (error) throw error;
    if (!office) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name, email, role")
      .eq("id", officeId)
      .maybeSingle();

    // Read native columns directly. Fall back to JSON-packed metadata for any office row
    // created before the migration so older rows still display correctly.
    const { unpackMeta } = await import('@/lib/officeMeta');
    const { description: cleanDesc, meta } = unpackMeta((office as any).description);

    return {
      ...office,
      description: cleanDesc,
      phone: (office as any).phone ?? meta.phone ?? null,
      city: (office as any).city ?? meta.city ?? null,
      office_type: (office as any).office_type ?? meta.office_type ?? null,
      years_of_experience: (office as any).years_of_experience ?? meta.years_of_experience ?? null,
      license_document_url: (office as any).license_document_url ?? meta.license_document_url ?? null,
      coverage_areas: meta.coverage_areas ?? null,
      profile: profile ?? null,
    };
  },

  async getProjectRequestById(requestId: string) {
    const { data: request, error } = await supabase
      .from("project_requests")
      .select("*")
      .eq("request_id", requestId)
      .maybeSingle();
    if (error) throw error;
    if (!request) return null;

    let clientProfile: any = null;
    let clientPhone: string | null = null;
    if (request.client_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, email, role")
        .eq("id", request.client_id)
        .maybeSingle();
      clientProfile = profile ?? null;

      const { data: client } = await supabase
        .from("clients")
        .select("phone")
        .eq("id", request.client_id)
        .maybeSingle();
      clientPhone = client?.phone ?? null;
    }

    return { ...request, client_profile: clientProfile, client_phone: clientPhone };
  },

  async approveOffice(officeId: string) {
    return this.approveOfficeRegistration(officeId);
  },
  async rejectOffice(officeId: string) {
    return this.rejectOfficeRegistration(officeId, "");
  },
  async getPendingOffices() {
    return this.getOfficeRegistrations();
  },
  async getAllProfiles() {
    return this.getAllAccounts();
  },
  async getPendingRequests() {
    return this.getProjectRequests();
  },
  async getOpenReports() {
    return this.getAllReports();
  },
};
