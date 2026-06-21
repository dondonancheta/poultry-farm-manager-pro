import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

type Step = 'request' | 'sent' | 'error';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="min-h-screen bg-surface-container-low flex items-center justify-center p-lg">
  <div class="w-full max-w-md">

    <!-- Farm branding -->
    <div class="text-center mb-xl">
      <div class="w-16 h-16 bg-primary rounded-2xl mx-auto mb-md flex items-center justify-center">
        <span class="material-symbols-outlined text-on-primary text-[32px]"
              style="font-variation-settings:'FILL' 1">egg</span>
      </div>
      <h1 class="font-bold text-primary" style="font-size:22px">GreenValley Poultry Farm</h1>
      <p class="text-on-surface-variant text-sm mt-xs">Farm Management System</p>
    </div>

    <!-- Request step -->
    @if (step() === 'request') {
      <div class="bg-white rounded-2xl shadow-lg border border-outline-variant overflow-hidden">
        <div class="bg-primary px-xl py-lg text-on-primary">
          <div class="flex items-center gap-sm mb-xs">
            <span class="material-symbols-outlined text-[22px]"
                  style="font-variation-settings:'FILL' 1">lock_reset</span>
            <h2 class="font-bold" style="font-size:18px">Reset Password</h2>
          </div>
          <p class="text-sm opacity-80">
            Enter your registered email address. We'll send a secure reset link.
          </p>
        </div>

        <div class="p-xl space-y-md">
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">Email Address *</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2
                           text-on-surface-variant text-[20px]">email</span>
              <input type="email" [(ngModel)]="email" placeholder="you@farm.com"
                     (keyup.enter)="submit()"
                     class="w-full pl-10 pr-md py-sm border border-outline-variant rounded-xl
                            text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20
                            transition-all"
                     [class.border-error]="emailError()"/>
            </div>
            @if (emailError()) {
              <p class="text-xs text-error mt-xs flex items-center gap-xs">
                <span class="material-symbols-outlined text-[12px]">error</span>
                {{ emailError() }}
              </p>
            }
          </div>

          <!-- Demo hint -->
          <div class="bg-surface-container rounded-xl p-md">
            <p class="text-xs text-on-surface-variant font-bold uppercase tracking-wide mb-sm">
              Demo accounts
            </p>
            <div class="space-y-xs">
              @for (hint of demoEmails; track hint.email) {
                <button (click)="email = hint.email"
                        class="w-full text-left px-sm py-xs rounded-lg hover:bg-surface-container-high
                               transition-colors flex items-center justify-between text-sm">
                  <span class="text-on-surface">{{ hint.email }}</span>
                  <span class="text-xs text-on-surface-variant capitalize">{{ hint.role }}</span>
                </button>
              }
            </div>
          </div>

          @if (apiError()) {
            <div class="bg-error-container text-on-error-container rounded-xl p-md flex items-center gap-sm text-sm">
              <span class="material-symbols-outlined text-[18px]">error</span>
              {{ apiError() }}
            </div>
          }

          <button (click)="submit()" [disabled]="loading()"
                  class="w-full py-md bg-primary text-on-primary rounded-xl text-label-md font-bold
                         hover:opacity-90 active:scale-95 transition-all disabled:opacity-60
                         flex items-center justify-center gap-sm">
            @if (loading()) {
              <span class="material-symbols-outlined text-[18px] animate-spin">refresh</span>
              Sending reset link…
            } @else {
              <span class="material-symbols-outlined text-[18px]"
                    style="font-variation-settings:'FILL' 1">send</span>
              Send Reset Link
            }
          </button>

          <div class="text-center">
            <a routerLink="/login"
               class="text-sm text-primary hover:underline flex items-center justify-center gap-xs">
              <span class="material-symbols-outlined text-[16px]">arrow_back</span>
              Back to Login
            </a>
          </div>
        </div>
      </div>
    }

    <!-- Success / sent step -->
    @if (step() === 'sent') {
      <div class="bg-white rounded-2xl shadow-lg border border-outline-variant overflow-hidden">
        <div class="p-xl text-center">
          <div class="w-16 h-16 bg-primary-fixed rounded-2xl mx-auto mb-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-primary text-[32px]"
                  style="font-variation-settings:'FILL' 1">mark_email_read</span>
          </div>
          <h2 class="font-bold text-on-surface mb-sm" style="font-size:20px">Check your email</h2>
          <p class="text-on-surface-variant text-sm leading-relaxed mb-lg">
            We sent a password reset link to<br>
            <strong class="text-on-surface">{{ email }}</strong>
          </p>
          <div class="bg-surface-container rounded-xl p-md mb-lg text-left space-y-sm">
            <p class="text-xs text-on-surface-variant font-bold uppercase tracking-wide">What to do next</p>
            <div class="flex items-start gap-sm text-sm text-on-surface-variant">
              <span class="w-5 h-5 bg-primary text-on-primary rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-xs">1</span>
              <span>Open the email from <strong>noreply&#64;greenvalley.farm</strong></span>
            </div>
            <div class="flex items-start gap-sm text-sm text-on-surface-variant">
              <span class="w-5 h-5 bg-primary text-on-primary rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-xs">2</span>
              <span>Click the secure link — it expires in <strong>60 minutes</strong></span>
            </div>
            <div class="flex items-start gap-sm text-sm text-on-surface-variant">
              <span class="w-5 h-5 bg-primary text-on-primary rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-xs">3</span>
              <span>Enter and confirm your new password</span>
            </div>
          </div>
          <div class="flex flex-col gap-sm">
            <button (click)="resend()" [disabled]="resendCooldown() > 0"
                    class="w-full py-sm border border-outline text-on-surface rounded-xl text-label-md
                           hover:bg-surface-container transition-all disabled:opacity-50 flex items-center justify-center gap-xs">
              <span class="material-symbols-outlined text-[16px]">refresh</span>
              {{ resendCooldown() > 0 ? 'Resend in ' + resendCooldown() + 's' : 'Resend Email' }}
            </button>
            <a routerLink="/login"
               class="w-full py-sm bg-primary text-on-primary rounded-xl text-label-md font-bold
                      hover:opacity-90 transition-all text-center block">
              Back to Login
            </a>
          </div>
        </div>
      </div>
    }

    <!-- Footer note -->
    <p class="text-center text-xs text-on-surface-variant mt-lg">
      Need help? Contact your farm administrator.
    </p>
  </div>
