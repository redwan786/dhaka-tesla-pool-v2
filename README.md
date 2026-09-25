# Dhaka Tesla Pool

> Share a seat. Split the fare. Survive Dhaka traffic.

This repository is being built incrementally for the Software Engineer Internship challenge. It will model three actors: passengers (Nusrat, Rafiq, Shirin), driver/Tesla (Jashim/Bullet), and ride/pool.

## Step 12 status

The risk-focused test suite now has two explicit layers. Forty-four fast unit/domain tests run without a database. Six Supertest integration scenarios drive the real Express API and migrated PostgreSQL database, proving exact Nusrat/Rafiq fares, passenger and driver ownership, cancellation rules, lifecycle transitions/history, capacity rollback, and a real concurrent final-seat race.

The concurrency scenario allocates two seats, then sends Rafiq's and Shirin's one-seat acceptance calls at the same time. It asserts one success plus one `409 POOL_CAPACITY_EXCEEDED`, `occupiedSeats === 3`, exactly one winning contender membership, and no partial data for the loser.

Integration tests require explicit opt-in through `.env.test`, use only isolated `itest-*` identities, and clean those fixtures without changing the story seed accounts.

```bash
copy .env.test.example .env.test
npm run db:test:prepare
npm run test:integration
npm run test:all
```

See [Testing and concurrency](docs/testing.md).

## Step 11 status

The frontend is now connected end to end to the Express API. Registration creates passenger accounts, login supports both roles and seeded one-click demos, JWT sessions survive refreshes, and role-aware navigation opens the correct product dashboard.

Passenger experience:

- select predefined pickup/destination zones and 1–3 seats;
- see a live, hand-checkable pooled-fare estimate before requesting;
- create one active ride, track its lifecycle and assigned Tesla;
- see only the authenticated passenger's fare/history;
- inspect the status timeline and cancel only while valid.

Driver experience:

- inspect Bullet, fixed capacity, availability, and active pool;
- go online/offline with backend safety rules;
- receive only currently relevant requests and accept them into a pool;
- see assigned passengers, routes, seats, membership status, and capacity;
- perform explicit arrive/start/complete actions;
- keep completed/cancelled pool history.

Both dashboards provide loading, error, empty, confirmation, disabled, action-in-progress, and periodic-refresh states. See [Frontend flows](docs/frontend-flows.md).

## Step 10 status

The Next.js frontend foundation is now ready for the product screens. It includes a responsive App Router layout and navigation, Tailwind design tokens, a typed API client with normalized errors, JWT session restoration through `/auth/me`, a protected-route boundary, and reusable buttons, cards, form controls, status badges, loading, error, and empty states. The public home, sign-in foundation, protected dashboard foundation, route-level loading/error, and custom not-found routes all build successfully.

This step intentionally does not implement the final passenger and driver product screens. Those API-backed flows belong to `feature/frontend-flows` in Step 11, preserving a meaningful incremental history.

Frontend environment:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Step 9 status

Jashim's complete backend workflow is now implemented. An authenticated driver can inspect Bullet and its active pool, go online/offline, see only waiting requests that fit the current capacity and matching rule, inspect assigned passengers/seats and pool history, and advance a pool through `OPEN → ARRIVED → IN_PROGRESS → COMPLETED`. Every pool transition locks the pool, verifies ownership and the required current state, updates every active passenger ride in the same transaction, appends status history, and writes an audit event.

Driver safety rules added in this step:

- an offline driver cannot view or accept waiting requests;
- a driver cannot go offline while a pool is active;
- an arrived/in-progress vehicle cannot accept another request;
- skipped, repeated, reversed, or terminal state transitions return `INVALID_POOL_TRANSITION`;
- cancelled memberships are excluded from lifecycle changes;
- Jashim can manage only pools that belong to Bullet.

Implemented driver endpoints:

