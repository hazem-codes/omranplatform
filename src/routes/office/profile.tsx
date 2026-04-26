import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, MapPin, Image, ArrowLeft, ArrowRight, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAuth } from '@/context/AuthContext';
import { engineeringOfficeService } from '@/services/engineeringOfficeService';
import { supabase } from '@/integrations/supabase/client';
import { SAUDI_CITIES, OFFICE_TYPES } from '@/types';
import { packMeta, unpackMeta } from '@/lib/officeMeta';

export const Route = createFileRoute('/office/profile')({
  component: OfficeProfilePage,
});

const yearsOptions = [
  { ar: 'أقل من سنة', en: 'Less than 1 year' },
  { ar: '1-3 سنوات', en: '1-3 years' },
  { ar: '3-5 سنوات', en: '3-5 years' },
  { ar: '5-10 سنوات', en: '5-10 years' },
  { ar: 'أكثر من 10 سنوات', en: 'More than 10 years' },
];

function OfficeProfilePage() {
  const { allowed, isLoading: guardLoading } = useAuthGuard('engineering_office');
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile] = useState({
    name: '',
    license_number: '',
    license_expiry_date: '',
    description: '',
    phone: '',
    city: '',
    office_type: '',
    years_of_experience: '',
    coverage_areas: [] as string[],
    license_document_url: '',
  });
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const office: any = await engineeringOfficeService.getOfficeProfile(user.id);
        const { data: prof } = await supabase.from('profiles').select('name').eq('id', user.id).maybeSingle();
        const { description, meta } = unpackMeta(office?.description);
        if (cancelled) return;
        const coverage = Array.isArray(meta.coverage_areas)
          ? meta.coverage_areas
          : typeof office?.coverage_area === 'string' && office.coverage_area.length
            ? office.coverage_area.split(/[,،]/).map((s: string) => s.trim()).filter(Boolean)
            : [];
        setProfile({
          name: prof?.name || '',
          license_number: office?.license_number || '',
          license_expiry_date: office?.license_expiry_date || '',
          description,
          phone: office?.phone ?? meta.phone ?? '',
          city: office?.city ?? meta.city ?? '',
          office_type: office?.office_type ?? meta.office_type ?? '',
          years_of_experience: office?.years_of_experience ?? meta.years_of_experience ?? '',
          coverage_areas: coverage,
          license_document_url: office?.license_document_url ?? meta.license_document_url ?? '',
        });
      } catch {
        // ignore — page still renders empty form
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const loadPortfolio = async () => {
      setPortfolioLoading(true);
      setPortfolioError(null);
      try {
        const data = await engineeringOfficeService.getPortfolio(user.id);
        if (cancelled) return;
        setPortfolio(Array.isArray(data) ? data.filter((item: any) => item && item.portfolio_id) : []);
      } catch {
        if (!cancelled) {
          setPortfolio([]);
          setPortfolioError(isRTL ? 'تعذر تحميل معرض الأعمال حالياً' : 'Unable to load portfolio right now');
        }
      } finally {
        if (!cancelled) setPortfolioLoading(false);
      }
    };

    loadPortfolio();
    return () => { cancelled = true; };
  }, [user?.id, isRTL]);

  const toggleCoverage = (city: string) => {
    setProfile(p => ({
      ...p,
      coverage_areas: p.coverage_areas.includes(city)
        ? p.coverage_areas.filter(c => c !== city)
        : [...p.coverage_areas, city],
    }));
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      let licenseUrl = profile.license_document_url;
      if (licenseFile) {
        const ext = licenseFile.name.split('.').pop();
        const path = `${user.id}/license.${ext}`;
        const upload = await supabase.storage.from('license-files').upload(path, licenseFile, { upsert: true });
        if (!upload.error) {
          const { data: pub } = supabase.storage.from('license-files').getPublicUrl(path);
          if (pub?.publicUrl) licenseUrl = pub.publicUrl;
        }
      }

      // Save directly to native columns. coverage_areas remains stored as a comma list
      // in coverage_area (no native array column); we still pack it into description as
      // a JSON array for the chip UI to round-trip cleanly.
      const packed = packMeta(profile.description, {
        coverage_areas: profile.coverage_areas,
      });

      const updateRow: Record<string, any> = {
        coverage_area: profile.coverage_areas.join('، '),
        description: packed,
        license_expiry_date: profile.license_expiry_date || null,
        phone: profile.phone || null,
        city: profile.city || null,
        office_type: profile.office_type || null,
        years_of_experience: profile.years_of_experience || null,
        license_document_url: licenseUrl || null,
      };

      await supabase.from('engineering_offices').update(updateRow as any).eq('id', user.id);

      if (profile.name) {
        await supabase.from('profiles').update({ name: profile.name }).eq('id', user.id);
      }

      setProfile(p => ({ ...p, license_document_url: licenseUrl }));
      setLicenseFile(null);
      toast.success(isRTL ? 'تم حفظ الملف الشخصي' : 'Profile saved');
    } catch (e: any) {
      toast.error(e?.message || (isRTL ? 'تعذر الحفظ' : 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/office/home' })}>
          <Arrow className="h-4 w-4 me-1" />
          {isRTL ? 'العودة' : 'Back'}
        </Button>
      </div>
      <h1 className="text-3xl font-black">{isRTL ? 'الملف الشخصي' : 'Office Profile'}</h1>

      <Card className="mt-6">
        <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />{isRTL ? 'معلومات المكتب' : 'Office Info'}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin me-2" />{isRTL ? 'جاري التحميل...' : 'Loading...'}</div>
          ) : (
            <>
              <div><Label>{isRTL ? 'اسم المكتب' : 'Office Name'}</Label><Input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} className="mt-1" /></div>
              <div><Label>{isRTL ? 'رقم الهاتف' : 'Phone'}</Label><Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="mt-1" dir="ltr" placeholder="05xxxxxxxx" /></div>
              <div><Label>{isRTL ? 'رقم الترخيص' : 'License Number'}</Label><Input value={profile.license_number} disabled className="mt-1 bg-muted" /></div>
              <div><Label>{isRTL ? 'تاريخ انتهاء الترخيص' : 'License Expiry Date'}</Label><Input type="date" value={profile.license_expiry_date} onChange={e => setProfile(p => ({ ...p, license_expiry_date: e.target.value }))} className="mt-1" dir="ltr" /></div>

              <div>
                <Label>{isRTL ? 'صورة الرخصة (PDF أو صورة)' : 'License File (PDF or image)'}</Label>
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png" className="mt-1" onChange={e => setLicenseFile(e.target.files?.[0] || null)} />
                {profile.license_document_url && (
                  <a href={profile.license_document_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm text-primary hover:underline">
                    <FileText className="h-4 w-4" />{isRTL ? 'عرض الملف الحالي' : 'View current file'}
                  </a>
                )}
              </div>

              <div>
                <Label>{isRTL ? 'المدينة' : 'City'}</Label>
                <Select value={profile.city} onValueChange={v => setProfile(p => ({ ...p, city: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={isRTL ? 'اختر' : 'Select'} /></SelectTrigger>
                  <SelectContent>
                    {SAUDI_CITIES.map(c => <SelectItem key={c.ar} value={c.ar}>{isRTL ? c.ar : c.en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{isRTL ? 'نوع المكتب' : 'Office Type'}</Label>
                <Select value={profile.office_type} onValueChange={v => setProfile(p => ({ ...p, office_type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={isRTL ? 'اختر' : 'Select'} /></SelectTrigger>
                  <SelectContent>
                    {OFFICE_TYPES.map(o => <SelectItem key={o.ar} value={o.ar}>{isRTL ? o.ar : o.en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-1"><MapPin className="h-4 w-4" />{isRTL ? 'مناطق التغطية' : 'Coverage Areas'}</Label>
                <div className="mt-2 flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {SAUDI_CITIES.map(c => (
                    <button key={c.ar} type="button" onClick={() => toggleCoverage(c.ar)}
                      className={`rounded-full px-3 py-1 text-xs border transition-all ${profile.coverage_areas.includes(c.ar) ? 'bg-primary/15 border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}>
                      {isRTL ? c.ar : c.en}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>{isRTL ? 'سنوات الخبرة' : 'Years of Experience'}</Label>
                <Select value={profile.years_of_experience} onValueChange={v => setProfile(p => ({ ...p, years_of_experience: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder={isRTL ? 'اختر' : 'Select'} /></SelectTrigger>
                  <SelectContent>
                    {yearsOptions.map(y => <SelectItem key={y.ar} value={y.ar}>{isRTL ? y.ar : y.en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div><Label>{isRTL ? 'الوصف' : 'Description'}</Label><Textarea value={profile.description} onChange={e => setProfile(p => ({ ...p, description: e.target.value }))} className="mt-1" rows={3} /></div>

              <Button className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                {saving ? (isRTL ? 'جارٍ الحفظ...' : 'Saving...') : (isRTL ? 'حفظ التغييرات' : 'Save Changes')}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <h2 className="mt-10 text-xl font-bold flex items-center gap-2"><Image className="h-5 w-5 text-primary" />{isRTL ? 'معرض الأعمال' : 'Portfolio'}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {portfolioLoading ? (
          <div className="col-span-full rounded-xl border bg-card p-8 text-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
            {isRTL ? 'جاري تحميل معرض الأعمال...' : 'Loading portfolio...'}
          </div>
        ) : portfolioError ? (
          <div className="col-span-full rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center text-destructive text-sm">
            {portfolioError}
          </div>
        ) : portfolio.length === 0 ? (
          <div className="col-span-full rounded-xl border bg-card p-8 text-center text-muted-foreground">
            {isRTL ? 'لا توجد عناصر في معرض الأعمال بعد' : 'No portfolio items yet'}
          </div>
        ) : portfolio.map(p => (
          <Card key={p.portfolio_id} className="overflow-hidden">
            <img
              src={p.image_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80'}
              alt={p.project_title || (isRTL ? 'عنصر معرض أعمال' : 'Portfolio item')}
              className="h-40 w-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80';
              }}
            />
            <CardContent className="p-3">
              <p className="font-semibold text-sm">{p.project_title || (isRTL ? 'مشروع بدون عنوان' : 'Untitled project')}</p>
              <p className="text-xs text-muted-foreground capitalize">{p.category || '-'}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
