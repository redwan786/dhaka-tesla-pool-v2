export const MAX_COMPATIBLE_DESTINATION_DISTANCE_KM = 4;
export const ROAD_DISTANCE_FALLBACK_FACTOR = 1.35;

// Fixed demo road estimates keep Nusrat and Rafiq's examples hand-checkable.
// Unknown pairs fall back to Haversine distance × ROAD_DISTANCE_FALLBACK_FACTOR.
export const DEMO_ROUTE_DISTANCE_KM: Readonly<Record<string, number>> = {
  'Banani::Mohakhali': 4,
  'Banani::Gulshan 1': 3,
};
