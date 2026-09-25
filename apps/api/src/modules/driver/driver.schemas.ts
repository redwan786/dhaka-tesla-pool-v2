import { z } from 'zod';

export const onlineStatusSchema = z.object({ isOnline: z.boolean() }).strict();
export const poolParamsSchema = z.object({ poolId: z.string().uuid() }).strict();

export type OnlineStatusInput = z.infer<typeof onlineStatusSchema>;
export type PoolParams = z.infer<typeof poolParamsSchema>;
