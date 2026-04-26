import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { templateService } from '@/services/templateService';
import { templatePurchaseService } from '@/services/templatePurchaseService';
import { messagingService } from '@/services/messagingService';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, Eye, ShoppingCart, FileText, MapPin, Filter, ArrowLeft, ArrowRight, Loader2, FileImage, Package, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { SERVICE_CATEGORIES_DATA, type ServiceCategory, SERVICE_CATEGORIES } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export const Route = createFileRoute('/client/templates')({
 component: TemplatesPage,
});

// Curated, professional category cover images (Unsplash, free to use).
// Used as a high-quality fallback when a template has no preview_image_url.
const CATEGORY_COVERS: Record<string, string> = {
 architectural_design: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=70',
 structural_engineering: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?auto=format&fit=crop&w=900&q=70',
 construction_supervision: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=70',
 mep_engineering: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=70',
 finishing_works: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=70',
 engineering_consultations: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=70',
 surveying: 'https://images.unsplash.com/photo-1606189934846-a527add8a77b?auto=format&fit=crop&w=900&q=70',
 project_management: 'https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=900&q=70',
};

const DEFAULT_INCLUDED = [
 { ar: 'مخططات PDF', en: 'PDF drawings' },
 { ar: 'وثائق التراخيص', en: 'Permit documents' },
 { ar: 'ملفات CAD', en: 'CAD files' },
 { ar: 'جداول الكميات', en: 'BOQ / specifications' },
];

