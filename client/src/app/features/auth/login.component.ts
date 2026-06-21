import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Role } from '../../core/models';

interface DemoCredential {
  role: Role;
  label: string;
  email: string;
  password: string;
  icon: string;
  color: string;
  textColor: string;
  description: string;
  capabilities: string[];
}

const DEMO_CREDENTIALS: DemoCredential[] = [
  {
    role: 'worker',
    label: 'Farm Worker',
    email: 'worker1@worker.com',
    password: 'worker1',
    icon: 'agriculture',
    color: 'bg-primary-fixed',
    textColor: 'text-on-primary-fixed-variant',
    description: 'Daily farm operations and data entry',
    capabilities: [
      'Record daily egg collection',
      'Report damaged eggs',
      'Log feed consumption',
      'Record mortality events',
    ],
  },
  {
    role: 'supervisor',
    label: 'Supervisor',
    email: 'supervisor1@supervisor.com',
    password: 'supervisor1',
    icon: 'manage_accounts',
    color: 'bg-secondary-fixed',
    textColor: 'text-on-secondary-fixed-variant',
    description: 'Verify entries and monitor operations',
    capabilities: [
      'Verify production entries',
      'Monitor inventory levels',
      'Review health records',
      'Approve feed issuances',
    ],
  },
  {
    role: 'manager',
    label: 'Farm Manager',
    email: 'manager1@manager.com',
    password: 'manager1',
    icon: 'leaderboard',
    color: 'bg-tertiary-fixed',
    textColor: 'text-on-tertiary-fixed-variant',
    description: 'Analytics, reporting and profitability',
    capabilities: [
      'Access full dashboards',
      'View advanced analytics',
      'Generate all reports',
      'Track profitability & FCR',
    ],
  },
  {
    role: 'admin',
    label: 'Administrator',
    email: 'admin1@admin.com',
    password: 'admin1',
    icon: 'admin_panel_settings',
    color: 'bg-primary-container',
    textColor: 'text-on-primary-container',
    description: 'Full system access and configuration',
    capabilities: [
      'Manage all users & roles',
      'Configure system settings',
      'Maintain master data',
      'Full access to everything',
    ],
  },
];

