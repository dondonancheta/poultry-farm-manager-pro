import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
<!--- ─────────────────────────────────────────────────────────
  PoultryFarm Pro — Landing Page
  Colors / spacing tokens match the project Tailwind config
─────────────────────────────────────────────────────────── -->
<div class="font-[Inter] antialiased text-on-surface bg-background selection:bg-primary-fixed selection:text-on-primary-fixed">

  <!-- ── TOP NAV ──────────────────────────────────────────── -->
  <header class="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-outline-variant/50 shadow-sm">
    <nav class="flex justify-between items-center px-lg py-sm max-w-[1280px] mx-auto">
      <div class="flex items-center gap-sm">
        <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span class="material-symbols-outlined text-on-primary text-[18px]"
                style="font-variation-settings:'FILL' 1">egg</span>
        </div>
        <span class="text-[20px] font-bold tracking-tight text-primary">PoultryFarm Pro</span>
      </div>
      <div class="hidden md:flex items-center gap-lg">
        <a class="text-sm font-semibold text-primary border-b-2 border-primary pb-px" href="#">Features</a>
        <a class="text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Solutions</a>
        <a class="text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Pricing</a>
        <a class="text-sm text-on-surface-variant hover:text-primary transition-colors" href="#">Resources</a>
      </div>
      <div class="flex items-center gap-sm">
        <a routerLink="/login"
           class="text-on-surface-variant text-sm font-medium hover:text-primary px-sm py-1.5 transition-colors">
          Login
        </a>
        <a routerLink="/login"
           class="bg-primary text-on-primary px-md py-1.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm">
          Start Free Trial
        </a>
      </div>
    </nav>
  </header>

  <!-- ── HERO ─────────────────────────────────────────────── -->
  <section class="relative overflow-hidden pt-xl pb-xl px-lg bg-gradient-to-b from-white to-surface-container-low/40">
    <div class="max-w-[1280px] mx-auto text-center">

      <!-- Badge -->
      <div class="inline-flex items-center gap-xs bg-primary-fixed text-on-primary-fixed rounded-full px-md py-xs text-xs font-bold mb-md border border-primary/10">
        <span class="material-symbols-outlined text-[14px]" style="font-variation-settings:'FILL' 1">verified</span>
        Trusted by 500+ Farms Across Southeast Asia
      </div>

      <h1 class="font-bold text-primary mb-md max-w-3xl mx-auto tracking-tight leading-tight"
          style="font-size:clamp(32px,5vw,52px)">
        Manage Your Poultry Farm Smarter,<br class="hidden md:block"/>
        Reduce Costs, Increase Profits
      </h1>

      <p class="text-on-surface-variant mb-lg max-w-xl mx-auto leading-relaxed" style="font-size:16px">
        Track flocks, feed consumption, mortality, inventory, and farm profitability
        in one unified enterprise platform built for modern poultry operations.
      </p>

      <div class="flex flex-col sm:flex-row justify-center gap-sm mb-xl">
        <a routerLink="/login"
           class="bg-primary text-on-primary px-xl py-sm rounded-lg font-semibold text-sm shadow-md hover:shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-xs">
          <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">rocket_launch</span>
          Start Free Trial
        </a>
        <button class="border-2 border-primary text-primary px-xl py-sm rounded-lg font-semibold text-sm hover:bg-primary-fixed transition-all flex items-center justify-center gap-xs">
          <span class="material-symbols-outlined text-[18px]">play_circle</span>
          Book Demo
        </button>
      </div>

      <!-- Hero dashboard mockup image -->
      <div class="relative mx-auto max-w-4xl">
        <div class="absolute inset-0 bg-primary/8 blur-[100px] -z-10 rounded-full"></div>
        <div class="bg-white rounded-2xl shadow-2xl border border-outline-variant/40 overflow-hidden">
          <!-- Browser chrome bar -->
          <div class="bg-surface-container flex items-center gap-sm px-md py-sm border-b border-outline-variant/30">
            <div class="flex gap-xs">
              <div class="w-3 h-3 rounded-full bg-error/60"></div>
              <div class="w-3 h-3 rounded-full bg-secondary/60"></div>
              <div class="w-3 h-3 rounded-full bg-primary/60"></div>
            </div>
            <div class="flex-1 bg-white rounded px-sm py-xs text-xs text-on-surface-variant text-center">
              app.greenvalley.farm
            </div>
          </div>
          <!-- Dashboard screenshot placeholder with live data visualization -->
          <div class="bg-surface-container-low p-md" style="min-height:380px">
            <div class="grid grid-cols-4 gap-sm mb-md">
              @for (kpi of heroKpis; track kpi.label) {
                <div class="bg-white rounded-xl p-sm border border-outline-variant/40 shadow-sm text-left">
                  <p class="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">{{ kpi.label }}</p>
                  <p class="font-bold text-primary mt-xs" style="font-size:18px">{{ kpi.value }}</p>
                  <p class="text-[9px] mt-xs flex items-center gap-xs"
                     [class]="kpi.up ? 'text-primary' : 'text-error'">
                    <span class="material-symbols-outlined text-[10px]" style="font-variation-settings:'FILL' 1">
                      {{ kpi.up ? 'trending_up' : 'trending_down' }}
                    </span>
                    {{ kpi.change }}
                  </p>
                </div>
              }
            </div>
            <!-- Mock chart -->
            <div class="bg-white rounded-xl border border-outline-variant/30 p-md mb-sm">
              <div class="flex justify-between items-center mb-sm">
                <p class="text-xs font-bold text-on-surface">Daily Egg Production — Last 14 Days</p>
                <span class="text-[9px] bg-primary-fixed text-on-primary-fixed px-sm py-xs rounded font-bold">LIVE</span>
              </div>
              <svg viewBox="0 0 600 100" class="w-full" style="height:80px">
                <defs>
                  <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#012d1d" stop-opacity="0.15"/>
                    <stop offset="100%" stop-color="#012d1d" stop-opacity="0"/>
                  </linearGradient>
                </defs>
                <path d="M0,70 L43,55 L86,62 L129,48 L172,52 L215,40 L258,45 L301,33 L344,38 L387,28 L430,32 L473,22 L516,28 L559,18 L600,22 L600,100 L0,100 Z"
                      fill="url(#heroGrad)"/>
                <path d="M0,70 L43,55 L86,62 L129,48 L172,52 L215,40 L258,45 L301,33 L344,38 L387,28 L430,32 L473,22 L516,28 L559,18 L600,22"
                      fill="none" stroke="#012d1d" stroke-width="2.5" stroke-linejoin="round"/>
                @for (pt of chartDots; track pt.x) {
                  <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="3" fill="#012d1d" stroke="white" stroke-width="1.5"/>
                }
              </svg>
            </div>
            <!-- Mock table rows -->
            <div class="bg-white rounded-xl border border-outline-variant/30 overflow-hidden">
              <div class="grid grid-cols-5 gap-0 border-b border-outline-variant/30 bg-surface-container-low px-md py-xs">
                @for (h of ['Batch','Building','Birds','FCR','Status']; track h) {
                  <p class="text-[8px] font-bold text-on-surface-variant uppercase tracking-wider">{{ h }}</p>
                }
              </div>
              @for (row of mockRows; track row.batch) {
                <div class="grid grid-cols-5 gap-0 px-md py-xs border-b border-outline-variant/20 last:border-0">
                  <p class="text-[9px] font-mono font-bold text-primary">{{ row.batch }}</p>
                  <p class="text-[9px] text-on-surface-variant">{{ row.house }}</p>
                  <p class="text-[9px] font-bold text-on-surface">{{ row.birds }}</p>
                  <p class="text-[9px] font-bold" [class]="parseFloat(row.fcr) > 1.5 ? 'text-error' : 'text-primary'">{{ row.fcr }}</p>
                  <span class="text-[8px] font-bold px-xs py-[1px] rounded-full w-fit"
                        [class]="row.status === 'Active' ? 'bg-primary-fixed text-on-primary-fixed' : 'bg-surface-container text-on-surface-variant'">
                    {{ row.status }}
                  </span>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ── TRUSTED BY ────────────────────────────────────────── -->
  <section class="py-lg px-lg border-y border-outline-variant/30 bg-white">
    <div class="max-w-[1280px] mx-auto">
      <p class="text-center text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-md">
        Trusted By Global Industry Leaders
      </p>
      <div class="flex flex-wrap justify-center items-center gap-xl mb-lg">
        @for (brand of brands; track brand) {
          <span class="text-sm font-bold text-on-surface-variant/50 hover:text-primary transition-colors cursor-default">
            {{ brand }}
          </span>
        }
      </div>
      <div class="grid grid-cols-3 gap-md text-center max-w-2xl mx-auto">
        @for (stat of stats; track stat.label) {
          <div [class]="!$last ? 'border-r border-outline-variant/30' : ''" class="py-sm">
            <div class="font-bold text-primary" style="font-size:32px;line-height:1">{{ stat.value }}</div>
            <p class="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mt-xs">{{ stat.label }}</p>
          </div>
        }
      </div>
    </div>
  </section>

  <!-- ── FEATURES BENTO ───────────────────────────────────── -->
  <section class="py-xl px-lg bg-surface-container-low">
    <div class="max-w-[1280px] mx-auto">
      <div class="text-center mb-xl">
        <h2 class="font-bold text-primary mb-sm" style="font-size:32px">Comprehensive Farm Intelligence</h2>
        <p class="text-on-surface-variant max-w-xl mx-auto">Everything you need to run a profitable, data-driven poultry operation</p>
      </div>
      <div class="grid grid-cols-12 gap-md">

        <!-- Big feature card: Flock Management -->
        <div class="col-span-12 md:col-span-7 bg-white p-lg rounded-2xl border border-outline-variant/50 shadow-sm hover:-translate-y-1 transition-all">
          <div class="flex items-center gap-sm mb-sm">
            <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span class="material-symbols-outlined text-on-primary" style="font-variation-settings:'FILL' 1">groups</span>
            </div>
            <h3 class="font-bold text-on-surface" style="font-size:17px">Flock Batch Management</h3>
          </div>
          <p class="text-on-surface-variant text-sm mb-md leading-relaxed">
            Unified tracking for batches from day-old chicks to harvest. Monitor growth curves,
            FCR, and mortality in real-time across all houses with live SVG performance charts.
          </p>
          <!-- Inline visual: growth chart -->
          <div class="bg-surface-container-low rounded-xl p-md border border-outline-variant/30">
            <div class="flex justify-between items-center mb-sm">
              <p class="text-xs font-bold text-on-surface">Flock Growth Curve — B-2024-001</p>
              <span class="text-[10px] font-bold text-primary">Day 32 / Alpha-1</span>
            </div>
            <svg viewBox="0 0 400 80" class="w-full" style="height:70px">
              <defs>
                <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#012d1d" stop-opacity="0.12"/>
                  <stop offset="100%" stop-color="#012d1d" stop-opacity="0"/>
                </linearGradient>
              </defs>
              <path d="M0,75 C40,74 80,68 120,55 C160,42 200,30 240,22 C280,14 320,10 360,7 L400,5 L400,80 L0,80 Z"
                    fill="url(#growthGrad)"/>
              <path d="M0,75 C40,74 80,68 120,55 C160,42 200,30 240,22 C280,14 320,10 360,7 L400,5"
                    fill="none" stroke="#012d1d" stroke-width="2.5"/>
              <circle cx="360" cy="7" r="4" fill="#012d1d" stroke="white" stroke-width="2"/>
              <line x1="360" y1="0" x2="360" y2="80" stroke="#012d1d" stroke-width="1" stroke-dasharray="3,3" opacity="0.3"/>
              <text x="362" y="18" fill="#012d1d" font-size="9" font-weight="700">Day 32</text>
            </svg>
            <div class="flex gap-md mt-sm">
              @for (m of flockMetrics; track m.label) {
                <div class="text-center flex-1">
                  <p class="font-bold text-primary text-sm">{{ m.value }}</p>
                  <p class="text-[9px] text-on-surface-variant uppercase tracking-wide">{{ m.label }}</p>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Feed Management -->
        <div class="col-span-12 md:col-span-5 bg-primary-container p-lg rounded-2xl hover:-translate-y-1 transition-all">
          <div class="flex items-center gap-sm mb-sm">
            <div class="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span class="material-symbols-outlined text-on-primary-container" style="font-variation-settings:'FILL' 1">grass</span>
            </div>
            <h3 class="font-bold text-on-primary-container" style="font-size:17px">Feed Management</h3>
          </div>
          <p class="text-on-primary-container/80 text-sm mb-md leading-relaxed">
            Precision tracking of feed consumption. Calculate FCR automatically to optimize
            your most significant cost factor. Issue, receive, and track all feed types.
          </p>
          <!-- FCR bars -->
          <div class="space-y-sm">
            @for (batch of fcrBatches; track batch.batch) {
              <div class="flex items-center gap-sm">
                <span class="text-[9px] font-mono font-bold text-on-primary-container w-20">{{ batch.batch }}</span>
                <div class="flex-1 bg-white/20 rounded-full h-2">
                  <div class="h-2 rounded-full"
                       [class]="batch.fcr > 1.5 ? 'bg-error' : 'bg-white'"
                       [style.width.%]="batch.fcr / 2 * 100"></div>
                </div>
                <span class="text-[10px] font-bold text-on-primary-container w-8 text-right">{{ batch.fcr }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Mortality Tracking -->
        <div class="col-span-12 md:col-span-4 bg-white p-lg rounded-2xl border border-outline-variant/50 shadow-sm hover:-translate-y-1 transition-all">
          <div class="flex items-center gap-sm mb-sm">
            <div class="w-10 h-10 bg-error-container rounded-xl flex items-center justify-center">
              <span class="material-symbols-outlined text-on-error-container" style="font-variation-settings:'FILL' 1">emergency</span>
            </div>
            <h3 class="font-bold text-on-surface" style="font-size:17px">Mortality Tracking</h3>
          </div>
          <p class="text-on-surface-variant text-sm leading-relaxed">
            Early warning systems for health trends. Identify patterns and push alerts to
            supervisors before losses impact your bottom line.
          </p>
          <div class="mt-md flex items-end justify-between gap-xs">
            @for (bar of mortalityBars; track bar.day) {
              <div class="flex-1 flex flex-col items-center gap-xs">
                <div class="w-full rounded-t"
                     [class]="bar.pct > 2 ? 'bg-error/70' : 'bg-primary/30'"
                     [style.height.px]="bar.pct * 14"></div>
                <span class="text-[8px] text-on-surface-variant">{{ bar.day }}</span>
              </div>
            }
          </div>
          <p class="text-[10px] text-on-surface-variant mt-xs text-center">7-day mortality rate (%)</p>
        </div>

        <!-- Vaccination Scheduler -->
        <div class="col-span-12 md:col-span-4 bg-surface-container p-lg rounded-2xl hover:-translate-y-1 transition-all border border-outline-variant/30">
          <div class="flex items-center gap-sm mb-sm">
            <div class="w-10 h-10 bg-primary-fixed rounded-xl flex items-center justify-center">
              <span class="material-symbols-outlined text-on-primary-fixed-variant" style="font-variation-settings:'FILL' 1">vaccines</span>
            </div>
            <h3 class="font-bold text-on-surface" style="font-size:17px">Vaccination Scheduler</h3>
          </div>
          <p class="text-on-surface-variant text-sm leading-relaxed">
            Automated schedules based on flock age and local health protocols with
            intelligent push notifications and overdue alerts.
          </p>
          <div class="mt-md space-y-xs">
            @for (vacc of vaccSchedule; track vacc.name) {
              <div class="flex items-center justify-between gap-sm bg-white/60 rounded-lg px-sm py-xs">
                <div class="flex items-center gap-xs">
                  <div class="w-2 h-2 rounded-full flex-shrink-0"
                       [class]="vacc.status === 'done' ? 'bg-primary' : vacc.status === 'overdue' ? 'bg-error' : 'bg-secondary'"></div>
                  <span class="text-[10px] font-bold text-on-surface">{{ vacc.name }}</span>
                </div>
                <span class="text-[9px] font-bold px-xs py-[1px] rounded-full"
                      [class]="vacc.status === 'done' ? 'bg-primary-fixed text-on-primary-fixed-variant' : vacc.status === 'overdue' ? 'bg-error text-on-error' : 'bg-secondary-fixed text-on-secondary-fixed-variant'">
                  {{ vacc.status | titlecase }}
                </span>
              </div>
            }
          </div>
        </div>

        <!-- Financial Dashboard -->
        <div class="col-span-12 md:col-span-4 bg-primary text-on-primary p-lg rounded-2xl hover:-translate-y-1 transition-all">
          <div class="flex items-center gap-sm mb-sm">
            <div class="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <span class="material-symbols-outlined text-on-primary" style="font-variation-settings:'FILL' 1">payments</span>
            </div>
            <h3 class="font-bold text-on-primary" style="font-size:17px">Financial Dashboard</h3>
          </div>
          <p class="text-on-primary/80 text-sm mb-md leading-relaxed">
            Real-time P&L reporting. Integrated bird sales and asset valuation for
            complete farm financial transparency.
          </p>
          <div class="space-y-sm">
            @for (fin of finMetrics; track fin.label) {
              <div class="flex justify-between items-center bg-white/10 rounded-lg px-sm py-xs">
                <span class="text-[10px] text-on-primary/70">{{ fin.label }}</span>
                <span class="text-[11px] font-bold" [class]="fin.positive ? 'text-primary-fixed-dim' : 'text-secondary-fixed'">
                  {{ fin.value }}
                </span>
              </div>
            }
          </div>
        </div>

      </div>
    </div>
  </section>

  <!-- ── BENEFITS ──────────────────────────────────────────── -->
  <section class="py-xl px-lg bg-primary text-on-primary overflow-hidden relative">
    <!-- decorative bg circles -->
    <div class="absolute top-0 right-0 w-96 h-96 bg-white/3 rounded-full blur-3xl -z-0"></div>
    <div class="absolute bottom-0 left-0 w-64 h-64 bg-white/3 rounded-full blur-2xl -z-0"></div>
    <div class="max-w-[1280px] mx-auto relative z-10">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-xl items-center">
        <div>
          <h2 class="font-bold mb-md" style="font-size:32px;line-height:1.2">
            Optimized Results,<br/>Built for Scale
          </h2>
          <p class="opacity-80 mb-lg leading-relaxed" style="font-size:16px">
            Professional tools that simplify complex biological operations
            into actionable business data.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-md">
            @for (b of benefits; track b.title) {
              <div class="flex gap-sm">
                <div class="bg-white/10 p-sm rounded-xl flex-shrink-0 h-fit">
                  <span class="material-symbols-outlined text-on-primary" style="font-variation-settings:'FILL' 1">{{ b.icon }}</span>
                </div>
                <div>
                  <h4 class="font-bold text-on-primary text-sm">{{ b.title }}</h4>
                  <p class="text-on-primary/70 text-xs mt-xs leading-relaxed">{{ b.desc }}</p>
                </div>
              </div>
            }
          </div>
        </div>
        <!-- Poultry farm image -->
        <div class="relative">
          <div class="rounded-2xl overflow-hidden shadow-2xl border border-white/10" style="height:380px">
            <img src="https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=80"
                 alt="Modern poultry facility with healthy chickens"
                 class="w-full h-full object-cover"/>
          </div>
          <!-- Overlay KPI card -->
          <div class="absolute -bottom-md -left-md bg-white rounded-2xl shadow-xl p-md border border-outline-variant/30" style="min-width:160px">
            <p class="text-[9px] font-bold text-on-surface-variant uppercase tracking-wide mb-xs">This Month</p>
            <p class="font-bold text-primary" style="font-size:22px">₱186,400</p>
            <p class="text-[10px] text-primary flex items-center gap-xs mt-xs">
              <span class="material-symbols-outlined text-[12px]" style="font-variation-settings:'FILL' 1">trending_up</span>
              +14.2% vs last month
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ── HOW IT WORKS ──────────────────────────────────────── -->
  <section class="py-xl px-lg bg-white">
    <div class="max-w-[1280px] mx-auto">
      <div class="text-center mb-xl">
        <h2 class="font-bold text-primary mb-sm" style="font-size:32px">Setup to Insights in 5 Steps</h2>
        <p class="text-on-surface-variant">Get your farm running on PoultryFarm Pro in under an hour</p>
      </div>
      <div class="relative">
        <div class="hidden md:block absolute top-6 left-0 w-full h-px bg-outline-variant/50"></div>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-md relative z-10">
          @for (step of steps; track step.num) {
            <div class="text-center group">
              <div class="w-12 h-12 rounded-full bg-white border-2 border-primary/30 text-primary
                          flex items-center justify-center mx-auto mb-md font-bold text-lg
                          group-hover:bg-primary group-hover:text-on-primary group-hover:border-primary
                          transition-all shadow-sm">
                {{ step.num }}
              </div>
              <div class="w-8 h-8 bg-primary-fixed rounded-lg flex items-center justify-center mx-auto mb-sm">
                <span class="material-symbols-outlined text-on-primary-fixed-variant text-[16px]"
                      style="font-variation-settings:'FILL' 1">{{ step.icon }}</span>
              </div>
              <h4 class="font-bold text-on-surface text-sm mb-xs">{{ step.title }}</h4>
              <p class="text-xs text-on-surface-variant leading-relaxed">{{ step.desc }}</p>
            </div>
          }
        </div>
      </div>
      <div class="mt-xl text-center">
        <a routerLink="/login"
           class="bg-primary text-on-primary px-xl py-sm rounded-lg font-semibold text-sm shadow-md hover:opacity-90 transition-all inline-flex items-center gap-sm">
          <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">rocket_launch</span>
          Get Started Now — It's Free
        </a>
      </div>
    </div>
  </section>

  <!-- ── TESTIMONIALS ──────────────────────────────────────── -->
  <section class="py-xl px-lg bg-surface-container-low">
    <div class="max-w-[1280px] mx-auto">
      <h2 class="font-bold text-primary text-center mb-xl" style="font-size:32px">What Farm Managers Say</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-lg">
        @for (t of testimonials; track t.name) {
          <div class="bg-white rounded-2xl p-lg shadow-sm border border-outline-variant/40 hover:-translate-y-1 transition-all">
            <div class="flex gap-xs mb-sm">
              @for (s of [1,2,3,4,5]; track s) {
                <span class="text-secondary text-sm">★</span>
              }
            </div>
            <p class="text-on-surface-variant text-sm leading-relaxed mb-lg italic">"{{ t.quote }}"</p>
            <div class="flex items-center gap-sm">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-on-primary font-bold text-sm flex-shrink-0"
                   [style.background]="t.color">
                {{ t.initials }}
              </div>
              <div>
                <p class="font-bold text-on-surface text-sm">{{ t.name }}</p>
                <p class="text-xs text-on-surface-variant">{{ t.role }}</p>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  </section>

  <!-- ── CTA BANNER ───────────────────────────────────────── -->
  <section class="py-xl px-lg bg-white">
    <div class="max-w-2xl mx-auto text-center">
      <h2 class="font-bold text-primary mb-sm" style="font-size:32px">Ready to Transform Your Farm?</h2>
      <p class="text-on-surface-variant mb-lg">Join 500+ farms already using PoultryFarm Pro to increase profits and reduce waste.</p>
      <div class="flex flex-col sm:flex-row justify-center gap-sm">
        <a routerLink="/login"
           class="bg-primary text-on-primary px-xl py-sm rounded-lg font-semibold text-sm shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-xs">
          <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">rocket_launch</span>
          Start Free Trial
        </a>
        <button class="border-2 border-primary text-primary px-xl py-sm rounded-lg font-semibold text-sm hover:bg-white transition-all flex items-center justify-center gap-xs">
          <span class="material-symbols-outlined text-[18px]">calendar_month</span>
          Schedule a Demo
        </button>
      </div>
    </div>
  </section>

  <!-- ── FOOTER ────────────────────────────────────────────── -->
  <footer class="bg-primary text-on-primary/80">
    <div class="max-w-[1280px] mx-auto px-lg py-xl">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-xl mb-xl">
        <div>
          <div class="flex items-center gap-sm mb-md">
            <div class="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
              <span class="material-symbols-outlined text-on-primary text-[18px]" style="font-variation-settings:'FILL' 1">egg</span>
            </div>
            <span class="font-bold text-on-primary text-lg">PoultryFarm Pro</span>
          </div>
          <p class="text-sm leading-relaxed opacity-70">Empowering farm managers with precision data and enterprise-grade tools.</p>
        </div>
        <div>
          <h5 class="text-xs font-bold text-on-primary uppercase tracking-widest mb-md">Navigation</h5>
          @for (link of ['Features','Pricing','Case Studies','Documentation']; track link) {
            <a href="#" class="block text-sm hover:text-on-primary transition-colors mb-xs">{{ link }}</a>
          }
        </div>
        <div>
          <h5 class="text-xs font-bold text-on-primary uppercase tracking-widest mb-md">Support</h5>
          @for (link of ['Contact Us','Privacy Policy','Help Center','System Status']; track link) {
            <a href="#" class="block text-sm hover:text-on-primary transition-colors mb-xs">{{ link }}</a>
          }
        </div>
        <div>
          <h5 class="text-xs font-bold text-on-primary uppercase tracking-widest mb-md">Newsletter</h5>
          <p class="text-sm opacity-70 mb-sm">Get farm insights and product updates.</p>
          <div class="flex gap-xs">
            <input [(ngModel)]="email" type="email" placeholder="your@email.com"
                   class="flex-1 bg-white/10 border border-white/20 rounded-lg px-sm py-xs text-sm text-on-primary placeholder:text-on-primary/40 focus:outline-none focus:ring-1 focus:ring-white/30"/>
            <button class="bg-secondary-container text-on-secondary-container px-md py-xs rounded-lg text-sm font-bold hover:opacity-90 transition-all">
              Join
            </button>
          </div>
        </div>
      </div>
      <div class="border-t border-white/10 pt-md text-center">
        <p class="text-sm opacity-60">© 2024 PoultryFarm Pro. Trusted across Southeast Asia.</p>
      </div>
    </div>
  </footer>

</div>
  `,
})
export class LandingComponent {
  email = '';
  parseFloat = parseFloat;

  heroKpis = [
    { label: 'Today Eggs',    value: '12,480', change: '+8.3% vs yesterday', up: true  },
    { label: 'Active Flocks', value: '4',      change: '52,500 birds',       up: true  },
    { label: 'Farm FCR',      value: '1.38',   change: '-0.04 this week',    up: true  },
    { label: 'Month Revenue', value: '₱186k',  change: '+14.2% vs last mo',  up: true  },
  ];

  chartDots = [
    {x:0,y:70},{x:43,y:55},{x:86,y:62},{x:129,y:48},{x:172,y:52},
    {x:215,y:40},{x:258,y:45},{x:301,y:33},{x:344,y:38},
    {x:387,y:28},{x:430,y:32},{x:473,y:22},{x:516,y:28},{x:559,y:18},{x:600,y:22},
  ];

  mockRows = [
    { batch:'B-2024-001', house:'Alpha-1', birds:'12,450', fcr:'1.42', status:'Active'    },
    { batch:'B-2024-002', house:'Beta-2',  birds:'15,000', fcr:'1.35', status:'Active'    },
    { batch:'B-2024-003', house:'Gamma-3', birds:'0',      fcr:'1.60', status:'Harvested' },
    { batch:'B-2024-004', house:'Delta-1', birds:'10,200', fcr:'1.10', status:'Active'    },
  ];

  brands = ['AgriCorp Global','Unity Growers','EcoFarm Co-op','Summit Poultry','Prime Flocks','NestVerde'];

  stats = [
    { value: '1M+',  label: 'Birds Managed'   },
    { value: '500+', label: 'Farms Registered' },
    { value: '10k+', label: 'Daily Records'    },
  ];

  flockMetrics = [
    { label: 'Birds',     value: '12,450' },
    { label: 'FCR',       value: '1.42'   },
    { label: 'Mortality', value: '1.2%'   },
    { label: 'Age',       value: 'Day 32' },
  ];

  fcrBatches = [
    { batch:'B-2024-001', fcr: 1.42 },
    { batch:'B-2024-002', fcr: 1.35 },
    { batch:'B-2024-004', fcr: 1.10 },
    { batch:'B-2024-005', fcr: 1.68 },
  ];

  mortalityBars = [
    {day:'M',pct:0.8},{day:'T',pct:1.2},{day:'W',pct:0.6},{day:'T',pct:3.2},
    {day:'F',pct:1.8},{day:'S',pct:0.4},{day:'S',pct:0.9},
  ];

  vaccSchedule = [
    { name:'Newcastle Stage 2', status:'done'      },
    { name:'Gumboro Stage 1',   status:'done'      },
    { name:"Marek's Disease",   status:'overdue'   },
    { name:'Newcastle Stage 3', status:'scheduled' },
  ];

  finMetrics = [
    { label:'Monthly Revenue', value:'₱186,400', positive:true  },
    { label:'Feed Cost',       value:'₱34,200',  positive:false },
    { label:'Gross Profit',    value:'₱142,800', positive:true  },
    { label:'Gross Margin',    value:'76.6%',     positive:true  },
  ];

  benefits = [
    { icon:'trending_down',    title:'Reduce Feed Waste',    desc:'Detect overfeeding instantly with FCR monitoring across all houses.'     },
    { icon:'health_and_safety',title:'Lower Mortality',      desc:'Health tracking reduces bird loss by up to 15% with early detection.'    },
    { icon:'bolt',             title:'Improve Productivity', desc:'Focus on care instead of manual paperwork with digital logs.'             },
    { icon:'add_chart',        title:'Increase Profits',     desc:'Higher margins on every batch through data-driven decision making.'       },
  ];

  steps = [
    { num:1, icon:'domain',    title:'Create Farm',     desc:'Define your farm profile, location, and configure settings.' },
    { num:2, icon:'warehouse', title:'Add Houses',      desc:'Map out your poultry houses and assign supervisors.'         },
    { num:3, icon:'groups',    title:'Register Flocks', desc:'Log batch origins, breed, and initial bird count.'           },
    { num:4, icon:'grass',     title:'Track Daily',     desc:'Input feed consumption, eggs collected, and health data.'    },
    { num:5, icon:'analytics', title:'View Reports',    desc:'Instant analytics, P&L, and downloadable farm reports.'      },
  ];

  testimonials = [
    {
      quote: "PoultryFarm Pro cut our feed waste by 18% in the first month. The FCR dashboard alone paid for the subscription in week one.",
      name: 'Ricardo Santos', role: 'Farm Owner, Batangas', initials: 'RS', color: '#012d1d',
    },
    {
      quote: "Our supervisors now verify egg collection digitally. No more paper logs, no more disputes. The whole team adopted it in two days.",
      name: 'Maria Reyes', role: 'Operations Manager, Laguna', initials: 'MR', color: '#3f6653',
    },
    {
      quote: "The vaccination scheduler saved us during the last health scare. We got alerts three days before our neighbors even noticed the issue.",
      name: 'Carlos Bautista', role: 'Veterinary Officer, Cavite', initials: 'CB', color: '#1b4332',
    },
  ];
}
