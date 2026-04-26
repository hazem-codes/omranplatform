import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useLeafletStyles, defaultIconOptions } from './LeafletStyles';

type Props = {
  latitude: number;
  longitude: number;
  height?: string;
  zoom?: number;
};

export default function StaticLocationMap({ latitude, longitude, height = '12rem', zoom = 14 }: Props) {
  useLeafletStyles();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
      attributionControl: false,
    }).setView([latitude, longitude], zoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    L.marker([latitude, longitude], { icon: L.icon(defaultIconOptions) }).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 60);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, zoom]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-lg border"
      style={{ height }}
      dir="ltr"
      aria-label="Project location map"
    />
  );
}
