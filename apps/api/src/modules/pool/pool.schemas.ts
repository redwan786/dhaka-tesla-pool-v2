import { z } from 'zod';

export const acceptRideParamsSchema = z.object({ rideId: z.string().uuid() }).strict();

export type AcceptRideParams = z.infer<typeof acceptRideParamsSchema>;
