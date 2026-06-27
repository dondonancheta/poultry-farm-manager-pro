# PoultryFarm Pro — Deployment Guide

## Project Structure

```
full-poultry-project/
├── client/                     ← Angular 20 frontend
├── server/                     ← Laravel 12 API
├── infrastructure/             ← All deployment & Docker configs
│   ├── render.yaml             ← Render.com blueprint
│   ├── docker-compose.yml      ← Local dev (all 3 services)
│   ├── DEPLOY.md               ← This file
│   ├── client/
│   │   ├── Dockerfile          ← Angular Docker image
│   │   └── nginx.conf          ← Angular nginx config
│   ├── server/
│   │   ├── Dockerfile          ← Laravel Docker image
│   │   ├── nginx.conf          ← PHP-FPM + nginx
│   │   ├── supervisord.conf    ← Process manager
│   │   └── start.sh            ← Boot: migrate → seed → serve
│   └── database/
│       ├── init.sql            ← PostgreSQL init
│       └── .env.docker         ← Local .env template
└── render.yaml                 ← Copy of infrastructure/render.yaml (required at root)
```

---

## Option A — Render.com (Recommended, Free)

### 1. Push render.yaml to repo root
```bash
cp infrastructure/render.yaml ./render.yaml
git add render.yaml infrastructure/
git commit -m "feat: add deployment config"
git push
```

### 2. Deploy
1. Go to [render.com](https://render.com) → sign up with GitHub
2. **New** → **Blueprint** → connect your repo
3. Render reads `render.yaml` → previews 3 services
4. Click **Apply** → deployment starts

### 3. Set API URL on client (after API deploys)
1. Dashboard → **poultry-client** → **Environment**
2. Add: `NG_APP_API_URL` = `https://poultry-api-fww1.onrender.com/api`
3. Save → auto-redeploys

### Test
```bash
curl https://poultry-api-fww1.onrender.com/api/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin1@admin.com","password":"admin1"}'
```

---

## Option B — Docker Compose (Local Dev)

```bash
# Start all services
cd infrastructure
docker compose up

# First run — generate keys
docker compose exec api php artisan key:generate
docker compose exec api php artisan jwt:secret
docker compose exec api php artisan migrate:fresh --seed
```

| Service | URL |
|---------|-----|
| Angular | http://localhost:4200 |
| Laravel API | http://localhost:8080/api |
| PostgreSQL | localhost:5432 |

---

## Option C — Vercel (client) + Render (API)

**Client → Vercel:**
- Root: `client`
- Build: `npm run build`
- Output: `dist/poultry-farm-pro/browser`
- Env: `NG_APP_API_URL` = your Render API URL

**API → Render:** follow Option A (API service only)

---

## Environment Variables

### Laravel API
| Key | Value |
|-----|-------|
| `APP_KEY` | `php artisan key:generate --show` |
| `APP_URL` | Your Render API URL |
| `DB_*` | Auto-filled by Render Blueprint |
| `JWT_SECRET` | `php artisan jwt:secret --show` |
| `FRONTEND_URL` | Your client URL (for CORS) |

### Angular Client
| Key | Value |
|-----|-------|
| `NG_APP_API_URL` | `https://poultry-api-fww1.onrender.com/api` |
| `NODE_OPTIONS` | `--max-old-space-size=4096` |

---

## Keep Free Tier Awake

Render free tier sleeps after 15min. Use [UptimeRobot](https://uptimerobot.com) (free):
- Monitor URL: `https://poultry-api-fww1.onrender.com/api/health`
- Interval: every 5 minutes

Add health route to `server/routes/api.php`:
```php
Route::get('health', fn() => response()->json(['status' => 'ok']));
```
