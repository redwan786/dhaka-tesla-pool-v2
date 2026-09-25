import { z } from 'zod';

export const fareEstimateSchema = z
  .object({
    pickupZoneId: z.string().uuid(),
    destinationZoneId: z.string().uuid(),
  })
  .strict();

export type FareEstimateInput = z.infer<typeof fareEstimateSchema>;
