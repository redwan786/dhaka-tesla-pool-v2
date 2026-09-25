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
GET   /api/driver/vehicle
PATCH /api/driver/online-status
GET   /api/driver/requests
GET   /api/driver/pools
POST  /api/driver/rides/:rideId/accept
POST  /api/driver/pools/:poolId/arrive
POST  /api/driver/pools/:poolId/start
POST  /api/driver/pools/:poolId/complete
```

## API design rules

- Authentication uses `Authorization: Bearer <token>`.
- Input is validated before business logic.
- The server derives passenger and driver identity from the token.
- The API never accepts a client-provided `passengerId` or `driverId` as an authority override.
- State changes are explicit commands, not arbitrary status updates.
- Capacity changes are transaction-protected.
- Errors contain an HTTP status, stable code, human-readable message, and optional details.
