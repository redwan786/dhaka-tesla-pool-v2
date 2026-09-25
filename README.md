# Dhaka Tesla Pool

> Share a seat. Split the fare. Survive Dhaka traffic.

This repository is being built incrementally for the Software Engineer Internship challenge. It will model three actors: passengers (Nusrat, Rafiq, Shirin), driver/Tesla (Jashim/Bullet), and ride/pool.

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

Database schema, auth, ride flows, testing, Docker, deployment, screenshots, and the final video will be added in later feature branches.
