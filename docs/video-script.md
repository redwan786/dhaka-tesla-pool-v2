# Six-minute walkthrough script

Keep the final recording at or below **6:00**. Speak naturally; do not read the PRD.

## 0:00–1:00 — Problem and core idea

### Show

- README title and live URL
- Home page

### Say

- Nusrat needs Banani → Mohakhali; Rafiq needs Banani → Gulshan 1.
- Jashim drives Bullet, which has three seats.
- The product groups compatible trips, preserves each passenger's own fare/status, and prevents overbooking.
- Real road routing is intentionally replaced with documented Dhaka zones and a simple compatibility rule.

## 1:00–2:00 — Architecture and database

### Show

- README architecture Mermaid diagram
- README ERD

### Say

- Browser → Next.js → Express REST API → Supabase PostgreSQL.
- The API owns auth, validation, lifecycle, fare, and capacity decisions.
- Explain `RideRequest`, `Pool`, `PoolMember`, `StatusHistory`, and `Vehicle`.
- Mention Docker PostgreSQL as the reproducible fallback.

## 2:00–3:00 — Key decision and trade-off

### Show

- Fare section
- Concurrency section/test

### Say

- Same pickup plus destinations within 4 km is the matching rule.
- Money is integer paisa: Nusrat ৳76.50 and Rafiq ৳63.75.
- The final-seat decision locks Bullet's vehicle row inside one PostgreSQL transaction.
- Trade-off: the MVP uses polling and predefined zones instead of WebSockets and real routing.

## 3:00–4:05 — Passenger flow

### Show

- Sign in as Nusrat
- Select Banani → Mohakhali
- Show fare breakdown
- Request ride
- Show `REQUESTED`, personal fare, and timeline

### Mention

- Loading/error/empty states
- Passenger sees only her own resources
- Cancellation is available only while valid

## 4:05–5:10 — Driver and pooling flow

### Show

- Sign in as Jashim
- Bullet capacity and online state
- Accept Nusrat
- Add Rafiq's compatible request
- Show memberships, individual fares, occupied seats
- Arrive → start → complete

### Mention

- No arbitrary status selector
- Backend rejects invalid transitions
- Pool and passenger states update atomically

## 5:10–5:45 — Interesting edge case

### Show

- Test output or concurrency test source

### Say

- With one seat remaining, Rafiq and Shirin submit concurrently.
- One succeeds; one gets `409 POOL_CAPACITY_EXCEEDED`.
- Occupancy stays at three and the loser gets no partial membership.

## 5:45–6:00 — Delivery

### Show

- Live deployment
- README Docker/test commands

### Say

- The repository contains migrations, seed data, 44 unit tests, six database integration scenarios, Docker Compose, and documented trade-offs.
- Close with the public repository and release version.

## Recording checklist

- Use the deployed `release/v1.0.0` version.
- Hide browser bookmarks, email, tokens, `.env`, and database credentials.
- Reset or reseed demo data immediately before recording.
- Keep terminal font and browser zoom readable.
- Do one timed rehearsal.
- Add the final video URL to the README before release.