const ROLE_ROUTES: Record<Role, string> = {
  worker:     '/worker-home',
  supervisor: '/supervisor-home',
  manager:    '/manager/dashboard',
  admin:      '/admin-home',
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-surface to-surface-container-low flex">

      <!-- ── Left panel: Role cards ─────────────────────────────────────── -->
      <div class="hidden lg:flex flex-col justify-center px-xl py-xl w-[520px] flex-shrink-0
                  bg-surface border-r border-outline-variant overflow-y-auto">

        <div class="mb-lg">
          <h1 class="font-bold text-primary" style="font-size:36px;line-height:44px">PoultryFarm Pro</h1>
          <p class="text-body-lg text-on-surface-variant mt-xs">Enterprise ERP Platform</p>
        </div>

        <p class="text-label-md text-on-surface-variant uppercase tracking-widest mb-md">
          Demo accounts — click to fill
        </p>

        <div class="flex flex-col gap-sm">
          @for (cred of demoCredentials; track cred.role) {
            <button
              (click)="fillCredentials(cred)"
              class="w-full text-left p-md rounded-xl border-2 transition-all duration-200
                     hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99]"
              [class]="selectedRole === cred.role
                ? 'border-primary shadow-md scale-[1.01] ' + cred.color
                : 'bg-white border-outline-variant hover:border-outline'"
            >
              <div class="flex items-start gap-md">
                <!-- Icon badge -->
                <div class="p-sm rounded-lg flex-shrink-0" [class]="cred.color">
                  <span class="material-symbols-outlined text-[22px]" [class]="cred.textColor"
                        style="font-variation-settings: 'FILL' 1">{{ cred.icon }}</span>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-xs">
                    <span class="text-body-md font-bold text-on-surface">{{ cred.label }}</span>
                    <span class="text-[10px] font-mono text-on-surface-variant truncate ml-sm">{{ cred.email }}</span>
                  </div>
                  <p class="text-xs text-on-surface-variant mb-sm">{{ cred.description }}</p>
                  <div class="grid grid-cols-2 gap-xs">
                    @for (cap of cred.capabilities; track cap) {
                      <div class="flex items-center gap-xs">
                        <span class="material-symbols-outlined text-[12px] text-primary"
                              style="font-variation-settings: 'FILL' 1">check_circle</span>
                        <span class="text-[11px] text-on-surface-variant leading-tight">{{ cap }}</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </button>
          }
        </div>
      </div>

      <!-- ── Right panel: Login form ────────────────────────────────────── -->
      <div class="flex-1 flex flex-col items-center justify-center px-lg py-xl">

        <!-- Mobile logo -->
        <div class="lg:hidden text-center mb-xl">
          <h1 class="font-bold text-primary" style="font-size:32px;line-height:40px">PoultryFarm Pro</h1>
          <p class="text-body-md text-on-surface-variant">Enterprise ERP Platform</p>
        </div>

        <div class="w-full max-w-sm">

          <!-- Active role indicator -->
          @if (activeRole) {
            <div class="flex items-center gap-sm mb-md px-md py-sm rounded-xl border border-outline-variant bg-white">
              <span class="material-symbols-outlined text-[18px] text-primary"
                    style="font-variation-settings: 'FILL' 1">{{ activeRole.icon }}</span>
              <span class="text-body-md text-on-surface flex-1">
                Signing in as <strong>{{ activeRole.label }}</strong>
              </span>
              <button (click)="clearRole()"
                      class="text-on-surface-variant hover:text-error transition-colors ml-auto">
                <span class="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          }

          <!-- Card -->
          <div class="bg-white border border-outline-variant rounded-2xl p-xl shadow-sm">
            <h2 class="font-bold text-on-surface mb-xs" style="font-size:22px;line-height:30px">
              Welcome back
            </h2>
            <p class="text-body-md text-on-surface-variant mb-lg">Sign in to your account to continue</p>

            <!-- Error -->
            @if (error()) {
              <div class="bg-error-container text-on-error-container rounded-lg p-md mb-md
                          text-body-md flex items-center gap-sm">
                <span class="material-symbols-outlined text-[18px]">error</span>
                {{ error() }}
              </div>
            }

            <!-- Success flash -->
            @if (success()) {
              <div class="bg-primary-fixed text-on-primary-fixed-variant rounded-lg p-md mb-md
                          text-body-md flex items-center gap-sm">
                <span class="material-symbols-outlined text-[18px]"
                      style="font-variation-settings: 'FILL' 1">check_circle</span>
                Credentials filled — click Sign In!
              </div>
            }

            <div class="space-y-md">
              <!-- Email -->
              <div>
                <label class="text-label-md text-on-surface-variant block mb-xs">Email address</label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2
                               text-on-surface-variant text-[18px]">mail</span>
                  <input
                    type="email"
                    [(ngModel)]="email"
                    placeholder="you@farm.com"
                    class="w-full border border-outline-variant rounded-lg pl-10 pr-md py-sm text-body-md
                           focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <!-- Password -->
              <div>
                <label class="text-label-md text-on-surface-variant block mb-xs">Password</label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2
                               text-on-surface-variant text-[18px]">lock</span>
                  <input
                    [type]="showPassword ? 'text' : 'password'"
                    [(ngModel)]="password"
                    placeholder="••••••••"
                    class="w-full border border-outline-variant rounded-lg pl-10 pr-10 py-sm text-body-md
                           focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    (keyup.enter)="login()"
                  />
                  <button type="button" (click)="showPassword = !showPassword"
                          class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant
                                 hover:text-primary transition-colors">
                    <span class="material-symbols-outlined text-[18px]">
                      {{ showPassword ? 'visibility_off' : 'visibility' }}
                    </span>
                  </button>
                </div>
              </div>

              <!-- Sign in button -->
              <button
                (click)="login()"
                [disabled]="loading()"
                class="w-full bg-primary text-on-primary py-md rounded-lg font-bold
                       hover:opacity-90 active:scale-95 transition-all disabled:opacity-60
                       flex items-center justify-center gap-sm text-body-md"
              >
                @if (loading()) {
                  <span class="material-symbols-outlined animate-spin text-[18px]">refresh</span>
                  Signing in...
                } @else {
                  <span class="material-symbols-outlined text-[18px]">login</span>
                  Sign In
                }
              </button>
            </div>
          </div>

          <!-- Mobile demo shortcuts -->
          <div class="mt-lg lg:hidden">
            <p class="text-label-md text-on-surface-variant uppercase tracking-widest text-center mb-md">
              Demo accounts
            </p>
            <div class="grid grid-cols-2 gap-sm">
              @for (cred of demoCredentials; track cred.role) {
                <button (click)="fillCredentials(cred)"
                        class="p-sm rounded-lg border border-outline-variant bg-white text-left
                               hover:border-primary transition-all">
                  <span class="material-symbols-outlined text-[16px] text-primary block mb-xs"
                        style="font-variation-settings: 'FILL' 1">{{ cred.icon }}</span>
                  <span class="font-bold text-on-surface block text-xs">{{ cred.label }}</span>
                  <span class="text-[10px] text-on-surface-variant">{{ cred.email }}</span>
                </button>
              }
            </div>
          </div>

          <p class="text-center text-xs text-on-surface-variant mt-lg">
            © 2024 PoultryFarm Pro · Trusted in Southeast Asia
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  email        = '';
  password     = '';
  showPassword = false;
  selectedRole = '';
  activeRole: DemoCredential | null = null;

  loading = signal(false);
  error   = signal('');
  success = signal(false);

  demoCredentials = DEMO_CREDENTIALS;

  fillCredentials(cred: DemoCredential): void {
    this.email        = cred.email;
    this.password     = cred.password;
    this.selectedRole = cred.role;
    this.activeRole   = cred;
    this.error.set('');
    this.success.set(true);
    setTimeout(() => this.success.set(false), 2500);
  }

  clearRole(): void {
    this.selectedRole = '';
    this.activeRole   = null;
    this.email        = '';
    this.password     = '';
  }

  login(): void {
    if (!this.email || !this.password) {
      this.error.set('Please enter your email and password.');
      return;
    }
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        const role = this.auth.role();
        const dest = role ? ROLE_ROUTES[role] : '/dashboard';
        this.router.navigate([dest]);
      },
      error: (e: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.error.set(e?.error?.message ?? 'Invalid credentials. Please try again.');
      },
    });
  }
}
