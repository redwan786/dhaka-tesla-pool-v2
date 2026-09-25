# Testing and Concurrency

## Test layers

### Unit/domain tests

Fast tests cover fare arithmetic, geography matching, validation, auth helpers, ownership guards, cancellation rules, capacity decisions, driver availability, and lifecycle transition maps. They do not require a running database.

```bash
npm run test:unit
```

### HTTP integration tests

Supertest drives the real Express application while Prisma talks to a migrated PostgreSQL database. The suite creates isolated users whose emails start with `itest-`, creates dedicated vehicles/rides/pools, and removes them after the run. It never edits the Jashim/Nusrat/Rafiq/Shirin seed accounts.

Coverage includes:

- Nusrat's and Rafiq's exact fare snapshots;
- cross-passenger read/cancel rejection;
- valid and invalid cancellation;
- skipped/repeated lifecycle transition rejection;
- full REQUESTED → COMPLETED HTTP flow and status history;
- capacity rejection plus transaction rollback evidence;
- role and driver-vehicle ownership;
- concurrent final-seat claims against real PostgreSQL.

## Safe integration-test environment

Copy the template and insert test connection strings:

```bash
cp .env.test.example .env.test
```

`TEST_DATABASE_URL` is mandatory. This explicit opt-in prevents the integration config from silently using a database merely because the normal app's `DATABASE_URL` exists. A dedicated migrated Supabase project/database is preferred. If the normal development database is used deliberately, the suite still touches only isolated `itest-*` identities and cleans them up.

Before the first run, let the explicit test-environment script apply migrations and seed zones:

```bash
npm run db:test:prepare
npm run test:integration
```

Run both layers:

```bash
npm run test:all
```

Never commit `.env.test`.

## Concurrent last-seat proof

The test first allocates two of Bullet Integration's three seats. Rafiq and Shirin then send two acceptance requests concurrently with `Promise.all`. Both initially compete for the same remaining seat.

Expected invariant after both responses:

```text
HTTP outcomes: one success + one 409 POOL_CAPACITY_EXCEEDED
occupiedSeats: 3
active memberships: 2 (the two-seat party + one winner)
contenders: one MATCHED + one REQUESTED
loser membership/poolId: absent
```

The implementation serializes allocation by locking the vehicle row with PostgreSQL `SELECT ... FOR UPDATE`. The second transaction re-reads occupancy only after the first commits, so it cannot rely on a stale available-seat value. Every write is in one transaction; the losing path rolls back without a partial membership.

At a larger scale, allocation could use an optimistic version column, bounded retries for serialization/deadlock errors, partitioning by geography/vehicle, or a dedicated matching/allocation service. The MVP intentionally keeps PostgreSQL as the consistency authority.
