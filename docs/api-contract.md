# API Contract Outline

The API is RESTful. Resource names are plural where appropriate, and the authenticated user is derived from the JWT rather than trusted from the request body.

## Public/auth routes

```text
POST /api/auth/register  # creates PASSENGER accounts only
POST /api/auth/login     # passenger and provisioned driver login
GET  /api/auth/me        # requires Bearer token
GET  /api/health
```

## Geography/fare routes

```text
GET  /api/zones           # seeded Dhaka zones
POST /api/zones/estimate # pickup/destination UUIDs → integer-paisa fare breakdown
```

## Passenger routes

```text
POST /api/passenger/rides
GET  /api/passenger/rides
GET  /api/passenger/rides/:rideId
POST /api/passenger/rides/:rideId/cancel
```

## Driver routes

```text
GET   /api/driver/vehicle                 # Bullet, availability, active pool
PATCH /api/driver/online-status           # body: { "isOnline": boolean }
GET   /api/driver/requests                # waiting requests relevant to Bullet now
GET   /api/driver/pools                   # active and historical pools
GET   /api/driver/pools/:poolId           # owned pool, members, routes, history
POST  /api/driver/rides/:rideId/accept    # create/join an OPEN pool
POST  /api/driver/pools/:poolId/arrive    # OPEN → ARRIVED
POST  /api/driver/pools/:poolId/start     # ARRIVED → IN_PROGRESS
POST  /api/driver/pools/:poolId/complete  # IN_PROGRESS → COMPLETED
```

All listed driver routes are implemented through Step 9.

### Driver behavior

- Only an authenticated `DRIVER` can call the endpoint.
- Driver and vehicle ownership are derived from the JWT identity.
- Going offline is rejected while Bullet has an active pool.
- Offline drivers cannot list/accept waiting requests.
- If there is no active pool, fitting `REQUESTED` rides are relevant.
- If there is an `OPEN` pool, relevant requests must also match its pickup/destination rule and remaining capacity.
- Once the pool is `ARRIVED` or `IN_PROGRESS`, no new request is relevant or acceptable.
- The ride must still be `REQUESTED`.
- The first compatible ride creates an `OPEN` pool; later compatible rides join it.
- Same pickup plus destinations within 4 km is required for a shared pool.
- Success returns the pool, Bullet's capacity/occupancy, explicit memberships, assigned passenger names, seats, routes, ride statuses, and each membership's snapshotted fare.
- `409 POOL_CAPACITY_EXCEEDED` rejects overbooking.
- `409 RIDE_NOT_COMPATIBLE_WITH_OPEN_POOL` rejects an incompatible route while Bullet has an open pool.
- `409 RIDE_NOT_REQUESTED` rejects duplicate or stale acceptance.
- `409 INVALID_POOL_TRANSITION` rejects skipped, repeated, reversed, or terminal lifecycle commands.
- Arrival/start/completion atomically update the pool, every active passenger ride, status history, and audit log.

## API design rules

- Authentication uses `Authorization: Bearer <token>`.
- Input is validated before business logic.
- The server derives passenger and driver identity from the token.
- The API never accepts a client-provided `passengerId` or `driverId` as an authority override.
- State changes are explicit commands, not arbitrary status updates.
- Capacity changes are transaction-protected.
- Errors contain an HTTP status, stable code, human-readable message, and optional details.
