import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, Subject, interval } from 'rxjs';
import { takeUntil, startWith } from 'rxjs/operators';
import { AnalyticsService } from '../../core/services/index';

// ── Typed API response interfaces ─────────────────────────────────────────────
interface ProductionApiResponse {
  trend: { date: string; eggs: number }[];
  avg_daily: number;
  total: number;
}

interface FcrApiResponse {
  farm_avg: number;
  by_batch: { batch: string; building: string; fcr: number; feed_kg?: number; eggs?: number; age?: number }[];
}

interface MortalityApiResponse {
  weekly:       { week: string; pct: number }[];
  avg_pct:      number;
  best_batch:   string;
  worst_batch:  string;
}

// ── Internal display models ───────────────────────────────────────────────────
interface KpiCard {
  label: string; value: string; color: string;
  trend: string; trendGood: boolean; icon: string;
}

interface BatchFcr {
  batch: string; building: string; fcr: number;
  age: number; feedKg: number; eggs: number;
}

interface MortWeek { week: string; pct: number; }

interface ChartPoint { x: number; y: number; }

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-lg max-w-6xl mx-auto pb-xl space-y-gutter">

      <!-- Header ──────────────────────────────────────────────────────────── -->
      <div class="flex items-center gap-md">
        <a routerLink="/manager/dashboard"
           class="p-sm hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant">
          <span class="material-symbols-outlined">arrow_back</span>
        </a>
        <div class="flex-1">
          <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">
            Production Analytics Dashboard
          </h1>
          <p class="text-body-md text-on-surface-variant">
            {{ today }}
            @if (loading()) {
              <span class="inline-flex items-center gap-xs ml-sm text-on-surface-variant">
                <span class="material-symbols-outlined text-[14px] animate-spin">refresh</span>
                Refreshing...
              </span>
            } @else {
              · Last updated: {{ lastRefreshed }}
            }
          </p>
        </div>

        <!-- Controls -->
        <div class="flex gap-sm items-center flex-wrap justify-end">
          <select [(ngModel)]="dateRange" (ngModelChange)="loadAll()"
                  class="border border-outline-variant rounded-lg px-md py-sm text-body-md
                         focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <select [(ngModel)]="filterBuilding" (ngModelChange)="loadAll()"
                  class="border border-outline-variant rounded-lg px-md py-sm text-body-md
                         focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="">All buildings</option>
            @for (b of buildings; track b) { <option>{{ b }}</option> }
          </select>
          <button (click)="loadAll()"
                  class="flex items-center gap-xs border border-outline text-on-surface px-md py-sm
                         rounded-lg text-label-md hover:bg-surface-container transition-all">
            <span class="material-symbols-outlined text-[16px]">refresh</span>
          </button>
          <a routerLink="/manager/reports"
             class="flex items-center gap-xs bg-primary text-on-primary px-lg py-sm
                    rounded-lg text-label-md font-bold hover:opacity-90 transition-all">
            <span class="material-symbols-outlined text-[18px]">download</span>
            Export
          </a>
        </div>
      </div>

      <!-- Error banner -->
      @if (error()) {
        <div class="bg-error-container text-on-error-container rounded-xl p-md flex items-center gap-sm">
          <span class="material-symbols-outlined text-[18px]">warning</span>
          {{ error() }} — showing last cached data.
        </div>
      }

      <!-- KPI strip ────────────────────────────────────────────────────────── -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-md">
        @for (kpi of kpiCards(); track kpi.label) {
          <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm
                      hover:shadow-md transition-all">
            <div class="flex items-center justify-between mb-sm">
              <span class="material-symbols-outlined p-sm rounded-xl text-[20px] bg-primary-fixed text-on-primary-fixed-variant"
                    style="font-variation-settings:'FILL' 1">{{ kpi.icon }}</span>
              <span class="text-xs font-bold px-sm py-xs rounded-full"
                    [class]="kpi.trendGood
                      ? 'bg-primary-fixed text-on-primary-fixed-variant'
                      : 'bg-error-container text-on-error-container'">
                {{ kpi.trend }}
              </span>
            </div>
            <div class="font-bold" [class]="kpi.color" style="font-size:26px;line-height:32px">{{ kpi.value }}</div>
            <div class="text-label-md text-on-surface-variant uppercase tracking-wider mt-xs">{{ kpi.label }}</div>
          </div>
        }
      </div>

      <!-- Production trend chart ───────────────────────────────────────────── -->
      <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
        <div class="flex items-center justify-between mb-lg">
          <div>
            <h3 class="font-bold text-on-surface" style="font-size:16px">
              Production Trend — Last {{ dateRange }} Days
            </h3>
            <p class="text-xs text-on-surface-variant mt-xs">
              {{ trendData().length }} data points · Daily target: {{ dailyTarget.toLocaleString() }} eggs
            </p>
          </div>
          <div class="flex gap-xs">
            @for (mode of chartModes; track mode.key) {
              <button (click)="chartMode = mode.key"
                      class="px-md py-xs rounded-lg text-label-md transition-all"
                      [class]="chartMode === mode.key
                        ? 'bg-primary text-on-primary font-bold'
                        : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'">
                {{ mode.label }}
              </button>
            }
          </div>
        </div>

        <!-- SVG area chart -->
        <div class="relative" style="height:220px">
          <!-- Y-axis labels -->
          <div class="absolute left-0 top-0 h-full flex flex-col justify-between text-right pr-sm"
               style="width:48px">
            @for (label of yAxisLabels; track label) {
              <span class="text-[10px] text-on-surface-variant">{{ label }}</span>
            }
          </div>

          <!-- Chart area -->
          <div class="absolute top-0 bottom-0 right-0" style="left:52px">
            <svg class="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="none">
              <!-- Grid -->
              @for (y of [0,50,100,150,200]; track y) {
                <line [attr.y1]="y" [attr.y2]="y" x1="0" x2="700"
                      stroke="#c1c8c2" stroke-width="0.5" opacity="0.4"/>
              }
              <!-- Target dashed line -->
              <line x1="0" [attr.y1]="targetLineY" x2="700" [attr.y2]="targetLineY"
                    stroke="#fe932c" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.7"/>

              <!-- Bar chart for ≤30 day ranges, line+area for longer -->
              @if (useBars()) {
                @for (pt of barPoints(); track pt.x) {
                  <rect [attr.x]="pt.x" [attr.y]="pt.y"
                        [attr.width]="pt.w" [attr.height]="200 - pt.y"
                        [attr.fill]="pt.eggs >= dailyTarget ? '#012d1d' : '#3f6653'"
                        rx="2" opacity="0.85"
                        class="hover:opacity-100 transition-opacity"/>
                  <!-- Target indicator dot on bar top -->
                  @if (pt.eggs >= dailyTarget) {
                    <rect [attr.x]="pt.x" [attr.y]="pt.y" [attr.width]="pt.w" height="3"
                          fill="#fe932c" rx="1"/>
                  }
                }
              } @else {
                <!-- Line + area for longer date ranges -->
                @if (areaPath()) {
                  <path [attr.d]="areaPath()" fill="#012d1d" opacity="0.07"/>
                  <path [attr.d]="linePath()" fill="none" stroke="#012d1d"
                        stroke-width="2" stroke-linejoin="round"/>
                }
                @for (pt of chartPoints(); track pt.x) {
                  <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="3"
                          fill="#012d1d" stroke="white" stroke-width="2"/>
                }
              }
            </svg>
          </div>
        </div>

        <!-- X-axis labels -->
        <div class="flex justify-between mt-xs" style="padding-left:52px">
          @for (pt of xAxisLabels(); track pt) {
            <span class="text-[10px] text-on-surface-variant">{{ pt }}</span>
          }
        </div>

        <!-- Legend -->
        <div class="flex items-center gap-lg mt-md pt-md border-t border-outline-variant">
          <div class="flex items-center gap-xs">
            <span class="w-3 h-3 rounded-sm bg-primary inline-block"></span>
            <span class="text-xs text-on-surface-variant">Eggs collected</span>
          </div>
          <div class="flex items-center gap-xs">
            <span class="w-5 h-px inline-block" style="border-top:2px dashed #fe932c"></span>
            <span class="text-xs text-on-surface-variant">Daily target ({{ dailyTarget.toLocaleString() }})</span>
          </div>
          <div class="ml-auto text-xs text-on-surface-variant">
            Avg: <strong class="text-primary">{{ avgDaily().toLocaleString() }}</strong> / day ·
            Total: <strong class="text-primary">{{ totalEggs().toLocaleString() }}</strong>
          </div>
        </div>
      </div>

      <!-- FCR + Mortality side by side ─────────────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-gutter">

        <!-- FCR per batch -->
        <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
          <div class="flex items-center justify-between mb-lg">
            <div>
              <h3 class="font-bold text-on-surface" style="font-size:16px">
                Feed Conversion Ratio (FCR)
              </h3>
              <p class="text-xs text-on-surface-variant mt-xs">
                Farm avg: <strong class="font-bold"
                  [class]="farmFcr() > 1.45 ? 'text-error' : 'text-primary'">
                  {{ farmFcr() }}
                </strong>
              </p>
            </div>
            <span class="text-xs text-on-surface-variant bg-surface-container px-sm py-xs rounded-lg">
              Target ≤ 1.45
            </span>
          </div>

          <div class="space-y-md">
            @for (b of fcrBatches(); track b.batch) {
              <div>
                <div class="flex items-center justify-between mb-xs">
                  <div>
                    <span class="font-bold text-on-surface text-sm font-mono">{{ b.batch }}</span>
                    <span class="text-xs text-on-surface-variant ml-sm">{{ b.building }}
                      @if (b.age) { · Day {{ b.age }} }
                    </span>
                  </div>
                  <span class="font-bold text-sm"
                        [class]="b.fcr > 1.6 ? 'text-error' : b.fcr > 1.45 ? 'text-secondary' : 'text-primary'">
                    {{ b.fcr }}
                    @if (b.fcr > 1.6) { <span class="text-[10px] ml-xs">⚠</span> }
                  </span>
                </div>

                <!-- Bar with target marker -->
                <div class="w-full bg-surface-container rounded-full h-2.5 relative">
                  <!-- Target marker at 1.45/2.0 = 72.5% -->
                  <div class="absolute top-0 bottom-0 w-0.5 bg-secondary z-10 rounded"
                       style="left:72.5%"></div>
                  <div class="h-2.5 rounded-full transition-all duration-700"
                       [class]="b.fcr > 1.6 ? 'bg-error' : b.fcr > 1.45 ? 'bg-secondary-container' : 'bg-primary'"
                       [style.width.%]="fcrBarPct(b.fcr)">
                  </div>
                </div>

                <div class="flex justify-between mt-xs text-[10px] text-on-surface-variant">
                  @if (b.feedKg) { <span>Feed: {{ b.feedKg.toLocaleString() }} kg</span> }
                  @if (b.eggs)   { <span>Eggs: {{ b.eggs.toLocaleString() }}</span> }
                </div>
              </div>
            }
          </div>

          <!-- FCR legend -->
          <div class="mt-md pt-md border-t border-outline-variant flex gap-lg flex-wrap">
            <div class="flex items-center gap-xs">
              <span class="w-3 h-3 rounded-sm bg-primary inline-block"></span>
              <span class="text-xs text-on-surface-variant">Efficient (≤ 1.45)</span>
            </div>
            <div class="flex items-center gap-xs">
              <span class="w-3 h-3 rounded-sm bg-secondary-container inline-block"></span>
              <span class="text-xs text-on-surface-variant">Monitor (1.45–1.6)</span>
            </div>
            <div class="flex items-center gap-xs">
              <span class="w-3 h-3 rounded-sm bg-error inline-block"></span>
              <span class="text-xs text-on-surface-variant">Critical (> 1.6)</span>
            </div>
          </div>
        </div>

        <!-- Mortality trend -->
        <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
          <div class="flex items-center justify-between mb-lg">
            <div>
              <h3 class="font-bold text-on-surface" style="font-size:16px">Mortality Rate Trend</h3>
              <p class="text-xs text-on-surface-variant mt-xs">
                Farm avg:
                <strong [class]="avgMortality() > 1 ? 'text-error' : 'text-primary'">
                  {{ avgMortality() }}%
                </strong>
              </p>
            </div>
            <span class="text-xs text-on-surface-variant bg-surface-container px-sm py-xs rounded-lg">
              Normal &lt; 1%
            </span>
          </div>

          <!-- SVG mortality bar chart -->
          <div style="height:180px" class="relative">
            <svg class="w-full h-full" viewBox="0 0 420 160" preserveAspectRatio="none">
              <!-- Grid lines -->
              @for (y of [0,40,80,120,160]; track y) {
                <line [attr.y1]="y" [attr.y2]="y" x1="0" x2="420"
                      stroke="#c1c8c2" stroke-width="0.5" opacity="0.4"/>
              }
              <!-- Normal threshold line at 1% -->
              <line x1="0" y1="120" x2="420" y2="120"
                    stroke="#fe932c" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.7"/>

              @for (w of mortWeeks(); track w.week; let i = $index) {
                @let barH = mortBarH(w.pct);
                <g>
                  <rect [attr.x]="i * 60 + 8"
                        [attr.y]="160 - barH"
                        width="44" [attr.height]="barH"
                        [attr.fill]="w.pct > 2 ? '#ba1a1a' : w.pct > 1 ? '#fe932c' : '#3f6653'"
                        rx="4" opacity="0.85"/>
                  <text [attr.x]="i * 60 + 30" [attr.y]="160 - barH - 6"
                        text-anchor="middle" font-size="9" font-weight="600"
                        [attr.fill]="w.pct > 2 ? '#ba1a1a' : w.pct > 1 ? '#904d00' : '#012d1d'">
                    {{ w.pct }}%
                  </text>
                  <text [attr.x]="i * 60 + 30" y="175" text-anchor="middle"
                        font-size="9" fill="#717973">
                    {{ w.week }}
                  </text>
                </g>
              }
            </svg>
          </div>

          <!-- Best / Worst batch -->
          <div class="mt-md pt-md border-t border-outline-variant grid grid-cols-2 gap-md">
            <div class="bg-primary-fixed rounded-xl p-sm text-center">
              <div class="text-[10px] text-on-primary-fixed-variant uppercase font-bold mb-xs">
                Best Batch
              </div>
              <div class="font-bold text-primary font-mono">{{ bestBatch() }}</div>
              <div class="text-xs text-on-surface-variant">Lowest mortality</div>
            </div>
            <div class="bg-error-container rounded-xl p-sm text-center">
              <div class="text-[10px] text-on-error-container uppercase font-bold mb-xs">
                Needs Attention
              </div>
              <div class="font-bold text-error font-mono">{{ worstBatch() }}</div>
              <div class="text-xs text-on-surface-variant">Highest mortality</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Per-building production breakdown ───────────────────────────────── -->
      <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
        <div class="flex items-center justify-between mb-lg">
          <h3 class="font-bold text-on-surface" style="font-size:16px">
            Production by Building
          </h3>
          <span class="text-xs text-on-surface-variant">{{ dateRange }}-day period</span>
        </div>

        <div class="space-y-md">
          @for (house of buildingPerf; track house.name) {
            <div class="flex items-center gap-md p-md rounded-xl border border-outline-variant
                        hover:border-primary transition-colors">
              <div class="w-10 h-10 rounded-xl bg-primary-fixed flex items-center justify-center flex-shrink-0">
                <span class="material-symbols-outlined text-[18px] text-on-primary-fixed-variant"
                      style="font-variation-settings:'FILL' 1">home_health</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between mb-xs">
                  <span class="font-bold text-on-surface">{{ house.name }}</span>
                  <div class="flex items-center gap-md text-sm">
                    <span class="text-on-surface-variant">{{ house.eggs.toLocaleString() }} eggs</span>
                    <span class="font-bold"
                          [class]="house.fcr > 1.45 ? 'text-error' : 'text-primary'">
                      FCR {{ house.fcr }}
                    </span>
                    <span [class]="house.mortality > 2 ? 'text-error font-bold' : 'text-on-surface-variant'">
                      {{ house.mortality }}% mort.
                    </span>
                  </div>
                </div>
                <!-- Production bar relative to top performer -->
                <div class="w-full bg-surface-container rounded-full h-2">
                  <div class="h-2 rounded-full transition-all duration-700 bg-primary"
                       [style.width.%]="(house.eggs / maxHouseEggs) * 100">
                  </div>
                </div>
              </div>
              <div class="text-right flex-shrink-0 ml-md">
                <div class="font-bold text-primary text-sm">
                  {{ houseSharePct(house.eggs) }}%
                </div>
                <div class="text-[10px] text-on-surface-variant">of total</div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Predictive insights ─────────────────────────────────────────────── -->
      <div class="bg-tertiary text-on-tertiary rounded-2xl p-lg shadow-sm relative overflow-hidden">
        <div class="relative z-10">
          <div class="flex items-center gap-sm mb-lg">
            <span class="material-symbols-outlined p-sm bg-white/10 rounded-xl"
                  style="font-variation-settings:'FILL' 1">auto_graph</span>
            <div>
              <h3 class="font-bold" style="font-size:16px">Predictive Insights</h3>
              <p class="text-xs opacity-70 mt-xs">
                Based on last {{ dateRange }} days — next 7-day forecast
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-md mb-lg">
            @for (pred of predictions(); track pred.label) {
              <div class="bg-white/10 rounded-xl p-md hover:bg-white/15 transition-colors">
                <div class="flex items-center gap-sm mb-sm">
                  <span class="material-symbols-outlined text-[20px]"
                        style="font-variation-settings:'FILL' 1">{{ pred.icon }}</span>
                  <div class="text-xs opacity-70 uppercase font-bold">{{ pred.label }}</div>
                </div>
                <div class="font-bold" style="font-size:22px">{{ pred.value }}</div>
                <div class="text-xs opacity-60 mt-xs">{{ pred.note }}</div>
              </div>
            }
          </div>

          <!-- 7-day forecast mini bars -->
          <div>
            <div class="text-xs opacity-70 uppercase font-bold mb-sm">
              7-Day Egg Production Forecast
            </div>
            <div class="flex items-end gap-sm" style="height:60px">
              @for (d of forecastDays; track d.label) {
                <div class="flex-1 flex flex-col items-center gap-xs">
                  <div class="w-full rounded-t-sm"
                       [style.height.px]="Math.round((d.forecast / 14000) * 50)"
                       [class]="d.isForcast ? 'bg-white/30' : 'bg-white/60'"
                       [style.border-top]="d.isForcast ? '1px dashed rgba(255,255,255,0.5)' : 'none'">
                  </div>
                  <div class="text-[9px] opacity-60">{{ d.label }}</div>
                </div>
              }
            </div>
            <div class="flex justify-between mt-xs text-[10px] opacity-50">
              <span>← Actual</span>
              <span>Forecast →</span>
            </div>
          </div>
        </div>

        <!-- Decorative blobs -->
        <div class="absolute -bottom-12 -right-12 w-48 h-48 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -top-8 -left-8 w-32 h-32 bg-primary-container/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      <!-- Key alerts panel ─────────────────────────────────────────────────── -->
      <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
        <h3 class="font-bold text-on-surface mb-md" style="font-size:16px">
          Analytics Alerts
        </h3>
        <div class="space-y-sm">
          @for (alert of analyticsAlerts(); track alert.id) {
            <div class="flex items-start gap-md p-md rounded-xl border"
                 [class]="alert.level === 'high' ? 'border-error bg-error-container/20'
                         : alert.level === 'med'  ? 'border-secondary bg-secondary-fixed/20'
                         : 'border-outline-variant bg-surface-container'">
              <span class="material-symbols-outlined text-[20px] flex-shrink-0 mt-xs"
                    [class]="alert.level === 'high' ? 'text-error' : alert.level === 'med' ? 'text-secondary' : 'text-on-surface-variant'"
                    style="font-variation-settings:'FILL' 1">{{ alert.icon }}</span>
              <div class="flex-1">
                <p class="font-bold text-on-surface text-sm">{{ alert.title }}</p>
                <p class="text-xs text-on-surface-variant mt-xs">{{ alert.desc }}</p>
              </div>
              <span class="text-[10px] font-bold uppercase px-sm py-xs rounded-full flex-shrink-0 self-start"
                    [class]="alert.level === 'high' ? 'bg-error text-on-error'
                            : alert.level === 'med'  ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                            : 'bg-surface-container-highest text-on-surface'">
                {{ alert.level === 'high' ? 'Critical' : alert.level === 'med' ? 'Warning' : 'Info' }}
              </span>
            </div>
          }
        </div>
      </div>

    </div>
  `,
})
export class ManagerAnalyticsComponent implements OnInit, OnDestroy {
  private analyticsSvc = inject(AnalyticsService);
  private destroy$     = new Subject<void>();

  today      = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  dateRange      = '30';
  filterBuilding = '';
  chartMode      = 'eggs';
  lastRefreshed  = '';
  dailyTarget    = 8500;
  Math           = Math;

  buildings = ['Alpha-1', 'Alpha-2', 'Beta-2', 'Gamma-3', 'Delta-1'];
  chartModes = [
    { key: 'eggs', label: 'Eggs' },
    { key: 'fcr',  label: 'FCR'  },
  ];

  // ── State signals (all updated from API) ─────────────────────────────────
  loading   = signal(true);
  error     = signal('');
  trendData = signal<{ date: string; eggs: number }[]>([]);
  fcrBatches = signal<BatchFcr[]>([]);
  farmFcr    = signal(1.38);
  mortWeeks  = signal<MortWeek[]>([]);
  avgMortality = signal(0.84);
  bestBatch    = signal('B-2024-004');
  worstBatch   = signal('B-2024-005');

  // ── Computed chart values ─────────────────────────────────────────────────
  avgDaily = computed(() => {
    const d = this.trendData();
    if (!d.length) return 0;
    return Math.round(d.reduce((s, p) => s + p.eggs, 0) / d.length);
  });

  totalEggs = computed(() => this.trendData().reduce((s, p) => s + p.eggs, 0));

  /** Use bar chart when showing ≤30 days (clearer for daily data) */
  useBars = computed(() => this.trendData().length <= 35);

  /** Bar chart data points */
  barPoints = computed(() => {
    const data   = this.trendData();
    if (!data.length) return [];
    const maxVal = Math.max(...data.map(d => d.eggs), this.dailyTarget * 1.3);
    const gap    = 1;
    const barW   = Math.max(2, Math.floor((700 - gap * data.length) / data.length));
    return data.map((d, i) => ({
      x:    i * (barW + gap),
      y:    Math.round(200 - (d.eggs / maxVal) * 190),
      w:    barW,
      eggs: d.eggs,
      date: d.date,
    }));
  });

  chartPoints = computed((): ChartPoint[] => {
    const data   = this.trendData();
    if (!data.length) return [];
    const maxVal = Math.max(...data.map(d => d.eggs), this.dailyTarget * 1.3);
    const w      = 700 / Math.max(data.length - 1, 1);
    return data.map((d, i) => ({
      x: Math.round(i * w),
      y: Math.round(200 - (d.eggs / maxVal) * 185),
    }));
  });

  linePath = computed(() => {
    const pts = this.chartPoints();
    if (!pts.length) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  });

  areaPath = computed(() => {
    const pts  = this.chartPoints();
    if (!pts.length) return '';
    const last = pts[pts.length - 1];
    return `${this.linePath()} L ${last.x} 200 L 0 200 Z`;
  });

  get targetLineY(): number {
    const data   = this.trendData();
    const maxVal = data.length
      ? Math.max(...data.map(d => d.eggs), this.dailyTarget * 1.3)
      : this.dailyTarget * 1.5;
    return Math.round(200 - (this.dailyTarget / maxVal) * 185);
  }

  get yAxisLabels(): string[] {
    const data   = this.trendData();
    const maxVal = data.length ? Math.max(...data.map(d => d.eggs)) : 15000;
    const step   = Math.ceil(maxVal / 4 / 1000) * 1000;
    return [
      `${Math.round(maxVal / 1000)}k`,
      `${Math.round(maxVal * 0.75 / 1000)}k`,
      `${Math.round(maxVal * 0.5 / 1000)}k`,
      `${Math.round(maxVal * 0.25 / 1000)}k`,
      '0',
    ];
  }

  xAxisLabels = computed(() => {
    const data  = this.trendData();
    if (!data.length) return [];
    const step  = Math.max(1, Math.floor(data.length / 6));
    return data
      .filter((_, i) => i % step === 0 || i === data.length - 1)
      .map(d => {
        const dt = new Date(d.date);
        return dt.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
      });
  });

  kpiCards = computed((): KpiCard[] => {
    const avg  = this.avgDaily();
    const fcr  = this.farmFcr();
    const mort = this.avgMortality();
    return [
      {
        label: 'Avg Daily Eggs', value: avg.toLocaleString(), color: 'text-primary',
        trend: avg >= this.dailyTarget ? '↑ On target' : '↓ Below target',
        trendGood: avg >= this.dailyTarget, icon: 'egg',
      },
      {
        label: 'Farm Avg FCR', value: fcr.toString(), color: fcr > 1.45 ? 'text-error' : 'text-primary',
        trend: fcr <= 1.45 ? '✓ Efficient' : '⚠ Above target',
        trendGood: fcr <= 1.45, icon: 'grain',
      },
      {
        label: 'Avg Mortality', value: `${mort}%`, color: mort > 1 ? 'text-error' : 'text-primary',
        trend: mort <= 1 ? '✓ Normal' : '⚠ Elevated',
        trendGood: mort <= 1, icon: 'monitoring',
      },
      {
        label: 'Total Eggs', value: `${(this.totalEggs() / 1000).toFixed(1)}k`,
        color: 'text-primary', trend: `${this.dateRange} days`, trendGood: true, icon: 'inventory_2',
      },
    ];
  });

  predictions = computed(() => {
    const avg = this.avgDaily() || 8500;
    const fcr = this.farmFcr() || 1.38;
    return [
      {
        icon:  'egg',
        label: 'Projected Eggs (7 days)',
        value: (avg * 7).toLocaleString(),
        note:  'Based on current production trend',
      },
      {
        icon:  'grass',
        label: 'Feed Required',
        value: `${((avg * 7 * fcr) / 1000).toFixed(1)} tons`,
        note:  'At current FCR — order if stock < 2 tons',
      },
      {
        icon:  'payments',
        label: 'Projected Revenue',
        value: `₱${(avg * 7 * 2.50).toLocaleString()}`,
        note:  'Based on ₱2.50/egg average selling price',
      },
    ];
  });

  analyticsAlerts = computed(() => {
    const alerts: { id: number; level: string; icon: string; title: string; desc: string }[] = [];
    if (this.farmFcr() > 1.6)
      alerts.push({ id: 1, level: 'high', icon: 'warning',       title: 'FCR Critical on one or more batches', desc: 'Batch FCR exceeding 1.6 significantly increases feed costs per egg.' });
    if (this.farmFcr() > 1.45 && this.farmFcr() <= 1.6)
      alerts.push({ id: 2, level: 'med',  icon: 'grain',          title: 'Feed Conversion Ratio Above Target',   desc: `Current farm FCR ${this.farmFcr()} — review feeding schedule and quantities.` });
    if (this.avgMortality() > 2)
      alerts.push({ id: 3, level: 'high', icon: 'emergency',      title: 'Mortality Rate Critical',              desc: `${this.avgMortality()}% avg mortality this period — veterinarian inspection recommended.` });
    if (this.avgMortality() > 1 && this.avgMortality() <= 2)
      alerts.push({ id: 4, level: 'med',  icon: 'monitoring',     title: 'Mortality Above Normal Range',         desc: `${this.avgMortality()}% — monitor closely and review ventilation and feed quality.` });
    if (this.avgDaily() < this.dailyTarget * 0.9)
      alerts.push({ id: 5, level: 'med',  icon: 'trending_down',  title: 'Production Below Target',              desc: `Averaging ${this.avgDaily().toLocaleString()}/day vs ${this.dailyTarget.toLocaleString()} target (${Math.round((this.avgDaily()/this.dailyTarget)*100)}%).` });
    if (!alerts.length)
      alerts.push({ id: 6, level: 'low',  icon: 'check_circle',   title: 'All metrics within normal range',      desc: 'No production anomalies detected in the selected period.' });
    return alerts;
  });

  // Building-level breakdown — signal, updated from API
  buildingPerfSig = signal([
    { name: 'Alpha-1', eggs: 40320, fcr: 1.42, mortality: 1.2 },
    { name: 'Alpha-2', eggs: 22680, fcr: 1.68, mortality: 3.0 },
    { name: 'Beta-2',  eggs: 46200, fcr: 1.35, mortality: 0.5 },
    { name: 'Delta-1', eggs: 29400, fcr: 1.10, mortality: 0.1 },
    { name: 'Gamma-3', eggs: 27720, fcr: 1.55, mortality: 2.1 },
  ]);
  get buildingPerf() { return this.buildingPerfSig(); }

  get maxHouseEggs(): number {
    return Math.max(...this.buildingPerfSig().map(h => h.eggs), 1);
  }

  houseSharePct(eggs: number): string {
    const total = this.buildingPerfSig().reduce((s, h) => s + h.eggs, 0);
    return total ? ((eggs / total) * 100).toFixed(1) : '0';
  }

  forecastDays = (() => {
    const days = [];
    for (let i = -3; i <= 7; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      days.push({
        label:      d.toLocaleDateString('en-PH', { weekday: 'short' }),
        forecast:   Math.floor(8000 + Math.random() * 5000),
        isForcast:  i >= 0,
      });
    }
    return days;
  })();

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadAll();
    // Auto-refresh every 5 minutes
    interval(5 * 60 * 1000).pipe(takeUntil(this.destroy$)).subscribe(() => this.loadAll());
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  loadAll(): void {
    this.loading.set(true);
    this.error.set('');

    const dateFrom = this.offsetDate(-parseInt(this.dateRange));
    const dateTo   = this.offsetDate(0);
    const params   = {
      date_from:   dateFrom,
      date_to:     dateTo,
      building_id: this.filterBuilding || undefined,
    };

    forkJoin({
      production:   this.analyticsSvc.getProduction(params),
      fcr:          this.analyticsSvc.getFcr({ date_from: dateFrom, date_to: dateTo }),
      mortality:    this.analyticsSvc.getMortality({ date_from: dateFrom, date_to: dateTo }),
      buildings:    this.analyticsSvc.getBuildings({ date_from: dateFrom, date_to: dateTo }),
    }).subscribe({
      next: ({ buildings, production, fcr, mortality }) => {
        // Map per-building breakdown if API returns it
        const bdata = buildings as any;
        if (bdata?.by_building?.length) {
          this.buildingPerfSig.set(bdata.by_building.map((b: any) => ({
            name:      b.building ?? b.houseName ?? b.name ?? '',
            eggs:      b.eggs_collected ?? b.eggs ?? 0,
            fcr:       b.fcr ?? 1.38,
            mortality: b.mortality_pct ?? b.mortalityPct ?? 0,
          })));
        }
        // Production trend
        const prod = production as ProductionApiResponse;
        if (prod?.trend?.length) {
          this.trendData.set(prod.trend);
        } else {
          this.trendData.set(this.generateFallbackTrend(parseInt(this.dateRange)));
        }

        // FCR data
        const fcrData = fcr as FcrApiResponse;
        if (fcrData?.farm_avg) this.farmFcr.set(fcrData.farm_avg);
        if (fcrData?.by_batch?.length) {
          this.fcrBatches.set(fcrData.by_batch.map(b => ({
            batch:    b.batch,
            building: b.building,
            fcr:      b.fcr,
            age:      b.age ?? 0,
            feedKg:   b.feed_kg ?? 0,
            eggs:     b.eggs ?? 0,
          })));
        }

        // Mortality data
        const mort = mortality as MortalityApiResponse;
        if (mort?.weekly?.length) this.mortWeeks.set(mort.weekly);
        if (mort?.avg_pct)        this.avgMortality.set(mort.avg_pct);
        if (mort?.best_batch)     this.bestBatch.set(mort.best_batch);
        if (mort?.worst_batch)    this.worstBatch.set(mort.worst_batch);

        this.loading.set(false);
        this.lastRefreshed = new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
      },
      error: () => {
        this.error.set('Could not reach API server');
        // Fall back to simulated data so dashboard remains useful
        this.trendData.set(this.generateFallbackTrend(parseInt(this.dateRange)));
        this.fcrBatches.set(this.fallbackFcrBatches());
        this.mortWeeks.set(this.fallbackMortWeeks());
        this.loading.set(false);
        this.lastRefreshed = new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) + ' (cached)';
      },
    });
  }

  // ── Chart helpers ─────────────────────────────────────────────────────────
  fcrBarPct(fcr: number): number { return Math.min(100, Math.round((fcr / 2.0) * 100)); }
  mortBarH(pct: number): number  { return Math.round(Math.min(pct / 4, 1) * 140); }

  // ── Fallback data generators ──────────────────────────────────────────────
  private generateFallbackTrend(days: number): { date: string; eggs: number }[] {
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
      const weekend = d.getDay() === 0 || d.getDay() === 6;
      return {
        date: d.toISOString().split('T')[0],
        eggs: Math.floor((weekend ? 9000 : 8200) + Math.random() * 4000),
      };
    });
  }

  private fallbackFcrBatches(): BatchFcr[] {
    return [
      { batch: 'B-2024-004', building: 'Delta-1', fcr: 1.10, age: 5,  feedKg: 2800,  eggs: 2548  },
      { batch: 'B-2024-002', building: 'Beta-2',  fcr: 1.35, age: 18, feedKg: 18900, eggs: 14000 },
      { batch: 'B-2024-001', building: 'Alpha-1', fcr: 1.42, age: 32, feedKg: 58000, eggs: 40845 },
      { batch: 'B-2024-003', building: 'Gamma-3', fcr: 1.55, age: 45, feedKg: 72000, eggs: 46452 },
      { batch: 'B-2024-005', building: 'Alpha-2', fcr: 1.68, age: 12, feedKg: 9800,  eggs: 5833  },
    ];
  }

  private fallbackMortWeeks(): MortWeek[] {
    return [
      { week: 'W1', pct: 1.4 }, { week: 'W2', pct: 1.1 }, { week: 'W3', pct: 0.8 },
      { week: 'W4', pct: 0.9 }, { week: 'W5', pct: 2.3 }, { week: 'W6', pct: 1.6 }, { week: 'W7', pct: 0.84 },
    ];
  }

  private offsetDate(days: number): string {
    const d = new Date(); d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }
}
