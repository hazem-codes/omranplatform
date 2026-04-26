import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useState, lazy, Suspense } from 'react';
import { projectRequestService } from '@/services/projectRequestService';
import { aiService } from '@/services/aiService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SERVICE_CATEGORIES_DATA, SAUDI_CITIES, type ServiceCategory, SERVICE_CATEGORIES } from '@/types';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { encodeLocation } from '@/lib/locationCodec';
import type { PickedLocation } from '@/components/map/LocationPicker';

const LocationPicker = lazy(() => import('@/components/map/LocationPicker'));

export const Route = createFileRoute('/client/submit-request')({
 component: SubmitRequestPage,
});

function SubmitRequestPage() {
 const { allowed, isLoading: guardLoading } = useAuthGuard('client');
 if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const Arrow = isRTL ? ArrowRight : ArrowLeft;
 const { user } = useAuth();
 const navigate = useNavigate();
 const [form, setForm] = useState({
 title: '', description: '', location: '', budget_min: '', budget_max: '',
 category: '', sub_category: '', area: '', timeline: '',
 });
 const [details, setDetails] = useState({
 project_type: '',
 floors: '',
 finishing_level: '',
 land_type: '',
 plot_status: '',
 style: '',
 permit_stage: '',
 supervision_scope: '',
 survey_type: '',
 });
 const [loading, setLoading] = useState(false);
 const [aiLoading, setAiLoading] = useState(false);
 const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(null);

 const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));
 const updateDetails = (key: string, value: string) => setDetails(d => ({ ...d, [key]: value }));

 const subcategories = form.category
 ? SERVICE_CATEGORIES_DATA[form.category as ServiceCategory]?.subcategories || []
 : [];

 const generateDescription = async () => {
 const draft = form.description.trim();
 const hasRequiredContext = !!form.title.trim() && !!form.location && !!form.category && !!form.sub_category;
 if (!hasRequiredContext || !draft) {
 toast.error(
 isRTL
 ? 'اكتب وصفًا أوليًا قصيرًا واملأ البيانات الأساسية أولًا ليتمكن الذكاء الاصطناعي من تحسين الوصف بناءً على متطلباتك.'
 : 'Write a short draft and complete the required fields first so AI can improve the description based on your requirements.'
 );
 return;
 }

 const context = [
 `${isRTL ? 'عنوان المشروع' : 'Project title'}: ${form.title}`,
 `${isRTL ? 'الفئة' : 'Category'}: ${form.category}`,
 `${isRTL ? 'التخصص الفرعي' : 'Sub-category'}: ${form.sub_category}`,
 `${isRTL ? 'الموقع' : 'Location'}: ${form.location}`,
 form.area ? `${isRTL ? 'المساحة' : 'Area'}: ${form.area}` : '',
 form.timeline ? `${isRTL ? 'المدة' : 'Timeline'}: ${form.timeline}` : '',
 (form.budget_min || form.budget_max)
 ? `${isRTL ? 'الميزانية' : 'Budget'}: ${form.budget_min || '-'} - ${form.budget_max || '-'}`
 : '',
 details.project_type ? `${isRTL ? 'نوع المشروع' : 'Project type'}: ${details.project_type}` : '',
 details.floors ? `${isRTL ? 'عدد الأدوار' : 'Floors'}: ${details.floors}` : '',
 details.finishing_level ? `${isRTL ? 'مستوى التشطيب' : 'Finishing level'}: ${details.finishing_level}` : '',
 details.land_type ? `${isRTL ? 'نوع الأرض' : 'Land type'}: ${details.land_type}` : '',
 details.plot_status ? `${isRTL ? 'وضع الصك/المخطط' : 'Plot status'}: ${details.plot_status}` : '',
 details.style ? `${isRTL ? 'الطراز المطلوب' : 'Preferred style'}: ${details.style}` : '',
 details.permit_stage ? `${isRTL ? 'مرحلة التصريح' : 'Permit stage'}: ${details.permit_stage}` : '',
 details.supervision_scope ? `${isRTL ? 'نطاق الإشراف' : 'Supervision scope'}: ${details.supervision_scope}` : '',
 details.survey_type ? `${isRTL ? 'نوع الرفع المساحي' : 'Survey type'}: ${details.survey_type}` : '',
 ].filter(Boolean).join('\n');

 const prompt = isRTL
 ? `أنت مساعد لتحسين وصف طلب مشروع هندسي. لا تنشئ وصفًا من الصفر. حسّن وصِغ النص التالي فقط بالاعتماد على مسودة المستخدم والسياق.

السياق:
${context}

مسودة المستخدم:
${draft}

المطلوب:
- تحسين الصياغة والوضوح
- تنظيم الوصف بشكل مهني
- الحفاظ على متطلبات المستخدم الأصلية دون اختلاق تفاصيل غير مذكورة.`
 : `You are an assistant that improves an engineering project request description. Do not generate from scratch. Improve and rewrite the following user draft using the provided context.

Context:
${context}

User draft:
${draft}

Requirements:
- Improve clarity and structure
- Keep the tone professional
- Preserve the user's intent and avoid inventing missing facts.`;

 setAiLoading(true);
 try {
 const desc = await aiService.generateDescription(prompt, i18n.language as 'ar' | 'en');
 update('description', desc);
 toast.success('');
 } catch { toast.error('AI generation failed'); }
 finally { setAiLoading(false); }
 };

 const buildStructuredNotes = () => {
 const lines = [
 form.category ? `${isRTL ? 'الفئة' : 'Category'}: ${form.category}` : '',
 form.sub_category ? `${isRTL ? 'التخصص الفرعي' : 'Sub-category'}: ${form.sub_category}` : '',
 details.project_type ? `${isRTL ? 'نوع المشروع' : 'Project type'}: ${details.project_type}` : '',
 form.area ? `${isRTL ? 'المساحة' : 'Area'}: ${form.area} ${isRTL ? 'م²' : 'm²'}` : '',
 details.floors ? `${isRTL ? 'عدد الأدوار' : 'Floors'}: ${details.floors}` : '',
 details.finishing_level ? `${isRTL ? 'مستوى التشطيب' : 'Finishing level'}: ${details.finishing_level}` : '',
 details.land_type ? `${isRTL ? 'نوع الأرض' : 'Land type'}: ${details.land_type}` : '',
 details.plot_status ? `${isRTL ? 'وضع الصك/المخطط' : 'Plot status'}: ${details.plot_status}` : '',
 details.style ? `${isRTL ? 'الطراز المطلوب' : 'Preferred style'}: ${details.style}` : '',
 details.permit_stage ? `${isRTL ? 'مرحلة التصريح' : 'Permit stage'}: ${details.permit_stage}` : '',
 details.supervision_scope ? `${isRTL ? 'نطاق الإشراف' : 'Supervision scope'}: ${details.supervision_scope}` : '',
 details.survey_type ? `${isRTL ? 'نوع الرفع المساحي' : 'Survey type'}: ${details.survey_type}` : '',
 form.timeline ? `${isRTL ? 'المدة المطلوبة' : 'Timeline'}: ${form.timeline} ${isRTL ? 'أسابيع' : 'weeks'}` : '',
 ].filter(Boolean);

 return lines.join('\n');
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 try {
  const budget_range = form.budget_min && form.budget_max
 ? `${form.budget_min} - ${form.budget_max}`
 : '';
 const structured = buildStructuredNotes();
 const encodedLocation = encodeLocation({
 city: form.location,
 latitude: pickedLocation?.latitude,
 longitude: pickedLocation?.longitude,
 formattedAddress: pickedLocation?.formattedAddress,
 });
 await projectRequestService.submit({
 title: form.sub_category ? `${form.title} — ${form.sub_category}` : form.title,
 description: [form.description, structured ? `\n\n${isRTL ? 'تفاصيل هندسية' : 'Engineering Details'}:\n${structured}` : ''].filter(Boolean).join(''),
 location: encodedLocation,
 budget_range,
 client_id: user?.id || '',
 });
 toast.success(isRTL ? 'تم إرسال الطلب. سيتم مراجعته من المشرف.' : 'Request submitted. Will be reviewed by supervisor.');
 navigate({ to: '/client/dashboard' });
 } catch (err: any) { toast.error(err.message); }
 finally { setLoading(false); }
 };

 return (
 <div className="mx-auto max-w-2xl px-4 py-8">
 <div className="mb-4">
 <Button type="button" variant="ghost" size="sm" onClick={() => navigate({ to: '/client/home' })}>
 <Arrow className="h-4 w-4 me-1" />
 {isRTL ? 'العودة' : 'Back'}
 </Button>
 </div>
 <div className="mb-4 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-sm">
 <p className="font-bold text-blue-700 dark:text-blue-300">
 {isRTL ? ' نشر مشروع — سوق مفتوح' : ' Publish Project — Open Marketplace'}
 </p>
 <p className="text-blue-700/80 dark:text-blue-300/80 mt-1 text-xs">
 {isRTL
 ? 'سيُنشر طلبك لعدة مكاتب هندسية بعد موافقة المشرف، وستتلقى عدة عروض أسعار للمقارنة. لاختيار مكتب محدد استخدم "اطلب خدمة" بدلاً من ذلك.'
 : 'After supervisor approval, multiple offices will see your request and submit competing bids. To pick one office instead, use "Request a Service".'}
 </p>
 </div>
 <h1 className="text-2xl font-black mb-2">
 {isRTL ? 'انشر مشروعاً وتلقَّ عروضاً من المكاتب' : 'Publish a Project & Compare Bids'}
 </h1>
 <p className="text-muted-foreground mb-6">{isRTL ? 'سيتم نشر طلبك بعد موافقة المشرف' : 'Your request will be published after supervisor approval'}</p>

 <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border bg-card p-8">
 <div className="space-y-2">
 <Label>{t('projects.project_title')}</Label>
 <Input value={form.title} onChange={e => update('title', e.target.value)} required />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label>{isRTL ? 'فئة الخدمة' : 'Service Category'}</Label>
 <Select value={form.category} onValueChange={v => { update('category', v); update('sub_category', ''); }}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 {SERVICE_CATEGORIES.map(key => (
 <SelectItem key={key} value={key}>{isRTL ? SERVICE_CATEGORIES_DATA[key].ar : SERVICE_CATEGORIES_DATA[key].en}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'التخصص الفرعي' : 'Sub-category'}</Label>
 <Select value={form.sub_category} onValueChange={v => update('sub_category', v)}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 {subcategories.map(s => (
 <SelectItem key={s.key} value={s.key}>{isRTL ? s.ar : s.en}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label>{isRTL ? 'الموقع' : 'Location'}</Label>
 <Select value={form.location} onValueChange={v => update('location', v)}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 {SAUDI_CITIES.map(c => (
 <SelectItem key={c.ar} value={c.ar}>{isRTL ? c.ar : c.en}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'المساحة (م²)' : 'Area (m²)'}</Label>
 <Input type="number" value={form.area} onChange={e => update('area', e.target.value)} dir="ltr" />
 </div>
  </div>

 <div className="rounded-xl border border-dashed bg-muted/20 p-4">
 <Suspense
 fallback={
 <div className="flex items-center justify-center h-72 text-muted-foreground text-sm">
 <Loader2 className="h-4 w-4 animate-spin me-2" />
 {isRTL ? 'جاري تحميل الخريطة...' : 'Loading map...'}
 </div>
 }
 >
 <LocationPicker isRTL={isRTL} onChange={setPickedLocation} />
 </Suspense>
 </div>

 {form.category === 'full_construction' && (
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label>{isRTL ? 'نوع المشروع' : 'Project Type'}</Label>
 <Input value={details.project_type} onChange={e => updateDetails('project_type', e.target.value)} placeholder={isRTL ? 'فيلا / عمارة / تجاري' : 'Villa / apartment / commercial'} />
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'عدد الأدوار' : 'Floors'}</Label>
 <Input type="number" value={details.floors} onChange={e => updateDetails('floors', e.target.value)} dir="ltr" />
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'نوع الأرض' : 'Land Type'}</Label>
 <Input value={details.land_type} onChange={e => updateDetails('land_type', e.target.value)} placeholder={isRTL ? 'صخرية / رملية / مختلطة' : 'Rocky / sandy / mixed'} />
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'مستوى التشطيب' : 'Finishing Level'}</Label>
 <Input value={details.finishing_level} onChange={e => updateDetails('finishing_level', e.target.value)} placeholder={isRTL ? 'اقتصادي / فاخر' : 'Economy / luxury'} />
 </div>
 </div>
 )}

 {form.category === 'architectural_design' && (
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label>{isRTL ? 'نوع المشروع' : 'Project Type'}</Label>
 <Input value={details.project_type} onChange={e => updateDetails('project_type', e.target.value)} placeholder={isRTL ? 'سكني / تجاري' : 'Residential / commercial'} />
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'عدد الأدوار' : 'Floors'}</Label>
 <Input type="number" value={details.floors} onChange={e => updateDetails('floors', e.target.value)} dir="ltr" />
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'وضع الصك/المخطط' : 'Plot Status'}</Label>
 <Input value={details.plot_status} onChange={e => updateDetails('plot_status', e.target.value)} placeholder={isRTL ? 'جاهز / قيد الاعتماد' : 'Ready / under approval'} />
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'الطراز المطلوب' : 'Preferred Style'}</Label>
 <Input value={details.style} onChange={e => updateDetails('style', e.target.value)} placeholder={isRTL ? 'حديث / كلاسيك' : 'Modern / classic'} />
 </div>
 </div>
 )}

 {(form.category === 'permits_consulting' || form.category === 'construction_supervision' || form.category === 'surveying_geomatics') && (
 <div className="grid grid-cols-2 gap-4">
 {(form.category === 'permits_consulting' || form.category === 'construction_supervision') && (
 <>
 <div className="space-y-2">
 <Label>{isRTL ? 'مرحلة التصريح' : 'Permit Stage'}</Label>
 <Input value={details.permit_stage} onChange={e => updateDetails('permit_stage', e.target.value)} placeholder={isRTL ? 'ابتدائي / نهائي' : 'Initial / final'} />
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'نطاق الإشراف' : 'Supervision Scope'}</Label>
 <Input value={details.supervision_scope} onChange={e => updateDetails('supervision_scope', e.target.value)} placeholder={isRTL ? 'إنشائي / معماري / كامل' : 'Structural / architectural / full'} />
 </div>
 </>
 )}
 {form.category === 'surveying_geomatics' && (
 <>
 <div className="space-y-2">
 <Label>{isRTL ? 'نوع الرفع المساحي' : 'Survey Type'}</Label>
 <Input value={details.survey_type} onChange={e => updateDetails('survey_type', e.target.value)} placeholder={isRTL ? 'حدود / كنتور / توقيع' : 'Boundary / contour / staking'} />
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'نوع الأرض' : 'Land Type'}</Label>
 <Input value={details.land_type} onChange={e => updateDetails('land_type', e.target.value)} placeholder={isRTL ? 'مستوية / منحدرة' : 'Flat / sloped'} />
 </div>
 </>
 )}
 </div>
 )}

 <div className="grid grid-cols-3 gap-4">
 <div className="space-y-2">
 <Label>{isRTL ? 'الميزانية (من)' : 'Budget Min'}</Label>
 <Input type="number" value={form.budget_min} onChange={e => update('budget_min', e.target.value)} dir="ltr" />
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'الميزانية (إلى)' : 'Budget Max'}</Label>
 <Input type="number" value={form.budget_max} onChange={e => update('budget_max', e.target.value)} dir="ltr" />
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'المدة (أسابيع)' : 'Timeline (weeks)'}</Label>
 <Input type="number" value={form.timeline} onChange={e => update('timeline', e.target.value)} dir="ltr" />
 </div>
 </div>

 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <Label>{t('projects.description')}</Label>
 <Button
 type="button"
 variant="ghost"
 size="sm"
 onClick={generateDescription}
 disabled={
 aiLoading ||
 !form.title.trim() ||
 !form.location ||
 !form.category ||
 !form.sub_category ||
 !form.description.trim()
 }
 className="text-gold"
 >
 <Sparkles className="h-4 w-4 me-1" />
 {isRTL ? 'توليد وصف بالذكاء الاصطناعي ' : 'AI Generate Description '}
 </Button>
 </div>
 <Textarea value={form.description} onChange={e => update('description', e.target.value)} rows={6} />
 </div>

 <Button type="submit" className="w-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90" disabled={loading}>
 {loading ? t('common.loading') : (isRTL ? 'نشر المشروع للمكاتب' : 'Publish Project to Offices')}
 </Button>
 </form>
 </div>
 );
}
