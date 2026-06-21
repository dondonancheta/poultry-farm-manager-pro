# PoultryFarm Pro — Angular 20 ERP

## 🚀 Deploy to Vercel (Frontend)

### Option A — Vercel Dashboard (easiest)
1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo (or drag-drop the `poultry-erp` folder)
3. Vercel auto-detects the `vercel.json` settings
4. Set environment variables in **Settings → Environment Variables**:
   ```
   NG_APP_API_URL = https://your-laravel-api.com/api
   ```
5. Click **Deploy** — done ✓

### Option B — Vercel CLI
```bash
cd poultry-erp
npm install -g vercel
vercel login
vercel --prod
```

---

## 🖥️ Local Development

### Prerequisites
- Node.js **22+** (`nvm install 22 && nvm use 22`)
  - Node 20 works with the `crypto-polyfill.cjs` included
- npm 9+

### Start everything (one command)
```bash
npm install
npm run dev       # Angular on :4200 + Mock API on :8000
```

### Individual commands
```bash
npm start         # Angular only → http://localhost:4200
npm run api       # Mock API only → http://localhost:8000
npm run build     # Production build (output: dist/poultry-farm-pro/browser)
```

---

## 🌍 Environment Variables

| Variable | Development | Production |
|---|---|---|
| `NG_APP_API_URL` | `http://localhost:8000/api` | Your Laravel API URL |
| `NG_APP_ENV` | `development` | `production` |

**For Vercel:** Add `NG_APP_API_URL` in Vercel Dashboard → Project Settings → Environment Variables

---

## 🔐 Demo Credentials

| Email | Password | Role |
|---|---|---|
| admin1@admin.com | admin1 | Admin |
| manager1@manager.com | manager1 | Manager |
| supervisor1@supervisor.com | supervisor1 | Supervisor |
| worker1@worker.com | worker1 | Worker |

---

## 📁 Project Structure

```
client/
├── mock-api/
│   └── server.js          ← Express mock API (82 endpoints)
├── src/
│   ├── app/
│   │   ├── core/          ← Services, auth, interceptors, models
│   │   ├── features/      ← All pages (worker, supervisor, manager, admin)
│   │   └── shared/        ← Topbar, sidebar, layout shell
│   ├── environments/
│   │   ├── environment.ts          ← Development (localhost:8000)
│   │   └── environment.prod.ts     ← Production (your API URL)
│   └── styles.css
├── vercel.json            ← Vercel config (SPA routing, cache headers)
├── crypto-polyfill.cjs   ← Node 20 compatibility shim
├── .env.development       ← Local dev env vars
├── .env.production        ← Production env template
├── .env.example           ← Copy this for your setup
└── package.json
```

---

## 🏗️ Backend (Laravel 12)

The `server/` folder contains the Laravel API.

**For production**, deploy it separately to:
- [Railway](https://railway.app) — easiest, free tier available
- [Fly.io](https://fly.io) — good free tier
- [DigitalOcean App Platform](https://digitalocean.com)
- Any VPS with PHP 8.2+ and PostgreSQL 16

Then point `NG_APP_API_URL` to your deployed API URL.

**For development**, the `mock-api/` (Express) handles all API calls — no Laravel needed.
