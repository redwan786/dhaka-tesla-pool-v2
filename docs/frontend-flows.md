# Frontend Product Flows

## Routes

| Route | Access | Responsibility |
|---|---|---|
| `/` | Public | Product story and entry points |
| `/login` | Public | Passenger/driver login and seeded demo shortcuts |
| `/register` | Public | Passenger-only registration |
| `/dashboard` | Authenticated | Redirect to the correct role dashboard |
| `/passenger` | PASSENGER | Request, fare, status, cancellation, and history |
| `/driver` | DRIVER | Availability, requests, pools, capacity, lifecycle, and history |

`ProtectedRoute` restores the JWT session through `/api/auth/me`, redirects missing sessions to login, and blocks the wrong role. The API remains the authority for every authorization and ownership decision; client guards are only a usability layer.

## Passenger flow

```text
Register/Login
  → Load zones + own ride history
  → Select pickup/destination/seats
  → Preview pooled fare
  → Request ride
  → REQUESTED
  → MATCHED
  → DRIVER_ARRIVED
  → STARTED
  → COMPLETED
```

Only `REQUESTED` and `MATCHED` rides expose the cancel action. The dashboard polls periodically and also provides manual refresh. A passenger receives only their own API resources, fare, and timeline.

## Driver flow

```text
Login as Jashim
  → Inspect Bullet
  → Go online
  → Load relevant requests
  → Accept into new/compatible pool
  → Mark arrived
  → Start trip
  → Complete trip
  → Inspect history
```

The driver UI never offers an arbitrary status selector. It renders the single next command allowed by the current pool state. Backend state-transition validation, ownership checks, transactions, and capacity locks remain authoritative if a caller bypasses the UI.

## UI state policy

- **Loading:** initial pages and individual mutations show progress.
- **Error:** API messages are normalized through `ApiError` and shown without discarding existing data.
- **Empty:** waiting requests, passenger rides, active pools, and pool history each explain the next action.
- **Disabled:** invalid or premature actions are not clickable.
- **Success:** completed mutations display confirmation and refresh server state.
- **Responsive:** the same information hierarchy works on phone and desktop layouts.