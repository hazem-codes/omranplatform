import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { projectRequestService } from '@/services/projectRequestService';
import { decodeLocation, distanceKm } from '@/lib/locationCodec';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, LocateFixed, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

const NearbyProjectsMap = lazy(() => import('@/components/map/NearbyProjectsMap'));

export const Route = createFileRoute('/office/nearby')({
  component: NearbyProjectsPage,
});

const RADII = [5, 10, 25, 50] as const;
type Radius = (typeof RADII)[number];

function NearbyProjectsPage() {
  const { allowed, isLoading: guardLoading } = useAuthGuard('engineering_office');
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();

  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [resolvingManual, setResolvingManual] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('all');
  const [radius, setRadius] = useState<Radius>(25);

  // Geolocation
  useEffect(() => {
    if (!allowed) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setPermissionDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => {
        if (err.code === err.PERMISSION_DENIED) setPermissionDenied(true);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, [allowed]);

  // Load approved projects
  useEffect(() => {
    if (!allowed) return;
    let cancelled = false;
    setLoading(true);
    projectRequestService.getApproved()
      .then((rows: any[]) => {
        if (cancelled) return;
        const enriched = (rows || []).map(r => {
          const loc = decodeLocation(r.location);
          return { ...r, _loc: loc };
        }).filter(r => r._loc.latitude != null && r._loc.longitude != null);
        setProjects(enriched);
      })
      .catch(() => !cancelled && setProjects([]))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [allowed]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    projects.forEach(p => { if (p.service_category || p.category) s.add(p.service_category || p.category); });
    return Array.from(s);
  }, [projects]);

  const enriched = useMemo(() => {
    return projects.map(p => {
      const dist = origin ? distanceKm(origin, { lat: p._loc.latitude, lng: p._loc.longitude }) : null;
      return {
        request_id: p.request_id,
        title: p.title || (isRTL ? 'مشروع بدون عنوان' : 'Untitled project'),
        category: p.service_category || p.category || '',
        city: p._loc.city || '-',
        latitude: p._loc.latitude as number,
        longitude: p._loc.longitude as number,
        formattedAddress: p._loc.formattedAddress,
        distance: dist,
      };
    });
  }, [projects, origin, isRTL]);

  const filtered = useMemo(() => {
    let list = enriched;
    if (category !== 'all') list = list.filter(p => p.category === category);
    if (origin) list = list.filter(p => (p.distance ?? Infinity) <= radius);
    list = [...list].sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    return list;
  }, [enriched, category, radius, origin]);

  const handleView = (id: string) => {
    navigate({ to: '/office/requests/$id', params: { id } });
  };

  const resolveManualAddress = async () => {
    if (!manualAddress.trim()) return;
    setResolvingManual(true);
    try {
      const lang = isRTL ? 'ar' : 'en';
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(manualAddress)}&accept-language=${lang}&limit=1&countrycodes=sa`);
      const data = await res.json();
      if (Array.isArray(data) && data[0]) {
        setOrigin({ lat: Number(data[0].lat), lng: Number(data[0].lon) });
        setPermissionDenied(false);
      }
    } finally {
      setResolvingManual(false);
    }
  };

  if (!allowed) return guardLoading ? <div className="flex min-h-[60vh] items-center justify-center"><span className="text-muted-foreground">جاري التحقق...</span></div> : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-black flex items-center gap-2">
          <MapPin className="h-7 w-7 text-gold" />
          {isRTL ? 'مشاريع حولي' : 'Projects Near Me'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isRTL ? 'استكشف المشاريع المتاحة بالقرب من موقع مكتبك' : 'Discover open projects near your office'}
        </p>
      </div>

      {permissionDenied && (
        <div className="mb-4 rounded-xl border border-warning/40 bg-warning/10 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {isRTL ? 'لم نتمكن من تحديد موقعك تلقائيًا' : 'We could not detect your location automatically'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {isRTL ? 'أدخل عنوانًا يدويًا أدناه لاستخدامه كنقطة مرجعية.' : 'Enter an address below to use as your reference point.'}
              </p>
              <div className="flex gap-2 mt-3">
                <Input
                  value={manualAddress}
                  onChange={e => setManualAddress(e.target.value)}
                  placeholder={isRTL ? 'مثال: حي الياسمين، الرياض' : 'e.g., Al Yasmin, Riyadh'}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), void resolveManualAddress())}
                />
                <Button onClick={resolveManualAddress} disabled={resolvingManual}>
                  {resolvingManual ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRTL ? 'بحث' : 'Search')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder={isRTL ? 'كل الفئات' : 'All categories'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? 'كل الفئات' : 'All categories'}</SelectItem>
            {categories.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(radius)} onValueChange={v => setRadius(Number(v) as Radius)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RADII.map(r => (
              <SelectItem key={r} value={String(r)}>
                {isRTL ? `حتى ${r} كم` : `Within ${r} km`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (!navigator.geolocation) return;
            navigator.geolocation.getCurrentPosition(
              pos => { setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setPermissionDenied(false); },
              err => { if (err.code === err.PERMISSION_DENIED) setPermissionDenied(true); },
              { enableHighAccuracy: true, timeout: 8000 },
            );
          }}
        >
          <LocateFixed className="h-3.5 w-3.5 me-1" />
          {isRTL ? 'موقعي الحالي' : 'Use my location'}
        </Button>

        <span className="ms-auto text-sm text-muted-foreground">
          {isRTL ? `${filtered.length} مشروع` : `${filtered.length} projects`}
        </span>
      </div>

      <Suspense fallback={<div className="h-[28rem] w-full rounded-xl border bg-muted animate-pulse" />}>
        <NearbyProjectsMap
          isRTL={isRTL}
          origin={origin}
          projects={filtered}
          onView={handleView}
        />
      </Suspense>

      <div className="mt-6">
        <h2 className="text-lg font-bold mb-3">
          {isRTL ? 'الأقرب إليك' : 'Nearest to you'}
        </h2>
        {loading ? (
          <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin inline-block me-2" />
            {isRTL ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
            {isRTL ? 'لا توجد مشاريع ضمن النطاق المحدد' : 'No projects within the selected radius'}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(p => (
              <div key={p.request_id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 hover:shadow-md transition-shadow">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold truncate">{p.title}</h3>
                    {p.category && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide">
                        {p.category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {p.city}
                    {p.formattedAddress ? ` · ${p.formattedAddress.slice(0, 60)}${p.formattedAddress.length > 60 ? '…' : ''}` : ''}
                  </p>
                </div>
                <div className="text-end shrink-0">
                  {p.distance != null && (
                    <p className="text-sm font-bold text-gold">
                      {p.distance.toFixed(1)} {isRTL ? 'كم' : 'km'}
                    </p>
                  )}
                  <Button size="sm" variant="outline" className="mt-1" onClick={() => handleView(p.request_id)}>
                    {isRTL ? 'عرض المشروع' : 'View Project'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
