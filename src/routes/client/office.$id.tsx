import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { serviceCatalogService, fetchOfficeRatings } from '@/services/serviceCatalogService';
import { engineeringOfficeService } from '@/services/engineeringOfficeService';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, ShieldCheck, MapPin, Star, Building2, ShoppingCart, Eye, Package } from 'lucide-react';
import { SERVICE_CATEGORIES_DATA, type ServiceCategory } from '@/types';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export const Route = createFileRoute('/client/office/$id')({
  component: OfficeFullPage,
});

// Reuse the same cover map convention used by the marketplace cards.
const SERVICE_COVERS: Record<string, string> = {
  architectural_design: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=70',
  structural_engineering: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?auto=format&fit=crop&w=900&q=70',
  construction_supervision: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=70',
  mep_engineering: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=900&q=70',
  finishing_works: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=70',
  engineering_consultations: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=70',
  surveying: 'https://images.unsplash.com/photo-1606189934846-a527add8a77b?auto=format&fit=crop&w=900&q=70',
  project_management: 'https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=900&q=70',
  permits_consulting: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=70',
  full_construction: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=70',
  surveying_geomatics: 'https://images.unsplash.com/photo-1606189934846-a527add8a77b?auto=format&fit=crop&w=900&q=70',
};

// Default banner if office has no cover photo — premium engineering aesthetic.
const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=70';

function OfficeFullPage() {
  const { allowed, isLoading: guardLoading } = useAuthGuard('client');
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const Arrow = isRTL ? ArrowRight : ArrowLeft;
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const sar = isRTL ? 'ر.س' : 'SAR';

  const [office, setOffice] = useState<any | null>(null);
  const [officeName, setOfficeName] = useState<string>('');
  const [services, setServices] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [rating, setRating] = useState<{ avg: number; count: number }>({ avg: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (guardLoading || !allowed || !id) return;
    let cancelled = false;
    (async () => {
      try {
        const [officeProfile, profileRes, svcs, portfolioRes, ratings] = await Promise.all([
          engineeringOfficeService.getOfficeProfile(id).catch(() => null),
          supabase.from('profiles').select('name').eq('id', id).maybeSingle(),
          serviceCatalogService.getByOffice(id).catch(() => []),
          supabase.from('portfolio').select('*').eq('office_id', id),
          fetchOfficeRatings([id]),
        ]);
        if (cancelled) return;
        setOffice(officeProfile);
        setOfficeName(profileRes.data?.name || '');
        setServices(svcs ?? []);
        setPortfolio(portfolioRes.data ?? []);
        setRating(ratings.get(id) ?? { avg: 0, count: 0 });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, guardLoading, allowed]);

  if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

  const banner = portfolio.find(p => p.image_url)?.image_url || DEFAULT_BANNER;
  const city = office?.city || office?.coverage_area || '';

  return (
    <div className="min-h-screen pb-12">
      {/* Full-width banner */}
      <div className="relative h-56 sm:h-72 md:h-80 w-full overflow-hidden">
        <img src={banner} alt={officeName || 'Office cover'} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute top-4 start-4">
          <Button variant="secondary" size="sm" onClick={() => navigate({ to: '/client/catalog' })} className="backdrop-blur bg-background/80">
            <Arrow className="h-4 w-4 me-1" />{isRTL ? 'العودة للسوق' : 'Back to Marketplace'}
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 -mt-16 relative">
        {/* Office identity card */}
        <div className="rounded-2xl border bg-card p-6 shadow-xl mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-navy text-white font-black text-3xl shadow-lg">
              {(officeName || '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black truncate">{officeName || (isRTL ? 'مكتب هندسي' : 'Engineering Office')}</h1>
                {office?.is_verified && (
                  <span className="rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-semibold text-white inline-flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />{isRTL ? 'معتمد' : 'Verified'}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-2">
                {city && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{city}</span>}
                {rating.count > 0 && (
                  <span className="flex items-center gap-1"><Star className="h-4 w-4 text-gold fill-gold" />{rating.avg.toFixed(1)} ({rating.count})</span>
                )}
                {office?.years_of_experience && (
                  <span className="flex items-center gap-1"><Building2 className="h-4 w-4" />{office.years_of_experience} {isRTL ? 'سنوات خبرة' : 'years exp.'}</span>
                )}
              </div>
              {office?.description && (
                <p className="text-sm text-foreground/80 mt-3 leading-relaxed">{office.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Portfolio preview */}
        {portfolio.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4">{isRTL ? 'معرض الأعمال' : 'Portfolio'}</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {portfolio.map(p => (
                <div key={p.portfolio_id} className="rounded-xl border overflow-hidden bg-card">
                  <div className="aspect-video bg-muted">
                    {p.image_url
                      ? <img src={p.image_url} alt={p.project_title || ''} className="h-full w-full object-cover" loading="lazy" />
                      : <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">{p.project_title}</div>}
                  </div>
                  {p.project_title && <div className="p-3 text-sm font-medium truncate">{p.project_title}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services list */}
        <div>
          <h2 className="text-xl font-bold mb-4">
            {isRTL ? `الخدمات (${services.length})` : `Services (${services.length})`}
          </h2>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">{isRTL ? 'جارٍ التحميل...' : 'Loading...'}</div>
          ) : services.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">{isRTL ? 'لا توجد خدمات منشورة لهذا المكتب' : 'No services listed for this office yet'}</div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {services.map((item: any) => {
                const cat = SERVICE_CATEGORIES_DATA[item.category as ServiceCategory];
                const sub = cat?.subcategories.find((s: any) => s.key === item.sub_category);
                const cover = SERVICE_COVERS[item.category] || SERVICE_COVERS.architectural_design;
                return (
                  <div key={item.catalog_id} className="group rounded-2xl border bg-card overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 flex flex-col">
                    <div className="relative h-44 overflow-hidden border-b">
                      <img src={cover} alt={cat?.en || item.category} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/10 to-transparent" />
                      <div className="absolute top-3 start-3 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-background/85 backdrop-blur px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm">
                          {isRTL ? cat?.ar : cat?.en}
                        </span>
                        {sub && (
                          <span className="rounded-full bg-gold/90 px-2.5 py-1 text-[11px] font-semibold text-gold-foreground shadow-sm">
                            {isRTL ? sub.ar : sub.en}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-bold text-base mb-1 line-clamp-1">
                        {isRTL ? sub?.ar || cat?.ar : sub?.en || cat?.en}
                      </h3>
                      <div className="mb-4">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1">
                          <Package className="h-3 w-3" />{isRTL ? 'المخرجات' : 'Deliverables'}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {[isRTL ? 'تقرير فني مفصّل' : 'Detailed technical report', isRTL ? 'مخططات بصيغة PDF' : 'PDF deliverables'].map((d, i) => (
                            <span key={i} className="rounded-md bg-muted/60 px-2 py-0.5 text-[11px] text-foreground/80">{d}</span>
                          ))}
                        </div>
                      </div>
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
                        <Link
                          to="/client/catalog"
                          className="block"
                        >
                          <Button size="sm" className="w-full bg-gradient-gold text-gold-foreground hover:opacity-90">
                            <ShoppingCart className="h-3.5 w-3.5 me-1" />{isRTL ? 'طلب الخدمة من السوق' : 'Request from Marketplace'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
