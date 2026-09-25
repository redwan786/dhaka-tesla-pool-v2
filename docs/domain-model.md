# Dhaka Tesla Pool — Domain Rules

## 1. Canonical story

- Jashim is the driver.
- Bullet is Jashim's three-seat battery-powered Tesla.
- Nusrat requests Banani → Mohakhali.
- Rafiq requests Banani → Gulshan 1.
- Shirin later attempts to claim the last available seat.

The same names appear in seed data, tests, README examples, and the final demo.

## 2. Ride lifecycle

```text
REQUESTED → MATCHED → DRIVER_ARRIVED → STARTED → COMPLETED
     └──────────────→ CANCELLED
                MATCHED ─────────────→ CANCELLED
```

Allowed transitions:

| Current | Next | Who can cause it |
|---|---|---|
| REQUESTED | MATCHED | Driver accepting the request |
| REQUESTED | CANCELLED | Passenger while request is waiting |
| MATCHED | DRIVER_ARRIVED | Driver |
| MATCHED | CANCELLED | Passenger before arrival |
| DRIVER_ARRIVED | STARTED | Driver |
| STARTED | COMPLETED | Driver |

`COMPLETED` and `CANCELLED` are terminal states. The API rejects skipped or reversed transitions.

The pool has a related lifecycle:

```text
OPEN → ARRIVED → IN_PROGRESS → COMPLETED
  └──────────────────────────→ CANCELLED
```

## 3. Geography assumption

The MVP uses a predefined list of Dhaka zones and coordinate points. It does not call a map provider or calculate actual road routes.

A new request is compatible with an existing OPEN Bullet pool when:

1. The pickup zone is the same.
2. The destination zones are the same or within 4 km by Haversine distance.
3. The requested seats fit within the remaining capacity.
4. The existing pool has not reached arrival/start.
5. Both requests are otherwise valid and not cancelled.

For the demo, Banani → Mohakhali and Banani → Gulshan 1 are intentionally compatible. This is deterministic, easy to test, and easy to explain.

Fare distance uses a small documented route-distance table for the demo examples. An unknown pair falls back to `Haversine distance × 1.35`, rounded to one decimal place, to approximate a simple road-distance factor without a map API.

## 4. Fare assumption

Money is stored as integer paisa/poysha, not a floating-point decimal.

```text
BASE_FARE = 3000 paisa
DISTANCE_RATE = 1500 paisa per km
POOL_DISCOUNT = 15 percent

subtotal = BASE_FARE + ceil(distanceKm × DISTANCE_RATE)
poolDiscount = floor(subtotal × 15 / 100)
passengerFare = subtotal - poolDiscount
```

Hand-checkable demo distances:

| Passenger | Route | Distance used | Calculation | Fare |
|---|---|---:|---|---:|
| Nusrat | Banani → Mohakhali | 4 km | 3000 + (4 × 1500) − 1350 | 7650 paisa = ৳76.50 |
| Rafiq | Banani → Gulshan 1 | 3 km | 3000 + (3 × 1500) − 1125 | 6375 paisa = ৳63.75 |

The calculated fare is snapshotted on the ride/pool membership so later pricing changes cannot rewrite history.

A ride request consumes `requestedSeats` from vehicle capacity. The MVP prices a passenger party as `per-seat pooled fare × requestedSeats`; the one-seat Nusrat and Rafiq examples remain unchanged. A passenger may have only one active ride (`REQUESTED`, `MATCHED`, `DRIVER_ARRIVED`, or `STARTED`) at a time.

## 5. Payment assumption

The MVP supports a documented cash settlement assumption. A payment record can store:

- `method`: CASH or TESLAPAY_SIMULATED
- `status`: PENDING, PAID, or FAILED
- `amountPaisa`
- `paidAt`

No real payment gateway is required or connected.

## 6. Capacity and concurrency rule

Bullet has a fixed capacity of 3 seats. The final check happens in a database transaction:

1. Lock the relevant vehicle row.
2. Load the current OPEN pool.
3. Check `occupiedSeats + requestedSeats <= capacity`.
4. Increment occupied seats and create membership atomically.
5. Commit, or roll back everything on failure.

If Nusrat and Shirin both try to claim one final seat, only one transaction can pass. The other receives a conflict response and no partial membership remains.

Step 8 implements this as a PostgreSQL `FOR UPDATE` lock on Bullet's `Vehicle` row. Every acceptance for that vehicle acquires the same lock before it reads the request, open pool, or current occupancy. A partial unique index also permits only one active pool (`OPEN`, `ARRIVED`, or `IN_PROGRESS`) per vehicle. Check constraints reject non-positive capacities/seats and negative fares/occupancy at the database boundary.

Acceptance is atomic: creating/reusing the pool, incrementing `occupiedSeats`, creating `PoolMember`, setting the ride to `MATCHED`, adding `StatusHistory`, and writing `AuditLog` either all commit or all roll back. `PoolMember.farePaisa` is the passenger's immutable fare snapshot; it is not another passenger's fare and is not recalculated when a new member joins.

At larger scale, this design could evolve toward a dedicated allocation service, optimistic version columns, partitioning, or queue-based matching, but the MVP does not need a distributed solution.

## 7. Visibility rules

- A passenger can read and cancel only their own ride requests.
- A passenger can see only their own fare and status.
- A driver can manage only pools belonging to their own vehicle.
- A driver can see assigned passenger names and seats, but ownership checks still apply on every API call.
