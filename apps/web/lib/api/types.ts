export type RideStatus =
  | 'REQUESTED'
  | 'MATCHED'
  | 'DRIVER_ARRIVED'
  | 'STARTED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PoolStatus = 'OPEN' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type PoolMemberStatus = 'ACTIVE' | 'CANCELLED';

export type Zone = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type FareBreakdown = {
  currency: 'BDT';
  distanceKm: number;
  baseFarePaisa: number;
  distanceChargePaisa: number;
  subtotalPaisa: number;
  poolDiscountPercent: number;
  poolDiscountPaisa: number;
  passengerFarePaisa: number;
};

export type FareEstimate = {
  pickup: Zone;
  destination: Zone;
  fare: FareBreakdown;
  assumptions: {
    pooledRide: boolean;
    realMapRouting: boolean;
    model: string;
  };
};

export type StatusHistory = {
  id: string;
  fromStatus: RideStatus | null;
  toStatus: RideStatus;
  reason: string | null;
  createdAt: string;
};

export type PassengerRide = {
  id: string;
  passengerId: string;
  pickupZoneId: string;
  destinationZoneId: string;
  poolId: string | null;
  requestedSeats: number;
  estimatedFarePaisa: number;
  status: RideStatus;
  createdAt: string;
  updatedAt: string;
  pickupZone: Zone;
  destinationZone: Zone;
  pool: null | {
    id: string;
    status: PoolStatus;
    occupiedSeats: number;
    vehicle: { id: string; name: string; capacity: number };
  };
  statusHistory?: StatusHistory[];
};

export type DriverVehicle = {
  id: string;
  driverId: string;
  name: string;
  capacity: number;
  isActive: boolean;
  driver: { id: string; name: string; isOnline: boolean };
  activePool: null | {
    id: string;
    status: PoolStatus;
    occupiedSeats: number;
    createdAt: string;
  };
};

export type DriverRequest = {
  id: string;
  requestedSeats: number;
  status: RideStatus;
  createdAt: string;
  passenger: { id: string; name: string };
  pickupZone: Zone;
  destinationZone: Zone;
};

export type DriverPoolMember = {
  id: string;
  poolId: string;
  rideRequestId: string;
  passengerId: string;
  seats: number;
  farePaisa: number;
  status: PoolMemberStatus;
  joinedAt: string;
  cancelledAt: string | null;
  passenger: { id: string; name: string };
  rideRequest: {
    id: string;
    status: RideStatus;
    requestedSeats: number;
    pickupZone: Zone;
    destinationZone: Zone;
    statusHistory: StatusHistory[];
  };
};

export type DriverPool = {
  id: string;
  vehicleId: string;
  status: PoolStatus;
  occupiedSeats: number;
  createdAt: string;
  updatedAt: string;
  vehicle: { id: string; name: string; capacity: number; driverId: string };
  members: DriverPoolMember[];
};
