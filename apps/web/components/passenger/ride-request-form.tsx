'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { apiRequest } from '../../lib/api/client';
import type { FareEstimate, PassengerRide, Zone } from '../../lib/api/types';
import { errorMessage, formatMoney } from '../../lib/format';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { FieldShell, SelectInput } from '../ui/form-controls';
import { Notice } from '../ui/notice';

export function RideRequestForm({
  zones,
  token,
  disabled,
  onCreated,
}: {
  zones: Zone[];
  token: string;
  disabled: boolean;
  onCreated: (ride: PassengerRide) => void;
}) {
  const [pickupZoneId, setPickupZoneId] = useState('');
  const [destinationZoneId, setDestinationZoneId] = useState('');
  const [requestedSeats, setRequestedSeats] = useState(1);
  const [estimate, setEstimate] = useState<FareEstimate | null>(null);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setEstimate(null);
    setEstimateError(null);
    if (!pickupZoneId || !destinationZoneId || pickupZoneId === destinationZoneId) return;

    const timer = window.setTimeout(() => {
      setIsEstimating(true);
      apiRequest<FareEstimate>('/zones/estimate', {
        method: 'POST',
        body: { pickupZoneId, destinationZoneId },
      })
        .then(setEstimate)
        .catch((caught) => setEstimateError(errorMessage(caught)))
        .finally(() => setIsEstimating(false));
    }, 250);

    return () => window.clearTimeout(timer);
  }, [destinationZoneId, pickupZoneId]);

  const totalFare = useMemo(
    () => (estimate ? estimate.fare.passengerFarePaisa * requestedSeats : null),
    [estimate, requestedSeats],
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const ride = await apiRequest<PassengerRide>('/passenger/rides', {
        method: 'POST',
        token,
        body: { pickupZoneId, destinationZoneId, requestedSeats },
      });
      onCreated(ride);
      setPickupZoneId('');
      setDestinationZoneId('');
      setRequestedSeats(1);
      setEstimate(null);
    } catch (caught) {
      setSubmitError(errorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="h-fit">
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-leaf">New ride</p>
      <h2 className="mt-3 text-2xl font-black">Where are you heading?</h2>
      <p className="mt-2 text-sm leading-6 text-ink/60">Choose simple Dhaka zones—no map API or hidden routing rules.</p>
      {disabled ? <div className="mt-6"><Notice title="One active ride at a time" message="Complete or cancel the current ride before requesting another." /></div> : null}
      {submitError ? <div className="mt-6"><Notice tone="error" title="Ride request failed" message={submitError} /></div> : null}
      <form className="mt-7 grid gap-5" onSubmit={submit}>
        <FieldShell label="Pickup zone" htmlFor="pickup">
          <SelectInput id="pickup" required disabled={disabled} value={pickupZoneId} onChange={(event) => setPickupZoneId(event.target.value)}>
            <option value="">Select pickup</option>
            {zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
          </SelectInput>
        </FieldShell>
        <FieldShell label="Destination zone" htmlFor="destination" error={pickupZoneId && pickupZoneId === destinationZoneId ? 'Pickup and destination must be different.' : undefined}>
          <SelectInput id="destination" required disabled={disabled} value={destinationZoneId} onChange={(event) => setDestinationZoneId(event.target.value)}>
            <option value="">Select destination</option>
            {zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
          </SelectInput>
        </FieldShell>
        <FieldShell label="Seats" htmlFor="seats" hint="One passenger may reserve 1–3 seats; every seat counts against Bullet's capacity.">
          <SelectInput id="seats" disabled={disabled} value={requestedSeats} onChange={(event) => setRequestedSeats(Number(event.target.value))}>
            {[1, 2, 3].map((seats) => <option key={seats} value={seats}>{seats} seat{seats > 1 ? 's' : ''}</option>)}
          </SelectInput>
        </FieldShell>

        {isEstimating ? <p className="text-sm font-semibold text-ink/55">Calculating pooled fare…</p> : null}
        {estimateError ? <Notice tone="error" title="Fare unavailable" message={estimateError} /> : null}
        {estimate && totalFare !== null ? (
          <div className="rounded-2xl bg-paper p-5">
            <div className="flex items-end justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-wider text-ink/45">Estimated total</p><p className="mt-1 text-3xl font-black">{formatMoney(totalFare)}</p></div>
              <span className="rounded-full bg-mint px-3 py-1 text-xs font-extrabold text-ink">{estimate.fare.poolDiscountPercent}% pool discount</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-ink/10 pt-4 text-xs text-ink/60">
              <span>{estimate.fare.distanceKm} km</span><span>{formatMoney(estimate.fare.passengerFarePaisa)}/seat</span><span>{requestedSeats} seat{requestedSeats > 1 ? 's' : ''}</span>
            </div>
          </div>
        ) : null}
        <Button type="submit" isLoading={isSubmitting} disabled={disabled || !estimate || pickupZoneId === destinationZoneId}>Request pooled ride</Button>
      </form>
    </Card>
  );
}
