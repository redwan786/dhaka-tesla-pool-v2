import { z } from 'zod';

export const createRideSchema = z
  .object({
    pickupZoneId: z.string().uuid(),
    destinationZoneId: z.string().uuid(),
    requestedSeats: z.number().int().min(1).max(3).default(1),
  })
  .strict();

export const rideParamsSchema = z.object({ rideId: z.string().uuid() }).strict();

export type CreateRideInput = z.infer<typeof createRideSchema>;
export type RideParams = z.infer<typeof rideParamsSchema>;
