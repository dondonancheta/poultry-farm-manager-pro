import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-surface flex items-center justify-center text-center p-lg">
      <div>
        <span class="material-symbols-outlined text-6xl text-error opacity-50 block mb-md">lock</span>
        <h1 class="text-headline-lg font-bold text-primary mb-sm" style="font-size:32px;line-height:40px">403 — Access Denied</h1>
        <p class="text-on-surface-variant text-body-md mb-xl">You don't have permission to view this page.</p>
        <a routerLink="/dashboard"
           class="bg-primary text-on-primary px-lg py-sm rounded-lg text-label-md hover:opacity-90 transition-all">
          Back to Dashboard
        </a>
      </div>
    </div>
  `,
})
export class ForbiddenComponent {}
