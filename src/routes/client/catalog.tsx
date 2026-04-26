import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { serviceCatalogService } from '@/services/serviceCatalogService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ShoppingCart, Sparkles, Star, MapPin, Building2, Eye, ArrowLeft, ArrowRight, Loader2, ShieldCheck, Package, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { SERVICE_CATEGORIES_DATA, SAUDI_CITIES, type ServiceCategory, SERVICE_CATEGORIES } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { projectRequestService } from '@/services/projectRequestService';
import { notificationService } from '@/services/notificationService';
import { aiService } from '@/services/aiService';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export const Route = createFileRoute('/client/catalog')({
 component: ServiceCatalogPage,
});

// Premium category covers shared between templates and services for visual consistency.
const SERVICE_COVERS: Record<string, string> = {
 architectural_design: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=70',
 structural_engineering: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?auto=format&fit=crop&w=900&q=70',
 construction_supervision: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=70',
 mep_engineering: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=70',
 finishing_works: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=70',
 engineering_consultations: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=70',
 surveying: 'https://images.unsplash.com/photo-1606189934846-a527add8a77b?auto=format&fit=crop&w=900&q=70',
 project_management: 'https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=900&q=70',
 // Legacy keys still used by some seeded data
 permits_consulting: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=70',
 full_construction: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=70',
 surveying_geomatics: 'https://images.unsplash.com/photo-1606189934846-a527add8a77b?auto=format&fit=crop&w=900&q=70',
};

const DEFAULT_DELIVERABLES = [
 { ar: 'تقرير فني مفصّل', en: 'Detailed technical report' },
 { ar: 'مخططات بصيغة PDF', en: 'PDF deliverables' },
 { ar: 'متابعة وتعديلات', en: 'Follow-up and revisions' },
];

