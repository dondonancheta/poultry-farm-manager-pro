import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EggCollectionService } from '../../core/services/egg-collection.service';
import { ApiService }            from '../../core/services/api.service';
import { EggStockService } from '../../core/services/egg-stock.service';

type EggSize = 'small' | 'medium' | 'large' | 'extra_large' | 'jumbo';
type MovType = 'collected' | 'sold' | 'damaged' | 'adjusted';
type PackagingType = 'dozen' | 'tray' | 'flat' | 'case';

interface SizeRow {
  key: EggSize; label: string; pricePerEgg: number;
  minGrams: number; maxGrams: number; color: string; textColor: string;
  maxCapacity: number;
}

interface StockMovement {
  id: number; date: string; type: MovType;
  size: EggSize | 'all'; qty: number; ref: string; balance: number;
}

interface AdjustmentForm {
  size: EggSize; qty: number; type: 'add' | 'remove'; reason: string;
}

const EGG_SIZES: SizeRow[] = [
  { key:'small',       label:'Small',       pricePerEgg:1.80, minGrams:45,  maxGrams:52,  color:'bg-surface-container',   textColor:'text-on-surface',                     maxCapacity:5000  },
  { key:'medium',      label:'Medium',      pricePerEgg:2.10, minGrams:53,  maxGrams:62,  color:'bg-tertiary-fixed',      textColor:'text-on-tertiary-fixed-variant',       maxCapacity:12000 },
  { key:'large',       label:'Large',       pricePerEgg:2.50, minGrams:63,  maxGrams:72,  color:'bg-primary-fixed',       textColor:'text-on-primary-fixed-variant',        maxCapacity:25000 },
  { key:'extra_large', label:'Extra Large', pricePerEgg:3.00, minGrams:73,  maxGrams:84,  color:'bg-secondary-fixed',     textColor:'text-on-secondary-fixed-variant',      maxCapacity:8000  },
  { key:'jumbo',       label:'Jumbo',       pricePerEgg:3.50, minGrams:85,  maxGrams:999, color:'bg-primary-container',   textColor:'text-on-primary-container',            maxCapacity:3000  },
];

const PACKAGING: { type: PackagingType; label: string; qty: number; icon: string }[] = [
  { type:'dozen', label:'Dozens',    qty:12,  icon:'grid_3x3'    },
  { type:'tray',  label:'Trays',     qty:30,  icon:'table_chart' },
  { type:'flat',  label:'Flats',     qty:36,  icon:'grid_view'   },
  { type:'case',  label:'Cases',     qty:360, icon:'inventory_2' },
];

const MOCK_MOVEMENTS: StockMovement[] = [
  { id:1,  date:'Today 07:30',    type:'collected', size:'large',       qty: 820, ref:'B-2024-001 · Alpha-1',       balance:8400 },
  { id:2,  date:'Today 07:30',    type:'collected', size:'medium',      qty: 310, ref:'B-2024-001 · Alpha-1',       balance:3200 },
  { id:3,  date:'Today 07:30',    type:'collected', size:'small',       qty:  90, ref:'B-2024-001 · Alpha-1',       balance:1100 },
  { id:4,  date:'Today 10:15',    type:'sold',      size:'large',       qty:-500, ref:'INV-1042 · Metro Fresh',     balance:7900 },
  { id:5,  date:'Today 10:15',    type:'sold',      size:'medium',      qty:-200, ref:'INV-1042 · Metro Fresh',     balance:3000 },
  { id:6,  date:'Yesterday 15:45',type:'collected', size:'large',       qty: 950, ref:'B-2024-002 · Beta-2',        balance:7450 },
  { id:7,  date:'Yesterday 11:00',type:'sold',      size:'medium',      qty:-200, ref:'INV-1041 · Sunrise SM',      balance:2800 },
  { id:8,  date:'Yesterday 08:00',type:'damaged',   size:'small',       qty: -12, ref:'Damage report #18',          balance:1088 },
  { id:9,  date:'2 days ago',     type:'collected', size:'extra_large', qty: 180, ref:'B-2024-005 · Alpha-2',       balance:620  },
  { id:10, date:'2 days ago',     type:'collected', size:'jumbo',       qty:  80, ref:'B-2024-005 · Alpha-2',       balance:180  },
];

