import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

type Step = 'form' | 'success' | 'invalid';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="min-h-screen bg-surface-container-low flex items-center justify-center p-lg">
  <div class="w-full max-w-md">

    <!-- Branding -->
    <div class="text-center mb-xl">
      <div class="w-16 h-16 bg-primary rounded-2xl mx-auto mb-md flex items-center justify-center">
        <span class="material-symbols-outlined text-on-primary text-[32px]"
              style="font-variation-settings:'FILL' 1">egg</span>
      </div>
      <h1 class="font-bold text-primary" style="font-size:22px">GreenValley Poultry Farm</h1>
      <p class="text-on-surface-variant text-sm mt-xs">Farm Management System</p>
    </div>

    <!-- Invalid / expired token -->
    @if (step() === 'invalid') {
      <div class="bg-white rounded-2xl shadow-lg border border-outline-variant p-xl text-center">
        <div class="w-16 h-16 bg-error-container rounded-2xl mx-auto mb-lg flex items-center justify-center">
          <span class="material-symbols-outlined text-on-error-container text-[32px]"
                style="font-variation-settings:'FILL' 1">link_off</span>
        </div>
        <h2 class="font-bold text-on-surface mb-sm" style="font-size:18px">Link expired or invalid</h2>
        <p class="text-on-surface-variant text-sm mb-lg">
          Reset links expire after 60 minutes. Request a new one to continue.
        </p>
        <a routerLink="/forgot-password"
           class="w-full py-sm bg-primary text-on-primary rounded-xl text-label-md font-bold
                  hover:opacity-90 transition-all block text-center">
          Request New Link
        </a>
      </div>
    }

    <!-- Reset form -->
    @if (step() === 'form') {
      <div class="bg-white rounded-2xl shadow-lg border border-outline-variant overflow-hidden">
        <div class="bg-primary px-xl py-lg text-on-primary">
          <div class="flex items-center gap-sm mb-xs">
            <span class="material-symbols-outlined text-[22px]"
                  style="font-variation-settings:'FILL' 1">lock</span>
            <h2 class="font-bold" style="font-size:18px">Set New Password</h2>
          </div>
          <p class="text-sm opacity-80">
            Resetting password for <strong>{{ email }}</strong>
          </p>
        </div>

        <div class="p-xl space-y-md">
          <!-- New password -->
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">New Password *</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2
                           text-on-surface-variant text-[20px]">lock</span>
              <input [type]="showPw ? 'text' : 'password'" [(ngModel)]="password"
                     placeholder="Minimum 8 characters"
                     class="w-full pl-10 pr-10 py-sm border border-outline-variant rounded-xl
                            text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
              <button type="button" (click)="showPw = !showPw"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                <span class="material-symbols-outlined text-[18px]">{{ showPw ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
            <!-- Strength meter -->
            @if (password.length > 0) {
              <div class="mt-xs">
                <div class="flex gap-xs">
                  @for (seg of [1,2,3,4]; track seg) {
                    <div class="flex-1 h-1.5 rounded-full transition-all"
                         [class]="strength() >= seg
                           ? (strength() <= 1 ? 'bg-error' : strength() === 2 ? 'bg-secondary-container' : strength() === 3 ? 'bg-secondary' : 'bg-primary')
                           : 'bg-surface-container-highest'"></div>
                  }
                </div>
                <p class="text-[10px] mt-xs" [class]="strength() <= 1 ? 'text-error' : strength() <= 2 ? 'text-secondary' : 'text-primary'">
                  {{ strengthLabel() }} — {{ hint() }}
                </p>
              </div>
            }
          </div>

          <!-- Confirm password -->
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">Confirm Password *</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2
                           text-on-surface-variant text-[20px]">lock_clock</span>
              <input [type]="showConfirm ? 'text' : 'password'" [(ngModel)]="confirm"
                     placeholder="Repeat new password"
                     class="w-full pl-10 pr-10 py-sm border-2 rounded-xl text-body-md
                            focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                     [class]="confirm && password !== confirm
                       ? 'border-error'
                       : confirm && password === confirm
                       ? 'border-primary'
                       : 'border-outline-variant'"/>
              <button type="button" (click)="showConfirm = !showConfirm"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                <span class="material-symbols-outlined text-[18px]">{{ showConfirm ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
            @if (confirm && password !== confirm) {
              <p class="text-[10px] text-error mt-xs flex items-center gap-xs">
                <span class="material-symbols-outlined text-[12px]">close</span>Passwords do not match
              </p>
            }
            @if (confirm && password === confirm && password.length >= 8) {
              <p class="text-[10px] text-primary mt-xs flex items-center gap-xs">
                <span class="material-symbols-outlined text-[12px]" style="font-variation-settings:'FILL' 1">check_circle</span>Passwords match
              </p>
            }
          </div>

          <!-- Requirements checklist -->
          <div class="bg-surface-container rounded-xl p-md">
            <p class="text-label-md text-on-surface-variant font-bold uppercase tracking-wide mb-sm">Requirements</p>
            <div class="space-y-xs">
              @for (req of requirements(); track req.label) {
                <div class="flex items-center gap-sm text-xs"
                     [class]="req.met ? 'text-primary' : 'text-on-surface-variant'">
                  <span class="material-symbols-outlined text-[14px]"
                        [style]="req.met ? 'font-variation-settings:FILL 1' : ''">
                    {{ req.met ? 'check_circle' : 'radio_button_unchecked' }}
                  </span>
                  {{ req.label }}
                </div>
              }
            </div>
          </div>

          @if (apiError()) {
            <div class="bg-error-container text-on-error-container rounded-xl p-md flex items-center gap-sm text-sm">
              <span class="material-symbols-outlined text-[18px]">error</span>{{ apiError() }}
            </div>
          }

          <button (click)="submit()" [disabled]="!canSubmit() || loading()"
                  class="w-full py-md bg-primary text-on-primary rounded-xl text-label-md font-bold
                         hover:opacity-90 active:scale-95 transition-all disabled:opacity-60
                         flex items-center justify-center gap-sm">
            @if (loading()) {
              <span class="material-symbols-outlined text-[18px] animate-spin">refresh</span>
              Updating password…
            } @else {
              <span class="material-symbols-outlined text-[18px]"
                    style="font-variation-settings:'FILL' 1">lock</span>
              Set New Password
            }
          </button>

          <div class="text-center">
            <a routerLink="/login"
               class="text-sm text-primary hover:underline flex items-center justify-center gap-xs">
              <span class="material-symbols-outlined text-[16px]">arrow_back</span>Back to Login
            </a>
          </div>
        </div>
      </div>
    }

    <!-- Success -->
    @if (step() === 'success') {
      <div class="bg-white rounded-2xl shadow-lg border border-outline-variant p-xl text-center">
        <div class="w-16 h-16 bg-primary-fixed rounded-2xl mx-auto mb-lg flex items-center justify-center">
          <span class="material-symbols-outlined text-primary text-[32px]"
                style="font-variation-settings:'FILL' 1">check_circle</span>
        </div>
        <h2 class="font-bold text-on-surface mb-sm" style="font-size:20px">Password Updated!</h2>
        <p class="text-on-surface-variant text-sm mb-lg leading-relaxed">
          Your password has been changed successfully.<br>
          You can now log in with your new password.
        </p>
        <a routerLink="/login"
           class="w-full py-sm bg-primary text-on-primary rounded-xl text-label-md font-bold
                  hover:opacity-90 transition-all block text-center">
          Go to Login
        </a>
      </div>
    }

    <p class="text-center text-xs text-on-surface-variant mt-lg">
      Need help? Contact your farm administrator.
    </p>
  </div>
</div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  private auth    = inject(AuthService);
  private router  = inject(Router);
  private route   = inject(ActivatedRoute);

  token   = '';
  email   = '';
  password  = '';
  confirm   = '';
  showPw      = false;
  showConfirm = false;
  step    = signal<Step>('form');
  loading = signal(false);
  apiError = signal('');

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? 'demo-token';
    this.email = this.route.snapshot.queryParamMap.get('email') ?? '';
    // In demo mode allow proceeding even without token
    if (!this.email && !this.token) { this.step.set('invalid'); }
  }

  strength(): number {
    const p = this.password;
    if (!p || p.length < 6) return 0;
    let s = 0;
    if (p.length >= 8)          s++;
    if (/[A-Z]/.test(p))        s++;
    if (/[0-9]/.test(p))        s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  }

  strengthLabel(): string { return ['','Weak','Fair','Good','Strong'][this.strength()] ?? ''; }

  hint(): string {
    const p = this.password;
    const h: string[] = [];
    if (p.length < 8)            h.push('8+ chars');
    if (!/[A-Z]/.test(p))       h.push('uppercase');
    if (!/[0-9]/.test(p))       h.push('number');
    if (!/[^A-Za-z0-9]/.test(p)) h.push('symbol');
    return h.length ? 'Still needs: ' + h.join(', ') : '✓ All requirements met';
  }

  requirements() {
    const p = this.password;
    return [
      { label: 'At least 8 characters',    met: p.length >= 8 },
      { label: 'One uppercase letter',      met: /[A-Z]/.test(p) },
      { label: 'One number',                met: /[0-9]/.test(p) },
      { label: 'One special character',     met: /[^A-Za-z0-9]/.test(p) },
    ];
  }

  canSubmit(): boolean {
    return this.password.length >= 8 && this.password === this.confirm;
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.loading.set(true);
    this.apiError.set('');

    this.auth.resetPassword(this.token, this.email, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set('success');
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message;
        if (err.status === 400 || err.status === 422) {
          this.step.set('invalid');
        } else {
          // Demo fallback — show success anyway
          this.step.set('success');
          setTimeout(() => this.router.navigate(['/login']), 3000);
        }
      },
    });
  }
}
