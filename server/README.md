# PoultryFarm Pro — Backend Setup & API Integration Guide

## Architecture overview

```
Angular 20 (port 4200)
   │   HTTP + JWT Bearer
   ▼
Express Mock API  ──(dev)──►  localhost:8000
       OR
Laravel 12 API    ──(prod)──► localhost:8000
   │
   ▼
PostgreSQL (port 5432)
```

---

## Option A: Express mock API (start in 60 seconds)

The mock API mirrors the full Laravel contract with JWT auth, in-memory data, and simulated report job progress. No database needed.

```bash
cd poultry-mock-api
npm install
npm start
# → http://localhost:8000
```

**Demo credentials (same as the login screen):**

| Email | Password | Role |
|---|---|---|
| admin1@admin.com | admin1 | Administrator |
| manager1@manager.com | manager1 | Farm Manager |
| supervisor1@supervisor.com | supervisor1 | Supervisor |
| worker1@worker.com | worker1 | Farm Worker |

---

## Option B: Laravel 12 API (production backend)

### Prerequisites

- PHP 8.3+
- Composer
- PostgreSQL 15+

### Setup

```bash
cd poultry-backend

# 1. Install dependencies
composer install

# 2. Configure environment
cp .env.example .env
php artisan key:generate
php artisan jwt:secret        # generates JWT_SECRET

# 3. Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE poultry_farm_pro;"

# 4. Run migrations & seed demo data
php artisan migrate --seed

# 5. Start the API
php artisan serve --port=8000
```

The seeder creates all demo accounts and sample farm data automatically.

### Queue worker (for async reports)

```bash
php artisan queue:work --tries=3
```

---

## Angular configuration

The Angular app is pre-configured to call `http://localhost:8000/api`.

**`src/environments/environment.ts`** (development):
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
};
```

**`src/environments/environment.prod.ts`** (production):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.yourfarm.com/api',
};
```

### Start Angular dev server

```bash
cd poultry-erp
npm install
npm start
# → http://localhost:4200
```

---

## API contract reference

All endpoints require `Authorization: Bearer <token>` except `/api/auth/login`.

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Returns JWT token + user object |
| GET | `/api/auth/me` | Current user with role |
| POST | `/api/auth/logout` | Invalidate token |
| POST | `/api/auth/refresh` | Refresh expired token |

### Login response shape

```json
{
  "token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 28800,
  "user": {
    "id": 1,
    "name": "Ana Reyes",
    "email": "admin1@admin.com",
    "role": "admin",
    "building": null,
    "phone": "+63 912 345 6789"
  }
}
```

### Key endpoints

```
GET  /api/dashboard/kpis            Dashboard KPIs
GET  /api/dashboard/activity        Activity feed
GET  /api/flock-batches             All batches (paginated)
GET  /api/flock-batches/:id/performance  Growth + egg trend
POST /api/egg-collections           Record daily collection
GET  /api/egg-collections/summary   Aggregated totals
GET  /api/egg-inventory             Current stock by size
POST /api/feed-issuance             Log feed consumption
GET  /api/feed/fcr                  FCR by batch
POST /api/mortality-logs            Record mortality
GET  /api/vaccinations              Vaccination schedule
GET  /api/inventory                 All inventory items
GET  /api/inventory/alerts          Low/critical items
GET  /api/analytics/production      Production trend
GET  /api/analytics/profitability   P&L breakdown
POST /api/reports                   Queue report job
GET  /api/reports/:jobId            Poll job status
GET  /api/users                     User list (admin only)
POST /api/users                     Create user (admin only)
GET  /api/system-settings           System config (admin only)
GET  /api/master-data/breeds        Breed master list
GET  /api/master-data/suppliers     Supplier list
```

---

## Angular services (already wired)

All HTTP logic lives in `src/app/core/services/`:

| Service | File | Used by |
|---|---|---|
| `DashboardService` | `dashboard.service.ts` | Dashboard component |
| `FlockBatchService` | `flock-batch.service.ts` | Flock management |
| `EggCollectionService` | `egg-collection.service.ts` | Worker egg collection |
| `FeedService` | `index.ts` | Worker feed log |
| `MortalityService` | `index.ts` | Worker mortality log |
| `HealthService` | `index.ts` | Supervisor health records |
| `InventoryService` | `index.ts` | Supervisor inventory |
| `AnalyticsService` | `index.ts` | Manager analytics |
| `ReportService` | `index.ts` | Manager reports |
| `UserService` | `index.ts` | Admin user management |
| `SystemSettingsService` | `index.ts` | Admin settings |
| `MasterDataService` | `index.ts` | Admin master data |

### Connecting remaining components

The worker, supervisor, and admin components currently use mock data. To connect them to the API, inject the relevant service in the component:

```typescript
// Example: egg-collection.component.ts
private eggSvc = inject(EggCollectionService);

submitEggEntry(): void {
  this.eggSvc.record({
    flock_batch_id:  1,
    building_id:     1,
    collector_id:    4,
    collection_date: today,
    collection_time: this.eggForm.time,
    sizes:           this.eggForm.sizes,
    cracked:         this.eggForm.cracked ?? 0,
    dirty:           0,
    spoiled:         this.eggForm.spoiled ?? 0,
    rejected:        0,
  }).subscribe({
    next:  () => this.eggSaved.set(true),
    error: (e) => console.error(e),
  });
}
```

---

## Docker Compose (optional, for local full-stack)

```yaml
# docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: poultry_farm_pro
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret
    ports: ['5432:5432']
    volumes: ['pgdata:/var/lib/postgresql/data']

  api:
    build: ./poultry-backend
    ports: ['8000:8000']
    environment:
      DB_HOST: db
      DB_DATABASE: poultry_farm_pro
      DB_USERNAME: postgres
      DB_PASSWORD: secret
    depends_on: [db]
    command: php artisan serve --host=0.0.0.0 --port=8000

  frontend:
    build: ./poultry-erp
    ports: ['4200:80']
    depends_on: [api]

volumes:
  pgdata:
```

---

## CORS configuration (Laravel)

`config/cors.php`:
```php
'allowed_origins' => [env('ALLOWED_ORIGINS', 'http://localhost:4200')],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age'         => 0,
'supports_credentials' => false,
```
