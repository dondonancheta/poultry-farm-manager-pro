import { Component } from '@angular/core';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [],
  template: `
    <div class="p-lg flex flex-col items-center justify-center min-h-64 text-center gap-md">
      <span class="material-symbols-outlined text-5xl text-primary opacity-30">analytics</span>
      <h2 class="text-headline-lg font-bold text-primary" style="font-size:24px;line-height:32px">Analytics Dashboard</h2>
      <p class="text-on-surface-variant text-body-md">Production trends, FCR analytics, and financial insights — Phase 3.</p>
    </div>
  `,
})
export class AnalyticsComponent {}
