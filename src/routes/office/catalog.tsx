import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { serviceCatalogService } from '@/services/serviceCatalogService';
import { engineeringOfficeService } from '@/services/engineeringOfficeService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, ArrowLeft, ArrowRight, Loader2, Eye, Tag, MapPin, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { SERVICE_CATEGORIES_DATA, type ServiceCategory, SERVICE_CATEGORIES } from '@/types';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export const Route = createFileRoute('/office/catalog')({
 component: CatalogPage,
});

function CatalogPage() {
 const { allowed, isLoading: guardLoading } = useAuthGuard('engineering_office');
 if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

 const { i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const Arrow = isRTL ? ArrowRight : ArrowLeft;
 const navigate = useNavigate();
 const { user } = useAuth();
 const [items, setItems] = useState<any[]>([]);
 const [category, setCategory] = useState('');
 const [subCategory, setSubCategory] = useState('');
 const [pricingModel, setPricingModel] = useState('fixed');
 const [price, setPrice] = useState('');
  const [addingService, setAddingService] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isOfficeVerified, setIsOfficeVerified] = useState<boolean | null>(null);
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const sar = isRTL ? 'ر.س' : 'SAR';

 const subcategories = category
 ? SERVICE_CATEGORIES_DATA[category as ServiceCategory]?.subcategories || []
 : [];

 useEffect(() => {
 if (user?.id) {
 serviceCatalogService.getByOffice(user.id).then(setItems).catch(() => {});
 engineeringOfficeService.getOfficeProfile(user.id)
 .then((office) => setIsOfficeVerified(Boolean(office?.is_verified)))
 .catch(() => setIsOfficeVerified(null));
 }
 }, [user?.id]);

 const addService = async () => {
 if (!category || !user?.id) return;
 try {
 setAddingService(true);
 const item = await serviceCatalogService.addService(user.id, {
 category,
 sub_category: subCategory,
 pricing_model: pricingModel,
 price: price ? parseFloat(price) : undefined,
 });
 setItems(prev => [...prev, item]);
 setCategory(''); setSubCategory(''); setPrice('');
 toast.success('');
 } catch (err: any) { toast.error(err.message); }
 finally { setAddingService(false); }
 };

  const removeService = async (id: string) => {
    try {
      setRemovingId(id);
      await serviceCatalogService.deleteService(id);
      setItems(prev => prev.filter(i => i.catalog_id !== id));
      toast.success(isRTL ? 'تم حذف الخدمة' : 'Service deleted');
    } catch (err: any) { toast.error(err.message); }
    finally { setRemovingId(null); setConfirmDeleteId(null); }
  };

  const scrollToAddForm = () => {
    document.getElementById('add-service-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const labelCat = (key: string) => {
    const cat = SERVICE_CATEGORIES_DATA[key as ServiceCategory];
    return cat ? (isRTL ? cat.ar : cat.en) : key;
  };
  const labelSub = (catKey: string, subKey: string) => {
    const cat = SERVICE_CATEGORIES_DATA[catKey as ServiceCategory];
    const sub = cat?.subcategories.find(s => s.key === subKey);
    return sub ? (isRTL ? sub.ar : sub.en) : subKey;
  };
  const pricingLabel = (model: string) =>
    model === 'per_m2' ? (isRTL ? 'بالمتر المربع' : 'Per m²') : (isRTL ? 'سعر ثابت' : 'Fixed Price');

  // Default cover image per service category. Keys cover both English DB enum keys
  // and the Arabic labels requested in the spec, so either resolves to an image.
  const CATEGORY_IMAGES: Record<string, string> = {
    architectural_design: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400',
    'تصميم معماري': 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400',
    interior_design: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400',
    'تصميم داخلي': 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400',
    construction_supervision: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
    'إشراف هندسي': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
    structural_engineering: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    'تصميم إنشائي': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    soil_studies: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=400',
    'دراسات تربة': 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=400',
    mep_engineering: 'https://images.unsplash.com/photo-1621905251189-08b45249ff78?w=400',
    'مخططات MEP': 'https://images.unsplash.com/photo-1621905251189-08b45249ff78?w=400',
    engineering_consultations: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
    'استشارات هندسية': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
    permits_consulting: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400',
    'مخططات وتصاريح': 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400',
  };
  const imageFor = (item: any): string => {
    return (
      item?.image_url ||
      CATEGORY_IMAGES[item?.category] ||
      CATEGORY_IMAGES[labelCat(item?.category)] ||
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=400'
    );
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
          <h1 className="text-3xl font-black">{isRTL ? 'خدمات مكتبي' : 'My Services'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRTL ? 'أدر خدماتك الظاهرة للعملاء في السوق' : 'Manage the services visible to clients in the marketplace'}
          </p>
        </div>
        <Button onClick={scrollToAddForm} className="bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90">
          <Plus className="h-4 w-4 me-2" />
          {isRTL ? 'إضافة خدمة جديدة' : 'Add New Service'}
        </Button>
      </div>

 <div className={`mb-6 rounded-xl border p-4 text-sm ${isOfficeVerified ? 'border-success/30 bg-success/5 text-success' : 'border-warning/30 bg-warning/5 text-warning'}`}>
 {isOfficeVerified
 ? (isRTL
 ? 'مكتبك معتمد لدى المشرف. خدماتك تظهر للعملاء في سوق الخدمات.'
 : 'Your office is supervisor-verified. Your services are visible to clients in the marketplace.')
 : (isRTL
 ? 'خدمات الكتالوج تظهر للعملاء فقط بعد اعتماد المكتب من المشرف (لا يوجد اعتماد منفصل لكل خدمة في المخطط الحالي).'
 : 'Catalog services become visible to clients only after office verification by a supervisor (no separate per-service approval exists in current schema).')}
 </div>

 <div id="add-service-form" className="rounded-2xl border bg-card p-6 mb-6 space-y-4 scroll-mt-24">
 <h3 className="font-bold">{isRTL ? 'إضافة خدمة جديدة' : 'Add New Service'}</h3>
 <div className="grid gap-4 md:grid-cols-2">
 <div className="space-y-2">
 <Label>{isRTL ? 'الفئة' : 'Category'}</Label>
 <Select value={category} onValueChange={v => { setCategory(v); setSubCategory(''); }}>
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
 <Select value={subCategory} onValueChange={setSubCategory}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 {subcategories.map(s => (
 <SelectItem key={s.key} value={s.key}>{isRTL ? s.ar : s.en}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'نموذج التسعير' : 'Pricing Model'}</Label>
 <Select value={pricingModel} onValueChange={setPricingModel}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="fixed">{isRTL ? 'سعر ثابت' : 'Fixed Price'}</SelectItem>
 <SelectItem value="per_m2">{isRTL ? 'بالمتر المربع' : 'Per m²'}</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'السعر' : 'Price'} ({sar})</Label>
 <Input type="number" value={price} onChange={e => setPrice(e.target.value)} dir="ltr" />
 </div>
 </div>
 <Button onClick={addService} className="bg-gradient-gold text-gold-foreground hover:opacity-90" disabled={addingService || !category}>
 {addingService ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Plus className="h-4 w-4 me-2" />}
 {addingService ? (isRTL ? 'جارٍ الإضافة...' : 'Adding...') : (isRTL ? 'إضافة' : 'Add')}
 </Button>
 </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{isRTL ? 'خدماتي الحالية' : 'My Current Services'}</h2>
        <span className="text-sm text-muted-foreground">{items.length} {isRTL ? 'خدمة' : 'services'}</span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/50 p-10 text-center text-muted-foreground">
          <Wrench className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{isRTL ? 'لا توجد خدمات بعد. أضف أول خدمة لك أعلاه.' : 'No services yet. Add your first service above.'}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map(item => {
            const catLabel = labelCat(item.category);
            const subLabel = item.sub_category ? labelSub(item.category, item.sub_category) : '';
            const isActive = isOfficeVerified;
            return (
              <div key={item.catalog_id} className="rounded-2xl border bg-card overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <div className="relative h-32 w-full bg-muted">
                  <img src={imageFor(item)} alt={catLabel} className="h-full w-full object-cover" loading="lazy" />
                </div>
                <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold leading-tight">
                    {catLabel}
                    {subLabel && <span className="block text-sm font-medium text-muted-foreground mt-0.5">{subLabel}</span>}
                  </h3>
                  <Badge variant={isActive ? 'default' : 'secondary'} className={isActive ? 'bg-success text-success-foreground' : ''}>
                    {isActive ? (isRTL ? 'نشطة' : 'Active') : (isRTL ? 'بانتظار الاعتماد' : 'Pending')}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Tag className="h-3 w-3" />{catLabel}
                  </Badge>
                  {subLabel && (
                    <Badge variant="outline">{subLabel}</Badge>
                  )}
                </div>

                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                  {item.description || (isRTL ? 'لا يوجد وصف لهذه الخدمة بعد.' : 'No description provided yet.')}
                </p>

                <div className="mt-4 text-xl font-black text-gold">
                  {item.price ? `${Number(item.price).toLocaleString()} ${sar}` : (isRTL ? 'السعر عند الطلب' : 'Price on request')}
                  {item.pricing_model === 'per_m2' && (
                    <span className="text-xs font-medium text-muted-foreground ms-1">/ {isRTL ? 'م²' : 'm²'}</span>
                  )}
                  <span className="block text-xs font-medium text-muted-foreground mt-0.5">{pricingLabel(item.pricing_model)}</span>
                </div>

                <div className="mt-4 flex gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setPreviewItem(item)}>
                    <Eye className="h-4 w-4 me-1" />
                    {isRTL ? 'تفاصيل / معاينة' : 'Details / Preview'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setConfirmDeleteId(item.catalog_id)}
                    disabled={removingId === item.catalog_id}
                  >
                    {removingId === item.catalog_id ? <Loader2 className="h-4 w-4 me-1 animate-spin" /> : <Trash2 className="h-4 w-4 me-1" />}
                    {isRTL ? 'حذف' : 'Delete'}
                  </Button>
                </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={(open) => { if (!open) setPreviewItem(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
          {previewItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {labelCat(previewItem.category)}
                  {previewItem.sub_category && (
                    <span className="block text-sm font-medium text-muted-foreground mt-1">
                      {labelSub(previewItem.category, previewItem.sub_category)}
                    </span>
                  )}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1"><Tag className="h-3 w-3" />{labelCat(previewItem.category)}</Badge>
                  {previewItem.sub_category && <Badge variant="outline">{labelSub(previewItem.category, previewItem.sub_category)}</Badge>}
                  <Badge variant={isOfficeVerified ? 'default' : 'secondary'} className={isOfficeVerified ? 'bg-success text-success-foreground' : ''}>
                    {isOfficeVerified ? (isRTL ? 'نشطة' : 'Active') : (isRTL ? 'بانتظار الاعتماد' : 'Pending')}
                  </Badge>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">{isRTL ? 'السعر' : 'Price'}</p>
                  <p className="text-2xl font-black text-gold">
                    {previewItem.price ? `${Number(previewItem.price).toLocaleString()} ${sar}` : (isRTL ? 'السعر عند الطلب' : 'Price on request')}
                    {previewItem.pricing_model === 'per_m2' && (
                      <span className="text-sm font-medium text-muted-foreground ms-1">/ {isRTL ? 'م²' : 'm²'}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{pricingLabel(previewItem.pricing_model)}</p>
                </div>

                {previewItem.description && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{isRTL ? 'الوصف' : 'Description'}</p>
                    <p className="text-sm whitespace-pre-wrap">{previewItem.description}</p>
                  </div>
                )}

                {previewItem.coverage_area && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gold mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'منطقة التغطية' : 'Coverage Area'}</p>
                      <p className="text-sm">{previewItem.coverage_area}</p>
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground pt-2 border-t">
                  {isRTL ? 'أُضيفت في' : 'Added on'}{' '}
                  {previewItem.created_at ? new Date(previewItem.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US') : '—'}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewItem(null)}>
                  {isRTL ? 'إغلاق' : 'Close'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}>
        <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? 'تأكيد الحذف' : 'Confirm Deletion'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL ? 'هل أنت متأكد من حذف هذه الخدمة؟ لا يمكن التراجع' : 'Are you sure you want to delete this service? This cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (confirmDeleteId) removeService(confirmDeleteId); }}
            >
              {isRTL ? 'حذف' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