@Component({
  selector: 'app-egg-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="p-lg max-w-5xl mx-auto pb-xl">

  <!-- Header -->
  <div class="flex items-center gap-md mb-lg">
    <a routerLink="/eggs"
       class="p-sm hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant">
      <span class="material-symbols-outlined">arrow_back</span>
    </a>
    <div class="flex-1">
      <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">Egg Inventory</h1>
      <p class="text-body-md text-on-surface-variant">
        {{ today }} · Last updated: {{ lastUpdated() }}
        @if (loading()) {
          <span class="material-symbols-outlined text-[14px] animate-spin ml-sm">refresh</span>
        }
      </p>
    </div>
    <div class="flex gap-sm">
      <button (click)="showAdjustModal = true"
              class="flex items-center gap-sm border border-outline text-on-surface px-md py-sm rounded-lg text-label-md hover:bg-surface-container transition-all">
        <span class="material-symbols-outlined text-[18px]">tune</span>Adjust Stock
      </button>
      <button (click)="reload()"
              class="flex items-center gap-sm bg-primary text-on-primary px-md py-sm rounded-lg text-label-md font-bold hover:opacity-90 transition-all">
        <span class="material-symbols-outlined text-[18px]">refresh</span>Refresh
      </button>
    </div>
  </div>

  <!-- Total value banner -->
  <div class="bg-primary rounded-2xl p-lg mb-lg flex items-center gap-xl relative overflow-hidden">
    <div class="relative z-10">
      <div class="text-xs text-on-primary opacity-70 uppercase font-bold tracking-widest mb-xs">Total Stock Value</div>
      <div class="font-bold text-on-primary" style="font-size:32px;line-height:38px">
        ₱{{ totalValue() | number:'1.2-2' }}
      </div>
      <div class="text-sm text-on-primary opacity-80 mt-xs">{{ totalEggs() | number }} eggs in warehouse</div>
      @if (totalEggs() < 5000) {
        <div class="mt-sm flex items-center gap-xs bg-white/15 rounded-lg px-sm py-xs w-fit">
          <span class="material-symbols-outlined text-[14px]" style="font-variation-settings:'FILL' 1">warning</span>
          <span class="text-xs">Stock running low — plan collection</span>
        </div>
      }
    </div>
    <div class="ml-auto grid grid-cols-2 gap-md relative z-10">
      @for (s of eggSizes.slice(2,4); track s.key) {
        <div class="bg-white/15 rounded-xl p-sm text-center">
          <div class="text-xs text-on-primary opacity-70 uppercase font-bold">{{ s.label }}</div>
          <div class="font-bold text-on-primary mt-xs">{{ stock()[s.key] | number }}</div>
          <div class="text-[10px] text-on-primary opacity-60">₱{{ s.pricePerEgg }}/egg</div>
        </div>
      }
    </div>
    <div class="absolute -top-8 -right-8 w-40 h-40 bg-primary-container/20 rounded-full blur-3xl pointer-events-none"></div>
  </div>

  <!-- Stock cards per size -->
  <div class="grid grid-cols-1 md:grid-cols-5 gap-md mb-lg">
    @for (size of eggSizes; track size.key) {
      <div class="bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
           [class]="stockAlert(size.key) ? 'border-error' : 'border-outline-variant'">
        <div class="px-md py-sm" [class]="size.color">
          <div class="font-bold text-label-md" [class]="size.textColor">{{ size.label }}</div>
          <div class="text-[10px] opacity-70 font-bold" [class]="size.textColor">{{ size.minGrams }}–{{ size.maxGrams }}g</div>
        </div>
        <div class="p-md">
          <div class="font-bold text-primary" style="font-size:24px;line-height:30px">{{ stock()[size.key] | number }}</div>
          <div class="text-xs text-on-surface-variant mt-xs">₱{{ size.pricePerEgg }}/egg</div>

          <!-- Stock level bar -->
          <div class="mt-sm w-full bg-surface-container rounded-full h-2">
            <div class="h-2 rounded-full transition-all duration-500"
                 [class]="stockLevelColor(size.key)"
                 [style.width.%]="stockLevelPct(size.key)"></div>
          </div>
          <div class="flex justify-between mt-xs text-[10px]">
            <span class="text-on-surface-variant">{{ stockLevelPct(size.key) }}%</span>
            <span [class]="stockAlert(size.key) ? 'text-error font-bold' : 'text-on-surface-variant'">
              {{ stockAlert(size.key) ? '⚠ Low' : '' }}
            </span>
          </div>

          <div class="mt-sm pt-sm border-t border-outline-variant text-[11px] text-on-surface-variant">
            ₱{{ (stock()[size.key] * size.pricePerEgg).toFixed(0) | number }} value
          </div>
        </div>
      </div>
    }
  </div>

  <!-- Main content grid -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-gutter mb-lg">

    <!-- Packaging calculator -->
    <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
      <h3 class="font-bold text-on-surface mb-md" style="font-size:16px">Packaging Calculator</h3>
      <div class="mb-md">
        <label class="text-label-md text-on-surface-variant block mb-xs">Egg Size</label>
        <div class="flex gap-xs flex-wrap">
          @for (size of eggSizes; track size.key) {
            <button (click)="calcSize = size.key"
                    class="px-md py-xs rounded-lg border-2 text-label-md font-bold transition-all"
                    [class]="calcSize === size.key
                      ? size.color + ' border-primary'
                      : 'border-outline-variant text-on-surface-variant hover:border-outline'">
              {{ size.label }}
            </button>
          }
        </div>
      </div>
      <div class="space-y-sm">
        @for (pkg of packaging; track pkg.type) {
          <div class="flex items-center justify-between p-md rounded-xl border border-outline-variant hover:border-primary transition-colors">
            <div class="flex items-center gap-md">
              <span class="material-symbols-outlined text-[20px] text-primary" style="font-variation-settings:'FILL' 1">{{ pkg.icon }}</span>
              <div>
                <div class="font-bold text-on-surface text-sm">{{ pkg.label }}</div>
                <div class="text-xs text-on-surface-variant">{{ pkg.qty }} eggs/unit</div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-bold text-primary text-lg">{{ packagingCount(pkg.qty) | number }}</div>
              <div class="text-xs text-on-surface-variant">units · ₱{{ (pkg.qty * calcSizePrice()).toFixed(2) }}/unit</div>
            </div>
          </div>
        }
      </div>
      <div class="mt-md pt-md border-t border-outline-variant flex justify-between">
        <span class="text-sm text-on-surface-variant">{{ calcSizeLabel }} in stock:</span>
        <span class="font-bold text-primary">{{ stock()[calcSize] | number }} eggs</span>
      </div>
    </div>

    <!-- Size distribution -->
    <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
      <h3 class="font-bold text-on-surface mb-md" style="font-size:16px">Size Distribution</h3>
      <div class="space-y-sm mb-lg">
        @for (size of eggSizes; track size.key) {
          <div>
            <div class="flex justify-between text-sm mb-xs">
              <span class="font-semibold text-on-surface">{{ size.label }}</span>
              <div class="text-right">
                <span class="font-bold text-on-surface">{{ stock()[size.key] | number }}</span>
                <span class="text-on-surface-variant ml-sm text-xs">{{ sizePct(size.key) }}%</span>
              </div>
            </div>
            <div class="w-full bg-surface-container rounded-full h-3">
              <div class="h-3 rounded-full transition-all duration-500"
                   [class]="size.color.split(' ')[0]"
                   [style.width.%]="sizePct(size.key)"></div>
            </div>
          </div>
        }
      </div>
      <div class="grid grid-cols-2 gap-md">
        <div class="bg-surface-container rounded-xl p-sm text-center">
          <div class="text-[10px] text-on-surface-variant uppercase font-bold mb-xs">Spoilage Rate</div>
          <div class="font-bold text-secondary" style="font-size:20px">1.02%</div>
        </div>
        <div class="bg-surface-container rounded-xl p-sm text-center">
          <div class="text-[10px] text-on-surface-variant uppercase font-bold mb-xs">Yield Rate</div>
          <div class="font-bold text-primary" style="font-size:20px">98.98%</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Stock movement log -->
  <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
    <div class="flex items-center justify-between px-lg py-md border-b border-outline-variant bg-surface-container-low">
      <h3 class="font-bold text-on-surface" style="font-size:16px">
        Stock Movement History
        <span class="text-on-surface-variant font-normal text-sm ml-sm">({{ filteredMovements().length }} records)</span>
      </h3>
      <div class="flex gap-sm">
        @for (t of movTabs; track t.key) {
          <button (click)="movFilter = t.key"
                  class="px-md py-xs rounded-lg text-label-md transition-all"
                  [class]="movFilter === t.key
                    ? 'bg-primary text-on-primary font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container'">
            {{ t.label }}
          </button>
        }
      </div>
    </div>
    <div class="divide-y divide-outline-variant">
      @for (mv of filteredMovements(); track mv.id) {
        <div class="flex items-center gap-md px-lg py-md hover:bg-surface-container-lowest transition-colors">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
               [class]="movIcon(mv.type).bg">
            <span class="material-symbols-outlined text-[16px]" [class]="movIcon(mv.type).color"
                  style="font-variation-settings:'FILL' 1">{{ movIcon(mv.type).icon }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-on-surface">{{ mv.ref }}</p>
            <p class="text-xs text-on-surface-variant mt-xs">{{ mv.date }} · {{ sizeLabelFn(mv.size) }}</p>
          </div>
          <div class="text-right flex-shrink-0">
            <div class="font-bold text-sm"
                 [class]="mv.qty > 0 ? 'text-primary' : mv.type === 'sold' ? 'text-secondary' : 'text-error'">
              {{ mv.qty > 0 ? '+' : '' }}{{ mv.qty | number }}
            </div>
            <div class="text-xs text-on-surface-variant">Bal: {{ mv.balance | number }}</div>
          </div>
          <span class="px-xs py-xs rounded text-[10px] font-bold uppercase flex-shrink-0"
                [class]="movTypeBadge(mv.type)">
            {{ mv.type }}
          </span>
        </div>
      }
      @empty {
        <div class="p-xl text-center text-on-surface-variant">No movements match the selected filter.</div>
      }
    </div>
  </div>

  <!-- Adjust Stock Modal -->
  @if (showAdjustModal) {
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-lg">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div class="px-xl py-lg border-b border-outline-variant flex items-center justify-between">
          <h3 class="font-bold text-on-surface" style="font-size:18px">Stock Adjustment</h3>
          <button (click)="showAdjustModal=false" class="p-xs hover:bg-surface-container rounded-lg">
            <span class="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div class="p-xl space-y-md">
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">Egg Size *</label>
            <div class="flex gap-xs flex-wrap">
              @for (size of eggSizes; track size.key) {
                <button (click)="adjustForm.size = size.key"
                        class="px-md py-xs rounded-lg border-2 text-label-md font-bold transition-all"
                        [class]="adjustForm.size === size.key
                          ? size.color + ' border-primary'
                          : 'border-outline-variant text-on-surface-variant hover:border-outline'">
                  {{ size.label }}
                </button>
              }
            </div>
          </div>
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">Adjustment Type</label>
            <div class="flex gap-sm">
              <button (click)="adjustForm.type = 'add'"
                      class="flex-1 py-sm rounded-lg border-2 text-label-md font-bold transition-all"
                      [class]="adjustForm.type==='add'
                        ? 'border-primary bg-primary-fixed text-on-primary-fixed-variant'
                        : 'border-outline-variant text-on-surface-variant hover:border-outline'">
                + Add Eggs
              </button>
              <button (click)="adjustForm.type = 'remove'"
                      class="flex-1 py-sm rounded-lg border-2 text-label-md font-bold transition-all"
                      [class]="adjustForm.type==='remove'
                        ? 'border-error bg-error-container text-on-error-container'
                        : 'border-outline-variant text-on-surface-variant hover:border-outline'">
                − Remove Eggs
              </button>
            </div>
          </div>
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">Quantity *</label>
            <div class="flex items-center gap-sm">
              <button (click)="adjustForm.qty = Math.max(1, adjustForm.qty - 10)"
                      class="w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center font-bold">−</button>
              <input type="number" [(ngModel)]="adjustForm.qty" min="1"
                     class="flex-1 text-center border border-outline-variant rounded-lg px-md py-sm text-body-md font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"/>
              <button (click)="adjustForm.qty = adjustForm.qty + 10"
                      class="w-9 h-9 rounded-lg bg-primary-fixed text-on-primary-fixed-variant hover:bg-primary hover:text-on-primary flex items-center justify-center font-bold">+</button>
            </div>
          </div>
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">Reason *</label>
            <input [(ngModel)]="adjustForm.reason" placeholder="e.g. Spoilage, missing stock, damaged in transit..."
                   class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
          </div>

          <!-- Preview -->
          @if (adjustForm.qty > 0) {
            <div class="bg-surface-container rounded-xl p-md flex justify-between items-center">
              <div>
                <p class="text-xs text-on-surface-variant">Current {{ sizeLabelFn(adjustForm.size) }} stock</p>
                <p class="font-bold text-on-surface">{{ stock()[adjustForm.size] | number }} eggs</p>
              </div>
              <span class="material-symbols-outlined text-on-surface-variant">arrow_forward</span>
              <div class="text-right">
                <p class="text-xs text-on-surface-variant">After adjustment</p>
                <p class="font-bold" [class]="adjustForm.type === 'add' ? 'text-primary' : 'text-error'">
                  {{ adjustForm.type === 'add'
                    ? (stock()[adjustForm.size] + adjustForm.qty)
                    : (stock()[adjustForm.size] - adjustForm.qty) | number }} eggs
                </p>
              </div>
            </div>
          }

          <div class="flex gap-md pt-md border-t border-outline-variant">
            <button (click)="showAdjustModal=false" class="flex-1 py-sm border border-outline rounded-lg text-label-md text-on-surface hover:bg-surface-container">Cancel</button>
            <button (click)="submitAdjustment()" class="flex-1 py-sm bg-primary text-on-primary rounded-lg text-label-md font-bold hover:opacity-90">Apply Adjustment</button>
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
export class EggInventoryComponent implements OnInit {
  private eggSvc      = inject(EggCollectionService);
  private api         = inject(ApiService);
  private eggStockSvc = inject(EggStockService);

  today    = new Date().toLocaleDateString('en-PH',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  Math     = Math;
  eggSizes = EGG_SIZES;
  packaging = PACKAGING;

  /** Delegate to shared service — reflects sales deductions immediately */
  get stock() { return this.eggStockSvc.stock; }
  movements = signal<StockMovement[]>(MOCK_MOVEMENTS);
  loading  = signal(false);
  toast    = signal('');
  lastUpdatedTime = signal('loading...');
  calcSize: EggSize = 'large';
  movFilter = 'all';
  showAdjustModal = false;
  adjustForm: AdjustmentForm = { size:'large', qty:10, type:'add', reason:'' };
  private nextMovId = 11;

  movTabs = [
    { key:'all',       label:'All'       },
    { key:'collected', label:'Collected' },
    { key:'sold',      label:'Sold'      },
    { key:'damaged',   label:'Damaged'   },
    { key:'adjusted',  label:'Adjusted'  },
  ];

  totalEggs  = this.eggStockSvc.totalEggs;
  totalValue = this.eggStockSvc.totalValue;

  filteredMovements = computed(() =>
    this.movFilter === 'all' ? this.movements() : this.movements().filter(m => m.type === this.movFilter)
  );

  lastUpdated = computed(() => this.lastUpdatedTime());

  ngOnInit(): void {
    this.reload();
    this.loadMovements();
  }

  loadMovements(): void {
    // Load all movement types in parallel
    const sizes: EggSize[] = ['small','medium','large','extra_large','jumbo'];

    // 1. Collected — from egg collections
    this.eggSvc.getAll({ per_page: 50 }).subscribe({
      next: (res) => {
        const records = (res?.data ?? []) as any[];
        if (!records.length) return;
        const apiMovements: StockMovement[] = records.flatMap((rec: any) => {
          const movs: StockMovement[] = [];
          sizes.forEach(sz => {
            const qty = rec.sizes?.[sz] ?? rec[sz] ?? 0;
            if (qty > 0) {
              movs.push({
                id:      rec.id * 100 + movs.length + 1,
                date:    this.formatMovDate(rec.collectedAt ?? rec.collected_at ?? rec.created_at),
                type:    'collected',
                size:    sz,
                qty,
                ref:     `${rec.batchCode ?? rec.batch_code ?? 'Batch'} · ${rec.building ?? rec.houseName ?? ''}`,
                balance: qty,
              });
            }
          });
          return movs;
        });
        this.movements.update(existing => [
          ...apiMovements,
          ...existing.filter(m => m.type !== 'collected'),
        ].sort((a, b) => b.id - a.id));
      },
      error: () => {},
    });

    // 2. Sold — from sales
    this.api.get<any>('sales').subscribe({
      next: (res) => {
        const sales = (res?.data ?? (Array.isArray(res) ? res : [])) as any[];
        const soldMovements: StockMovement[] = sales.flatMap((sale: any) => {
          const items = sale.items ?? sale.line_items ?? [];
          return items.map((item: any, idx: number) => ({
            id:      sale.id * 100 + idx + 200,
            date:    this.formatMovDate(sale.saleDate ?? sale.sale_date ?? sale.created_at),
            type:    'sold' as MovType,
            size:    (item.eggSize ?? item.egg_size ?? 'large') as EggSize,
            qty:     -Math.abs(item.qty ?? item.quantity ?? 0),
            ref:     `${sale.invoiceNo ?? sale.invoice_no ?? 'INV'} · ${sale.customerName ?? sale.customer_name ?? 'Customer'}`,
            balance: 0,
          }));
        });
        if (soldMovements.length) {
          this.movements.update(existing => [
            ...existing.filter(m => m.type !== 'sold'),
            ...soldMovements,
          ].sort((a, b) => b.id - a.id));
        }
      },
      error: () => {},
    });

    // 3. Damaged — from damaged eggs reports
    this.api.get<any>('damaged-eggs').subscribe({
      next: (res) => {
        const reports = (Array.isArray(res) ? res : res?.data ?? []) as any[];
        const damagedMovements: StockMovement[] = reports.map((r: any, idx: number) => ({
          id:      r.id ?? idx * 100 + 300,
          date:    this.formatMovDate(r.reportedAt ?? r.reported_at ?? r.created_at),
          type:    'damaged' as MovType,
          size:    (r.eggSize ?? r.egg_size ?? 'small') as EggSize,
          qty:     -Math.abs(r.count ?? r.qty ?? 0),
          ref:     `Damage report · ${r.building ?? ''} ${r.batch ?? ''}`.trim(),
          balance: 0,
        }));
        if (damagedMovements.length) {
          this.movements.update(existing => [
            ...existing.filter(m => m.type !== 'damaged'),
            ...damagedMovements,
          ].sort((a, b) => b.id - a.id));
        }
      },
      error: () => {},
    });
  }

  private formatMovDate(raw: string | undefined): string {
    if (!raw) return 'Unknown';
    try {
      const d = new Date(raw);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffH  = Math.floor(diffMs / 3600000);
      const diffD  = Math.floor(diffMs / 86400000);
      if (diffH < 1)  return 'Just now';
      if (diffH < 24) return `Today ${d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}`;
      if (diffD === 1) return `Yesterday ${d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}`;
      return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
    } catch { return raw; }
  }

  reload(): void {
    this.eggStockSvc.reload();
    // Separately fetch just for the updated_at timestamp
    this.eggSvc.getInventory().subscribe({
      next: (inv) => {
        this.lastUpdatedTime.set(new Date(inv.updated_at).toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'}));
      },
      error: () => this.lastUpdatedTime.set('Using cached data'),
    });
  }

  sizePct(key: EggSize): number {
    const total = this.totalEggs();
    return total ? Math.round((this.stock()[key] / total) * 100) : 0;
  }

  stockLevelPct(key: EggSize): number {
    const sz = EGG_SIZES.find(s => s.key === key)!;
    return Math.min(100, Math.round((this.stock()[key] / sz.maxCapacity) * 100));
  }

  stockLevelColor(key: EggSize): string {
    const p = this.stockLevelPct(key);
    return p < 20 ? 'bg-error' : p < 40 ? 'bg-secondary-container' : 'bg-primary';
  }

  stockAlert(key: EggSize): boolean { return this.stockLevelPct(key) < 20; }

  get calcSizeLabel(): string { return EGG_SIZES.find(s => s.key === this.calcSize)?.label ?? ''; }

  calcSizePrice(): number { return EGG_SIZES.find(s => s.key === this.calcSize)?.pricePerEgg ?? 0; }

  packagingCount(eggCount: number): number {
    return Math.floor((this.stock()[this.calcSize] || 0) / eggCount);
  }

  submitAdjustment(): void {
    if (!this.adjustForm.qty || this.adjustForm.qty <= 0) return;
    if (!this.adjustForm.reason.trim()) { alert('Please enter a reason.'); return; }

    const delta  = this.adjustForm.type === 'add' ? this.adjustForm.qty : -this.adjustForm.qty;
    const oldVal = this.stock()[this.adjustForm.size];
    const newVal = Math.max(0, oldVal + delta);
    this.eggStockSvc.adjust(this.adjustForm.size as any, delta);

    this.movements.update(list => [{
      id: this.nextMovId++,
      date: 'Just now',
      type: 'adjusted' as MovType,
      size: this.adjustForm.size,
      qty:  delta,
      ref:  `Manual adj: ${this.adjustForm.reason}`,
      balance: newVal,
    }, ...list]);

    this.showAdjustModal = false;
    this.showToast(`${Math.abs(delta)} ${this.calcSizeLabel} eggs ${this.adjustForm.type === 'add' ? 'added to' : 'removed from'} stock.`);
    this.adjustForm = { size:'large', qty:10, type:'add', reason:'' };
  }

  sizeLabelFn(key: EggSize | 'all'): string {
    if (key === 'all') return 'All sizes';
    return EGG_SIZES.find(s => s.key === key)?.label ?? key;
  }

  movIcon(type: MovType): { icon: string; bg: string; color: string } {
    return { collected:{ icon:'egg',           bg:'bg-primary-fixed',   color:'text-on-primary-fixed-variant'   }, sold:{ icon:'point_of_sale',  bg:'bg-tertiary-fixed',  color:'text-on-tertiary-fixed-variant'  }, damaged:{ icon:'broken_image',  bg:'bg-error-container', color:'text-on-error-container'         }, adjusted:{ icon:'tune',          bg:'bg-secondary-fixed', color:'text-on-secondary-fixed-variant' } }[type];
  }

  movTypeBadge(type: MovType): string {
    return { collected:'bg-primary-fixed text-on-primary-fixed-variant', sold:'bg-tertiary-fixed text-on-tertiary-fixed-variant', damaged:'bg-error-container text-on-error-container', adjusted:'bg-secondary-fixed text-on-secondary-fixed-variant' }[type];
  }

  private showToast(msg: string): void { this.toast.set(msg); setTimeout(() => this.toast.set(''), 3500); }
}
