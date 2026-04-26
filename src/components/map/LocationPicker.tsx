import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin, LocateFixed, Search } from 'lucide-react';
import { useLeafletStyles, defaultIconOptions } from './LeafletStyles';

export type PickedLocation = {
  latitude: number;
  longitude: number;
  formattedAddress: string;
};

type Props = {
  isRTL: boolean;
  initial?: { latitude?: number; longitude?: number; formattedAddress?: string };
  onChange: (loc: PickedLocation) => void;
};

const DEFAULT_CENTER: [number, number] = [24.7136, 46.6753]; // Riyadh

async function reverseGeocode(lat: number, lng: number, lang: 'ar' | 'en'): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${lang}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('reverse geocode failed');
  const data = await res.json();
  return (data?.display_name as string) || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

async function forwardGeocode(query: string, lang: 'ar' | 'en'): Promise<{ lat: number; lng: number; address: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}&accept-language=${lang}&limit=1&countrycodes=sa`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const item = data[0];
  return { lat: Number(item.lat), lng: Number(item.lon), address: item.display_name };
}

export default function LocationPicker({ isRTL, initial, onChange }: Props) {
  useLeafletStyles();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [address, setAddress] = useState(initial?.formattedAddress ?? '');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initial?.latitude != null && initial?.longitude != null
      ? { lat: initial.latitude, lng: initial.longitude }
      : null,
  );
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const lang: 'ar' | 'en' = isRTL ? 'ar' : 'en';

  const updateAddressFor = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      const addr = await reverseGeocode(lat, lng, lang);
      setAddress(addr);
      onChange({ latitude: lat, longitude: lng, formattedAddress: addr });
    } catch {
      const fallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setAddress(fallback);
      onChange({ latitude: lat, longitude: lng, formattedAddress: fallback });
    } finally {
      setLoading(false);
    }
  };

  const placeMarker = (lat: number, lng: number, opts?: { pan?: boolean; skipGeocode?: boolean }) => {
    const map = mapRef.current;
    if (!map) return;
    setCoords({ lat, lng });
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const icon = L.icon(defaultIconOptions);
      const marker = L.marker([lat, lng], { draggable: true, icon }).addTo(map);
      marker.on('dragend', () => {
        const p = marker.getLatLng();
        placeMarker(p.lat, p.lng);
      });
      markerRef.current = marker;
    }
    if (opts?.pan !== false) {
      map.setView([lat, lng], Math.max(map.getZoom(), 13));
    }
    if (!opts?.skipGeocode) {
      void updateAddressFor(lat, lng);
    } else {
      onChange({ latitude: lat, longitude: lng, formattedAddress: address });
    }
  };

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const start: [number, number] = coords ? [coords.lat, coords.lng] : DEFAULT_CENTER;
    const map = L.map(containerRef.current, { zoomControl: true }).setView(start, coords ? 14 : 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    map.on('click', (e: L.LeafletMouseEvent) => placeMarker(e.latlng.lat, e.latlng.lng));
    mapRef.current = map;

    if (coords) {
      placeMarker(coords.lat, coords.lng, { pan: false, skipGeocode: true });
    } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => placeMarker(pos.coords.latitude, pos.coords.longitude),
        err => {
          if (err.code === err.PERMISSION_DENIED) setPermissionDenied(true);
        },
        { enableHighAccuracy: true, timeout: 8000 },
      );
    }

    // Fix sizing after mount
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => placeMarker(pos.coords.latitude, pos.coords.longitude),
      err => {
        if (err.code === err.PERMISSION_DENIED) setPermissionDenied(true);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const runSearch = async () => {
    if (!searchValue.trim()) return;
    setLoading(true);
    try {
      const result = await forwardGeocode(searchValue.trim(), lang);
      if (result) {
        placeMarker(result.lat, result.lng);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="flex items-center gap-1">
          <MapPin className="h-4 w-4 text-gold" />
          {isRTL ? 'حدد موقع المشروع على الخريطة' : 'Pin the project location on the map'}
        </Label>
        <Button type="button" size="sm" variant="outline" onClick={useMyLocation}>
          <LocateFixed className="h-3.5 w-3.5 me-1" />
          {isRTL ? 'موقعي الحالي' : 'Use my location'}
        </Button>
      </div>

      <div
        ref={containerRef}
        className="h-72 w-full overflow-hidden rounded-xl border bg-muted"
        dir="ltr"
        aria-label={isRTL ? 'خريطة لاختيار موقع المشروع' : 'Map to choose project location'}
      />

      {permissionDenied && (
        <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs">
          {isRTL
            ? 'تعذّر الوصول إلى موقعك. ابحث يدويًا عن العنوان أو انقر على الخريطة لاختيار الموقع.'
            : 'Location access denied. Search for an address or click the map to pick a location.'}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void runSearch();
            }
          }}
          placeholder={isRTL ? 'ابحث عن عنوان أو حي...' : 'Search for address or neighborhood...'}
        />
        <Button type="button" variant="outline" onClick={runSearch} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      <div className="space-y-2">
        <Label>{isRTL ? 'العنوان' : 'Address'}</Label>
        <Input
          value={address}
          onChange={e => {
            const v = e.target.value;
            setAddress(v);
            if (coords) onChange({ latitude: coords.lat, longitude: coords.lng, formattedAddress: v });
          }}
          placeholder={isRTL ? 'سيتم ملء العنوان تلقائيًا' : 'Address will autofill from the map'}
        />
        {coords && (
          <p className="text-xs text-muted-foreground" dir="ltr">
            {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </p>
        )}
      </div>
    </div>
  );
}
