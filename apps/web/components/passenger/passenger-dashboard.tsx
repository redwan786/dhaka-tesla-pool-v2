'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../lib/api/client';
import type { PassengerRide, RideStatus, Zone } from '../../lib/api/types';
import { errorMessage, formatDate, formatMoney } from '../../lib/format';
import { useAuth } from '../../providers/auth-provider';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { EmptyState, ErrorState, LoadingState } from '../ui/page-state';
import { StatusBadge } from '../ui/status-badge';
import { Notice } from '../ui/notice';
import { RideRequestForm } from './ride-request-form';

const ACTIVE_STATUSES: RideStatus[] = ['REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED'];
const CANCELLABLE_STATUSES: RideStatus[] = ['REQUESTED', 'MATCHED'];
const JOURNEY: RideStatus[] = ['REQUESTED', 'MATCHED', 'DRIVER_ARRIVED', 'STARTED', 'COMPLETED'];

export function PassengerDashboard() {
  const { user, token } = useAuth();
  const [zones, setZones] = useState<Zone[]>([]);
  const [rides, setRides] = useState<PassengerRide[]>([]);
  const [selectedRide, setSelectedRide] = useState<PassengerRide | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [busyRideId, setBusyRideId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async (quiet = false) => {
    if (!token) return;
    if (!quiet) setIsLoading(true);
    setError(null);
    try {
      const [zoneData, rideData] = await Promise.all([
        apiRequest<Zone[]>('/zones'),
        apiRequest<PassengerRide[]>('/passenger/rides', { token }),
      ]);
      setZones(zoneData);
      setRides(rideData);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(true), 12000);
    return () => window.clearInterval(interval);
  }, [load]);

  const activeRide = useMemo(
    () => rides.find((ride) => ACTIVE_STATUSES.includes(ride.status)) ?? null,
    [rides],
  );

  const cancelRide = async (rideId: string) => {
    if (!token || !window.confirm('Cancel this ride request?')) return;
    setBusyRideId(rideId);
    setError(null);
    try {
      await apiRequest(`/passenger/rides/${rideId}/cancel`, { method: 'POST', token });
      setNotice('Ride cancelled and any reserved seats were released.');
      setSelectedRide(null);
      await load(true);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusyRideId(null);
    }
  };

  const showTimeline = async (rideId: string) => {
    if (!token) return;
    setBusyRideId(rideId);
    try {
      setSelectedRide(await apiRequest<PassengerRide>(`/passenger/rides/${rideId}`, { token }));
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusyRideId(null);
    }
  };

  if (isLoading) return <LoadingState message="Loading your rides…" />;
  if (error && rides.length === 0) return <ErrorState message={error} onRetry={() => void load()} />;

  return (
    <main className="page-container py-10 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-leaf">Passenger dashboard</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Salaam, {user?.name}.</h1>
          <p className="mt-2 text-ink/60">Request, track, and understand your own ride—never another passenger's fare.</p>
        </div>
        <Button variant="secondary" onClick={() => void load()} disabled={isLoading}>Refresh status</Button>
      </div>
      {error ? <div className="mt-6"><Notice tone="error" title="Action failed" message={error} /></div> : null}
      {notice ? <div className="mt-6"><Notice tone="success" title="Done" message={notice} /></div> : null}

      {activeRide ? (
        <Card className="mt-8 overflow-hidden bg-ink text-white">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
            <div>
              <div className="flex flex-wrap items-center gap-3"><StatusBadge status={activeRide.status} /><span className="text-xs text-white/45">Updated {formatDate(activeRide.updatedAt)}</span></div>
              <h2 className="mt-5 text-3xl font-black">{activeRide.pickupZone.name} <span className="text-mint">→</span> {activeRide.destinationZone.name}</h2>
              <p className="mt-3 text-white/60">{activeRide.requestedSeats} seat{activeRide.requestedSeats > 1 ? 's' : ''} · Your fare {formatMoney(activeRide.estimatedFarePaisa)}</p>
              {activeRide.pool ? <p className="mt-2 text-sm text-mint">Matched with {activeRide.pool.vehicle.name} · {activeRide.pool.occupiedSeats}/{activeRide.pool.vehicle.capacity} seats occupied</p> : <p className="mt-2 text-sm text-signal">Waiting for Jashim to accept</p>}
            </div>
            <div className="grid content-start gap-2 sm:grid-cols-5 lg:grid-cols-1">
              {JOURNEY.map((status, index) => {
                const currentIndex = JOURNEY.indexOf(activeRide.status);
                const reached = currentIndex >= index || activeRide.status === 'COMPLETED';
                return <div key={status} className={`rounded-xl px-3 py-2 text-xs font-bold ${reached ? 'bg-mint text-ink' : 'bg-white/5 text-white/35'}`}>{index + 1}. {status.replaceAll('_', ' ')}</div>;
              })}
            </div>
          </div>
          <div className="mt-7 flex flex-wrap gap-3 border-t border-white/10 pt-6">
            <Button variant="secondary" onClick={() => void showTimeline(activeRide.id)} isLoading={busyRideId === activeRide.id}>View timeline</Button>
            {CANCELLABLE_STATUSES.includes(activeRide.status) ? <Button variant="danger" onClick={() => void cancelRide(activeRide.id)} isLoading={busyRideId === activeRide.id}>Cancel ride</Button> : null}
          </div>
        </Card>
      ) : null}

      <div className="mt-8 grid gap-7 lg:grid-cols-[.9fr_1.1fr]">
        <RideRequestForm zones={zones} token={token!} disabled={Boolean(activeRide)} onCreated={(ride) => { setRides((current) => [ride, ...current]); setNotice('Ride requested. Jashim can now see it when online.'); }} />
        <section>
          <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.18em] text-leaf">Your history</p><h2 className="mt-2 text-2xl font-black">Every ride, explained</h2></div><span className="text-sm text-ink/50">{rides.length} total</span></div>
          {rides.length === 0 ? <EmptyState title="No rides yet" description="Choose Banani and a destination to create the first request." /> : (
            <div className="grid gap-4">
              {rides.map((ride) => (
                <Card key={ride.id} className="shadow-none">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div><StatusBadge status={ride.status} /><h3 className="mt-3 text-lg font-black">{ride.pickupZone.name} → {ride.destinationZone.name}</h3><p className="mt-1 text-sm text-ink/55">{formatDate(ride.createdAt)} · {ride.requestedSeats} seat{ride.requestedSeats > 1 ? 's' : ''}</p></div>
                    <p className="text-xl font-black">{formatMoney(ride.estimatedFarePaisa)}</p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-ink/10 pt-4">
                    <Button variant="ghost" onClick={() => void showTimeline(ride.id)} isLoading={busyRideId === ride.id}>Timeline</Button>
                    {CANCELLABLE_STATUSES.includes(ride.status) ? <Button variant="danger" onClick={() => void cancelRide(ride.id)} isLoading={busyRideId === ride.id}>Cancel</Button> : null}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedRide ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-5" role="dialog" aria-modal="true" aria-label="Ride timeline">
          <Card className="max-h-[85vh] w-full max-w-xl overflow-y-auto">
            <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-wider text-leaf">Ride timeline</p><h2 className="mt-2 text-2xl font-black">{selectedRide.pickupZone.name} → {selectedRide.destinationZone.name}</h2></div><Button variant="ghost" onClick={() => setSelectedRide(null)}>Close</Button></div>
            <div className="mt-7 grid gap-3">
              {selectedRide.statusHistory?.map((entry) => (
                <div key={entry.id} className="rounded-2xl bg-paper p-4"><div className="flex items-center justify-between gap-3"><StatusBadge status={entry.toStatus} /><span className="text-xs text-ink/45">{formatDate(entry.createdAt)}</span></div><p className="mt-2 text-sm text-ink/65">{entry.reason}</p></div>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
    </main>
  );
}
