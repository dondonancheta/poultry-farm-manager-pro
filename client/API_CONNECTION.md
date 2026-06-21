# API Connection Guide

## Current Setup (Development)

Angular → `http://localhost:8000/api` → Express Mock API

Both start with one command:
```bash
npm run dev
```

---

## Switch to Laravel Backend

### Option A — Change environment file
Edit `src/environments/environment.ts`:
```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',  // ← your Laravel port
  useMockFallback: false,
};
```

Then restart Angular:
```bash
npm start   # just Angular, no mock API
```

### Option B — Use proxy (no environment file change)
Create `proxy.conf.json`:
```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

Update `package.json` start script:
```
"start": "node --require ./crypto-polyfill.cjs node_modules/.bin/ng serve --proxy-config proxy.conf.json"
```

---

## Production (Vercel)

Set environment variable in Vercel dashboard:
```
NG_APP_API_URL = https://your-laravel-api.com/api
```

The `environment.prod.ts` reads this automatically.

---

## Auth Behavior

| API Status | What happens |
|---|---|
| Mock API running (`localhost:8000`) | Logs in via mock → returns JWT-like demo token |
| Laravel API running | Logs in via real JWT → full auth flow |
| Both offline | Falls back to hardcoded demo credentials |

---

## Demo Credentials (work with mock AND Laravel after seeding)

| Email | Password | Role |
|---|---|---|
| admin1@admin.com | admin1 | Admin |
| manager1@manager.com | manager1 | Manager |
| supervisor1@supervisor.com | supervisor1 | Supervisor |
| worker1@worker.com | worker1 | Worker |
