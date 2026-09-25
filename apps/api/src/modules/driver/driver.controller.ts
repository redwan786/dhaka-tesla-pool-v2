import type { Request, Response } from 'express';
import { sendSuccess } from '../../lib/api-response.js';
import type { OnlineStatusInput, PoolParams } from './driver.schemas.js';
import {
  getDriverPool,
  getDriverVehicle,
  listDriverPools,
  listRelevantRideRequests,
  transitionDriverPool,
  updateDriverOnlineStatus,
} from './driver.service.js';

export async function getVehicleController(request: Request, response: Response) {
  sendSuccess(response, await getDriverVehicle(request.user!), { message: 'Driver vehicle loaded' });
}

export async function updateOnlineStatusController(request: Request, response: Response) {
  const { isOnline } = request.body as OnlineStatusInput;
  sendSuccess(response, await updateDriverOnlineStatus(isOnline, request.user!), {
    message: isOnline ? 'Driver is online' : 'Driver is offline',
  });
}

export async function listRequestsController(request: Request, response: Response) {
  sendSuccess(response, await listRelevantRideRequests(request.user!), {
    message: 'Relevant ride requests loaded',
  });
}

export async function listPoolsController(request: Request, response: Response) {
  sendSuccess(response, await listDriverPools(request.user!), { message: 'Driver pool history loaded' });
}

export async function getPoolController(request: Request, response: Response) {
  const { poolId } = request.params as PoolParams;
  sendSuccess(response, await getDriverPool(poolId, request.user!), { message: 'Driver pool loaded' });
}

async function transition(request: Request, response: Response, command: 'arrive' | 'start' | 'complete') {
  const { poolId } = request.params as PoolParams;
  const pool = await transitionDriverPool(poolId, command, request.user!);
  sendSuccess(response, pool, { message: `Pool ${command} transition completed` });
}

export const arrivePoolController = (request: Request, response: Response) =>
  transition(request, response, 'arrive');
export const startPoolController = (request: Request, response: Response) =>
  transition(request, response, 'start');
export const completePoolController = (request: Request, response: Response) =>
  transition(request, response, 'complete');
