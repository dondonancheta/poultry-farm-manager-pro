import { DataRefreshService } from '../../core/services/data-refresh.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EggCollectionService, EggSummary } from '../../core/services/egg-collection.service';

type VerifyStatus = 'pending' | 'verified' | 'flagged' | 'rejected';
type EggSize = 'small' | 'medium' | 'large' | 'extra_large' | 'jumbo';

interface CollectionRecord {
  id:             number;
  batchCode:      string;
  building:       string;
  collector:      string;
  collectionDate: string;
  collectionTime: string;
  totalCollected: number;
  goodEggs:       number;
  cracked:        number;
  dirty:          number;
  spoiled:        number;
  rejected:       number;
  sizes:          Record<EggSize, number>;
  verifiedStatus: VerifyStatus;
  verifiedBy?:    string;
  notes?:         string;
}

// Simulated data (replaced by API on ngOnInit)
const MOCK_RECORDS: CollectionRecord[] = Array.from({ length: 14 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - Math.floor(i / 2));
  const buildings = ['Alpha-1','Beta-2','Delta-1','Alpha-2'];
  const batches   = ['B-2024-001','B-2024-002','B-2024-004','B-2024-005'];
  const collectors= ['Juan dela Cruz','Pedro Reyes','Carlos Bautista'];
  const b = i % 4;
  const total = Math.floor(900 + Math.random() * 600);
  const cracked = Math.floor(Math.random() * 15);
  return {
    id: i + 1,
    batchCode:      batches[b],
    building:       buildings[b],
    collector:      collectors[i % 3],
    collectionDate: d.toISOString().split('T')[0],
    collectionTime: i % 2 === 0 ? '06:15' : '15:00',
    totalCollected: total,
    goodEggs:       total - cracked,
    cracked,
    dirty:    Math.floor(Math.random() * 5),
    spoiled:  0,
    rejected: 0,
    sizes: { small: 90, medium: Math.floor(total * 0.25), large: Math.floor(total * 0.6), extra_large: 40, jumbo: 10 },
    verifiedStatus: i < 6 ? 'verified' : i < 10 ? 'pending' : 'flagged',
    verifiedBy: i < 6 ? 'Maria Santos' : undefined,
    notes: undefined,
  };
});

