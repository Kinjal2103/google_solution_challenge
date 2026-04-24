export const ZONE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "North Mumbai": { lat: 19.2183, lng: 72.9781 },
  "South Mumbai": { lat: 18.9322, lng: 72.8264 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  "East Delhi": { lat: 28.6692, lng: 77.2738 },
  "West Delhi": { lat: 28.6519, lng: 77.0884 },
  "North Delhi": { lat: 28.7041, lng: 77.1025 },
  "South Delhi": { lat: 28.5245, lng: 77.1855 },
  "Central Delhi": { lat: 28.6328, lng: 77.2197 },
  "Chennai Central": { lat: 13.0827, lng: 80.2707 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Lucknow: { lat: 26.8467, lng: 80.9462 },
  Bhubaneswar: { lat: 20.2961, lng: 85.8245 },
  "Bhubaneswar South": { lat: 20.25, lng: 85.8245 }
};

export function resolveCoordinates(need: { zone?: string; metadata?: Record<string, unknown> }) {
  if (need.metadata?.lat && need.metadata?.lng) {
    const lat = Number(need.metadata.lat);
    const lng = Number(need.metadata.lng);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return { lat, lng };
    }
  }

  if (need.zone && ZONE_COORDINATES[need.zone]) {
    return ZONE_COORDINATES[need.zone];
  }

  return null;
}
