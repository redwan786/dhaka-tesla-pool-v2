-- Capacity-related values must remain valid even if a future code path misses validation.
ALTER TABLE "Vehicle"
  ADD CONSTRAINT "Vehicle_capacity_positive" CHECK ("capacity" > 0);

ALTER TABLE "RideRequest"
  ADD CONSTRAINT "RideRequest_requestedSeats_valid" CHECK ("requestedSeats" BETWEEN 1 AND 3),
  ADD CONSTRAINT "RideRequest_estimatedFarePaisa_nonnegative" CHECK ("estimatedFarePaisa" >= 0);

ALTER TABLE "Pool"
  ADD CONSTRAINT "Pool_occupiedSeats_nonnegative" CHECK ("occupiedSeats" >= 0);

ALTER TABLE "PoolMember"
  ADD CONSTRAINT "PoolMember_seats_positive" CHECK ("seats" > 0),
  ADD CONSTRAINT "PoolMember_farePaisa_nonnegative" CHECK ("farePaisa" >= 0);

-- One allocatable pool per vehicle keeps every seat claim behind the same row lock.
CREATE UNIQUE INDEX "Pool_one_active_per_vehicle_key"
  ON "Pool"("vehicleId")
  WHERE "status" IN ('OPEN'::"PoolStatus", 'ARRIVED'::"PoolStatus", 'IN_PROGRESS'::"PoolStatus");
