'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../lib/api/client';
import type { DriverPool, DriverRequest, DriverVehicle, PoolStatus } from '../../lib/api/types';
import { errorMessage, formatDate } from '../../lib/format';
import { useAuth } from '../../providers/auth-provider';
import { Button } from '../ui/button';
import { CapacityMeter } from '../ui/capacity-meter';
import { Card } from '../ui/card';
import { EmptyState, ErrorState, LoadingState } from '../ui/page-state';
import { Notice } from '../ui/notice';
import { StatusBadge } from '../ui/status-badge';

const ACTIVE_POOL_STATUSES: PoolStatus[] = ['OPEN', 'ARRIVED', 'IN_PROGRESS'];

const actionForStatus: Partial<Record<PoolStatus, { command: string; label: string }>> = {
  OPEN: { command: 'arrive', label: 'Mark driver arrived' },
  ARRIVED: { command: 'start', label: 'Start pooled trip' },
  IN_PROGRESS: { command: 'complete', label: 'Complete trip' },
};

export function DriverDashboard() {
  const { user, token, refreshUser } = useAuth();
  const [vehicle, setVehicle] = useState<DriverVehicle | null>(null);
  const [requests, setRequests] = useState<DriverRequest[]>([]);
  const [pools, setPools] = useState<DriverPool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!token) return;
    if (!quiet) setIsLoading(true);
    setError(null);
    try {
      const [vehicleData, poolData] = await Promise.all([
        apiRequest<DriverVehicle>('/driver/vehicle', { token }),
        apiRequest<DriverPool[]>('/driver/pools', { token }),
      ]);
      setVehicle(vehicleData);
      setPools(poolData);
      if (vehicleData.driver.isOnline) {
        setRequests(await apiRequest<DriverRequest[]>('/driver/requests', { token }));
      } else {
        setRequests([]);
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(true), 10000);
    return () => window.clearInterval(interval);
  }, [load]);

  const activePool = useMemo(
    () => pools.find((pool) => ACTIVE_POOL_STATUSES.includes(pool.status)) ?? null,
    [pools],
  );
  const poolHistory = pools.filter((pool) => !ACTIVE_POOL_STATUSES.includes(pool.status));

  const toggleOnline = async () => {
    if (!token || !vehicle) return;
    const nextOnline = !vehicle.driver.isOnline;
    setBusyKey('online');
    setError(null);
    try {
      await apiRequest('/driver/online-status', {
        method: 'PATCH',
        token,
        body: { isOnline: nextOnline },
      });
      await refreshUser();
      setNotice(nextOnline ? 'You are online and receiving relevant requests.' : 'You are now offline.');
      await load(true);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusyKey(null);
    }
  };

  const acceptRide = async (rideId: string) => {
    if (!token) return;
    setBusyKey(rideId);
    setError(null);
    try {
      await apiRequest(`/driver/rides/${rideId}/accept`, { method: 'POST', token });
      setNotice('Passenger assigned to Bullet. Capacity and membership updated atomically.');
      await load(true);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusyKey(null);
    }
  };

  const transitionPool = async (pool: DriverPool) => {
    if (!token) return;
    const action = actionForStatus[pool.status];
    if (!action) return;
    setBusyKey(action.command);
    setError(null);
    try {
      await apiRequest(`/driver/pools/${pool.id}/${action.command}`, { method: 'POST', token });
      setNotice(`${action.label} completed for every active passenger.`);
      await load(true);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusyKey(null);
    }
  };

  if (isLoading) return <LoadingState message="Loading Bullet's dashboard…" />;
  if (!vehicle) return <ErrorState message={error ?? 'No active vehicle was found for this driver.'} onRetry={() => void load()} />;

  return (
    <main className="page-container py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-leaf">Driver dashboard</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Ready, {user?.name}?</h1>
          <p className="mt-2 text-ink/60">Manage Bullet, assigned passengers, and the complete pooled-trip lifecycle.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => void load()}>Refresh</Button>
          <Button variant={vehicle.driver.isOnline ? 'danger' : 'primary'} isLoading={busyKey === 'online'} onClick={() => void toggleOnline()}>
            Go {vehicle.driver.isOnline ? 'offline' : 'online'}
          </Button>
        </div>
      </div>
      {error ? <div className="mt-6"><Notice tone="error" title="Action failed" message={error} /></div> : null}
      {notice ? <div className="mt-6"><Notice tone="success" title="Dashboard updated" message={notice} /></div> : null}

      <section className="mt-8 grid gap-5 sm:grid-cols-3">
        <Card className="shadow-none"><p className="text-xs font-bold uppercase tracking-wider text-ink/45">Tesla</p><p className="mt-3 text-3xl font-black">{vehicle.name}</p><p className="mt-1 text-sm text-ink/55">Fixed capacity · {vehicle.capacity} seats</p></Card>
        <Card className="shadow-none"><p className="text-xs font-bold uppercase tracking-wider text-ink/45">Availability</p><div className="mt-3"><StatusBadge status={vehicle.driver.isOnline ? 'ONLINE' : 'OFFLINE'} /></div><p className="mt-3 text-sm text-ink/55">{vehicle.driver.isOnline ? 'Relevant requests are visible.' : 'No new request can be accepted.'}</p></Card>
        <Card className="shadow-none"><p className="text-xs font-bold uppercase tracking-wider text-ink/45">Active pool</p><p className="mt-3 text-3xl font-black">{activePool ? activePool.members.filter((member) => member.status === 'ACTIVE').length : 0}</p><p className="mt-1 text-sm text-ink/55">assigned passenger parties</p></Card>
      </section>

      <div className="mt-8 grid gap-7 xl:grid-cols-[1.15fr_.85fr]">
        <section>
          <div className="mb-5"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-leaf">Current pool</p><h2 className="mt-2 text-2xl font-black">Who's riding Bullet?</h2></div>
          {!activePool ? <EmptyState title="No active pool" description="Go online and accept a relevant request to create one." /> : (
            <Card className="overflow-hidden bg-ink text-white">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><StatusBadge status={activePool.status} /><h3 className="mt-4 text-3xl font-black">Pool #{activePool.id.slice(0, 8)}</h3><p className="mt-2 text-sm text-white/55">Created {formatDate(activePool.createdAt)}</p></div>
                {actionForStatus[activePool.status] ? <Button isLoading={busyKey === actionForStatus[activePool.status]?.command} onClick={() => void transitionPool(activePool)}>{actionForStatus[activePool.status]?.label}</Button> : null}
              </div>
              <div className="mt-7 rounded-2xl bg-white p-5 text-ink"><CapacityMeter occupied={activePool.occupiedSeats} capacity={activePool.vehicle.capacity} /></div>
              <div className="mt-6 grid gap-3">
                {activePool.members.map((member) => (
                  <div key={member.id} className={`rounded-2xl border p-4 ${member.status === 'ACTIVE' ? 'border-white/10 bg-white/5' : 'border-red-300/20 bg-red-300/5 opacity-60'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-black">{member.passenger.name}</p><p className="mt-1 text-sm text-white/55">{member.rideRequest.pickupZone.name} → {member.rideRequest.destinationZone.name}</p></div><div className="text-right"><StatusBadge status={member.rideRequest.status} /><p className="mt-2 text-xs text-white/50">{member.seats} seat{member.seats > 1 ? 's' : ''}</p></div></div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </section>

        <section>
          <div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-leaf">Waiting nearby</p><h2 className="mt-2 text-2xl font-black">Relevant requests</h2></div><span className="text-sm text-ink/50">{requests.length}</span></div>
          {!vehicle.driver.isOnline ? <Notice title="You are offline" message="Go online to load matching passenger requests." /> : null}
          {vehicle.driver.isOnline && requests.length === 0 ? <EmptyState title="No compatible requests" description="The list updates automatically every 10 seconds." /> : (
            <div className="grid gap-4">
              {requests.map((request) => (
                <Card key={request.id} className="shadow-none">
                  <div className="flex items-start justify-between gap-3"><div><p className="font-black">{request.passenger.name}</p><p className="mt-1 text-sm text-ink/55">{request.pickupZone.name} → {request.destinationZone.name}</p></div><span className="rounded-full bg-paper px-3 py-1 text-xs font-bold">{request.requestedSeats} seat{request.requestedSeats > 1 ? 's' : ''}</span></div>
                  <p className="mt-3 text-xs text-ink/40">Requested {formatDate(request.createdAt)}</p>
                  <Button className="mt-5 w-full" isLoading={busyKey === request.id} onClick={() => void acceptRide(request.id)}>Accept into pool</Button>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="mt-12">
        <div className="mb-5"><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-leaf">Ride history</p><h2 className="mt-2 text-2xl font-black">Completed and cancelled pools</h2></div>
        {poolHistory.length === 0 ? <EmptyState title="No finished pools" description="Completed trips will remain here for explanation and audit." /> : (
          <div className="grid gap-4 md:grid-cols-2">
            {poolHistory.map((pool) => <Card key={pool.id} className="shadow-none"><div className="flex justify-between gap-3"><StatusBadge status={pool.status} /><span className="text-xs text-ink/45">{formatDate(pool.createdAt)}</span></div><h3 className="mt-4 text-lg font-black">{pool.members.filter((member) => member.status === 'ACTIVE').map((member) => member.passenger.name).join(' · ') || 'No active passengers'}</h3><p className="mt-2 text-sm text-ink/55">{pool.occupiedSeats}/{pool.vehicle.capacity} seats recorded · Pool #{pool.id.slice(0, 8)}</p></Card>)}
          </div>
        )}
      </section>
    </main>
  );
}
