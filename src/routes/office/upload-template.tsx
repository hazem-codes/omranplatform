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
 <div className="mx-auto max-w-4xl px-4 py-8">
 <div className="mb-4">
 <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/office/home' })}>
 <Arrow className="h-4 w-4 me-1" />
 {isRTL ? 'العودة' : 'Back'}
 </Button>
 </div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">{isRTL ? 'قوالب مكتبي' : 'My Templates'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRTL ? 'ارفع قوالب جاهزة وأدر منشوراتك في سوق القوالب' : 'Publish ready-made templates and manage your marketplace listings'}
          </p>
        </div>
        <Button type="button" onClick={scrollToAddForm} className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
          <Plus className="h-4 w-4 me-2" />
          {isRTL ? 'إضافة قالب جديد' : 'Add New Template'}
        </Button>
      </div>
      <form id="add-template-form" onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-4 rounded-2xl border bg-card p-8 scroll-mt-24">
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
          <h2 className="text-lg font-bold">
            {isRTL ? 'قوالبي الحالية' : 'My Templates'}{' '}
            <span className="text-sm font-medium text-muted-foreground">({templates.length})</span>
          </h2>
          <Button type="button" variant="outline" size="sm" onClick={loadTemplates} disabled={loadingTemplates}>
            <RefreshCcw className={`h-4 w-4 me-1 ${loadingTemplates ? 'animate-spin' : ''}`} />
            {isRTL ? 'تحديث' : 'Refresh'}
          </Button>
        </div>
        {loadingTemplates ? (
          <div className="py-8 text-center text-muted-foreground">{isRTL ? 'جاري تحميل القوالب...' : 'Loading templates...'}</div>
        ) : templates.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card/50 p-10 text-center text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{isRTL ? 'لا توجد قوالب مضافة بعد. أضف أول قالب لك أعلاه.' : 'No templates added yet. Add your first template above.'}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {templates.map((tpl) => {
              const previewImg = tpl.preview_image_url
                || (typeof tpl.description === 'string' ? (tpl.description.match(/Preview Image URL:\s*(\S+)/i)?.[1] || tpl.description.match(/رابط صورة المعاينة:\s*(\S+)/)?.[1]) : null)
                || null;
              const catLabel = tpl.category ? labelCat(tpl.category) : '';
              const subLabel = tpl.category && tpl.sub_category ? labelSub(tpl.category, tpl.sub_category) : '';
              return (
                <div key={tpl.template_id} className="rounded-2xl border bg-card overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {previewImg ? (
                      <img src={previewImg} alt={tpl.title || ''} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <FileImage className="h-10 w-10 opacity-40" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold leading-tight line-clamp-2">
                        {tpl.title || (isRTL ? 'قالب بدون اسم' : 'Untitled template')}
                      </h3>
                      <StatusBadge status={getTemplateStatus(tpl)} />
                    </div>
                    {(catLabel || subLabel) && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {catLabel && <Badge variant="outline" className="gap-1"><Tag className="h-3 w-3" />{catLabel}</Badge>}
                        {subLabel && <Badge variant="outline">{subLabel}</Badge>}
                      </div>
                    )}
                    <div className="mt-3 text-lg font-black text-gold">
                      {tpl.price ? `${Number(tpl.price).toLocaleString()} ${t('common.sar')}` : '-'}
                    </div>
                    <div className="mt-4 flex gap-2 pt-3 border-t">
                      <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setPreviewTpl(tpl)}>
                        <Eye className="h-4 w-4 me-1" />
                        {isRTL ? 'تفاصيل / معاينة' : 'Details / Preview'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmDeleteId(tpl.template_id)}
                        disabled={deletingId === tpl.template_id}
                      >
                        {deletingId === tpl.template_id ? <Loader2 className="h-4 w-4 me-1 animate-spin" /> : <Trash2 className="h-4 w-4 me-1" />}
                        {isRTL ? 'حذف' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewTpl} onOpenChange={(open) => { if (!open) setPreviewTpl(null); }}>
        <DialogContent className="max-w-4xl max-h-[90dvh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
          {previewTpl && (() => {
            const previewImg = previewTpl.preview_image_url
              || (typeof previewTpl.description === 'string' ? (previewTpl.description.match(/Preview Image URL:\s*(\S+)/i)?.[1] || previewTpl.description.match(/رابط صورة المعاينة:\s*(\S+)/)?.[1]) : null)
              || null;
            const catLabel = previewTpl.category ? labelCat(previewTpl.category) : '';
            const subLabel = previewTpl.category && previewTpl.sub_category ? labelSub(previewTpl.category, previewTpl.sub_category) : '';
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl">
                    {previewTpl.title || (isRTL ? 'قالب بدون اسم' : 'Untitled template')}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  {previewImg && (
                    <div className="rounded-lg overflow-hidden border bg-muted">
                      <img src={previewImg} alt={previewTpl.title || ''} className="w-full max-h-72 object-cover" />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {catLabel && <Badge variant="outline" className="gap-1"><Tag className="h-3 w-3" />{catLabel}</Badge>}
                    {subLabel && <Badge variant="outline">{subLabel}</Badge>}
                    <StatusBadge status={getTemplateStatus(previewTpl)} />
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">{isRTL ? 'السعر' : 'Price'}</p>
                    <p className="text-2xl font-black text-gold">
                      {previewTpl.price ? `${Number(previewTpl.price).toLocaleString()} ${t('common.sar')}` : '-'}
                    </p>
                  </div>

                  {previewTpl.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{isRTL ? 'التفاصيل' : 'Details'}</p>
                      <p className="text-sm whitespace-pre-wrap">{previewTpl.description}</p>
                    </div>
                  )}

                  {previewTpl.file_url && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{isRTL ? 'ملف القالب' : 'Template File'}</p>
                      <a href={previewTpl.file_url} target="_blank" rel="noreferrer" className="text-sm text-primary underline break-all">
                        {previewTpl.file_url}
                      </a>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    {isRTL ? 'أُضيف في' : 'Added on'}{' '}
                    {previewTpl.created_at ? new Date(previewTpl.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US') : '—'}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setPreviewTpl(null)}>
                    {isRTL ? 'إغلاق' : 'Close'}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? 'تأكيد الحذف' : 'Confirm Deletion'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL ? 'هل أنت متأكد من حذف هذا القالب؟ لا يمكن التراجع' : 'Are you sure you want to delete this template? This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (confirmDeleteId) deleteTemplate(confirmDeleteId); }}
            >
              {isRTL ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
