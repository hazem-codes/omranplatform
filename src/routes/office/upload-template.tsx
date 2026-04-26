import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { templateService } from '@/services/templateService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, ArrowRight, Loader2, Trash2, RefreshCcw, Plus, Eye, FileImage, Tag, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { SERVICE_CATEGORIES, SERVICE_CATEGORIES_DATA, type ServiceCategory } from '@/types';
import { StatusBadge } from '@/components/StatusBadge';
import { supabase } from '@/integrations/supabase/client';

export const Route = createFileRoute('/office/upload-template')({
 component: UploadTemplatePage,
});

function UploadTemplatePage() {
 const { allowed, isLoading: guardLoading } = useAuthGuard('engineering_office');
 if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

 const { t, i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const Arrow = isRTL ? ArrowRight : ArrowLeft;
 const { user } = useAuth();
 const navigate = useNavigate();
 const [form, setForm] = useState({
 title: '',
 category: '',
 sub_category: '',
 overview: '',
 specifications: '',
 deliverables: '',
 preview_image_url: '',
 brochure_url: '',
 price: '',
 });
 const [templateFile, setTemplateFile] = useState<File | null>(null);
 const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewTpl, setPreviewTpl] = useState<any | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const labelCat = (key: string) => {
    const cat = SERVICE_CATEGORIES_DATA[key as ServiceCategory];
    return cat ? (isRTL ? cat.ar : cat.en) : key;
  };
  const labelSub = (catKey: string, subKey: string) => {
    const cat = SERVICE_CATEGORIES_DATA[catKey as ServiceCategory];
    const sub = cat?.subcategories.find(s => s.key === subKey);
    return sub ? (isRTL ? sub.ar : sub.en) : subKey;
  };
  const scrollToAddForm = () => {
    document.getElementById('add-template-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

 const subcategories = form.category
 ? SERVICE_CATEGORIES_DATA[form.category as ServiceCategory]?.subcategories || []
 : [];

 const update = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

 const buildStructuredDescription = () => {
 const sections = [
 form.overview ? `${isRTL ? 'نبذة' : 'Overview'}:\n${form.overview}` : '',
 form.specifications ? `${isRTL ? 'المواصفات الهندسية' : 'Engineering Specifications'}:\n${form.specifications}` : '',
 form.deliverables ? `${isRTL ? 'المخرجات المتضمنة' : 'Included Deliverables'}:\n${form.deliverables}` : '',
 form.preview_image_url ? `${isRTL ? 'رابط صورة المعاينة' : 'Preview Image URL'}: ${form.preview_image_url}` : '',
 form.brochure_url ? `${isRTL ? 'رابط البروشور/الملف' : 'Brochure/File URL'}: ${form.brochure_url}` : '',
 ].filter(Boolean);

 return sections.join('\n\n');
 };

 const loadTemplates = async () => {
 if (!user?.id) return;
 setLoadingTemplates(true);
 try {
 const data = await templateService.getByOffice(user.id);
 setTemplates(data ?? []);
 } catch {
 setTemplates([]);
 } finally {
 setLoadingTemplates(false);
 }
 };

 const getTemplateStatus = (tpl: any): string => {
 if (tpl.is_approved && tpl.is_available) return 'approved';
 if (tpl.is_approved === false && tpl.is_available) return 'active';
 if (tpl.is_approved === false) return 'pending';
 return 'pending';
 };

 const deleteTemplate = async (templateId: string) => {
 setDeletingId(templateId);
 try {
 await templateService.delete(templateId);
 toast.success(isRTL ? 'تم حذف القالب' : 'Template deleted');
 await loadTemplates();
 } catch (err: any) {
 toast.error(err?.message || (isRTL ? 'تعذر حذف القالب' : 'Failed to delete template'));
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

 useEffect(() => {
 loadTemplates();
 }, [user?.id]);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 try {
 let fileUrl = form.brochure_url || '';
 if (templateFile && user?.id) {
 const ext = templateFile.name.split('.').pop();
 const path = `${user.id}/${Date.now()}.${ext}`;
 const upload = await supabase.storage.from('template-files').upload(path, templateFile, { upsert: true });
 if (!upload.error) {
 const { data: pub } = supabase.storage.from('template-files').getPublicUrl(path);
 if (pub?.publicUrl) fileUrl = pub.publicUrl;
 }
 }
 await templateService.upload({
 office_id: user?.id || '',
 title: form.title,
 description: buildStructuredDescription(),
 price: Number(form.price),
 category: form.category,
 sub_category: form.sub_category,
 file_url: fileUrl || undefined,
 });
 toast.success(t('templates.upload') + ' ');
 setForm({ title: '', category: '', sub_category: '', overview: '', specifications: '', deliverables: '', preview_image_url: '', brochure_url: '', price: '' });
 setTemplateFile(null);
 await loadTemplates();
 } catch (err: any) { toast.error(err.message); }
 finally { setLoading(false); }
 };

 return (
 <div className="mx-auto max-w-2xl px-4 py-8">
 <div className="mb-4">
 <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/office/home' })}>
 <Arrow className="h-4 w-4 me-1" />
 {isRTL ? 'العودة' : 'Back'}
 </Button>
 </div>
 <h1 className="text-2xl font-black mb-2">{isRTL ? 'إضافة قالب هندسي جاهز' : 'Add Ready-made Engineering Template'}</h1>
 <p className="text-muted-foreground mb-6">{isRTL ? 'ارفع قالباً جاهزاً مع تفاصيل هندسية واضحة للمشتري' : 'Publish a ready-made template with clear engineering details'}</p>
 <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border bg-card p-8">
 <div className="space-y-2">
 <Label>{isRTL ? 'اسم القالب' : 'Template Title'}</Label>
 <Input value={form.title} onChange={e => update('title', e.target.value)} required />
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'الفئة الرئيسية' : 'Category'}</Label>
 <Select value={form.category} onValueChange={(v) => { update('category', v); update('sub_category', ''); }}>
 <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر الفئة' : 'Choose category'} /></SelectTrigger>
 <SelectContent>
 {SERVICE_CATEGORIES.map((key) => (
 <SelectItem key={key} value={key}>{isRTL ? SERVICE_CATEGORIES_DATA[key as ServiceCategory].ar : SERVICE_CATEGORIES_DATA[key as ServiceCategory].en}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 {form.category && (
 <div className="space-y-2">
 <Label>{isRTL ? 'الفئة الفرعية' : 'Sub-category'}</Label>
 <Select value={form.sub_category} onValueChange={(v) => update('sub_category', v)}>
 <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر الفئة الفرعية' : 'Choose sub-category'} /></SelectTrigger>
 <SelectContent>
 {subcategories.map(s => (
 <SelectItem key={s.key} value={s.key}>{isRTL ? s.ar : s.en}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 )}
 <div className="space-y-2">
 <Label>{isRTL ? 'ملف القالب (PDF أو صورة)' : 'Template File (PDF or image)'}</Label>
 <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setTemplateFile(e.target.files?.[0] || null)} />
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'وصف مختصر' : 'Overview'}</Label>
 <Textarea value={form.overview} onChange={e => update('overview', e.target.value)} rows={3} />
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'المواصفات/التفاصيل الهندسية' : 'Engineering Specifications'}</Label>
 <Textarea value={form.specifications} onChange={e => update('specifications', e.target.value)} rows={4} />
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'المخرجات المتضمنة' : 'Included Deliverables'}</Label>
 <Textarea value={form.deliverables} onChange={e => update('deliverables', e.target.value)} rows={3} />
 </div>
 <div className="grid gap-4 md:grid-cols-2">
 <div className="space-y-2">
 <Label>{isRTL ? 'رابط صورة المعاينة' : 'Preview Image URL'}</Label>
 <Input value={form.preview_image_url} onChange={e => update('preview_image_url', e.target.value)} placeholder="https://..." dir="ltr" />
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'رابط البروشور/الملف' : 'Brochure/File URL'}</Label>
 <Input value={form.brochure_url} onChange={e => update('brochure_url', e.target.value)} placeholder="https://..." dir="ltr" />
 </div>
 </div>
 <div className="space-y-2">
 <Label>{t('bids.price')} ({t('common.sar')})</Label>
 <Input type="number" value={form.price} onChange={e => update('price', e.target.value)} dir="ltr" required />
 </div>
 <Button type="submit" className="w-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90" disabled={loading}>
 {loading ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
 {loading ? (isRTL ? 'جارٍ النشر...' : 'Publishing...') : (isRTL ? 'نشر القالب' : 'Publish Template')}
 </Button>
 </form>

 <div className="mt-8 rounded-2xl border bg-card p-6">
 <div className="mb-4 flex items-center justify-between">
 <h2 className="text-lg font-bold">{isRTL ? 'قوالبي الحالية' : 'My Templates'}</h2>
 <Button type="button" variant="outline" size="sm" onClick={loadTemplates} disabled={loadingTemplates}>
 <RefreshCcw className={`h-4 w-4 me-1 ${loadingTemplates ? 'animate-spin' : ''}`} />
 {isRTL ? 'تحديث' : 'Refresh'}
 </Button>
 </div>
 {loadingTemplates ? (
 <div className="py-8 text-center text-muted-foreground">{isRTL ? 'جاري تحميل القوالب...' : 'Loading templates...'}</div>
 ) : templates.length === 0 ? (
 <div className="py-8 text-center text-muted-foreground">{isRTL ? 'لا توجد قوالب مضافة بعد' : 'No templates added yet'}</div>
 ) : (
 <div className="space-y-3">
 {templates.map((tpl) => (
 <div key={tpl.template_id} className="flex items-center justify-between rounded-xl border p-4">
 <div>
 <p className="font-semibold">{tpl.title || (isRTL ? 'قالب بدون اسم' : 'Untitled template')}</p>
 <p className="text-sm text-muted-foreground">{tpl.price ? `${Number(tpl.price).toLocaleString()} ${t('common.sar')}` : '-'}</p>
 <div className="mt-2 flex items-center gap-2">
 <StatusBadge status={getTemplateStatus(tpl)} />
 <span className="text-xs text-muted-foreground">
 {tpl.is_approved ? (isRTL ? 'معتمد للعرض' : 'Approved for marketplace') : (isRTL ? 'بانتظار/مرفوض من المشرف' : 'Pending/rejected by supervisor')}
 </span>
 </div>
 </div>
 <Button
 type="button"
 variant="outline"
 size="sm"
 className="text-destructive"
 onClick={() => deleteTemplate(tpl.template_id)}
 disabled={deletingId === tpl.template_id}
 >
 {deletingId === tpl.template_id ? <Loader2 className="h-4 w-4 me-1 animate-spin" /> : <Trash2 className="h-4 w-4 me-1" />}
 {isRTL ? 'حذف' : 'Delete'}
 </Button>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 );
}