function ServiceCatalogPage() {
 const { allowed, isLoading: guardLoading } = useAuthGuard('client');
 const { i18n } = useTranslation();
 const isRTL = i18n.language === 'ar';
 const Arrow = isRTL ? ArrowRight : ArrowLeft;
 const navigate = useNavigate();
 const { user } = useAuth();
 const sar = isRTL ? 'ر.س' : 'SAR';

 const [dbItems, setDbItems] = useState<any[]>([]);
 const [selectedCategory, setSelectedCategory] = useState<string>('');
 const [bookingItem, setBookingItem] = useState<any | null>(null);
 const [detailItem, setDetailItem] = useState<any | null>(null);
 const [bookingForm, setBookingForm] = useState({ area: '', city: '', timeline: '', description: '' });
 const [aiLoading, setAiLoading] = useState(false);
 const [bookingSubmitting, setBookingSubmitting] = useState(false);

 useEffect(() => {
 if (guardLoading || !allowed) return;
 serviceCatalogService.getPublicMarketplace().then((items) => setDbItems(items ?? [])).catch(() => {});
 }, [guardLoading, allowed]);

 if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

 const allItems = dbItems.map((item: any) => {
 const cat = SERVICE_CATEGORIES_DATA[item.category as ServiceCategory];
 const sub = cat?.subcategories.find((s: any) => s.key === item.sub_category);
 const office = Array.isArray(item.engineering_offices) ? item.engineering_offices[0] : item.engineering_offices;
 const profileName = office?.public_profiles?.name || office?.profiles?.name || '';
 const officeCity = office?.city || office?.coverage_area || '';
 return {
 ...item,
 officeName: profileName,
 officeNameEn: profileName,
 officeCity,
 officeCityEn: officeCity,
 officeRating: Number(office?.rating_avg || 0),
 officeRatingCount: Number(office?.rating_count || 0),
 officeCoverage: office?.coverage_area || '',
 officeCoverageEn: office?.coverage_area || '',
 officeVerified: !!office?.is_verified,
 officeExperience: office?.years_of_experience || '',
 officeType: office?.office_type || (isRTL ? 'مكتب هندسي معتمد' : 'Verified Engineering Office'),
 officeTypeEn: office?.office_type || 'Verified Engineering Office',
 officePortfolio: office?.portfolio_preview || [],
 officePortfolioCount: office?.portfolio_count || 0,
 catLabelAr: cat?.ar || item.category,
 catLabelEn: cat?.en || item.category,
 subLabelAr: sub?.ar || item.sub_category,
 subLabelEn: sub?.en || item.sub_category,
 coverImage: SERVICE_COVERS[item.category] || SERVICE_COVERS.architectural_design,
 };
 });

 const filtered = selectedCategory ? allItems.filter(i => i.category === selectedCategory) : allItems;

 const handleBook = async () => {
 if (!user?.id || !bookingItem) return;
 try {
 setBookingSubmitting(true);
 const catLabel = isRTL ? bookingItem.catLabelAr : bookingItem.catLabelEn;
 const subLabel = isRTL ? bookingItem.subLabelAr : bookingItem.subLabelEn;
 const realOfficeId = bookingItem.office_id;
 const req = await projectRequestService.submit({
 client_id: user.id,
 title: `${catLabel} — ${subLabel}`,
 description: bookingForm.description,
 location: bookingForm.city,
 budget_range: bookingItem.price ? `${bookingItem.price} ${sar}` : '',
 status: 'direct_booking',
 ...(realOfficeId ? { target_office_id: realOfficeId } : {}),
 } as any);
 if (bookingItem.office_id) {
 await notificationService.send(bookingItem.office_id, `طلب حجز مباشر جديد: ${req.title}`);
 }
 toast.success(isRTL ? 'تم إرسال طلب الخدمة بنجاح' : 'Service request sent successfully');
 setBookingItem(null);
 setBookingForm({ area: '', city: '', timeline: '', description: '' });
 navigate({ to: '/client/my-requests', search: { tab: 'services' } as any });
 } catch (err: any) { toast.error(err.message); }
 finally { setBookingSubmitting(false); }
 };

 const generateDesc = async () => {
 if (!bookingItem) return;
 const draft = bookingForm.description.trim();
 const areaRequired = bookingItem.pricing_model === 'per_m2';
 const hasRequiredContext = !!bookingForm.city && !!bookingForm.timeline.trim() && (!areaRequired || !!bookingForm.area.trim());

 if (!hasRequiredContext || !draft) {
 toast.error(
 isRTL
 ? 'اكتب وصفًا أوليًا قصيرًا واملأ البيانات الأساسية أولًا ليتمكن الذكاء الاصطناعي من تحسين الوصف بناءً على متطلباتك.'
 : 'Write a short draft and complete the required fields first so AI can improve the description based on your requirements.'
 );
 return;
 }

 const context = [
 `${isRTL ? 'الخدمة' : 'Service'}: ${isRTL ? bookingItem.catLabelAr : bookingItem.catLabelEn} — ${isRTL ? bookingItem.subLabelAr : bookingItem.subLabelEn}`,
 bookingItem.price ? `${isRTL ? 'السعر' : 'Price'}: ${bookingItem.price}` : '',
 `${isRTL ? 'الموقع' : 'Location'}: ${bookingForm.city}`,
 areaRequired ? `${isRTL ? 'المساحة' : 'Area'}: ${bookingForm.area}` : '',
 `${isRTL ? 'المدة المتوقعة' : 'Expected timeline'}: ${bookingForm.timeline}`,
 ].filter(Boolean).join('\n');

 const prompt = isRTL
 ? `أنت مساعد لتحسين وصف طلب خدمة هندسية. لا تنشئ وصفًا من الصفر. حسّن وصِغ مسودة المستخدم بناءً على السياق.

السياق:
${context}

مسودة المستخدم:
${draft}

المطلوب:
- تحسين الوضوح والتنظيم
- إبراز المتطلبات بشكل مهني
- الالتزام بما كتبه المستخدم دون اختراع تفاصيل غير مذكورة.`
 : `You are an assistant that improves an engineering service request description. Do not generate from scratch. Improve and rewrite the user's draft using the context.

Context:
${context}

User draft:
${draft}

Requirements:
- Improve clarity and organization
- Keep it professional
- Preserve user intent and avoid inventing details.`;

 setAiLoading(true);
 try {
 const desc = await aiService.generateDescription(prompt, i18n.language as 'ar' | 'en');
 setBookingForm(f => ({ ...f, description: desc }));
 } catch { toast.error('AI generation failed'); }
 finally { setAiLoading(false); }
 };

 const deliverables = DEFAULT_DELIVERABLES.map(d => isRTL ? d.ar : d.en);

 return (
 <div className="mx-auto max-w-7xl px-4 py-8">
 <div className="mb-4">
 <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/client/home' })}>
 <Arrow className="h-4 w-4 me-1" />
 {isRTL ? 'العودة' : 'Back'}
 </Button>
 </div>
 <div className="mb-4 rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm">
 <p className="font-bold text-gold">
 {isRTL ? ' طلب خدمة — مكتب واحد محدد' : ' Request a Service — One Specific Office'}
 </p>
 <p className="text-foreground/70 mt-1 text-xs">
 {isRTL
 ? 'كل خدمة هنا مرتبطة بمكتب هندسي محدد. سيُرسل طلبك إلى ذلك المكتب فقط، لا للسوق المفتوح. تريد عدة عروض؟ استخدم "نشر مشروع".'
 : 'Each service belongs to a specific office. Your request goes only to that office, not the open marketplace. Want multiple bids? Use "Publish Project".'}
 </p>
 </div>
 <h1 className="text-3xl font-black mb-2">{isRTL ? 'اطلب خدمة من مكتب هندسي محدد' : 'Request a Service from a Specific Office'}</h1>
 <p className="text-muted-foreground mb-8">{isRTL ? 'اختر مكتباً معتمداً وأرسل له طلب خدمة مباشرة' : 'Choose a verified office and send a direct service request'}</p>

 <div className="flex flex-wrap gap-2 mb-8">
 <button onClick={() => setSelectedCategory('')}
 className={`rounded-full px-4 py-2 text-sm font-medium border transition-all ${!selectedCategory ? 'bg-gold/20 border-gold text-gold' : 'border-border hover:border-gold/30'}`}>
 {isRTL ? 'الكل' : 'All'} ({allItems.length})
 </button>
 {SERVICE_CATEGORIES.map(key => {
 const count = allItems.filter(i => i.category === key).length;
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
 {isRTL ? 'لا توجد خدمات في هذه الفئة حالياً' : 'No services in this category yet'}
 </div>
 ) : (
 <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
 {filtered.map(item => (
 <div key={item.catalog_id} className="group rounded-2xl border bg-card overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col">
 {/* Cover image */}
 <div className="relative h-44 overflow-hidden border-b">
 <img
 src={item.coverImage}
 alt={isRTL ? item.catLabelAr : item.catLabelEn}
 loading="lazy"
 className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
 onError={(e) => {
 const fallback = SERVICE_COVERS.architectural_design;
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
 {/* Office / Provider — prominent identity block */}
 {item.officeName && (
 <div className="mb-4 rounded-xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent p-3">
 <Link
 to="/client/office/$id"
 params={{ id: item.office_id }}
 className="flex items-center gap-2.5 group/office hover:opacity-90"
 aria-label={isRTL ? 'عرض صفحة المكتب' : 'View office page'}
 >
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-navy text-white font-bold text-sm">
 {(isRTL ? item.officeName : item.officeNameEn).charAt(0)}
 </div>
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-1.5">
 <p className="font-bold text-sm truncate text-gold underline-offset-2 group-hover/office:underline">{isRTL ? item.officeName : item.officeNameEn}</p>
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
 <span className="flex items-center gap-0.5"><Building2 className="h-3 w-3" />{item.officePortfolioCount} {isRTL ? 'أعمال' : 'works'}</span>
 )}
 </div>
 </div>
 </Link>
 <p className="text-[10px] text-muted-foreground mt-2 italic">
 {isRTL ? 'سيُرسل طلبك مباشرة إلى هذا المكتب فقط' : 'Your request goes directly to this office only'}
 </p>
 </div>
 )}

 <h3 className="font-bold text-base mb-1 line-clamp-1">
 {isRTL ? item.subLabelAr || item.catLabelAr : item.subLabelEn || item.catLabelEn}
 </h3>
 <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
 {isRTL
 ? `خدمة هندسية احترافية ضمن ${item.catLabelAr}. مقدّمة من مكتب معتمد.`
 : `Professional engineering service in ${item.catLabelEn}, delivered by a verified office.`}
 </p>

 {/* Deliverables */}
 <div className="mb-4">
 <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1">
 <Package className="h-3 w-3" />{isRTL ? 'المخرجات' : 'Deliverables'}
 </div>
 <div className="flex flex-wrap gap-1.5">
 {deliverables.map((d, i) => (
 <span key={i} className="rounded-md bg-muted/60 px-2 py-0.5 text-[11px] text-foreground/80">{d}</span>
 ))}
 </div>
 </div>

 {/* Price + actions */}
 <div className="mt-auto">
 <div className="flex items-center justify-between mb-3">
 <span className="text-lg font-black text-gold">
 {item.price ? `${Number(item.price).toLocaleString()} ${sar}` : '—'}
 {item.pricing_model === 'per_m2' ? <span className="text-xs font-normal"> / {isRTL ? 'م²' : 'm²'}</span> : ''}
 </span>
 <span className="text-[10px] rounded-full border px-2 py-0.5 text-muted-foreground">
 {item.pricing_model === 'per_m2' ? (isRTL ? 'بالمتر المربع' : 'Per m²') : (isRTL ? 'سعر ثابت' : 'Fixed Price')}
 </span>
 </div>
 <div className="grid grid-cols-2 gap-2">
 <Button variant="outline" size="sm" className="border-gold/30 text-gold hover:bg-gold/5" onClick={() => setDetailItem(item)}>
 <Eye className="h-3.5 w-3.5 me-1" />{isRTL ? 'معاينة' : 'Preview'}
 </Button>
 <Button size="sm" className="bg-gradient-gold text-gold-foreground hover:opacity-90" onClick={() => setBookingItem(item)} disabled={bookingSubmitting}>
 <ShoppingCart className="h-3.5 w-3.5 me-1" />{isRTL ? 'طلب الخدمة' : 'Request Service'}
 </Button>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}

 {/* Detail Modal */}
 <Dialog open={!!detailItem} onOpenChange={(open) => { if (!open) setDetailItem(null); }}>
 <DialogContent
 className="max-w-lg max-h-[90vh] overflow-y-auto"
 onOpenAutoFocus={(e) => e.preventDefault()}
 >
 <DialogHeader><DialogTitle>{isRTL ? 'تفاصيل الخدمة' : 'Service Details'}</DialogTitle></DialogHeader>
 {detailItem && (
 <div className="space-y-4">
 <div className="h-44 rounded-lg overflow-hidden relative">
 <img src={detailItem.coverImage} alt={detailItem.catLabelEn} className="absolute inset-0 h-full w-full object-cover" />
 </div>
 {detailItem.officeName && (
 <div className="rounded-xl border border-gold/30 bg-gradient-to-br from-gold/5 to-transparent p-4">
 <div className="flex items-center gap-3">
 <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-navy text-white font-bold">
 {(isRTL ? detailItem.officeName : detailItem.officeNameEn).charAt(0)}
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-bold flex items-center gap-1.5">
 <span className="truncate">{isRTL ? detailItem.officeName : detailItem.officeNameEn}</span>
 {detailItem.officeVerified && <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />}
 </p>
 <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
 {detailItem.officeCity && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{detailItem.officeCity}</span>}
 {detailItem.officeRating > 0 && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-gold fill-gold" />{detailItem.officeRating.toFixed(1)}{detailItem.officeRatingCount > 0 ? ` (${detailItem.officeRatingCount})` : ''}</span>}
 {detailItem.officeType && <span className="truncate">{detailItem.officeType}</span>}
 </div>
 </div>
 </div>
 {detailItem.officePortfolio && detailItem.officePortfolio.length > 0 && (
 <div className="mt-3">
 <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">{isRTL ? 'من أعمال المكتب' : 'From their portfolio'}</div>
 <div className="grid grid-cols-3 gap-1.5">
 {detailItem.officePortfolio.slice(0, 3).map((p: any) => (
 <div key={p.portfolio_id} className="aspect-video rounded-md overflow-hidden bg-muted border" title={p.project_title || ''}>
 {p.image_url ? <img src={p.image_url} alt={p.project_title || ''} className="h-full w-full object-cover" loading="lazy" /> : <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground p-1 text-center">{p.project_title}</div>}
 </div>
 ))}
 </div>
 </div>
 )}
 <p className="text-[11px] text-muted-foreground mt-3 italic">
 {isRTL ? 'سيُرسل طلبك مباشرة إلى هذا المكتب فقط — ليس للسوق المفتوح.' : 'Your request goes directly to this office only — not the open marketplace.'}
 </p>
 </div>
 )}
 <div>
 <div className="flex flex-wrap gap-2 mb-2">
 <span className="rounded-full bg-gold/10 px-3 py-1 text-xs font-medium text-gold">{isRTL ? detailItem.catLabelAr : detailItem.catLabelEn}</span>
 {(detailItem.subLabelAr || detailItem.subLabelEn) && (
 <span className="rounded-full border px-3 py-1 text-xs">{isRTL ? detailItem.subLabelAr : detailItem.subLabelEn}</span>
 )}
 </div>
 <h3 className="font-bold text-lg mt-2">{isRTL ? detailItem.subLabelAr || detailItem.catLabelAr : detailItem.subLabelEn || detailItem.catLabelEn}</h3>
 <p className="text-sm text-muted-foreground mt-2">
 {isRTL
 ? `خدمة احترافية ضمن فئة ${detailItem.catLabelAr}. تشمل التحليل والتصميم والمتابعة بحسب احتياج المشروع.`
 : `Professional service in ${detailItem.catLabelEn}, including analysis, design, and follow-up tailored to your project.`}
 </p>
 </div>
 <div className="rounded-lg border p-3">
 <div className="text-xs font-semibold mb-2 flex items-center gap-1"><Package className="h-3.5 w-3.5" />{isRTL ? 'المخرجات' : 'Deliverables'}</div>
 <div className="flex flex-wrap gap-1.5">
 {deliverables.map((d, i) => (
 <span key={i} className="rounded-md bg-muted/60 px-2 py-0.5 text-[11px]">{d}</span>
 ))}
 </div>
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div className="rounded-lg border p-3">
 <div className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1"><Clock className="h-3 w-3" />{isRTL ? 'مدة تقديرية' : 'Est. timeline'}</div>
 <div className="text-sm font-bold">{isRTL ? '٢ – ٤ أسابيع' : '2–4 weeks'}</div>
 </div>
 <div className="rounded-lg border p-3 bg-gold/5 border-gold/20">
 <div className="text-[11px] text-muted-foreground mb-1">{isRTL ? 'السعر' : 'Price'}</div>
 <div className="text-lg font-black text-gold">
 {detailItem.price ? `${Number(detailItem.price).toLocaleString()} ${sar}` : '—'}
 {detailItem.pricing_model === 'per_m2' ? <span className="text-xs font-normal"> / {isRTL ? 'م²' : 'm²'}</span> : ''}
 </div>
 </div>
 </div>
 {detailItem.officeCoverage && (
 <div className="text-sm flex items-center gap-1"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /><span className="font-medium">{isRTL ? 'منطقة التغطية:' : 'Coverage:'}</span> {detailItem.officeCoverage}</div>
 )}
 <Button className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90" onClick={() => { setDetailItem(null); setBookingItem(detailItem); }} disabled={bookingSubmitting}>
 <ShoppingCart className="h-4 w-4 me-2" />{isRTL ? 'طلب هذه الخدمة' : 'Request This Service'}
 </Button>
 </div>
 )}
 </DialogContent>
 </Dialog>

 {/* Booking Modal */}
 <Dialog open={!!bookingItem} onOpenChange={(open) => { if (!open) setBookingItem(null); }}>
 <DialogContent
 className="max-w-md max-h-[90vh] overflow-y-auto"
 onOpenAutoFocus={(e) => e.preventDefault()}
 >
 <DialogHeader><DialogTitle>{isRTL ? 'طلب الخدمة' : 'Request Service'}</DialogTitle></DialogHeader>
 <div className="space-y-4">
 <div className="p-3 rounded-lg bg-muted/30">
 {bookingItem?.officeName && <p className="text-xs text-muted-foreground mb-1">{isRTL ? bookingItem.officeName : bookingItem.officeNameEn}</p>}
 <p className="font-bold text-sm">{isRTL ? bookingItem?.catLabelAr : bookingItem?.catLabelEn} — {isRTL ? bookingItem?.subLabelAr : bookingItem?.subLabelEn}</p>
 {bookingItem?.price && <p className="text-gold font-bold mt-1">{Number(bookingItem.price).toLocaleString()} {sar}{bookingItem.pricing_model === 'per_m2' ? ` / ${isRTL ? 'م²' : 'm²'}` : ''}</p>}
 </div>
 {bookingItem?.pricing_model === 'per_m2' && (
 <div className="space-y-2">
 <Label>{isRTL ? 'المساحة (م²)' : 'Area (m²)'}</Label>
 <Input type="number" value={bookingForm.area} onChange={e => setBookingForm(f => ({ ...f, area: e.target.value }))} dir="ltr" />
 </div>
 )}
 <div className="space-y-2">
 <Label>{isRTL ? 'موقع المشروع' : 'Project Location'}</Label>
 <Select value={bookingForm.city} onValueChange={v => setBookingForm(f => ({ ...f, city: v }))}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 {SAUDI_CITIES.map(c => (
 <SelectItem key={c.ar} value={c.ar}>{isRTL ? c.ar : c.en}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <Label>{isRTL ? 'الجدول الزمني المتوقع' : 'Expected Timeline'}</Label>
 <Input value={bookingForm.timeline} onChange={e => setBookingForm(f => ({ ...f, timeline: e.target.value }))} placeholder={isRTL ? 'مثال: 4 أسابيع' : 'e.g., 4 weeks'} />
 </div>
 <div className="space-y-2">
 <div className="flex items-center justify-between">
 <Label>{isRTL ? 'وصف المشروع' : 'Description'}</Label>
 <Button
 type="button"
 variant="ghost"
 size="sm"
 onClick={generateDesc}
 disabled={
 aiLoading ||
 !bookingForm.city ||
 !bookingForm.timeline.trim() ||
 (bookingItem?.pricing_model === 'per_m2' && !bookingForm.area.trim()) ||
 !bookingForm.description.trim()
 }
 className="text-gold"
 >
 <Sparkles className="h-3 w-3 me-1" />{isRTL ? 'توليد بالذكاء الاصطناعي ' : 'AI Generate '}
 </Button>
 </div>
 <Textarea value={bookingForm.description} onChange={e => setBookingForm(f => ({ ...f, description: e.target.value }))} rows={4} />
 </div>
 <Button className="w-full bg-gradient-gold text-gold-foreground shadow-gold hover:opacity-90" onClick={handleBook} disabled={bookingSubmitting || !bookingForm.city}>
 {bookingSubmitting ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : null}
 {bookingSubmitting ? (isRTL ? 'جارٍ الإرسال...' : 'Submitting...') : (isRTL ? 'إرسال طلب الخدمة' : 'Submit Service Request')}
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 </div>
 );
}
