import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useLeafletStyles, defaultIconOptions } from './LeafletStyles';
import { distanceKm } from '@/lib/locationCodec';

export type NearbyProject = {
  request_id: string;
  title: string;
  category?: string;
  city: string;
  latitude: number;
  longitude: number;
  formattedAddress?: string;
};

type Props = {
  isRTL: boolean;
  origin: { lat: number; lng: number } | null;
  projects: NearbyProject[];
  onView: (id: string) => void;
};

export default function NearbyProjectsMap({ isRTL, origin, projects, onView }: Props) {
  useLeafletStyles();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const [popupId, setPopupId] = useState<string | null>(null);

  // Init
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const center: [number, number] = origin ? [origin.lat, origin.lng] : [24.7136, 46.6753];
    const map = L.map(containerRef.current).setView(center, origin ? 11 : 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    setTimeout(() => map.invalidateSize(), 80);
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    if (origin) {
      const originIcon = L.divIcon({
        className: '',
        html: '<div style="background:#1B2A4A;border:3px solid #C5A55A;border-radius:9999px;width:18px;height:18px;box-shadow:0 0 0 4px rgba(197,165,90,0.25)"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      L.marker([origin.lat, origin.lng], { icon: originIcon, zIndexOffset: 1000 })
        .addTo(layer)
        .bindTooltip(isRTL ? 'موقعك' : 'Your location');
    }

    const icon = L.icon(defaultIconOptions);
    const bounds = L.latLngBounds([]);
    if (origin) bounds.extend([origin.lat, origin.lng]);

    projects.forEach(p => {
      const marker = L.marker([p.latitude, p.longitude], { icon }).addTo(layer);
      const dist = origin ? distanceKm(origin, { lat: p.latitude, lng: p.longitude }).toFixed(1) : null;
      const popupHtml = `
        <div style="min-width:180px;font-family:inherit">
          <div style="font-weight:700;margin-bottom:4px">${escapeHtml(p.title)}</div>
          ${p.category ? `<div style="font-size:11px;color:#666">${escapeHtml(p.category)}</div>` : ''}
          <div style="font-size:11px;color:#666;margin-top:2px">${escapeHtml(p.city)}${dist ? ` · ${dist} ${isRTL ? 'كم' : 'km'}` : ''}</div>
          <button data-nearby-view="${p.request_id}" style="margin-top:8px;width:100%;padding:6px 10px;border-radius:8px;background:linear-gradient(135deg,#C5A55A,#d6b87a);color:#1B2A4A;font-weight:700;font-size:12px;border:0;cursor:pointer">
            ${isRTL ? 'عرض المشروع' : 'View Project'}
          </button>
        </div>`;
      marker.bindPopup(popupHtml);
      marker.on('popupopen', () => setPopupId(p.request_id));
      bounds.extend([p.latitude, p.longitude]);
    });

    if (projects.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      } catch {
        /* ignore */
      }
    } else if (origin) {
      map.setView([origin.lat, origin.lng], 11);
    }
  }, [projects, origin, isRTL]);

  // Wire popup button click via container delegation
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const id = target?.getAttribute?.('data-nearby-view');
      if (id) onView(id);
    };
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, [onView, popupId]);

  return (
    <div
      ref={containerRef}
      className="h-[28rem] w-full overflow-hidden rounded-xl border bg-muted"
      dir="ltr"
      aria-label={isRTL ? 'خريطة المشاريع القريبة' : 'Nearby projects map'}
    />
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c),
  );
}
