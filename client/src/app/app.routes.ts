import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/auth/guards';

export const routes: Routes = [
  // ── Public ──────────────────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./features/landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: '403',
    loadComponent: () =>
      import('./features/errors/forbidden.component').then(m => m.ForbiddenComponent),
  },

  // ── Authenticated shell ──────────────────────────────────────────────────
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      // ── Manager routes ──────────────────────────────────────────────────
      {
        path: 'manager',
        canActivate: [roleGuard('manager', 'admin')],
        loadChildren: () =>
          import('./features/manager/manager.routes').then(m => m.MANAGER_ROUTES),
      },
      // Legacy /dashboard redirect → manager dashboard
      {
        path: 'dashboard',
        canActivate: [roleGuard('manager', 'admin')],
        loadComponent: () =>
          import('./features/manager/manager-dashboard.component').then(m => m.ManagerDashboardComponent),
      },

      // ── Worker home ─────────────────────────────────────────────────────
      {
        path: 'worker-home',
        canActivate: [roleGuard('worker', 'admin')],
        loadComponent: () =>
          import('./features/worker/worker-home.component').then(m => m.WorkerHomeComponent),
      },

      // ── Supervisor routes ────────────────────────────────────────────────
      {
        path: 'supervisor-home',
        canActivate: [roleGuard('supervisor', 'admin')],
        loadChildren: () =>
          import('./features/supervisor/supervisor.routes').then(m => m.SUPERVISOR_ROUTES),
      },

      // ── Admin home ───────────────────────────────────────────────────────
      {
        path: 'admin-home',
        canActivate: [roleGuard('admin')],
        loadComponent: () =>
          import('./features/admin/admin-home.component').then(m => m.AdminHomeComponent),
      },


      // ── Flocks ──────────────────────────────────────────────────────────
      {
        path: 'flocks',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/flock-management/flock-management.component')
                .then(m => m.FlockManagementComponent),
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./features/flock-management/flock-form.component')
                .then(m => m.FlockFormComponent),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/flock-management/flock-detail.component')
                .then(m => m.FlockDetailComponent),
          },
        ],
      },

      // ── Sub-feature stubs ────────────────────────────────────────────────
      { path: 'feed',    loadChildren: () => import('./features/feed-management/feed.routes').then(m => m.FEED_ROUTES) },
      { path: 'eggs',    loadChildren: () => import('./features/egg-production/egg.routes').then(m => m.EGG_ROUTES) },
      {
        path: 'mortality',
        children: [
          { path: 'log', loadComponent: () => import('./features/worker/mortality-log.component').then(m => m.MortalityLogComponent) },
          { path: '', redirectTo: 'log', pathMatch: 'full' },
        ],
      },
      { path: 'health',  loadChildren: () => import('./features/health-medicine/health.routes').then(m => m.HEALTH_ROUTES) },
      { path: 'sales',   loadChildren: () => import('./features/sales/sales.routes').then(m => m.SALES_ROUTES) },
      { path: 'reports', loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent) },

      // ── Farm, Houses, Notifications ─────────────────────────────────────
      { path: 'farm',          loadComponent: () => import('./features/farm/farm-management.component').then(m => m.FarmManagementComponent) },
      { path: 'houses',        loadComponent: () => import('./features/farm/farm-management.component').then(m => m.FarmManagementComponent) },
      { path: 'notifications', loadComponent: () => import('./features/farm/notifications.component').then(m => m.NotificationsComponent) },
      { path: 'inventory',     loadComponent: () => import('./features/egg-production/egg-inventory.component').then(m => m.EggInventoryComponent) },
      { path: 'financials',    loadComponent: () => import('./features/manager/profitability.component').then(m => m.ProfitabilityComponent) },

      // ── Admin module ─────────────────────────────────────────────────────
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
        canActivate: [roleGuard('admin')],
      },
    ],
  },

  // ── Fallback ─────────────────────────────────────────────────────────────
  { path: '**', redirectTo: '' },
];
