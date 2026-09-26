# Submission checklist

## Product and repository

- [x] GitHub repository is public/evaluator-accessible
- [x] Working frontend, backend, and PostgreSQL implementation
- [x] Story cast consistently uses Jashim, Bullet, Nusrat, Rafiq, and Shirin
- [x] No real secret committed
- [x] `.env.example`, `.env.test.example`, and `.env.docker.example` included

## Database and integrity

- [x] Prisma schema with relationships, enums, constraints, and indexes
- [x] Versioned PostgreSQL migrations
- [x] Idempotent seed/demo data
- [x] Individual integer-paisa fare snapshots
- [x] Transactional three-seat enforcement
- [x] Concurrent last-seat proof

## Documentation

- [x] Final-style README
- [x] Architecture diagram
- [x] ERD
- [x] API overview
- [x] Matching, fare, lifecycle, and cancellation rules
- [x] Technology alternatives and switch conditions
- [x] AI usage disclosure with accepted and rejected/changed suggestions
- [x] Known limitations and next improvements
- [x] Viral-scale reasoning
- [x] Six-minute video outline
- [x] Home, login, passenger, and driver screenshots

## Testing

- [x] 44 unit/domain tests
- [x] Six real API/PostgreSQL integration scenarios
- [x] Capacity cannot be exceeded
- [x] Invalid transitions are rejected
- [x] Nusrat/Rafiq fares are exact
- [x] Cross-user modification is rejected
- [x] Cancellation rules hold
- [x] Concurrent final-seat allocation stays consistent

## Docker and deployment

- [x] API and frontend Dockerfiles
- [x] PostgreSQL Compose service
- [x] Automatic migrations and idempotent seed
- [x] Database, API, and web health checks
- [x] Deployment configuration and instructions
- [ ] Verify `docker compose up --build` on a Docker-enabled second environment
- [x] Deploy API on a free/free-tier host
- [x] Deploy frontend on a free/free-tier host
- [x] Run hosted passenger/driver smoke test
- [x] Add frontend and API URLs to README

## Git and release

- [x] Feature branches with incremental logical commits
- [x] Feature branches merged to `master` with merge commits
- [x] Push public `master`
- [ ] Cut `pre-release` from `master`
- [ ] Perform integration/docs/deployment fixes on `pre-release`
- [ ] Cut `release/v1.0.0` from `pre-release`
- [ ] Push all three long-lived branches

## Final media

- [ ] Record a maximum six-minute walkthrough
- [ ] Add video link prominently to README
- [ ] Confirm video uses the deployed `release/v1.0.0` build
- [ ] Perform final secret scan
- [ ] Perform final clean-clone setup test