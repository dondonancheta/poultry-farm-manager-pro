import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { DashboardKPIs, ActivityItem } from '../../core/models';
import { DashboardService } from '../../core/services/dashboard.service';

// ── Mock data (replace with real service calls) ────────────────────────────
const MOCK_KPIS: DashboardKPIs = {
  activeFlocks:      12,
  totalBirds:        24500,
  todayMortality:    8,
  feedRemainingTons: 4.2,
  vaccinationsToday: 3,
  todayRevenue:      0,
  monthlyRevenue:    124500,
  grossProfitPct:    75,
};

const MOCK_ACTIVITIES: ActivityItem[] = [
  { id: 1, type: 'vaccination', title: 'Batch 42 Vaccination Completed', subtitle: 'Gumboro Stage 2 • 15 minutes ago',      timeAgo: '15m' },
  { id: 2, type: 'alert',       title: 'Feed Stock Low in House 3',       subtitle: 'Inventory Alert • 2 hours ago',         timeAgo: '2h'  },
  { id: 3, type: 'feed',        title: 'New Feed Shipment Received',       subtitle: '10 Tons Pre-Starter • 5 hours ago',    timeAgo: '5h'  },
  { id: 4, type: 'mortality',   title: 'Mortality Spike — House Beta-2',  subtitle: 'Auto-alert • 8 hours ago',             timeAgo: '8h'  },
];