</div>
  `,
})
export class ForgotPasswordComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  email    = '';
  step     = signal<Step>('request');
  loading  = signal(false);
  emailError = signal('');
  apiError   = signal('');
  resendCooldown = signal(0);
  private cooldownInterval: any;

  demoEmails = [
    { email: 'admin1@admin.com',           role: 'admin'      },
    { email: 'manager1@manager.com',        role: 'manager'    },
    { email: 'supervisor1@supervisor.com',  role: 'supervisor' },
    { email: 'worker1@worker.com',          role: 'worker'     },
  ];

  submit(): void {
    this.emailError.set('');
    this.apiError.set('');

    if (!this.email.trim()) { this.emailError.set('Email address is required.'); return; }
    if (!this.email.includes('@')) { this.emailError.set('Enter a valid email address.'); return; }

    this.loading.set(true);
    this.auth.forgotPassword(this.email.trim()).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set('sent');
        this.startResendCooldown();
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.message;
        if (err.status === 404) {
          this.emailError.set('No account found with this email address.');
        } else if (msg) {
          this.apiError.set(msg);
        } else {
          // In demo mode (mock server may not have this endpoint) — show success anyway
          this.step.set('sent');
          this.startResendCooldown();
        }
      },
    });
  }

  resend(): void {
    if (this.resendCooldown() > 0) return;
    this.submit();
  }

  private startResendCooldown(): void {
    this.resendCooldown.set(60);
    this.cooldownInterval = setInterval(() => {
      this.resendCooldown.update(v => {
        if (v <= 1) { clearInterval(this.cooldownInterval); return 0; }
        return v - 1;
      });
    }, 1000);
  }
}