```text
GET   /api/driver/vehicle
PATCH /api/driver/online-status
GET   /api/driver/requests
GET   /api/driver/pools
GET   /api/driver/pools/:poolId
POST  /api/driver/rides/:rideId/accept
POST  /api/driver/pools/:poolId/arrive
POST  /api/driver/pools/:poolId/start
POST  /api/driver/pools/:poolId/complete
```

## Step 8 status

Tesla pooling and capacity allocation are now implemented. Jashim can accept a waiting ride into a new Bullet pool or the compatible existing OPEN pool. The transaction locks Bullet's vehicle row before re-reading capacity, then atomically creates an explicit membership, snapshots that passenger's fare, increments occupied seats, changes the ride to `MATCHED`, and records status/audit history. Bullet can never exceed its three-seat capacity; a concurrent loser receives `POOL_CAPACITY_EXCEEDED` or `RIDE_NOT_REQUESTED` without partial data.

Apply the new database integrity migration before testing this step:

```bash
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
```

Driver endpoint added in this step:

```text
POST /api/driver/rides/:rideId/accept
```

## Step 7 status

The authenticated passenger ride flow is now implemented: request a ride with pickup/destination/seats, snapshot the integer-paisa fare, list and inspect only the passenger's own rides, preserve status history and audit records, prevent multiple active rides, and cancel only while `REQUESTED` or `MATCHED`. Matched cancellation safely releases occupied seats inside a transaction.

## Step 6 status

Geography and fare rules are now executable domain code. The API lists seeded Dhaka zones and returns a pooled fare estimate with an integer-paisa breakdown. Nusrat's Banani–Mohakhali example uses 4 km and ৳76.50; Rafiq's Banani–Gulshan 1 example uses 3 km and ৳63.75. Destination compatibility uses a 4 km Haversine threshold while unknown fare routes use a documented road-distance fallback.

## Step 5 status

Authentication and authorization are now implemented: passenger registration, passenger/driver login, bcrypt password hashing, signed JWT access tokens, authenticated current-user lookup, role middleware, reusable ownership guards, and authentication audit records. Public registration is passenger-only; the seeded Jashim account represents the provisioned driver.

## Step 4 status

The Express backend foundation now includes validated environment configuration, structured request logging, security headers, CORS policy, standard success/error responses, Zod validation middleware, Prisma error mapping, a reusable Prisma client, modular routes, and health endpoints. Business features remain intentionally deferred.

## Step 3 status

The relational database foundation is now included in `apps/api/prisma/`: Prisma schema, initial migration, and story-consistent seed data for Supabase PostgreSQL or the later Docker PostgreSQL fallback. Business API routes are intentionally deferred to later steps.

## Step 2 status

Architecture-first documentation is now included in `docs/`: system architecture, ERD, domain rules, API contract, and technology decisions. Database schema and business features are intentionally deferred to later steps.

## Step 1 status

The project foundation is in place:

- Next.js App Router frontend
- Express + TypeScript API
- Monorepo workspace scripts
- Environment variable template
- API health endpoint
- Initial frontend shell
- No real domain feature has been added yet

## Local prerequisites

- Node.js 22 or newer
- npm 10 or newer
- Supabase account for the database step
- Docker is not needed for this foundation step; Docker Compose files will be added later for reproducibility

## Run the foundation

```bash
npm install
npm run dev
```

- Frontend: http://localhost:3000
- API health: http://localhost:4000/health

## Environment

Copy `.env.example` to `.env` when environment-backed features are introduced. Never commit `.env` or real secrets.

## Planned architecture

```text
Browser → Next.js frontend → Node.js Express API → Supabase PostgreSQL
                                                   ↘ Docker PostgreSQL fallback
```

Detailed architecture and design documents:

- [Architecture](docs/architecture.md)
- [Domain rules](docs/domain-model.md)
- [ERD](docs/erd.md)
- [Technology decisions](docs/technology-decisions.md)
- [API contract](docs/api-contract.md)

Docker, deployment, final screenshots, and the final video will be added in later feature branches.
