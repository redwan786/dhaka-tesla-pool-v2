# Free-tier deployment

## Target

```text
Browser → Vercel Next.js → Render Express API → Supabase PostgreSQL
```

The hosted path and Docker path use the same source, migrations, seed, and API contract. Hosting availability and free-tier terms can change; do not pay for this challenge. If a free backend is unavailable, use the documented Docker deployment and state that limitation in the README.

## Before deployment

1. Confirm the repository is public and contains no `.env` files or secrets.
2. Confirm Supabase has both pooled and direct PostgreSQL URLs.
3. Apply migrations, seed, and local verification:

```powershell
npm install
npm run db:generate
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma
npm run db:seed
npm run test:typecheck
npm run test:unit
npm run build
```

4. Push the current feature branch, merge it to `master`, and push `master`.

## Deploy the API to Render

The root `render.yaml` defines a free web service.

1. In Render, create a **Blueprint** from the public GitHub repository.
2. Select `render.yaml`.
3. Configure these secret environment variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase pooled runtime URL with `sslmode=require` |
| `DIRECT_URL` | Supabase direct database URL with `sslmode=require` |
| `WEB_ORIGIN` | Temporary frontend origin; replace with the Vercel production URL |
| `JWT_SECRET` | Blueprint-generated secret, or a unique random value of 24+ characters |

`NODE_ENV=production` and `LOG_LEVEL=info` are already declared.

The service executes:

```text
Build: npm ci --include=dev → Prisma generate → API TypeScript build
Start: migrate deploy → idempotent seed → production API
Health: GET /health
```

After deployment, record:

```text
API base:   https://YOUR-RENDER-SERVICE.onrender.com/api
API health: https://YOUR-RENDER-SERVICE.onrender.com/health
```

Open `/health` and confirm a `200` response before deploying the frontend.

## Deploy the frontend to Vercel

1. Import the same GitHub repository into Vercel.
2. Set **Root Directory** to `apps/web`.
3. Keep the detected framework as **Next.js**.
4. Add the build-time environment variable:

```text
NEXT_PUBLIC_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api
```

5. Deploy and record the stable production URL:

```text
https://YOUR-PROJECT.vercel.app
```

`NEXT_PUBLIC_API_URL` is embedded in the browser bundle. Redeploy the frontend whenever it changes.

## Finish API CORS

Return to Render and set:

```text
WEB_ORIGIN=https://YOUR-PROJECT.vercel.app
```

Multiple exact origins can be comma-separated. Avoid `*` for the authenticated API. Render restarts the API after the environment change.

Vercel preview deployments use changing hostnames. Use the stable production URL for final evaluation, or explicitly add a known preview origin while testing.

## Hosted smoke test

Run in this order:

1. `GET <API>/health` returns `200`.
2. Open the Vercel URL with a clean/private browser session.
3. Sign in as Nusrat.
4. Confirm zones load.
5. Estimate and request Banani → Mohakhali.
6. Sign out and sign in as Jashim.
7. Confirm Bullet and driver availability load.
8. Accept Nusrat, mark arrived, start, and complete.
9. Sign back in as Nusrat and confirm fare, final status, and history.
10. Repeat with Nusrat and Rafiq to demonstrate pooling.
11. Confirm no CORS errors or secrets appear in browser logs.

## Update the repository

Replace the pending values in:

- `README.md` live-demo table
- `docs/submission-checklist.md`

Then commit:

```text
docs(deploy): add verified production URLs
```

## Rollback and failure notes

- A failed API deploy should leave the previous Render deployment available; use Render's rollback/redeploy controls.
- Prisma migrations are forward-only in the automated start path. Test destructive schema changes separately and prepare an explicit corrective migration rather than editing an applied migration.
- The seed uses upserts, so repeated deploys do not create duplicate story users, zones, or Bullet.
- Render free services may sleep and cold-start. Wait for `/health` before judging the first UI request.
- Supabase free projects may pause after inactivity. Resume the project rather than changing application code.

## Docker fallback

If free hosted backend capacity is unavailable:

```powershell
docker compose up --build
docker compose ps
```

Document the hosting constraint and provide [the reproducible Docker path](docker.md). This fallback includes PostgreSQL, migrations, seed data, health checks, API, and frontend.