@Component({
  selector: 'app-egg-production',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-lg max-w-6xl mx-auto pb-xl">

      <!-- Header -->
      <div class="flex items-center justify-between mb-lg">
        <div>
          <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">Egg Production</h1>
          <p class="text-body-md text-on-surface-variant">{{ today }}</p>
        </div>
        <div class="flex gap-sm">
          <a routerLink="/eggs/collect"
             class="flex items-center gap-sm bg-primary text-on-primary px-lg py-sm
                    rounded-lg text-label-md font-bold hover:opacity-90 active:scale-95 transition-all">
            <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">add_circle</span>
            Record Collection
          </a>
          <a routerLink="/eggs/inventory"
             class="flex items-center gap-sm border border-outline text-on-surface px-lg py-sm
                    rounded-lg text-label-md hover:bg-surface-container transition-all">
            <span class="material-symbols-outlined text-[18px]">inventory_2</span>
            Inventory
          </a>
        </div>
      </div>

      <!-- Summary KPI strip -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-md mb-lg">
        @for (kpi of summaryKpis(); track kpi.label) {
          <div class="bg-white border border-outline-variant rounded-xl p-md text-center">
            <div class="font-bold" [class]="kpi.color" style="font-size:22px">{{ kpi.value }}</div>
            <div class="text-label-md text-on-surface-variant uppercase tracking-wide mt-xs">{{ kpi.label }}</div>
          </div>
        }
      </div>

      <!-- 7-day production chart -->
      <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm mb-lg">
        <div class="flex items-center justify-between mb-md">
          <h3 class="font-bold text-on-surface" style="font-size:16px">7-Day Production vs Target</h3>
          <span class="text-xs text-on-surface-variant bg-surface-container px-sm py-xs rounded-lg">
            Target: {{ dailyTarget.toLocaleString() }} / day
          </span>
        </div>

        <div class="relative" style="height:160px">
          <svg class="w-full h-full" viewBox="0 0 700 140" preserveAspectRatio="none">
            <!-- Grid lines -->
            @for (y of [0,35,70,105,140]; track y) {
              <line [attr.y1]="y" [attr.y2]="y" x1="0" x2="700"
                    stroke="#c1c8c2" stroke-width="0.5" opacity="0.5"/>
            }
            <!-- Target line -->
            <line x1="0" [attr.y1]="targetY" x2="700" [attr.y2]="targetY"
                  stroke="#fe932c" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.8"/>
            <!-- Bars -->
            @for (d of chartDays; track d.label; let i = $index) {
              <rect [attr.x]="i * 100 + 10" [attr.y]="140 - chartBarH(d.total)"
                    width="80" [attr.height]="chartBarH(d.total)"
                    [attr.fill]="d.total >= dailyTarget ? '#3f6653' : '#fe932c'"
                    rx="4" opacity="0.85"/>
            }
          </svg>
        </div>

        <div class="flex justify-around mt-xs">
          @for (d of chartDays; track d.label) {
            <div class="text-center">
              <div class="text-[10px] text-on-surface-variant font-bold">{{ d.label }}</div>
              <div class="text-[10px] font-bold mt-xs"
                   [class]="d.total >= dailyTarget ? 'text-primary' : 'text-secondary'">
                {{ (d.total / 1000).toFixed(1) }}k
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Filters & search -->
      <div class="bg-white border border-outline-variant rounded-xl p-md flex flex-wrap gap-md items-center mb-md shadow-sm">
        <div class="relative flex-1 min-w-48">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input type="text" [(ngModel)]="search" placeholder="Search batch, building or collector..."
                 class="w-full pl-10 pr-md py-sm border border-outline-variant rounded-lg text-body-md
                        focus:outline-none focus:ring-2 focus:ring-primary/20"/>
        </div>
        <input type="date" [(ngModel)]="filterDate"
               class="border border-outline-variant rounded-lg px-md py-sm text-body-md
                      focus:outline-none focus:ring-2 focus:ring-primary/20"/>
        <select [(ngModel)]="filterBuilding"
                class="border border-outline-variant rounded-lg px-md py-sm text-body-md
                       focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">All buildings</option>
          @for (b of buildings; track b) { <option>{{ b }}</option> }
        </select>
        <div class="flex gap-xs">
          @for (tab of statusTabs; track tab.key) {
            <button (click)="filterStatus = tab.key"
                    class="px-md py-xs rounded-lg text-label-md font-bold transition-all"
                    [class]="filterStatus === tab.key
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'">
              {{ tab.label }}
              <span class="ml-xs text-[10px] opacity-70">({{ statusCount(tab.key) }})</span>
            </button>
          }
        </div>
        <button (click)="clearFilters()"
                class="text-label-md text-on-surface-variant hover:text-error flex items-center gap-xs">
          <span class="material-symbols-outlined text-[16px]">filter_list_off</span>Clear
        </button>
      </div>

      <!-- Records table -->
      <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
        <div class="flex items-center justify-between px-lg py-md border-b border-outline-variant bg-surface-container-low">
          <h3 class="font-bold text-on-surface" style="font-size:14px">
            Collection Records
            <span class="text-on-surface-variant font-normal ml-sm">({{ filtered().length }} shown)</span>
          </h3>
          @if (pendingCount() > 0) {
            <button (click)="verifyAll()"
                    class="flex items-center gap-xs bg-primary text-on-primary px-md py-xs
                           rounded-lg text-label-md font-bold hover:opacity-90 transition-all">
              <span class="material-symbols-outlined text-[16px]" style="font-variation-settings:'FILL' 1">task_alt</span>
              Verify All Pending ({{ pendingCount() }})
            </button>
          }
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead class="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider">Date / Time</th>
                <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider">Batch & Building</th>
                <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider">Collector</th>
                <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider text-right">Total</th>
                <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider text-right">Good</th>
                <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider text-center">Defects</th>
                <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider text-center">Status</th>
                <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              @for (rec of filtered(); track rec.id) {
                <tr class="hover:bg-surface-container-lowest transition-colors cursor-pointer"
                    (click)="selectedRecord = selectedRecord?.id === rec.id ? null : rec">
                  <td class="px-md py-md">
                    <div class="font-semibold text-on-surface text-sm">{{ rec.collectionDate }}</div>
                    <div class="text-xs text-on-surface-variant">{{ rec.collectionTime }}</div>
                  </td>
                  <td class="px-md py-md">
                    <div class="font-bold text-primary text-sm font-mono">{{ rec.batchCode }}</div>
                    <div class="text-xs text-on-surface-variant">{{ rec.building }}</div>
                  </td>
                  <td class="px-md py-md text-sm text-on-surface">{{ rec.collector }}</td>
                  <td class="px-md py-md text-right">
                    <span class="font-bold text-on-surface">{{ rec.totalCollected | number }}</span>
                  </td>
                  <td class="px-md py-md text-right">
                    <span class="font-bold text-primary">{{ rec.goodEggs | number }}</span>
                  </td>
                  <td class="px-md py-md text-center">
                    @if (rec.cracked + rec.dirty + rec.spoiled + rec.rejected > 0) {
                      <span class="text-error font-bold text-sm">
                        {{ rec.cracked + rec.dirty + rec.spoiled + rec.rejected }}
                      </span>
                    } @else {
                      <span class="text-on-surface-variant text-sm">—</span>
                    }
                  </td>
                  <td class="px-md py-md text-center">
                    <span class="px-sm py-xs rounded-full text-[10px] font-bold uppercase"
                          [class]="statusChip(rec.verifiedStatus)">
                      {{ rec.verifiedStatus }}
                    </span>
                    @if (rec.verifiedBy) {
                      <div class="text-[10px] text-on-surface-variant mt-xs">{{ rec.verifiedBy }}</div>
                    }
                  </td>
                  <td class="px-md py-md">
                    @if (rec.verifiedStatus === 'pending') {
                      <div class="flex gap-xs justify-end">
                        <button (click)="$event.stopPropagation(); verify(rec)"
                                class="px-sm py-xs bg-primary-fixed text-on-primary-fixed-variant rounded-lg
                                       text-[10px] font-bold hover:bg-primary hover:text-on-primary transition-all">
                          Verify
                        </button>
                        <button (click)="$event.stopPropagation(); flag(rec)"
                                class="px-sm py-xs border border-secondary text-secondary rounded-lg
                                       text-[10px] hover:bg-secondary-fixed transition-all">
                          Flag
                        </button>
                      </div>
                    }
                  </td>
                </tr>

                <!-- Expanded detail row -->
                @if (selectedRecord?.id === rec.id) {
                  <tr class="bg-primary-fixed/30">
                    <td colspan="8" class="px-lg py-md">
                      <div class="grid grid-cols-2 md:grid-cols-5 gap-md">
                        @for (size of eggSizeKeys; track size) {
                          <div class="text-center">
                            <div class="text-xs text-on-surface-variant uppercase font-bold">{{ sizeLabel(size) }}</div>
                            <div class="font-bold text-primary mt-xs">{{ rec.sizes[size] | number }}</div>
                          </div>
                        }
                      </div>
                      @if (rec.notes) {
                        <p class="text-xs text-on-surface-variant mt-md">Notes: {{ rec.notes }}</p>
                      }
                    </td>
                  </tr>
                }
              }

              @empty {
                <tr>
                  <td colspan="8" class="px-lg py-xl text-center text-on-surface-variant">
                    <span class="material-symbols-outlined text-4xl block mb-sm opacity-30">egg</span>
                    No records match your filters.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `,
})
export class EggProductionComponent implements OnInit {
  private refreshSvc = inject(DataRefreshService);
  private destroy$   = new Subject<void>();
  private eggSvc = inject(EggCollectionService);

  today = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  buildings   = ['Alpha-1', 'Alpha-2', 'Beta-2', 'Gamma-3', 'Delta-1'];
  dailyTarget = 8500;
  eggSizeKeys: EggSize[] = ['small', 'medium', 'large', 'extra_large', 'jumbo'];

  records         = signal<CollectionRecord[]>([]);
  summary         = signal<EggSummary | null>(null);
  search          = '';
  filterDate      = '';
  filterBuilding  = '';
  filterStatus    = 'all';
  selectedRecord: CollectionRecord | null = null;

  statusTabs = [
    { key: 'all',      label: 'All'     },
    { key: 'pending',  label: 'Pending' },
    { key: 'verified', label: 'Verified'},
    { key: 'flagged',  label: 'Flagged' },
  ];

  ngOnInit(): void {
    this.loadData();
    // Re-fetch when another component saves a new record
    this.refreshSvc.refresh$.pipe(takeUntil(this.destroy$)).subscribe(event => {
      if (event === 'egg-collections' || event === 'all') {
        this.loadData();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    // Load collection records from API
    this.eggSvc.getAll({ page: 1 }).subscribe({
      next: (res) => this.records.set((res.data as any[]).map(r => ({
        ...r,
        collector:      typeof r.collector === 'object' ? (r.collector?.name ?? '—') : (r.collector ?? '—'),
        batchCode:      r.batch_code ?? r.flock_batch?.batch_code ?? '—',
        buildingName:   r.building?.name ?? '—',
        collectionDate: r.collection_date,
        collectionTime: r.collection_time,
        totalCollected: r.total_collected ?? 0,
        goodEggs:       r.good_eggs ?? 0,
        defects:        (r.cracked ?? 0) + (r.dirty ?? 0) + (r.spoiled ?? 0) + (r.rejected ?? 0),
        verifiedStatus: r.verified_status ?? 'pending',
      }))),
      error: ()   => this.records.set(MOCK_RECORDS),
    });

    // Load summary
    const today = new Date().toISOString().split('T')[0];
    const from  = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    this.eggSvc.getSummary({ date_from: from, date_to: today }).subscribe({
      next: (s) => this.summary.set(s),
      error: ()  => {},
    });
  }

  summaryKpis = computed(() => {
    const s   = this.summary();
    const all = this.records();
    const today = new Date().toISOString().split('T')[0];
    const todayRecs = all.filter(r => r.collectionDate === today);
    const todayTotal = todayRecs.reduce((sum, r) => sum + r.totalCollected, 0) || s?.total_collected || 12720;
    const totalDefects = all.reduce((sum, r) => sum + r.cracked + r.dirty + r.spoiled + r.rejected, 0);
    const totalGood    = all.reduce((sum, r) => sum + r.goodEggs, 0);
    const total        = all.reduce((sum, r) => sum + r.totalCollected, 0) || 1;
    return [
      { label: 'Today',       value: todayTotal.toLocaleString(),                          color: 'text-primary'   },
      { label: 'Good Eggs',   value: (totalGood || todayTotal - 130).toLocaleString(),    color: 'text-primary'   },
      { label: 'Defects',     value: (totalDefects || 130).toLocaleString(),               color: 'text-error'     },
      { label: 'Spoilage %',  value: ((totalDefects / total) * 100).toFixed(1) + '%',     color: 'text-secondary' },
      { label: 'Pending',     value: this.pendingCount().toString(),                        color: 'text-secondary' },
    ];
  });

  chartDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    return { label: d.toLocaleDateString('en-PH', { weekday: 'short' }), total: Math.floor(7800 + Math.random() * 5000) };
  });

  get targetY(): number { return 140 - this.chartBarH(this.dailyTarget); }
  chartBarH(total: number): number { return Math.round(Math.min(total / 15000, 1) * 130); }

  filtered = computed(() => {
    const q = this.search.toLowerCase();
    return this.records().filter(r => {
      if (this.filterStatus !== 'all' && r.verifiedStatus !== this.filterStatus) return false;
      if (this.filterDate    && r.collectionDate !== this.filterDate) return false;
      if (this.filterBuilding && r.building !== this.filterBuilding) return false;
      if (q && !r.batchCode.toLowerCase().includes(q) &&
               !r.building.toLowerCase().includes(q) &&
               !(r.collector?.toString() ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  });

  pendingCount = computed(() => this.records().filter(r => r.verifiedStatus === 'pending').length);

  statusCount(status: string): number {
    if (status === 'all') return this.records().length;
    return this.records().filter(r => r.verifiedStatus === status).length;
  }

  verify(rec: CollectionRecord): void {
    this.records.update(list => list.map(r => r.id === rec.id
      ? { ...r, verifiedStatus: 'verified' as VerifyStatus, verifiedBy: 'Maria Santos' }
      : r
    ));
  }

  verifyAll(): void {
    this.records.update(list => list.map(r =>
      r.verifiedStatus === 'pending'
        ? { ...r, verifiedStatus: 'verified' as VerifyStatus, verifiedBy: 'Maria Santos' }
        : r
    ));
  }

  flag(rec: CollectionRecord): void {
    this.records.update(list => list.map(r =>
      r.id === rec.id ? { ...r, verifiedStatus: 'flagged' as VerifyStatus } : r
    ));
  }

  clearFilters(): void {
    this.search = ''; this.filterDate = ''; this.filterBuilding = ''; this.filterStatus = 'all';
  }

  sizeLabel(key: EggSize): string {
    return { small:'Small', medium:'Medium', large:'Large', extra_large:'XL', jumbo:'Jumbo' }[key];
  }

  statusChip(status: VerifyStatus): string {
    const map: Record<VerifyStatus, string> = {
      pending:  'bg-secondary-fixed text-on-secondary-fixed-variant',
      verified: 'bg-primary-fixed text-on-primary-fixed-variant',
      flagged:  'bg-secondary-container text-on-secondary-container',
      rejected: 'bg-error-container text-on-error-container',
    };
    return map[status];
  }
}
