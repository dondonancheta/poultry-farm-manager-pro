import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FlockBatch, BatchStatus } from '../../core/models';
import { FlockBatchService } from '../../core/services/flock-batch.service';

const MOCK_BATCHES: any[] = [
  { id:1, batchCode:'B-2024-001', houseName:'Alpha-1', breed:'Cobb 500',  ageDays:32, population:12450, fcr:1.42, mortalityPct:1.2, status:'Active',    arrivalDate:'2024-01-10', sourceFarm:'GreenValley' },
  { id:2, batchCode:'B-2024-002', houseName:'Beta-2',  breed:'Ross 308',  ageDays:18, population:15000, fcr:1.35, mortalityPct:0.5, status:'Active',    arrivalDate:'2024-01-24', sourceFarm:'SunFarm'     },
  { id:3, batchCode:'B-2024-003', houseName:'Gamma-3', breed:'Cobb 500',  ageDays:45, population:0,     fcr:1.60, mortalityPct:2.1, status:'Harvested', arrivalDate:'2023-12-28', sourceFarm:'GreenValley' },
  { id:4, batchCode:'B-2024-004', houseName:'Delta-1', breed:'Hubbard',   ageDays:5,  population:10200, fcr:1.10, mortalityPct:0.1, status:'Active',    arrivalDate:'2024-02-06', sourceFarm:'PrimeBirds'  },
  { id:5, batchCode:'B-2024-005', houseName:'Alpha-2', breed:'Ross 308',  ageDays:12, population:14850, fcr:1.28, mortalityPct:0.3, status:'Active',    arrivalDate:'2024-01-30', sourceFarm:'SunFarm'     },
];

type FilterStatus = 'All' | 'Active' | 'Harvested' | 'Quarantined';

