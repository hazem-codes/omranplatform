// Encodes/decodes structured location data into the existing project_requests.location text column.
// Format: "City||lat,lng||Formatted address"
// Backwards compatible: a plain "City" string still parses (lat/lng/address undefined).

export type ProjectLocation = {
  city: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
};

const SEP = '||';

export function encodeLocation(loc: ProjectLocation): string {
  const lat = loc.latitude;
  const lng = loc.longitude;
  const coord = typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)
    ? `${lat.toFixed(6)},${lng.toFixed(6)}`
    : '';
  const addr = (loc.formattedAddress || '').replace(/\|\|/g, ' ').trim();
  // Always emit 3 segments so it round-trips
  return [loc.city || '', coord, addr].join(SEP);
}

export function decodeLocation(value: string | null | undefined): ProjectLocation {
  if (!value) return { city: '' };
  if (!value.includes(SEP)) return { city: value };
  const [city = '', coord = '', formattedAddress = ''] = value.split(SEP);
  let latitude: number | undefined;
  let longitude: number | undefined;
  if (coord && coord.includes(',')) {
    const [latStr, lngStr] = coord.split(',');
    const lat = Number(latStr);
    const lng = Number(lngStr);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      latitude = lat;
      longitude = lng;
    }
  }
  return {
    city,
    latitude,
    longitude,
    formattedAddress: formattedAddress || undefined,
  };
}

// Haversine distance in km
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
