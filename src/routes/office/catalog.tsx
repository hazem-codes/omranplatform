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
 toast.success('');
 } catch (err: any) { toast.error(err.message); }
 finally { setRemovingId(null); }
 };

 return (
 <div className="mx-auto max-w-4xl px-4 py-8">
 <div className="mb-4">
 <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/office/home' })}>
 <Arrow className="h-4 w-4 me-1" />
 {isRTL ? 'العودة' : 'Back'}
 </Button>
 </div>
 <h1 className="text-2xl font-black mb-6">{isRTL ? 'إدارة كتالوج الخدمات' : 'Manage Service Catalog'}</h1>

 <div className={`mb-6 rounded-xl border p-4 text-sm ${isOfficeVerified ? 'border-success/30 bg-success/5 text-success' : 'border-warning/30 bg-warning/5 text-warning'}`}>
 {isOfficeVerified
 ? (isRTL
 ? 'مكتبك معتمد لدى المشرف. خدماتك تظهر للعملاء في سوق الخدمات.'
 : 'Your office is supervisor-verified. Your services are visible to clients in the marketplace.')
 : (isRTL
 ? 'خدمات الكتالوج تظهر للعملاء فقط بعد اعتماد المكتب من المشرف (لا يوجد اعتماد منفصل لكل خدمة في المخطط الحالي).'
 : 'Catalog services become visible to clients only after office verification by a supervisor (no separate per-service approval exists in current schema).')}
 </div>

 <div className="rounded-2xl border bg-card p-6 mb-6 space-y-4">
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

 <div className="space-y-2">
 {items.map(item => {
 const cat = SERVICE_CATEGORIES_DATA[item.category as ServiceCategory];
 const sub = cat?.subcategories.find(s => s.key === item.sub_category);
 return (
 <div key={item.catalog_id} className="flex items-center justify-between rounded-xl border p-4">
 <div>
 <span className="font-medium">{isRTL ? cat?.ar : cat?.en || item.category}</span>
 {sub && <span className="text-sm text-muted-foreground ms-2">/ {isRTL ? sub.ar : sub.en}</span>}
 <div className="text-sm text-gold mt-1">
 {item.price ? `${Number(item.price).toLocaleString()} ${sar}` : '—'}
 {item.pricing_model === 'per_m2' ? ` / ${isRTL ? 'م²' : 'm²'}` : ''}
 </div>
 </div>
 <Button variant="ghost" size="icon" onClick={() => removeService(item.catalog_id)} disabled={removingId === item.catalog_id}>
 {removingId === item.catalog_id ? <Loader2 className="h-4 w-4 text-destructive animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
 </Button>
 </div>
 );
 })}
 </div>
 </div>
 );
}