function TemplatesPage() {
 const { allowed, isLoading: guardLoading } = useAuthGuard('client');
 const { i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const Arrow = isRTL ? ArrowRight : ArrowLeft;
 const navigate = useNavigate();
 const { user } = useAuth();
 const sar = isRTL ? 'ر.س' : 'SAR';

 const [dbTemplates, setDbTemplates] = useState<any[]>([]);
 const [selectedCategory, setSelectedCategory] = useState<string>('all');
 const [priceRange, setPriceRange] = useState<string>('all');
 const [previewItem, setPreviewItem] = useState<any | null>(null);
 const [showFilters, setShowFilters] = useState(false);
 const [processingTemplateId, setProcessingTemplateId] = useState<string | null>(null);

 useEffect(() => {
 if (guardLoading || !allowed) return;
 templateService.getPublicMarketplace().then((data) => setDbTemplates(data ?? [])).catch(() => {});
 }, [guardLoading, allowed]);

 if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

 const allTemplates = dbTemplates.map((t: any) => {
 const cat = SERVICE_CATEGORIES_DATA[t.category as ServiceCategory];
 const subLabel = cat?.subcategories?.find((s: any) => s.key === t.sub_category);
 const office = Array.isArray(t.engineering_offices) ? t.engineering_offices[0] : t.engineering_offices;
 const officeName = office?.public_profiles?.name || office?.profiles?.name || '';
 const officeCity = office?.city || office?.coverage_area || '';
 return {
 ...t,
 titleEn: t.title || '',
 descriptionEn: t.description || '',
 catLabelAr: cat?.ar || t.category || (isRTL ? 'غير مصنف' : 'Uncategorized'),
 catLabelEn: cat?.en || t.category || 'Uncategorized',
 subLabelAr: subLabel?.ar || t.sub_category || '',
 subLabelEn: subLabel?.en || t.sub_category || '',
 officeName,
 officeNameEn: officeName,
 officeCity,
 officeCityEn: officeCity,
 officeRating: Number(office?.rating_avg || 0),
 officeRatingCount: Number(office?.rating_count || 0),
 officeVerified: !!office?.is_verified,
 officeType: office?.office_type || '',
 officePortfolio: office?.portfolio_preview || [],
 officePortfolioCount: office?.portfolio_count || 0,
 coverImage: t.preview_image_url || CATEGORY_COVERS[t.category] || CATEGORY_COVERS.architectural_design,
 };
 });

 let filtered = allTemplates;
 if (selectedCategory && selectedCategory !== 'all') filtered = filtered.filter(t => t.category === selectedCategory);
 if (priceRange === 'under1000') filtered = filtered.filter(t => (t.price || 0) < 1000);
 else if (priceRange === '1000to3000') filtered = filtered.filter(t => (t.price || 0) >= 1000 && (t.price || 0) <= 3000);
 else if (priceRange === 'above3000') filtered = filtered.filter(t => (t.price || 0) > 3000);

  const handlePurchase = async (item: any) => {
    if (!user?.id) {
      toast.error(isRTL ? 'يرجى تسجيل الدخول أولاً' : 'Please login first');
      return;
    }
    setProcessingTemplateId(item.template_id);
    try {
      const purchase = await templatePurchaseService.create({
        template_id: item.template_id,
        client_id: user.id,
        office_id: item.office_id ?? null,
        purchase_price: Number(item.price ?? 0),
        title_snapshot: item.title ?? null,
        category_snapshot: item.category ?? null,
        sub_category_snapshot: item.sub_category ?? null,
        file_url_snapshot: item.file_url ?? null,
        preview_image_snapshot: item.preview_image_url ?? null,
      });
      // Open a conversation thread between client and selling office.
      if (item.office_id && purchase?.id) {
        try {
          await messagingService.getOrCreateConversation({
            type: 'template_purchase',
            referenceId: purchase.id,
            referenceTitle: item.title ?? null,
            clientId: user.id,
            officeId: item.office_id,
          });
        } catch { /* non-blocking */ }
      }
      toast.success(isRTL ? 'تم شراء القالب بنجاح ' : 'Template purchased successfully ');
      setPreviewItem(null);
      navigate({ to: '/client/my-requests', search: { tab: 'templates' } as any });
    } catch (err: any) {
 const msg = err?.message || '';
 if (msg.includes('template_purchases') || msg.includes('relation') || msg.toLowerCase().includes('does not exist')) {
 toast.error(isRTL
 ? 'لم يتم تجهيز قاعدة البيانات. شغّل ملف public/marketplace_setup.sql في محرر SQL لـ Supabase'
 : 'Database not initialised. Run public/marketplace_setup.sql in your Supabase SQL Editor');
 } else {
 toast.error(msg || (isRTL ? 'تعذر إتمام الشراء' : 'Purchase failed'));
 }
 } finally {
 setProcessingTemplateId(null);
 }
 };

 const includedFiles = (item: any) => {
 if (item.included_files) {
 return String(item.included_files).split(/[,;\n]/).map((s: string) => s.trim()).filter(Boolean);
 }
 return DEFAULT_INCLUDED.map(d => isRTL ? d.ar : d.en);
 };

 return (
 <div className="mx-auto max-w-7xl px-4 py-8">
 <div className="mb-4">
 <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/client/home' })}>
 <Arrow className="h-4 w-4 me-1" />
 {isRTL ? 'العودة' : 'Back'}
 </Button>
 </div>
 <div className="mb-4 rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-sm">
 <p className="font-bold text-purple-700 dark:text-purple-300">
 {isRTL ? ' قوالب جاهزة — شراء فوري' : ' Ready-made Templates — Instant Purchase'}
 </p>
 <p className="text-purple-700/80 dark:text-purple-300/80 mt-1 text-xs">
 {isRTL
 ? 'منتجات رقمية جاهزة من مكاتب معتمدة. ادفع وحمّل مباشرة دون انتظار عروض أو موافقة.'
 : 'Digital products from verified offices. Pay and download instantly — no bids, no waiting for approval.'}
 </p>
 </div>
 <div className="flex items-start justify-between mb-8">
 <div>
 <h1 className="text-3xl font-black mb-2">{isRTL ? 'سوق القوالب الجاهزة' : 'Ready-made Templates Marketplace'}</h1>
 <p className="text-muted-foreground">{isRTL ? 'اشترِ القالب، حمّله، استخدمه فوراً' : 'Buy the template, download it, use it immediately'}</p>
 </div>
 <Button variant="outline" size="sm" className="gap-1 shrink-0" onClick={() => setShowFilters(!showFilters)}>
 <Filter className="h-4 w-4" />{isRTL ? 'فلاتر' : 'Filters'}
 </Button>
 </div>

 {showFilters && (
 <div className="mb-6 p-4 rounded-xl border bg-card grid gap-4 md:grid-cols-3">
 <div>
 <label className="text-xs font-medium text-muted-foreground mb-1 block">{isRTL ? 'الفئة' : 'Category'}</label>
 <Select value={selectedCategory} onValueChange={setSelectedCategory}>
 <SelectTrigger><SelectValue placeholder={isRTL ? 'الكل' : 'All'} /></SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{isRTL ? 'الكل' : 'All'}</SelectItem>
 {SERVICE_CATEGORIES.map(key => (
 <SelectItem key={key} value={key}>{isRTL ? SERVICE_CATEGORIES_DATA[key].ar : SERVICE_CATEGORIES_DATA[key].en}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div>
 <label className="text-xs font-medium text-muted-foreground mb-1 block">{isRTL ? 'نطاق السعر' : 'Price Range'}</label>
 <Select value={priceRange} onValueChange={setPriceRange}>
 <SelectTrigger><SelectValue placeholder={isRTL ? 'الكل' : 'All'} /></SelectTrigger>
 <SelectContent>
 <SelectItem value="all">{isRTL ? 'الكل' : 'All'}</SelectItem>
 <SelectItem value="under1000">{isRTL ? 'أقل من 1,000' : 'Under 1,000'} {sar}</SelectItem>
 <SelectItem value="1000to3000">1,000 - 3,000 {sar}</SelectItem>
 <SelectItem value="above3000">{isRTL ? 'أكثر من 3,000' : 'Above 3,000'} {sar}</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="flex items-end">
 <Button variant="ghost" size="sm" onClick={() => { setSelectedCategory('all'); setPriceRange('all'); }}>
 {isRTL ? 'إعادة تعيين' : 'Reset'}
 </Button>
 </div>
 </div>
 )}

 <div className="flex flex-wrap gap-2 mb-8">
 <button onClick={() => setSelectedCategory('all')}
 className={`rounded-full px-4 py-2 text-sm font-medium border transition-all ${!selectedCategory || selectedCategory === 'all' ? 'bg-gold/20 border-gold text-gold' : 'border-border hover:border-gold/30'}`}>
 {isRTL ? 'الكل' : 'All'} ({allTemplates.length})
 </button>
 {SERVICE_CATEGORIES.filter(key => allTemplates.some(t => t.category === key)).map(key => {
 const count = allTemplates.filter(t => t.category === key).length;
 return (
 <button key={key} onClick={() => setSelectedCategory(key)}
 className={`rounded-full px-4 py-2 text-sm font-medium border transition-all ${selectedCategory === key ? 'bg-gold/20 border-gold text-gold' : 'border-border hover:border-gold/30'}`}>
 {isRTL ? SERVICE_CATEGORIES_DATA[key].ar : SERVICE_CATEGORIES_DATA[key].en} ({count})
 </button>
 );
 })}
 </div>

 {filtered.length === 0 ? (
 <div className="text-center py-16 text-muted-foreground">
 <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
 <p>{isRTL ? 'لا توجد قوالب في هذه الفئة حالياً' : 'No templates in this category yet'}</p>
 </div>
 ) : (
 <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
 {filtered.map(item => {
 const files = includedFiles(item).slice(0, 4);
 return (
 <div key={item.template_id} className="group rounded-2xl border bg-card overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col">
 {/* Cover image */}
 <div className="relative h-44 overflow-hidden border-b">
 <img
 src={item.coverImage}
 alt={item.title || 'template cover'}
 loading="lazy"
 className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
 onError={(e) => {
 const fallback = CATEGORY_COVERS.architectural_design;
 if ((e.target as HTMLImageElement).src !== fallback) {
 (e.target as HTMLImageElement).src = fallback;
 }
 }}
 />
 <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
 <div className="absolute top-3 start-3 flex flex-wrap gap-1.5">
 <span className="rounded-full bg-background/85 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm">
 {isRTL ? item.catLabelAr : item.catLabelEn}
 </span>
 {(item.subLabelAr || item.subLabelEn) && (
 <span className="rounded-full bg-gold/90 px-2.5 py-1 text-[11px] font-semibold text-gold-foreground shadow-sm">
 {isRTL ? item.subLabelAr : item.subLabelEn}
 </span>
 )}
 </div>
 <div className="absolute top-3 end-3">
 <span className="rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold text-white inline-flex items-center gap-1 shadow-sm">
 <ShieldCheck className="h-3 w-3" />{isRTL ? 'معتمد' : 'Verified'}
 </span>
 </div>
 </div>

 <div className="p-5 flex-1 flex flex-col">
 <h3 className="font-bold text-base mb-1 line-clamp-1">{isRTL ? item.title : item.titleEn}</h3>
 <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
 {isRTL ? item.description : item.descriptionEn}
 </p>

 {/* Office / Seller — prominent identity block */}
                {item.officeName && (
                  <div className="mb-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-3">
                    <Link
                      to="/client/office/$id"
                      params={{ id: item.office_id }}
                      className="flex items-center gap-2.5 group/office hover:opacity-90"
                      aria-label={isRTL ? 'عرض صفحة المكتب' : 'View office page'}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-navy text-white font-bold text-xs">
                        {(isRTL ? item.officeName : item.officeNameEn).charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground">{isRTL ? 'يبيعه' : 'Sold by'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <p className="font-bold text-sm truncate text-foreground underline-offset-2 group-hover/office:underline">{isRTL ? item.officeName : item.officeNameEn}</p>
                          {item.officeVerified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          {item.officeCity && (
                            <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{item.officeCity}</span>
                          )}
                          {item.officeRating > 0 && (
                            <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-gold fill-gold" />{item.officeRating.toFixed(1)}{item.officeRatingCount > 0 ? ` (${item.officeRatingCount})` : ''}</span>
                          )}
                          {item.officePortfolioCount > 0 && (
                            <span>· {item.officePortfolioCount} {isRTL ? 'أعمال' : 'works'}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                )}

 {/* Includes */}
 <div className="mb-4">
 <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1">
 <Package className="h-3 w-3" />{isRTL ? 'يشمل' : 'Includes'}
 </div>
 <div className="flex flex-wrap gap-1.5">
 {files.map((f, i) => (
 <span key={i} className="rounded-md bg-muted/60 px-2 py-0.5 text-[11px] text-foreground/80">
 {f}
 </span>
 ))}
 </div>
 </div>

 {/* Price + actions */}
 <div className="mt-auto">
 <div className="flex items-center justify-between mb-3">
 <span className="text-lg font-black text-gold">
 {item.price ? `${Number(item.price).toLocaleString()} ${sar}` : '—'}
 </span>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <Button variant="outline" size="sm" className="border-gold/30 text-gold hover:bg-gold/5" onClick={() => setPreviewItem(item)}>
 <Eye className="h-3.5 w-3.5 me-1" />{isRTL ? 'معاينة' : 'Preview'}
 </Button>
 <Button size="sm" className="bg-gradient-gold text-gold-foreground hover:opacity-90" onClick={() => handlePurchase(item)} disabled={processingTemplateId === item.template_id}>
 {processingTemplateId === item.template_id ? <Loader2 className="h-3.5 w-3.5 me-1 animate-spin" /> : <ShoppingCart className="h-3.5 w-3.5 me-1" />}
 {processingTemplateId === item.template_id ? (isRTL ? 'جارٍ الشراء...' : 'Processing...') : (isRTL ? 'شراء الآن' : 'Buy Now')}
 </Button>
 </div>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* Preview Modal */}
 <Dialog open={!!previewItem} onOpenChange={(open) => { if (!open) setPreviewItem(null); }}>
 <DialogContent
 className="max-w-lg max-h-[90vh] overflow-y-auto"
 onOpenAutoFocus={(e) => e.preventDefault()}
 >
 <DialogHeader><DialogTitle>{isRTL ? 'معاينة القالب' : 'Template Preview'}</DialogTitle></DialogHeader>
 {previewItem && (
 <div className="space-y-4">
 <div className="h-48 rounded-lg overflow-hidden relative">
 <img src={previewItem.coverImage} alt={previewItem.title} className="absolute inset-0 h-full w-full object-cover" />
 </div>
  {previewItem.officeName && (
  <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
  <Link
    to="/client/office/$id"
    params={{ id: previewItem.office_id }}
    className="flex items-center gap-3 group/office hover:opacity-90"
    aria-label={isRTL ? 'عرض صفحة المكتب' : 'View office page'}
  >
  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-navy text-white font-bold text-sm">
  {(isRTL ? previewItem.officeName : previewItem.officeNameEn).charAt(0)}
  </div>
  <div className="flex-1 min-w-0">
  <p className="text-[10px] text-muted-foreground">{isRTL ? 'يبيعه' : 'Sold by'}</p>
  <p className="font-bold text-sm flex items-center gap-1.5">
  <span className="truncate underline-offset-2 group-hover/office:underline">{isRTL ? previewItem.officeName : previewItem.officeNameEn}</span>
  {previewItem.officeVerified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
  </p>
  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
  {previewItem.officeCity && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{previewItem.officeCity}</span>}
  {previewItem.officeRating > 0 && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-gold fill-gold" />{previewItem.officeRating.toFixed(1)}{previewItem.officeRatingCount > 0 ? ` (${previewItem.officeRatingCount})` : ''}</span>}
  </div>
  </div>
  </Link>
 {previewItem.officePortfolio && previewItem.officePortfolio.length > 0 && (
 <div className="mt-3">
 <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">{isRTL ? 'من أعمال المكتب' : 'From their portfolio'}</div>
 <div className="grid grid-cols-3 gap-1.5">
 {previewItem.officePortfolio.slice(0, 3).map((p: any) => (
 <div key={p.portfolio_id} className="aspect-video rounded-md overflow-hidden bg-muted border" title={p.project_title || ''}>
 {p.image_url ? <img src={p.image_url} alt={p.project_title || ''} className="h-full w-full object-cover" loading="lazy" /> : <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground p-1 text-center">{p.project_title}</div>}
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 )}
 <div>
 <div className="flex flex-wrap gap-2 mb-2">
 <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-medium text-gold">{isRTL ? previewItem.catLabelAr : previewItem.catLabelEn}</span>
 {(previewItem.subLabelAr || previewItem.subLabelEn) && (
 <span className="rounded-full border px-3 py-1 text-xs">{isRTL ? previewItem.subLabelAr : previewItem.subLabelEn}</span>
 )}
 </div>
 <h3 className="font-bold text-lg mt-2">{isRTL ? previewItem.title : previewItem.titleEn}</h3>
 <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{isRTL ? previewItem.description : previewItem.descriptionEn}</p>
 </div>
 <div className="rounded-lg border p-3">
 <div className="text-xs font-semibold mb-2 flex items-center gap-1"><FileImage className="h-3.5 w-3.5" />{isRTL ? 'محتوى القالب' : 'Template contents'}</div>
 <div className="flex flex-wrap gap-1.5">
 {includedFiles(previewItem).map((f, i) => (
 <span key={i} className="rounded-md bg-muted/60 px-2 py-0.5 text-[11px]">{f}</span>
 ))}
 </div>
 </div>
 <div className="flex items-center justify-between p-3 rounded-lg bg-gold/5 border border-gold/20">
 <span className="text-sm font-medium">{isRTL ? 'السعر' : 'Price'}</span>
 <span className="text-xl font-black text-gold">{previewItem.price ? `${Number(previewItem.price).toLocaleString()} ${sar}` : '—'}</span>
 </div>
 <Button className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90" onClick={() => handlePurchase(previewItem)} disabled={processingTemplateId === previewItem.template_id}>
 {processingTemplateId === previewItem.template_id ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <ShoppingCart className="h-4 w-4 me-2" />}
 {isRTL ? 'شراء وتنزيل القالب' : 'Buy & Download Template'}
 </Button>
 <Button
 variant="outline"
 className="w-full"
 onClick={() => { setPreviewItem(null); navigate({ to: '/client/submit-request' }); }}
 >
 {isRTL ? 'تحتاج تخصيصاً؟ انشر مشروعاً بدلاً من ذلك' : 'Need customization? Publish a project instead'}
 </Button>
 </div>
 )}
 </DialogContent>
 </Dialog>
 </div>
 );
}
