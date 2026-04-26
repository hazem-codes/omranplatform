import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supervisorService } from "@/services/supervisorService";
import { serviceCatalogService } from "@/services/serviceCatalogService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/supervisor/office/$id")({
  component: OfficeProfilePage,
});

function OfficeProfilePage() {
  const { id } = Route.useParams();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const navigate = useNavigate();

  const [data, setData] = useState<any | null>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [office, svc] = await Promise.all([
          supervisorService.getOfficeRegistrationById(id),
          serviceCatalogService.getByOffice(id).catch(() => []),
        ]);
        setData(office);
        setServices(svc ?? []);
      } catch (err: any) {
        console.error("OfficeProfilePage error =>", err);
        toast.error(err?.message || (isRTL ? "تعذر تحميل البيانات" : "Failed to load"));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-muted-foreground">{isRTL ? "جارٍ التحميل..." : "Loading..."}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-muted-foreground">{isRTL ? "لا توجد بيانات" : "No data"}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate({ to: "/supervisor/accounts" })}>
          <BackIcon className="me-1 h-4 w-4" />
          {isRTL ? "رجوع" : "Back"}
        </Button>
      </div>
    );
  }

  const profile = data.profile ?? {};
  const isVerified = data.is_verified === true;
  const isActive = data.is_active !== false;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate({ to: "/supervisor/accounts" })}>
          <BackIcon className="me-1 h-4 w-4" />
          {isRTL ? "رجوع للحسابات" : "Back to Accounts"}
        </Button>
        <Link to="/supervisor/chat/$id" params={{ id }}>
          <Button size="sm">
            <MessageSquare className="me-1 h-4 w-4" />
            {isRTL ? "تواصل" : "Contact"}
          </Button>
        </Link>
      </div>

      <h1 className="mt-6 text-3xl font-black">
        {profile.name || (isRTL ? "مكتب هندسي" : "Engineering Office")}
      </h1>

      <div className="mt-2 flex flex-wrap gap-2">
        <Badge variant="secondary">{isRTL ? "مكتب هندسي" : "Office"}</Badge>
        {isActive ? (
          <Badge className="bg-success text-success-foreground">{isRTL ? "نشط" : "Active"}</Badge>
        ) : (
          <Badge variant="destructive">{isRTL ? "موقوف" : "Suspended"}</Badge>
        )}
        {isVerified ? (
          <Badge variant="outline" className="border-success text-success">
            {isRTL ? "موثّق" : "Verified"}
          </Badge>
        ) : (
          <Badge variant="outline">{isRTL ? "قيد التحقق" : "Pending Verification"}</Badge>
        )}
      </div>

      <Card className="mt-6">
        <CardContent className="pt-6 space-y-2 text-sm">
          <Row label={isRTL ? "الاسم الكامل" : "Full name"} value={profile.name} />
          <Row label={isRTL ? "البريد الإلكتروني" : "Email"} value={profile.email} />
          <Row label={isRTL ? "نوع الحساب" : "Account type"} value={isRTL ? "مكتب هندسي" : "Engineering Office"} />
          <Row label={isRTL ? "معرّف الحساب" : "Account ID"} value={data.id} />
          <Row label={isRTL ? "رقم الهاتف" : "Phone"} value={data.phone} />
          <Row label={isRTL ? "المدينة" : "City"} value={data.city} />
          <Row label={isRTL ? "نوع المكتب" : "Office type"} value={data.office_type} />
          <Row label={isRTL ? "سنوات الخبرة" : "Years of experience"} value={data.years_of_experience} />
          <Row label={isRTL ? "رقم الترخيص" : "License number"} value={data.license_number} />
          <Row label={isRTL ? "تاريخ انتهاء الترخيص" : "License expiry"} value={data.license_expiry_date} />
          <Row label={isRTL ? "مناطق التغطية" : "Coverage area"} value={data.coverage_area} />
          <Row label={isRTL ? "الوصف" : "Description"} value={data.description} />
          {data.license_document_url && (
            <Row
              label={isRTL ? "وثيقة الترخيص" : "License document"}
              value={
                <a href={data.license_document_url} target="_blank" rel="noreferrer" className="text-primary underline">
                  {isRTL ? "عرض الوثيقة" : "View document"}
                </a>
              }
            />
          )}
        </CardContent>
      </Card>

      <h2 className="mt-8 text-xl font-bold">{isRTL ? "الخدمات المقدمة" : "Services Offered"}</h2>
      <Card className="mt-3">
        <CardContent className="pt-6">
          {services.length === 0 ? (
            <p className="text-muted-foreground text-sm">{isRTL ? "لا توجد خدمات" : "No services listed"}</p>
          ) : (
            <ul className="divide-y">
              {services.map((s: any) => (
                <li key={s.catalog_id} className="flex justify-between py-2 text-sm">
                  <span>
                    <span className="font-medium">{s.category}</span>
                    {s.sub_category ? <span className="text-muted-foreground"> / {s.sub_category}</span> : null}
                  </span>
                  <span className="text-muted-foreground">
                    {s.price ? `${s.price} ${isRTL ? "ر.س" : "SAR"}` : ""}
                    {s.pricing_model ? ` · ${s.pricing_model}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: any }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex justify-between gap-4 border-b py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-end break-all">
        {typeof value === "string" || typeof value === "number" ? String(value) : value}
      </span>
    </div>
  );
}
