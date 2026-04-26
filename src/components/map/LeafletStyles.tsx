import { useEffect } from 'react';

// Loads Leaflet CSS once via CDN — keeps map styling out of the main CSS bundle.
let injected = false;
export function useLeafletStyles() {
  useEffect(() => {
    if (injected || typeof document === 'undefined') return;
    if (document.querySelector('link[data-leaflet-css]')) {
      injected = true;
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    link.setAttribute('data-leaflet-css', 'true');
    document.head.appendChild(link);
    injected = true;
  }, []);
}

// Default marker icon — Leaflet's default URLs break under Vite bundling, so we use CDN PNGs.
export const defaultIconOptions = {
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41] as [number, number],
  iconAnchor: [12, 41] as [number, number],
  popupAnchor: [1, -34] as [number, number],
  shadowSize: [41, 41] as [number, number],
};
