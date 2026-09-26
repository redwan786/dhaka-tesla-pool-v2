# Changelog

All notable changes for the internship challenge are recorded here.

## 1.0.0

### Product

- Passenger registration, login, fare estimate, ride request, status, cancellation, and history
- Jashim driver login, Bullet availability, relevant requests, passenger assignment, and pool history
- Explicit `REQUESTED → MATCHED → DRIVER_ARRIVED → STARTED → COMPLETED` lifecycle
- Same-pickup and four-kilometre destination-compatibility rule
- Individual integer-paisa fares for Nusrat and Rafiq

### Integrity and security

- API-owned JWT authentication, role authorization, and resource ownership
- Zod request validation and normalized API errors
- Transactional seat allocation with PostgreSQL row locking
- Three-seat database integrity constraints
- Status history and audit logging

### Delivery

- Responsive Next.js frontend and Express REST API
- Supabase PostgreSQL deployment
- Vercel frontend and Render API
- Docker Compose environment with migrations, seed, and health checks
- 44 unit/domain tests and six real API/PostgreSQL integration scenarios
- Concurrent final-seat integration proof
- Architecture, ERD, deployment, scaling, AI-usage, video, and operational documentation