@Component({
  selector: 'app-flock-management',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
<div class="p-lg max-w-6xl mx-auto pb-xl">

  <!-- Header -->
  <div class="flex items-center justify-between mb-lg">
    <div>
      <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">Flock Batch Management</h1>
      <p class="text-body-md text-on-surface-variant">
        {{ today }}
        @if (loading()) {
          <span class="inline-flex items-center gap-xs ml-sm">
            <span class="material-symbols-outlined text-[14px] animate-spin">refresh</span>Refreshing...
          </span>
        }
      </p>
    </div>
    <div class="flex gap-sm">
      <button (click)="refresh()"
              class="flex items-center gap-sm border border-outline text-on-surface px-md py-sm rounded-lg text-label-md hover:bg-surface-container transition-all">
        <span class="material-symbols-outlined text-[18px]">refresh</span>
      </button>
      <a routerLink="/flocks/new"
         class="flex items-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-lg text-label-md font-bold hover:opacity-90 transition-all">
        <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">add</span>
        Register Batch
      </a>
    </div>
  </div>

  <!-- Summary KPIs -->
  <div class="grid grid-cols-2 md:grid-cols-5 gap-md mb-lg">
    @for (k of kpis(); track k.label) {
      <div class="bg-white border border-outline-variant rounded-xl p-md text-center">
        <div class="font-bold" [class]="k.color" style="font-size:20px">{{ k.value }}</div>
        <div class="text-label-md text-on-surface-variant uppercase tracking-wide mt-xs">{{ k.label }}</div>
      </div>
    }
  </div>

  <!-- Filters -->
  <div class="bg-white border border-outline-variant rounded-xl p-md flex flex-wrap gap-md items-center mb-md shadow-sm">
    <div class="relative flex-1 min-w-40">
      <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
      <input [(ngModel)]="search" placeholder="Search batch, house, breed..."
             class="w-full pl-10 pr-md py-sm border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
    </div>
    <select [(ngModel)]="filterBuilding"
            class="border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
      <option value="">All buildings</option>
      @for (b of buildings; track b) { <option>{{ b }}</option> }
    </select>
    <div class="flex gap-xs">
      @for (s of statusFilters; track s) {
        <button (click)="filterStatus = s"
                class="px-md py-xs rounded-lg text-label-md font-bold transition-all"
                [class]="filterStatus === s
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'">
          {{ s }}
        </button>
      }
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-gutter">

    <!-- Batch list (2/3) -->
    <div class="lg:col-span-2 space-y-sm">
      @for (batch of filtered(); track batch.id) {
        <div class="bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer"
             [class]="selected()?.id === batch.id
               ? 'border-primary ring-2 ring-primary/20'
               : getBorderClass(batch.status)"
             (click)="selectBatch(batch)">
          <div class="p-lg">
            <div class="flex items-start gap-md mb-md">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                   [class]="statusIconBg(batch.status)">
                <span class="material-symbols-outlined text-[22px]" style="font-variation-settings:'FILL' 1">
                  {{ batch.status === 'Active' ? 'groups' : batch.status === 'Harvested' ? 'check_circle' : 'warning' }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-sm">
                  <div>
                    <p class="font-bold text-primary font-mono" style="font-size:18px">{{ batch.batchCode }}</p>
                    <p class="text-sm text-on-surface-variant mt-xs">{{ batch.houseName }} &middot; {{ batch.breed }}</p>
                  </div>
                  <span class="px-sm py-xs rounded-full text-[10px] font-bold uppercase flex-shrink-0"
                        [class]="statusBadge(batch.status)">{{ batch.status }}</span>
                </div>
              </div>
            </div>

            <!-- Stats grid -->
            <div class="grid grid-cols-4 gap-sm text-center mb-md">
              <div class="bg-surface-container rounded-lg p-sm">
                <div class="font-bold text-primary text-sm">{{ batch.ageDays ?? 0 }}</div>
                <div class="text-[10px] text-on-surface-variant uppercase">Days</div>
              </div>
              <div class="bg-surface-container rounded-lg p-sm">
                <div class="font-bold text-sm" [class]="populationColor(batch.status)">
                  {{ batch.population?.toLocaleString() ?? '0' }}
                </div>
                <div class="text-[10px] text-on-surface-variant uppercase">Birds</div>
              </div>
              <div class="bg-surface-container rounded-lg p-sm">
                <div class="font-bold text-sm"
                     [class]="(batch.fcr ?? 0) > 1.45 ? 'text-error' : 'text-primary'">
                  {{ batch.fcr ?? '-' }}
                </div>
                <div class="text-[10px] text-on-surface-variant uppercase">FCR</div>
              </div>
              <div class="bg-surface-container rounded-lg p-sm">
                <div class="font-bold text-sm"
                     [class]="(batch.mortalityPct ?? 0) > 2 ? 'text-error' : 'text-on-surface'">
                  {{ batch.mortalityPct ?? 0 }}%
                </div>
                <div class="text-[10px] text-on-surface-variant uppercase">Mortality</div>
              </div>
            </div>

            <!-- Occupancy bar -->
            @if (batch.population && batch.status === 'Active') {
              <div class="mb-md">
                <div class="flex justify-between text-xs text-on-surface-variant mb-xs">
                  <span>Population</span>
                  <span>{{ occupancyPct(batch.population) }}% of capacity</span>
                </div>
                <div class="w-full bg-surface-container rounded-full h-2">
                  <div class="h-2 rounded-full bg-primary transition-all" [style.width.%]="occupancyPct(batch.population)"></div>
                </div>
              </div>
            }

            <div class="flex gap-sm pt-sm border-t border-outline-variant">
              <a [routerLink]="'/flocks/' + batch.id"
                 class="flex-1 py-xs text-center border border-outline text-on-surface rounded-lg text-label-md hover:bg-surface-container transition-all text-sm"
                 (click)="$event.stopPropagation()">
                View Detail
              </a>
              <a routerLink="/eggs/collect"
                 class="flex-1 py-xs text-center bg-primary-fixed text-on-primary-fixed-variant rounded-lg text-label-md hover:bg-primary hover:text-on-primary transition-all text-sm"
                 (click)="$event.stopPropagation()">
                Log Eggs
              </a>
              @if (batch.status === 'Active') {
                <button (click)="$event.stopPropagation(); openStatusChange(batch)"
                        class="px-md py-xs border border-outline text-on-surface-variant rounded-lg text-label-md hover:bg-surface-container transition-all text-sm">
                  Change Status
                </button>
              }
            </div>
          </div>
        </div>
      }

      @if (filtered().length === 0) {
        <div class="bg-white border border-outline-variant rounded-2xl p-xl text-center text-on-surface-variant">
          <span class="material-symbols-outlined text-5xl block mb-md opacity-30">groups</span>
          No batches match your filters.
        </div>
      }
    </div>

    <!-- Detail sidebar (1/3) -->
    <div class="lg:col-span-1">
      @if (selected(); as batch) {
        <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm sticky top-lg">
          <div class="bg-primary p-lg text-on-primary relative overflow-hidden">
            <div class="relative z-10">
              <p class="text-xs opacity-70 uppercase font-bold tracking-widest mb-xs">Selected Batch</p>
              <p class="font-bold font-mono" style="font-size:22px">{{ batch.batchCode }}</p>
              <p class="text-sm opacity-80 mt-xs">{{ batch.houseName }} &middot; {{ batch.breed }}</p>
              <span class="mt-sm px-sm py-xs rounded-full text-[10px] font-bold uppercase inline-block"
                    [class]="statusBadge(batch.status)">{{ batch.status }}</span>
            </div>
            <div class="absolute -top-4 -right-4 w-24 h-24 bg-primary-container/20 rounded-full blur-2xl"></div>
          </div>

          <div class="p-md">
            <div class="space-y-xs mb-md">
              @for (row of batchInfoRows(batch); track row.label) {
                <div class="flex justify-between py-xs border-b border-outline-variant last:border-0 text-sm">
                  <span class="text-on-surface-variant">{{ row.label }}</span>
                  <span class="font-semibold text-on-surface">{{ row.value }}</span>
                </div>
              }
            </div>

            <!-- FCR bar -->
            <div class="space-y-sm mb-md">
              <div>
                <div class="flex justify-between text-xs mb-xs">
                  <span class="text-on-surface-variant">FCR Performance</span>
                  <span class="font-bold"
                        [class]="(batch.fcr ?? 0) > 1.45 ? 'text-error' : 'text-primary'">
                    {{ batch.fcr ?? '-' }}
                  </span>
                </div>
                <div class="w-full bg-surface-container rounded-full h-2">
                  <div class="h-2 rounded-full"
                       [class]="(batch.fcr ?? 0) > 1.45 ? 'bg-error' : 'bg-primary'"
                       [style.width.%]="Math.min((batch.fcr ?? 0) / 2 * 100, 100)"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-xs mb-xs">
                  <span class="text-on-surface-variant">Mortality Rate</span>
                  <span class="font-bold"
                        [class]="(batch.mortalityPct ?? 0) > 2 ? 'text-error' : 'text-primary'">
                    {{ batch.mortalityPct ?? 0 }}%
                  </span>
                </div>
                <div class="w-full bg-surface-container rounded-full h-2">
                  <div class="h-2 rounded-full"
                       [class]="(batch.mortalityPct ?? 0) > 2 ? 'bg-error' : 'bg-primary'"
                       [style.width.%]="Math.min((batch.mortalityPct ?? 0) / 5 * 100, 100)"></div>
                </div>
              </div>
            </div>

            <div class="space-y-xs">
              <a [routerLink]="'/flocks/' + batch.id"
                 class="w-full py-sm text-center bg-primary text-on-primary rounded-xl text-label-md font-bold hover:opacity-90 transition-all block">
                Full Batch Detail
              </a>
              <a routerLink="/mortality/log"
                 class="w-full py-sm text-center border border-outline text-on-surface rounded-xl text-label-md hover:bg-surface-container transition-all block">
                Log Mortality
              </a>
              <a routerLink="/health"
                 class="w-full py-sm text-center border border-outline text-on-surface rounded-xl text-label-md hover:bg-surface-container transition-all block">
                Health Records
              </a>
            </div>
          </div>
        </div>
      } @else {
        <div class="bg-white border border-outline-variant rounded-2xl p-xl text-center text-on-surface-variant">
          <span class="material-symbols-outlined text-4xl block mb-md opacity-30">touch_app</span>
          <p class="font-bold text-on-surface text-sm">Select a batch</p>
          <p class="text-xs mt-xs">Click any batch card to see its details</p>
        </div>
      }
    </div>
  </div>

  <!-- Status change modal -->
  @if (showStatusModal && statusTarget) {
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-lg">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div class="px-xl py-lg border-b border-outline-variant flex items-center justify-between">
          <h3 class="font-bold text-on-surface" style="font-size:18px">Change Batch Status</h3>
          <button (click)="showStatusModal=false" class="p-xs hover:bg-surface-container rounded-lg">
            <span class="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div class="p-xl space-y-md">
          <div class="bg-primary-fixed rounded-xl p-md">
            <p class="font-bold text-on-surface">{{ statusTarget.batchCode }}</p>
            <p class="text-xs text-on-surface-variant mt-xs">{{ statusTarget.houseName }} &middot; Current: {{ statusTarget.status }}</p>
          </div>
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">New Status</label>
            <div class="space-y-sm">
              @for (s of ['Active','Quarantined','Harvested']; track s) {
                <button (click)="newStatus = $any(s)"
                        class="w-full text-left p-md rounded-xl border-2 transition-all"
                        [class]="newStatus === s ? 'border-primary bg-primary-fixed' : 'border-outline-variant hover:border-outline'">
                  <div class="flex items-center gap-sm">
                    <span class="material-symbols-outlined text-[18px]"
                          [class]="s==='Active' ? 'text-primary' : s==='Quarantined' ? 'text-error' : 'text-on-surface-variant'"
                          style="font-variation-settings:'FILL' 1">
                      {{ s === 'Active' ? 'groups' : s === 'Quarantined' ? 'warning' : 'check_circle' }}
                    </span>
                    <div>
                      <p class="font-bold text-on-surface text-sm">{{ s }}</p>
                      <p class="text-xs text-on-surface-variant">
                        {{ s === 'Active' ? 'Normal operations resume'
                         : s === 'Quarantined' ? 'Isolate batch - alert supervisor'
                         : 'Batch complete - remove from active list' }}
                      </p>
                    </div>
                  </div>
                </button>
              }
            </div>
          </div>
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">Reason / Notes</label>
            <textarea [(ngModel)]="statusNote" rows="2" placeholder="Describe reason for status change..."
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none">
            </textarea>
          </div>
          <div class="flex gap-md pt-md border-t border-outline-variant">
            <button (click)="showStatusModal=false"
                    class="flex-1 py-sm border border-outline rounded-lg text-label-md text-on-surface hover:bg-surface-container">Cancel</button>
            <button (click)="confirmStatusChange()"
                    class="flex-1 py-sm bg-primary text-on-primary rounded-lg text-label-md font-bold hover:opacity-90">
              Confirm Change
            </button>
          </div>
        </div>
      </div>
    </div>
  }

  <!-- Toast -->
  @if (toast()) {
    <div class="fixed bottom-lg right-lg bg-on-surface text-inverse-on-surface px-lg py-md rounded-xl shadow-lg flex items-center gap-sm z-50">
      <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">check_circle</span>
      {{ toast() }}
    </div>
  }
</div>
  `,
})
export class FlockManagementComponent implements OnInit {
  private flockSvc = inject(FlockBatchService);

  Math = Math;
  today = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  search = '';
  filterBuilding = '';
  filterStatus: FilterStatus = 'All';
  statusFilters: FilterStatus[] = ['All', 'Active', 'Harvested', 'Quarantined'];
  buildings = ['Alpha-1', 'Alpha-2', 'Beta-1', 'Beta-2', 'Gamma-3', 'Delta-1'];

  private batchList = signal<any[]>([]);
  selected = signal<any | null>(null);
  loading = signal(false);
  toast = signal('');

  showStatusModal = false;
  statusTarget: any = null;
  newStatus: BatchStatus = 'Active';
  statusNote = '';

  kpis = computed(() => {
    const list = this.batchList();
    const total = list.length;
    const active = list.filter(x => x.status === 'Active').length;
    const totalBirds = list
      .filter(x => x.status === 'Active')
      .reduce((s: number, x: any) => s + (x.population ?? 0), 0);
    const activeBatches = list.filter(x => x.status === 'Active');
    const avgFcr = activeBatches.length
      ? activeBatches.reduce((s: number, x: any) => s + (x.fcr ?? 1.38), 0) / activeBatches.length
      : 1.38;
    const quarantined = list.filter(x => x.status === 'Quarantined').length;
    return [
      { label: 'Total Batches',  value: total,                       color: 'text-primary'    },
      { label: 'Active',         value: active,                      color: 'text-primary'    },
      { label: 'Total Birds',    value: totalBirds.toLocaleString(), color: 'text-on-surface' },
      { label: 'Farm Avg FCR',   value: parseFloat(avgFcr.toFixed(2)), color: avgFcr > 1.45 ? 'text-error' : 'text-primary' },
      { label: 'Quarantined',    value: quarantined,                 color: 'text-error'      },
    ];
  });

  filtered = computed(() =>
    this.batchList().filter((b: any) => {
      const q = this.search.toLowerCase();
      if (q && !b.batchCode.toLowerCase().includes(q) &&
               !(b.houseName ?? '').toLowerCase().includes(q) &&
               !(b.breed ?? '').toLowerCase().includes(q)) return false;
      if (this.filterBuilding && b.houseName !== this.filterBuilding) return false;
      if (this.filterStatus !== 'All' && b.status !== this.filterStatus) return false;
      return true;
    })
  );

  ngOnInit(): void { this.refresh(); }

  refresh(): void {
    this.loading.set(true);
    this.flockSvc.getAll().subscribe({
      next: (res: any) => {
        const data = res?.data ?? res ?? [];
        this.batchList.set(data.length ? data : MOCK_BATCHES);
        this.loading.set(false);
      },
      error: () => {
        this.batchList.set(MOCK_BATCHES);
        this.loading.set(false);
      },
    });
  }

  selectBatch(b: any): void {
    this.selected.set(this.selected()?.id === b.id ? null : b);
  }

  openStatusChange(b: any): void {
    this.statusTarget = b;
    this.newStatus = b.status;
    this.statusNote = '';
    this.showStatusModal = true;
  }

  confirmStatusChange(): void {
    if (!this.statusTarget) return;
    const id = this.statusTarget.id;
    this.batchList.update((list: any[]) => list.map((b: any) =>
      b.id === id ? { ...b, status: this.newStatus } : b
    ));
    if (this.selected()?.id === id) {
      this.selected.update((b: any) => b ? { ...b, status: this.newStatus } : null);
    }
    this.flockSvc.update(id, { status: this.newStatus } as any).subscribe();
    this.showStatusModal = false;
    this.showToast(this.statusTarget.batchCode + ' status changed to ' + this.newStatus + '.');
  }

  batchInfoRows(b: any): { label: string; value: string }[] {
    return [
      { label: 'Arrival Date',  value: b.arrivalDate ?? '-' },
      { label: 'Source Farm',   value: b.sourceFarm ?? '-'  },
      { label: 'Initial Count', value: (b.initialCount ?? b.population ?? 0).toLocaleString() },
      { label: 'Current Birds', value: (b.population ?? 0).toLocaleString() },
      { label: 'Age',           value: 'Day ' + (b.ageDays ?? 0) },
      { label: 'Status',        value: b.status },
    ];
  }

  occupancyPct(population: number): number {
    return Math.min(100, Math.round((population / 15000) * 100));
  }

  populationColor(status: string): string {
    return status !== 'Active' ? 'text-on-surface-variant' : 'text-primary';
  }

  statusIconBg(status: string): string {
    const map: Record<string, string> = {
      Active: 'bg-primary-fixed text-on-primary-fixed-variant',
      Harvested: 'bg-surface-container text-on-surface-variant',
      Quarantined: 'bg-error-container text-on-error-container',
    };
    return map[status] ?? 'bg-surface-container text-on-surface';
  }

  statusBadge(status: string): string {
    const map: Record<string, string> = {
      Active: 'bg-primary-fixed text-on-primary-fixed-variant',
      Harvested: 'bg-surface-container text-on-surface',
      Quarantined: 'bg-error text-on-error',
    };
    return map[status] ?? 'bg-surface-container text-on-surface';
  }

  getBorderClass(status: string): string {
    if (status === 'Quarantined') return 'border-error';
    if (status === 'Harvested')   return 'border-outline opacity-70';
    return 'border-outline-variant';
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3500);
  }
}