interface FeedHouse { name: string; pct: number; isOver: boolean; }
const FEED_HOUSES: FeedHouse[] = [
  { name: 'House 01 — Broilers', pct: 92,  isOver: false },
  { name: 'House 02 — Layers',   pct: 100, isOver: true  },
  { name: 'House 03 — Breeders', pct: 78,  isOver: false },
];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StatCardComponent],
  template: `
    <div class="p-lg max-w-container-max mx-auto w-full space-y-gutter pb-xl">

      <!-- Page header ──────────────────────────────────────────────────────── -->
      <div class="flex justify-between items-end">
        <div>
          <h1 class="text-headline-lg font-bold text-primary">Operational Overview</h1>
          <p class="text-on-surface-variant text-body-md">Real-time status of Poultry Houses and Batch Analytics</p>
        </div>

        <div class="flex gap-sm">
          <button
            routerLink="/feed/issuance/new"
            class="bg-surface-container-highest text-on-surface px-md py-sm rounded-lg font-bold
                   flex items-center gap-sm hover:bg-surface-container-high transition-all text-label-md"
          >
            <span class="material-symbols-outlined">inventory</span>
            Stock Out Feed
          </button>

          <button
            routerLink="/mortality/log"
            class="bg-error-container text-on-error-container px-md py-sm rounded-lg font-bold
                   flex items-center gap-sm hover:opacity-90 transition-all text-label-md"
          >
            <span class="material-symbols-outlined">monitoring</span>
            Log Mortality
          </button>
        </div>
      </div>

      <!-- KPI cards ────────────────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-gutter">
        <app-stat-card
          label="Active Flocks"
          [value]="kpis().activeFlocks"
          icon="groups"
          badge="+2 this month"
        />
        <app-stat-card
          label="Total Birds"
          [value]="totalBirdsDisplay"
          icon="agriculture"
          badge="Healthy"
          variant="warning"
        />
        <app-stat-card
          label="Today's Mortality"
          [value]="kpis().todayMortality"
          icon="analytics"
          badge="Low ↓"
        />
        <app-stat-card
          label="Feed Remaining"
          [value]="kpis().feedRemainingTons"
          icon="storage"
          unit="Tons"
          badge="Reorder soon"
          variant="error"
        />
        <app-stat-card
          label="Vaccinations"
          [value]="kpis().vaccinationsToday"
          icon="vaccines"
          unit="Today"
          badge="Action Required"
          variant="warning"
        />
      </div>

      <!-- Charts row ────────────────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-gutter">

        <!-- Mortality trend (SVG line chart) -->
        <div class="lg:col-span-2 bg-surface-container-lowest border border-outline-variant
                    rounded-xl shadow-sm p-lg overflow-hidden">
          <div class="flex justify-between items-center mb-lg">
            <h4 class="text-title-md font-semibold text-primary">Mortality Trend (Last 30 Days)</h4>
            <select class="bg-surface-container border-none rounded-lg text-sm py-1 pl-3 pr-8 focus:ring-primary">
              <option>Daily</option>
              <option>Weekly</option>
            </select>
          </div>

          <div class="h-64 w-full chart-grid rounded-lg relative overflow-hidden bg-surface-bright">
            <svg class="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="grad-mortality" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%"   style="stop-color:#a5d0b9;stop-opacity:0.4"/>
                  <stop offset="100%" style="stop-color:#a5d0b9;stop-opacity:0"/>
                </linearGradient>
              </defs>
              <path
                d="M0,80 Q50,40 100,60 T200,30 T300,45 T400,20 L400,100 L0,100 Z"
                fill="url(#grad-mortality)"
              />
              <path
                d="M0,80 Q50,40 100,60 T200,30 T300,45 T400,20"
                fill="none" stroke="#012d1d" stroke-width="2" vector-effect="non-scaling-stroke"
              />
            </svg>
          </div>

          <div class="mt-md flex justify-between text-on-surface-variant text-label-md">
            <span>Day 1</span><span>Day 10</span><span>Day 20</span><span>Today</span>
          </div>
        </div>

        <!-- Feed consumption per house -->
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-lg">
          <h4 class="text-title-md font-semibold text-primary mb-lg">Feed Consumption</h4>

          <div class="space-y-lg">
            @for (house of feedHouses; track house.name) {
              <div class="space-y-sm">
                <div class="flex justify-between text-sm">
                  <span class="font-semibold">{{ house.name }}</span>
                  <span [class.text-secondary]="house.isOver" class="text-on-surface-variant">
                    {{ house.pct }}% of Forecast
                  </span>
                </div>
                <div class="w-full bg-surface-container rounded-full h-3">
                  <div
                    class="h-3 rounded-full transition-all duration-500"
                    [class.bg-primary]="!house.isOver"
                    [class.bg-secondary-container]="house.isOver"
                    [style.width.%]="Math.min(house.pct, 100)"
                  ></div>
                </div>
              </div>
            }
          </div>

          <div class="mt-xl p-md bg-surface-container-low rounded-lg border border-outline-variant border-dashed">
            <p class="text-label-md text-on-surface-variant mb-xs">INSIGHT</p>
            <p class="text-sm text-on-surface-variant">
              House 02 consumption is above forecast due to localized heat stress.
              Cooling system check recommended.
            </p>
          </div>
        </div>
      </div>

      <!-- Secondary row ─────────────────────────────────────────────────────── -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-gutter">

        <!-- Activity feed -->
        <div class="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm p-lg">
          <div class="flex justify-between items-center mb-md">
            <h4 class="text-title-md font-semibold text-primary">Recent Activities</h4>
            <button class="text-primary text-sm font-bold hover:underline">View All</button>
          </div>

          <div class="space-y-md">
            @for (item of activities(); track item.id) {
              <div class="flex gap-md items-start p-sm hover:bg-surface-container-low rounded-lg transition-colors">
                <div class="p-2 rounded-full flex-shrink-0" [ngClass]="activityIconBg(item.type)">
                  <span
                    class="material-symbols-outlined text-sm"
                    [ngClass]="activityIconColor(item.type)"
                    style="font-variation-settings: 'FILL' 1"
                  >{{ activityIcon(item.type) }}</span>
                </div>
                <div>
                  <p class="text-sm font-semibold text-on-surface">{{ item.title }}</p>
                  <p class="text-xs text-on-surface-variant">{{ item.subtitle }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Profitability gauge -->
        <div class="bg-tertiary text-on-tertiary rounded-xl shadow-sm p-lg flex flex-col
                    justify-between relative overflow-hidden">
          <div class="relative z-10">
            <h4 class="text-title-md font-semibold mb-xs">Farm Profitability (YTD)</h4>
            <p class="text-on-tertiary-container text-sm">Aggregated performance across all houses</p>
          </div>

          <div class="flex items-center justify-center my-md relative z-10">
            <!-- Circular gauge -->
            <div class="relative flex items-center justify-center">
              <svg class="w-48 h-48 transform -rotate-90">
                <circle class="text-tertiary-container" cx="96" cy="96" r="88"
                        fill="transparent" stroke="currentColor" stroke-width="12"/>
                <circle class="text-secondary-container" cx="96" cy="96" r="88"
                        fill="transparent" stroke="currentColor" stroke-width="12"
                        stroke-dasharray="552.92"
                        [attr.stroke-dashoffset]="gaugeOffset"/>
              </svg>
              <div class="absolute text-center">
                <span class="text-4xl font-bold block">{{ kpis().grossProfitPct }}%</span>
                <span class="text-label-md uppercase opacity-60">Margin</span>
              </div>
            </div>

            <div class="ml-lg space-y-md">
              <div>
                <p class="text-on-tertiary-container text-xs text-label-md">REVENUE</p>
                <p class="text-xl font-bold">₱{{ kpis().monthlyRevenue | number }}</p>
              </div>
              <div>
                <p class="text-on-tertiary-container text-xs text-label-md">OPEX</p>
                <p class="text-xl font-bold">₱{{ opex() | number }}</p>
              </div>
            </div>
          </div>

          <button
            routerLink="/reports"
            class="w-full bg-white/10 hover:bg-white/20 py-sm rounded-lg font-bold
                   transition-all relative z-10 text-sm"
          >
            Download Financial Report
          </button>

          <!-- Decorative bg blob -->
          <div class="absolute -bottom-10 -right-10 w-48 h-48 bg-secondary-container/10 blur-3xl rounded-full pointer-events-none"></div>
        </div>
      </div>

    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private dashSvc = inject(DashboardService);

  // ── State ──────────────────────────────────────────────────────────────────
  kpis       = signal<DashboardKPIs>(MOCK_KPIS);
  activities = signal<ActivityItem[]>(MOCK_ACTIVITIES);
  loading    = signal(true);
  feedHouses = FEED_HOUSES;
  Math       = Math;

  get gaugeOffset(): number {
    const circumference = 2 * Math.PI * 88;
    return circumference * (1 - this.kpis().grossProfitPct / 100);
  }

  get totalBirdsDisplay(): string { return this.kpis().totalBirds.toLocaleString(); }

  opex = computed(() =>
    Math.round(this.kpis().monthlyRevenue * (1 - this.kpis().grossProfitPct / 100))
  );

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit() {
    this.dashSvc.getKPIs().subscribe({
      next: (kpis) => { this.kpis.set(kpis); this.loading.set(false); },
      error: ()    => this.loading.set(false), // falls back to mock data
    });
    this.dashSvc.getActivity().subscribe({
      next: (items) => this.activities.set(items),
      error: ()     => {}, // keep mock activities
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  activityIcon(type: ActivityItem['type']): string {
    const map: Record<string, string> = {
      vaccination: 'check_circle',
      alert:       'warning',
      feed:        'add_shopping_cart',
      mortality:   'monitoring',
      sale:        'point_of_sale',
    };
    return map[type] ?? 'info';
  }

  activityIconBg(type: ActivityItem['type']): string {
    const map: Record<string, string> = {
      vaccination: 'bg-primary-fixed',
      alert:       'bg-error-container',
      feed:        'bg-secondary-fixed',
      mortality:   'bg-error-container',
      sale:        'bg-primary-fixed',
    };
    return map[type] ?? 'bg-surface-container';
  }

  activityIconColor(type: ActivityItem['type']): string {
    const map: Record<string, string> = {
      vaccination: 'text-on-primary-fixed-variant',
      alert:       'text-on-error-container',
      feed:        'text-on-secondary-fixed-variant',
      mortality:   'text-on-error-container',
      sale:        'text-on-primary-fixed-variant',
    };
    return map[type] ?? 'text-on-surface';
  }
}
