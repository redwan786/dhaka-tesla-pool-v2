# Dhaka Tesla Pool

> Share a seat. Split the fare. Survive Dhaka traffic.

This repository is being built incrementally for the Software Engineer Internship challenge. It will model three actors: passengers (Nusrat, Rafiq, Shirin), driver/Tesla (Jashim/Bullet), and ride/pool.

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

Auth, ride flows, testing, Docker, deployment, screenshots, and the final video will be added in later feature branches.
