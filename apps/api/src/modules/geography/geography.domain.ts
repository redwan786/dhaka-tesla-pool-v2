import {
  DEMO_ROUTE_DISTANCE_KM,
  MAX_COMPATIBLE_DESTINATION_DISTANCE_KM,
  ROAD_DISTANCE_FALLBACK_FACTOR,
} from './geography.constants.js';

export type Coordinate = {
  latitude: number;
  longitude: number;
};

export type NamedCoordinate = Coordinate & { name: string };

export function haversineDistanceKm(first: Coordinate, second: Coordinate) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDifference = toRadians(second.latitude - first.latitude);
  const longitudeDifference = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);

  const value =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  return earthRadiusKm * 2 * Math.asin(Math.sqrt(value));
}

export function estimateRouteDistanceKm(pickup: NamedCoordinate, destination: NamedCoordinate) {
  const configuredDistance =
    DEMO_ROUTE_DISTANCE_KM[routeKey(pickup.name, destination.name)] ??
    DEMO_ROUTE_DISTANCE_KM[routeKey(destination.name, pickup.name)];

  if (configuredDistance !== undefined) return configuredDistance;

  const fallbackDistance =
    haversineDistanceKm(pickup, destination) * ROAD_DISTANCE_FALLBACK_FACTOR;
  return Math.max(1, roundToOneDecimal(fallbackDistance));
}

export function destinationsAreCompatible(first: Coordinate, second: Coordinate) {
  return haversineDistanceKm(first, second) <= MAX_COMPATIBLE_DESTINATION_DISTANCE_KM;
}

export function requestsAreGeographicallyCompatible(
  first: { pickupZoneId: string; destination: Coordinate },
  second: { pickupZoneId: string; destination: Coordinate },
) {
  return (
    first.pickupZoneId === second.pickupZoneId &&
    destinationsAreCompatible(first.destination, second.destination)
  );
}

function routeKey(pickupName: string, destinationName: string) {
  return `${pickupName}::${destinationName}`;
}

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}
