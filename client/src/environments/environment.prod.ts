// ── Production ────────────────────────────────────────────────────────────────
// Set NG_APP_API_URL in Vercel environment variables
// e.g. https://api.greenvalley.farm/api
export const environment = {
  production: true,
  apiUrl: (window as any).__env?.API_URL ?? 'https://api.greenvalley.farm/api',
  useMockFallback: false,  // no demo fallback in production
};
