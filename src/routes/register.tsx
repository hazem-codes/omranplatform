import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { SAUDI_CITIES, OFFICE_TYPES } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { completeOnboarding, resolvePostAuthDestination } from '@/services/authRoutingService';
import omranLogo from '@/assets/omran-logo.png';

export const Route = createFileRoute('/register')({
 component: RegisterPage,
 validateSearch: (search): { type?: string; onboarding?: string } => ({
 type: (search as any).type,
 onboarding: (search as any).onboarding,
 }),
});

function RegisterPage() {
 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const { register, isAuthenticated, role, isLoading, session } = useAuth();
 const navigate = useNavigate();
 const search = useSearch({ from: '/register' });
 const isOnboarding = search.onboarding === '1';
 const initialRole = useMemo(() => {
 if (isOnboarding) return '';
 return search.type === 'office' ? 'engineering_office' : 'client';
 }, [search.type, isOnboarding]);
 const [form, setForm] = useState({
 name: '', email: '', password: '', confirmPassword: '', phone: '',
 role: initialRole as string,
 license_number: '', license_expiry_date: '', city: '', office_type: '',
 coverage_areas: [] as string[], years_experience: '',
 });
 const yearsOptions = [
 { ar: 'أقل من سنة', en: 'Less than 1 year' },
 { ar: '1-3 سنوات', en: '1-3 years' },
 { ar: '3-5 سنوات', en: '3-5 years' },
 { ar: '5-10 سنوات', en: '5-10 years' },
 { ar: 'أكثر من 10 سنوات', en: 'More than 10 years' },
 ];
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [allowSupervisorRole, setAllowSupervisorRole] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

 useEffect(() => {
 if (isLoading) return;
 if (!isAuthenticated && isOnboarding) {
 navigate({ to: '/login' });
 return;
 }

 if (!isAuthenticated) return;

 let cancelled = false;
 (async () => {
 const user = session?.user ?? (await supabase.auth.getUser()).data.user;
 if (!user || cancelled) return;

 if (isOnboarding) {
 const dest = await resolvePostAuthDestination(user.id);
 if (cancelled) return;
 if (!dest.includes('/register?onboarding=1')) {
 navigate({ to: dest as '/' });
 return;
 }

 setForm(prev => ({
 ...prev,
 name: prev.name || (user.user_metadata?.name as string | undefined) || '',
 email: user.email || prev.email,
 role: (role ?? prev.role) as string,
 }));
 const metadataRole = (user.user_metadata?.role as string | undefined) ?? null;
 setAllowSupervisorRole(role === 'supervisor' || metadataRole === 'supervisor');
 setOnboardingChecked(true);
 return;
 }

 const dest = await resolvePostAuthDestination(user.id);
 if (!cancelled) navigate({ to: dest as '/' });
 })();

 return () => {
 cancelled = true;
 };
 }, [isAuthenticated, role, isLoading, navigate, isOnboarding, session?.user]);

 const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

 const toggleCoverage = (city: string) => {
 setForm(f => ({
 ...f,
 coverage_areas: f.coverage_areas.includes(city)
 ? f.coverage_areas.filter(c => c !== city)
 : [...f.coverage_areas, city],
 }));
 };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (isOnboarding && !isAuthenticated) {
      toast.error(isRTL ? 'يجب تسجيل الدخول أولاً' : 'Please sign in first');
      return;
    }
    if (isOnboarding && !form.role) {
      errs.role = isRTL ? 'اختر نوع الحساب أولاً' : 'Please select an account role first';
    }

    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = isRTL ? 'كلمات المرور غير متطابقة' : 'Passwords do not match';
    }
    if (form.role === 'engineering_office') {
      const lic = form.license_number.trim().toUpperCase();
      if (!lic.match(/^SE-\d{5}$/)) {
        errs.license_number = isRTL
          ? 'يجب أن يبدأ رقم الترخيص بـ SE- ثم 5 أرقام (مثال: SE-12345)'
          : 'License must start with SE- followed by 5 digits (e.g., SE-12345)';
      }
      if (!form.phone.match(/^05\d{8}$/)) {
        errs.phone = isRTL
          ? 'يجب أن يبدأ رقم الهاتف بـ 05 ويتكون من 10 أرقام (مثال: 0512345678)'
          : 'Phone must start with 05 and contain 10 digits (e.g., 0512345678)';
      }
      if (!form.city) errs.city = isRTL ? 'اختر المدينة' : 'Select your city';
      if (!form.office_type) errs.office_type = isRTL ? 'اختر نوع المكتب' : 'Select office type';
      if (!form.license_expiry_date) errs.license_expiry_date = isRTL ? 'اختر تاريخ الانتهاء' : 'Select expiry date';
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      const first = Object.values(errs)[0];
      toast.error(first, { duration: 6000 });
      // scroll to first error
      requestAnimationFrame(() => {
        const el = document.querySelector('[data-field-error="true"]');
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
    setFieldErrors({});
    setLoading(true);
 try {
 if (isOnboarding) {
 const user = session?.user ?? (await supabase.auth.getUser()).data.user;
 if (!user?.id) throw new Error(isRTL ? 'تعذر قراءة المستخدم الحالي' : 'Unable to resolve current user');

 const dest = await completeOnboarding(user.id, {
 email: user.email || form.email,
 name: form.name,
 role: form.role as 'client' | 'engineering_office' | 'supervisor',
 phone: form.phone,
 license_number: form.license_number,
 license_expiry_date: form.license_expiry_date,
 city: form.city,
 office_type: form.office_type,
 years_of_experience: form.years_experience,
 coverage_areas: form.coverage_areas,
 });

 if (form.role === 'engineering_office' && licenseFile) {
 const ext = licenseFile.name.split('.').pop();
 const path = `${user.id}/license.${ext}`;
 const upload = await supabase.storage.from('license-files').upload(path, licenseFile, { upsert: true });
 if (!upload.error) {
 const { data: pub } = supabase.storage.from('license-files').getPublicUrl(path);
 const url = pub?.publicUrl;
 if (url) {
 await supabase
 .from('engineering_offices')
 .update({ license_document_url: url } as any)
 .eq('id', user.id);
 }
 }
 }

 toast.success(isRTL ? 'تم إكمال إعداد الحساب' : 'Account setup completed');
 navigate({ to: dest as '/' });
 return;
 }

 const meta: Record<string, string> = { phone: form.phone };
 if (form.role === 'engineering_office') {
 meta.license_number = form.license_number;
 meta.coverage_area = form.coverage_areas.join('، ');
 meta.coverage_areas = JSON.stringify(form.coverage_areas);
 meta.city = form.city;
 meta.office_type = form.office_type;
 meta.years_of_experience = form.years_experience;
 meta.license_expiry_date = form.license_expiry_date;
 meta.description_text = '';
 }
 await register(form.email, form.password, form.name, form.role, meta);

 // Upload license file (best-effort) and patch the office row with the URL
 // directly into the native license_document_url column.
 if (form.role === 'engineering_office' && licenseFile) {
 const { data: { user } } = await supabase.auth.getUser();
 if (user) {
 const ext = licenseFile.name.split('.').pop();
 const path = `${user.id}/license.${ext}`;
 const upload = await supabase.storage.from('license-files').upload(path, licenseFile, { upsert: true });
 if (!upload.error) {
 const { data: pub } = supabase.storage.from('license-files').getPublicUrl(path);
 const url = pub?.publicUrl;
 if (url) {
 await supabase
 .from('engineering_offices')
 .update({ license_document_url: url } as any)
 .eq('id', user.id);
 }
 }
 }
 }

 if (form.role === 'engineering_office') {
 toast.success(isRTL ? 'تم تقديم طلب التسجيل، سيتم مراجعته من قِبل المشرف' : 'Registration submitted. It will be reviewed by a supervisor.');
 } else {
 toast.success(t('auth.register') + ' ');
 }
 navigate({ to: '/login' });
 } catch (err: any) {
 toast.error(err.message || 'Registration failed');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
 <div className="w-full max-w-lg space-y-8">
 <div className="text-center">
 <img src={omranLogo} alt="Omran" className="mx-auto mb-4 h-32 w-32 object-contain" />
 <h1 className="text-2xl font-black">{isOnboarding ? (isRTL ? 'إكمال إعداد الحساب' : 'Complete Account Setup') : t('auth.register')}</h1>
 {isOnboarding && (
 <p className="mt-2 text-sm text-muted-foreground">
 {isRTL ? 'أكمل بياناتك الأساسية للمتابعة داخل المنصة.' : 'Finish the required profile details to continue into the app.'}
 </p>
 )}
 </div>

 {(!isLoading && !isAuthenticated && !isOnboarding) && <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border bg-card p-8 shadow-lg">
 {/* Role selector */}
 <div className="space-y-2">
 <Label>{t('auth.role')}</Label>
 <div className="grid grid-cols-2 gap-2">
 {(['client', 'engineering_office'] as const).map(role => (
 <button key={role} type="button" onClick={() => update('role', role)}
 className={`rounded-lg border p-3 text-sm font-medium transition-all ${form.role === role ? 'border-gold bg-gold/10 text-foreground' : 'border-border text-muted-foreground hover:border-gold/30'}`}>
 {t(`auth.${role}`)}
 </button>
 ))}
 </div>
 </div>

 <div className="space-y-2">
 <Label>{isRTL ? 'الاسم الكامل' : 'Full Name'}{form.role === 'engineering_office' ? (isRTL ? ' (اسم المكتب)' : ' (Office Name)') : ''}</Label>
 <Input value={form.name} onChange={e => update('name', e.target.value)} required />
 </div>
 <div className="space-y-2">
 <Label>{t('auth.email')}</Label>
 <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} required dir="ltr" />
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'رقم الهاتف' : 'Phone Number'}{form.role === 'engineering_office' ? ' (05xxxxxxxx)' : ''}</Label>
 <Input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} dir="ltr" placeholder="05xxxxxxxx" required={form.role === 'engineering_office'} />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label>{t('auth.password')}</Label>
 <Input type="password" value={form.password} onChange={e => update('password', e.target.value)} required dir="ltr" />
 </div>
 <div className="space-y-2">
 <Label>{t('auth.confirm_password')}</Label>
 <Input type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} required dir="ltr" />
 </div>
 </div>

 {/* Office-specific fields */}
 {form.role === 'engineering_office' && (
 <div className="space-y-4 rounded-xl border border-gold/20 bg-gold/5 p-4">
 <div className="space-y-2">
 <Label>{isRTL ? 'رقم الترخيص (هيئة المهندسين السعوديين)' : 'License Number (Saudi Engineers Authority)'}</Label>
 <Input value={form.license_number} onChange={e => update('license_number', e.target.value)} required dir="ltr" placeholder="SE-XXXXX" />
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'تاريخ انتهاء الترخيص' : 'License Expiry Date'}</Label>
 <Input type="date" value={form.license_expiry_date} onChange={e => update('license_expiry_date', e.target.value)} required dir="ltr" />
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'رفع صورة الرخصة (PDF أو صورة)' : 'Upload License File (PDF or Image)'}</Label>
 <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setLicenseFile(e.target.files?.[0] || null)} />
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'المدينة' : 'City'}</Label>
 <Select value={form.city} onValueChange={v => update('city', v)}>
 <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر المدينة' : 'Select City'} /></SelectTrigger>
 <SelectContent>
 {SAUDI_CITIES.map(c => (
 <SelectItem key={c.ar} value={c.ar}>{isRTL ? c.ar : c.en}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'نوع المكتب' : 'Office Type'}</Label>
 <Select value={form.office_type} onValueChange={v => update('office_type', v)}>
 <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر نوع المكتب' : 'Select Office Type'} /></SelectTrigger>
 <SelectContent>
 {OFFICE_TYPES.map(t => (
 <SelectItem key={t.ar} value={t.ar}>{isRTL ? t.ar : t.en}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'مناطق التغطية' : 'Coverage Areas'}</Label>
 <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
 {SAUDI_CITIES.map(c => (
 <button key={c.ar} type="button" onClick={() => toggleCoverage(c.ar)}
 className={`rounded-full px-3 py-1 text-xs border transition-all ${form.coverage_areas.includes(c.ar) ? 'bg-gold/20 border-gold text-foreground' : 'border-border text-muted-foreground hover:border-gold/30'}`}>
 {isRTL ? c.ar : c.en}
 </button>
 ))}
 </div>
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'سنوات الخبرة' : 'Years of Experience'}</Label>
 <Select value={form.years_experience} onValueChange={v => update('years_experience', v)}>
 <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر' : 'Select'} /></SelectTrigger>
 <SelectContent>
 {yearsOptions.map(y => (
 <SelectItem key={y.ar} value={y.ar}>{isRTL ? y.ar : y.en}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </div>
 )}

 <Button type="submit" className="w-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90" disabled={loading}>
 {loading ? t('common.loading') : t('auth.register')}
 </Button>

 <div className="relative my-2">
 <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
 <span className="relative flex justify-center text-xs uppercase">
 <span className="bg-card px-2 text-muted-foreground">{isRTL ? 'أو استخدم' : 'Or use'}</span>
 </span>
 </div>

 <GoogleSignInButton isRTL={isRTL} mode="signup" redirectPath="/register?onboarding=1" />
 </form>}

 {(isOnboarding && isAuthenticated && onboardingChecked) && <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border bg-card p-8 shadow-lg">
 <div className="space-y-2">
 <Label>{t('auth.role')}</Label>
 <div className={`grid gap-2 ${allowSupervisorRole ? 'grid-cols-3' : 'grid-cols-2'}`}>
 {([
 'client',
 'engineering_office',
 ...(allowSupervisorRole ? ['supervisor'] : []),
 ] as const).map(role => (
 <button key={role} type="button" onClick={() => update('role', role)}
 className={`rounded-lg border p-3 text-sm font-medium transition-all ${form.role === role ? 'border-gold bg-gold/10 text-foreground' : 'border-border text-muted-foreground hover:border-gold/30'}`}>
 {t(`auth.${role}`)}
 </button>
 ))}
 </div>
 </div>

 <div className="space-y-2">
 <Label>{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
 <Input type="email" value={form.email} disabled dir="ltr" className="bg-muted" />
 </div>

 <div className="space-y-2">
 <Label>{isRTL ? 'الاسم الكامل' : 'Full Name'}{form.role === 'engineering_office' ? (isRTL ? ' (اسم المكتب)' : ' (Office Name)') : ''}</Label>
 <Input value={form.name} onChange={e => update('name', e.target.value)} required />
 </div>

 <div className="space-y-2">
 <Label>{isRTL ? 'رقم الهاتف' : 'Phone Number'}{form.role === 'engineering_office' ? ' (05xxxxxxxx)' : ''}</Label>
 <Input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} dir="ltr" placeholder="05xxxxxxxx" required />
 </div>

 {form.role === 'engineering_office' && (
 <div className="space-y-4 rounded-xl border border-gold/20 bg-gold/5 p-4">
 <div className="space-y-2">
 <Label>{isRTL ? 'رقم الترخيص (هيئة المهندسين السعوديين)' : 'License Number (Saudi Engineers Authority)'}</Label>
 <Input value={form.license_number} onChange={e => update('license_number', e.target.value)} required dir="ltr" placeholder="SE-XXXXX" />
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'تاريخ انتهاء الترخيص' : 'License Expiry Date'}</Label>
 <Input type="date" value={form.license_expiry_date} onChange={e => update('license_expiry_date', e.target.value)} required dir="ltr" />
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'رفع صورة الرخصة (PDF أو صورة)' : 'Upload License File (PDF or Image)'}</Label>
 <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setLicenseFile(e.target.files?.[0] || null)} />
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'المدينة' : 'City'}</Label>
 <Select value={form.city} onValueChange={v => update('city', v)}>
 <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر المدينة' : 'Select City'} /></SelectTrigger>
 <SelectContent>
 {SAUDI_CITIES.map(c => (
 <SelectItem key={c.ar} value={c.ar}>{isRTL ? c.ar : c.en}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'نوع المكتب' : 'Office Type'}</Label>
 <Select value={form.office_type} onValueChange={v => update('office_type', v)}>
 <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر نوع المكتب' : 'Select Office Type'} /></SelectTrigger>
 <SelectContent>
 {OFFICE_TYPES.map(t => (
 <SelectItem key={t.ar} value={t.ar}>{isRTL ? t.ar : t.en}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'مناطق التغطية' : 'Coverage Areas'}</Label>
 <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
 {SAUDI_CITIES.map(c => (
 <button key={c.ar} type="button" onClick={() => toggleCoverage(c.ar)}
 className={`rounded-full px-3 py-1 text-xs border transition-all ${form.coverage_areas.includes(c.ar) ? 'bg-gold/20 border-gold text-foreground' : 'border-border text-muted-foreground hover:border-gold/30'}`}>
 {isRTL ? c.ar : c.en}
 </button>
 ))}
 </div>
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'سنوات الخبرة' : 'Years of Experience'}</Label>
 <Select value={form.years_experience} onValueChange={v => update('years_experience', v)}>
 <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر' : 'Select'} /></SelectTrigger>
 <SelectContent>
 {yearsOptions.map(y => (
 <SelectItem key={y.ar} value={y.ar}>{isRTL ? y.ar : y.en}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </div>
 )}

 <Button type="submit" className="w-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90" disabled={loading || !form.role}>
 {loading ? t('common.loading') : (isRTL ? 'إكمال الإعداد' : 'Complete Setup')}
 </Button>
 </form>}

 {!isOnboarding && (
 <p className="text-center text-sm text-muted-foreground">
 {t('auth.has_account')}{' '}
 <Link to="/login" className="font-medium text-gold hover:underline">{t('auth.login')}</Link>
 </p>
 )}
 </div>
 </div>
 );
}
