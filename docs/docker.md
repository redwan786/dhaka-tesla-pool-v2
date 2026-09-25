# Reproducible Docker Setup

The Docker path is a self-contained evaluation environment. It does not require Supabase and does not replace the normal Supabase development/deployment path.

```text
Browser :3000
    ↓
Next.js web container
    ↓ http://localhost:4000/api
Express API container :4000
    ↓ private Compose network
PostgreSQL 16 container :5432
```

## Prerequisites

- Docker Desktop, Docker Engine with Compose v2, or a compatible environment
- Ports 3000, 4000, and 5432 available (all can be overridden)

## One-command start

From the repository root:

```bash
docker compose up --build
```

Compose waits for PostgreSQL to become healthy. The API container then:

1. runs `prisma migrate deploy`;
2. idempotently upserts the Dhaka zones and story cast;
3. starts the production Express build;
4. becomes healthy before the web container is considered ready.

Open:

- Web: http://localhost:3000
- API health: http://localhost:4000/health
- Canonical API health: http://localhost:4000/api/health

Demo password for all seeded identities: `Pass123!`

- `nusrat@teslapool.local`
- `rafiq@teslapool.local`
- `shirin@teslapool.local`
- `jashim@teslapool.local`

## Service health

```bash
docker compose ps
docker compose logs -f api
docker compose logs -f web
docker compose logs -f db
```

The three health checks verify:

- PostgreSQL accepts connections through `pg_isready`;
- Express returns HTTP 200 from `/health`;
- Next.js returns HTTP 200 from `/`.

## Stop and preserve data

```bash
docker compose down
```

The named `postgres_data` volume preserves rides and history between starts. Migration and seed operations are safe to repeat.

## Full local reset

This permanently removes the Docker PostgreSQL volume:

```bash
docker compose down -v --remove-orphans
docker compose up --build
```

## Optional overrides

Defaults work without another environment file. To change them:

```bash
cp .env.docker.example .env.docker
```

Docker Compose automatically reads `.env`, not `.env.docker`. Either rename the file to `.env` in a clean evaluator checkout or pass it explicitly:

```bash
docker compose --env-file .env.docker up --build
```

Available overrides:

| Variable | Default | Purpose |
|---|---|---|
| `DOCKER_POSTGRES_DB` | `dhaka_tesla_pool` | Local database name |
| `DOCKER_POSTGRES_USER` | `postgres` | Local database user |
| `DOCKER_POSTGRES_PASSWORD` | local development value | Local database password |
| `DOCKER_POSTGRES_PORT` | `5432` | Host PostgreSQL port |
| `DOCKER_API_PORT` | `4000` | Host API port and browser API URL |
| `DOCKER_WEB_PORT` | `3000` | Host frontend port and API CORS origin |
| `DOCKER_JWT_SECRET` | local development value | JWT signing secret |

If ports are changed, use the same command with `--env-file`; the web build receives the selected API port and the API receives the selected web origin.

## Image design

### API image

- Node.js 22 Debian slim, avoiding Alpine/OpenSSL surprises with Prisma
- deterministic `npm ci`
- generated Prisma Client and compiled TypeScript
- non-root `node` runtime user
- migration and idempotent seed entrypoint
- HTTP health check

The image intentionally keeps Prisma CLI and `tsx` available so it can perform required startup migration/seed operations. A later production optimization could split migration into a release job and remove development tooling from the runtime image.

### Web image

- multi-stage Next.js build
- `output: standalone`
- only standalone server, static chunks, and public assets in runtime
- non-root `node` user
- browser-facing API URL baked through `NEXT_PUBLIC_API_URL`
- HTTP health check

## Supabase versus Docker PostgreSQL

| Path | Database | Use |
|---|---|---|
| Normal development/deployment | Supabase PostgreSQL | Hosted free-tier workflow |
| Docker Compose | Local PostgreSQL 16 | Reproducible evaluator/offline workflow |

Both paths use the same Prisma migrations, seed script, PostgreSQL constraints, transactions, and row locks. This prevents a “Docker demo” from diverging from the submitted application.

## Troubleshooting

### Port already allocated

Override the conflicting host port in `.env.docker`, then run with `--env-file`.

### API remains unhealthy

```bash
docker compose logs api
docker compose logs db
```

Confirm migrations completed and PostgreSQL is healthy.

### Rebuild after frontend API URL changes

`NEXT_PUBLIC_API_URL` is a browser build-time value, so rebuild the web image:

```bash
docker compose --env-file .env.docker build --no-cache web
docker compose --env-file .env.docker up
```
