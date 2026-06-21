// ── Development ───────────────────────────────────────────────────────────────
// Change apiUrl to point to your Laravel server when ready
// Default: Express mock API (npm run dev starts this automatically)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api',
  useMockFallback: true,   // fall back to demo users if API is unreachable
};
