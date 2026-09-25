# Dhaka Tesla Pool — ERD

The database is designed as a relational model because rides, pools, passengers, vehicles, and status history have strong relationships and consistency rules.

```mermaid
erDiagram
    USER ||--o| VEHICLE : owns
    USER ||--o{ RIDE_REQUEST : creates
    USER ||--o{ POOL_MEMBER : joins
    USER ||--o{ STATUS_HISTORY : changes
    USER ||--o{ AUDIT_LOG : performs
    VEHICLE ||--o{ POOL : operates
    ZONE ||--o{ RIDE_REQUEST : pickup
    ZONE ||--o{ RIDE_REQUEST : destination
    POOL ||--o{ RIDE_REQUEST : contains
    POOL ||--o{ POOL_MEMBER : has
    RIDE_REQUEST ||--o| POOL_MEMBER : becomes
    RIDE_REQUEST ||--o{ STATUS_HISTORY : records
    RIDE_REQUEST ||--o| PAYMENT : settles

    USER {
        uuid id PK
        string name
        string email UK
        string password_hash
        enum role
        boolean is_online
        timestamp created_at
    }
    VEHICLE {
        uuid id PK
        uuid driver_id FK,UK
        string name
        int capacity
        boolean is_active
    }
    ZONE {
        uuid id PK
        string name UK
        decimal latitude
        decimal longitude
    }
    RIDE_REQUEST {
        uuid id PK
        uuid passenger_id FK
        uuid pickup_zone_id FK
        uuid destination_zone_id FK
        uuid pool_id FK
        int requested_seats
        int estimated_fare_paisa
        enum status
        timestamp created_at
    }
    POOL {
        uuid id PK
        uuid vehicle_id FK
        enum status
        int occupied_seats
        timestamp created_at
    }
    POOL_MEMBER {
        uuid id PK
        uuid pool_id FK
        uuid ride_request_id FK,UK
        uuid passenger_id FK
        int seats
        int fare_paisa
        enum status
        timestamp joined_at
    }
    STATUS_HISTORY {
        uuid id PK
        uuid ride_request_id FK
        uuid changed_by_id FK
        enum from_status
        enum to_status
        string reason
        timestamp created_at
    }
    PAYMENT {
        uuid id PK
        uuid ride_request_id FK,UK
        int amount_paisa
        enum method
        enum status
        timestamp paid_at
    }
    AUDIT_LOG {
        uuid id PK
        uuid actor_id FK
        string action
        string entity_type
        uuid entity_id
        json metadata
        timestamp created_at
    }
```

## Relationship explanations

- One driver owns one active vehicle in the MVP; the schema can later support multiple vehicles.
- One passenger can create many ride requests.
- One vehicle operates many pools over time.
- One pool contains many ride requests and pool memberships.
- One ride request has at most one active pool membership.
- One ride request has many status history records.
- One completed ride may have one simulated payment record.
- Audit logs are append-only operational history and are not used as the current state.

## Integrity rules planned for Step 3

- `users.email` is unique.
- `vehicles.driver_id` is unique for the MVP.
- `zones.name` is unique.
- `pool_members.ride_request_id` is unique.
- `payments.ride_request_id` is unique.
- Foreign keys use restrictive or cascading behavior intentionally per relationship.
- Indexes cover passenger/status, pool/status, vehicle/status, and history timestamps.
