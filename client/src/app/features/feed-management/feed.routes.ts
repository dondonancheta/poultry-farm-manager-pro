import { Routes } from '@angular/router';
export const FEED_ROUTES: Routes = [
  { path: '',    loadComponent: () => import('./feed-management.component').then(m => m.FeedManagementComponent) },
  { path: 'log', loadComponent: () => import('../worker/feed-log.component').then(m => m.FeedLogComponent) },
];
