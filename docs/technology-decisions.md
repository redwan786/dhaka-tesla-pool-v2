# Technology Decisions

## Frontend: Next.js App Router

**Picked:** Next.js with the App Router and TypeScript.

**Alternatives:** Plain React with Vite and a router.

**Why this fits:** The challenge recommends Next.js, and App Router gives us a clear route/layout structure for passenger and driver areas. TypeScript makes API response shapes and role-specific UI safer.

**When to switch:** If this becomes a purely client-rendered internal tool and the server-rendering/layout benefits are not useful, plain React/Vite could reduce framework overhead.

### Frontend state and API boundary

**Picked:** A small React Context for the authenticated user/token plus a framework-independent typed `fetch` wrapper.

**Alternatives:** Redux Toolkit, Zustand, TanStack Query, Axios, or server-only cookie sessions.

**Why this fits:** The MVP has one global session and a modest number of request-driven screens. Context avoids introducing a state library before the product needs it, while one API wrapper consistently adds the Bearer token and turns backend errors into typed `ApiError` values.

The MVP stores the short-lived JWT in browser local storage so the session survives refreshes and remains straightforward to demonstrate. The trade-off is exposure if an XSS vulnerability exists. A production version would prefer an `HttpOnly`, `Secure`, `SameSite` cookie with CSRF protection and a refresh-token rotation strategy.

**When to switch:** Add TanStack Query when caching, background refresh, deduplication, and optimistic updates become substantial. Move to secure cookies before handling production identities or payments.

## Backend: Express

**Picked:** Express with TypeScript and REST.

**Alternatives:** NestJS or Fastify.

**Why this fits:** Express is small, widely understood, and makes the API/resource boundaries and middleware order easy to explain in an interview. The MVP does not need NestJS's larger framework conventions or Fastify's performance focus.

**When to switch:** A larger team may choose NestJS for enforced module conventions; a measured throughput bottleneck could justify Fastify.

## Database: Supabase PostgreSQL

**Picked:** Supabase-hosted PostgreSQL for development and deployment, with a Docker PostgreSQL fallback for reproducibility.

**Alternatives:** Neon PostgreSQL, a self-managed PostgreSQL container, MySQL, or SQLite.

**Why this fits:** Pool capacity, membership, status history, and concurrency require a relational database and transactions. Supabase provides a free hosted PostgreSQL database while keeping PostgreSQL semantics visible to the backend.

**When to switch:** A larger deployment may use managed PostgreSQL with read replicas, PostGIS, stronger backup guarantees, or a dedicated private network.

## ORM: Prisma

**Picked:** Prisma.

**Alternatives:** node-postgres with SQL or Drizzle.

**Why this fits:** Prisma gives typed models, explicit migrations, readable relations, and a schema that can be reviewed alongside the ERD. Raw SQL remains available for the vehicle row lock needed by the concurrency path.

**When to switch:** Very complex reporting queries or database-specific features may justify more SQL-first access.

## Authentication: JWT + bcrypt

**Picked:** API-owned JWT authentication with bcrypt password hashing.

**Alternatives:** Supabase Auth, sessions with a server-side session store, or an external identity provider.

**Why this fits:** The challenge explicitly evaluates auth and authorization design. Owning the API auth flow makes role checks and resource ownership visible and testable, while Supabase remains the database provider.

**When to switch:** A production product with social login, MFA, password recovery, and identity federation could use Supabase Auth or another identity provider.

## Validation: Zod

**Picked:** Zod at the API boundary.

**Alternatives:** Joi, Yup, class-validator, or manual validation.

**Why this fits:** Schemas are concise, TypeScript-friendly, and return structured validation errors.

## Testing: Vitest + Supertest

**Picked:** Vitest for pure domain logic and Supertest for HTTP integration tests.

**Alternatives:** Jest, Node's built-in test runner, or Cypress/Playwright for browser tests.

**Why this fits:** The risky parts are fare calculation, state transitions, authorization, capacity, and concurrency. Fast unit tests plus API tests target those risks without chasing a coverage number.

## Styling: Tailwind CSS

**Picked:** Tailwind CSS.

**Alternatives:** CSS Modules, vanilla CSS, or a component library.

**Why this fits:** It enables a simple responsive interface quickly while keeping the UI implementation close to each component. The product is evaluated on flow clarity and engineering quality, not animation complexity.

## Hosting: Free-tier services

**Picked:** Supabase for PostgreSQL, Render for the API if a suitable free tier is available, and Vercel or Render Static Site for the frontend.

**Fallback:** Documented Docker deployment if free backend hosting is unavailable.

**Why this fits:** The challenge forbids paid infrastructure and prefers public deployment. Hosting remains replaceable because the application is container-ready and uses environment variables.
