// ── Production ────────────────────────────────────────────────────────────────
// Set NG_APP_API_URL in Vercel environment variables when you deploy Laravel
// Until then, the app runs in demo mode with hardcoded data
export const environment = {
  production: true,
  // Replace with your Laravel API URL once deployed:
  // e.g. https://api.greenvalley.farm/api
  apiUrl: (window as any).__env?.API_URL ?? '',
  useMockFallback: true,
};
