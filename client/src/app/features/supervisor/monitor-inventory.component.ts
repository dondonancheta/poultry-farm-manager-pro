import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { InventoryService } from '../../core/services/index';

type InventoryCategory = 'feed' | 'medicine' | 'eggs' | 'supplies';
type StockLevel = 'critical' | 'low' | 'ok' | 'full';

interface InventoryItem {
  id: number;
  category: InventoryCategory;
  name: string;
  current: number;
  capacity: number;
  unit: string;
  minThreshold: number;
  reorderPoint: number;
  expiryDate?: string;
  lastUpdated: string;
  supplier?: string;
  location: string;
}

interface StockMovement {
  id: number;
  itemName: string;
  type: 'received' | 'issued' | 'adjusted' | 'expired';
  quantity: number;
  unit: string;
  by: string;
  at: string;
  building?: string;
}

const INVENTORY: InventoryItem[] = [
  // Feed
  { id: 1,  category: 'feed',     name: 'Starter Mix (Type A)',  current: 4200, capacity: 10000, unit: 'kg',    minThreshold: 1000, reorderPoint: 2000, lastUpdated: '6:30 AM', supplier: 'AgriFeeds Corp',     location: 'Feed Warehouse A' },
  { id: 2,  category: 'feed',     name: 'Starter Mix (Type B)',  current: 1800, capacity: 10000, unit: 'kg',    minThreshold: 1000, reorderPoint: 2000, lastUpdated: '6:30 AM', supplier: 'AgriFeeds Corp',     location: 'Feed Warehouse A' },
  { id: 3,  category: 'feed',     name: 'Grower Pellets (A)',    current: 3100, capacity:  8000, unit: 'kg',    minThreshold:  800, reorderPoint: 1500, lastUpdated: '7:00 AM', supplier: 'PrimeFeed Ltd',      location: 'Feed Warehouse B' },
  { id: 4,  category: 'feed',     name: 'Finisher Crumbles',     current:  950, capacity:  5000, unit: 'kg',    minThreshold:  500, reorderPoint: 1000, lastUpdated: '7:00 AM', supplier: 'PrimeFeed Ltd',      location: 'Feed Warehouse B' },
  { id: 5,  category: 'feed',     name: 'Layer Mash (Premium)',  current: 2750, capacity:  6000, unit: 'kg',    minThreshold:  600, reorderPoint: 1200, lastUpdated: '5:45 AM', supplier: 'NutriPro',          location: 'Feed Warehouse C' },
  // Medicine
  { id: 6,  category: 'medicine', name: 'Newcastle Vaccine',     current:  200, capacity:  1000, unit: 'doses', minThreshold:  100, reorderPoint: 200,  expiryDate: '2025-03-15', lastUpdated: 'Yesterday', supplier: 'VetCare PH', location: 'Medicine Cabinet 1' },
  { id: 7,  category: 'medicine', name: 'Gumboro Vaccine',       current:   50, capacity:   500, unit: 'doses', minThreshold:   80, reorderPoint: 150,  expiryDate: '2025-02-28', lastUpdated: 'Yesterday', supplier: 'VetCare PH', location: 'Medicine Cabinet 1' },
  { id: 8,  category: 'medicine', name: 'Marek\'s Vaccine',      current:  320, capacity:   500, unit: 'doses', minThreshold:  100, reorderPoint: 200,  expiryDate: '2025-06-01', lastUpdated: '2 days ago', supplier: 'PhilVet',   location: 'Medicine Cabinet 2' },
  { id: 9,  category: 'medicine', name: 'Tetracycline (1kg)',     current:   12, capacity:    50, unit: 'packs', minThreshold:    5, reorderPoint: 10,   expiryDate: '2025-08-10', lastUpdated: 'Yesterday', supplier: 'MedSupply PH', location: 'Medicine Cabinet 2' },
  // Eggs
  { id: 10, category: 'eggs',     name: 'Large Eggs (stock)',    current: 8400, capacity: 20000, unit: 'pcs',   minThreshold: 2000, reorderPoint: 4000, lastUpdated: '7:30 AM', location: 'Egg Cold Storage' },
  { id: 11, category: 'eggs',     name: 'Medium Eggs (stock)',   current: 3200, capacity: 10000, unit: 'pcs',   minThreshold: 1000, reorderPoint: 2000, lastUpdated: '7:30 AM', location: 'Egg Cold Storage' },
  { id: 12, category: 'eggs',     name: 'Small Eggs (stock)',    current: 1100, capacity:  5000, unit: 'pcs',   minThreshold:  500, reorderPoint: 1000, lastUpdated: '7:30 AM', location: 'Egg Cold Storage' },
  // Supplies
  { id: 13, category: 'supplies', name: 'Egg Trays (30-count)',  current:  480, capacity:  1000, unit: 'pcs',   minThreshold:  100, reorderPoint: 200,  lastUpdated: '2 days ago', location: 'Supply Room' },
  { id: 14, category: 'supplies', name: 'Disinfectant (20L)',    current:    6, capacity:    30, unit: 'drums', minThreshold:    4, reorderPoint: 8,    lastUpdated: 'Yesterday',  location: 'Supply Room' },
];

const MOVEMENTS: StockMovement[] = [
  { id: 1, itemName: 'Starter Mix (Type A)', type: 'issued',   quantity: 450, unit: 'kg',    by: 'Juan dela Cruz',   at: '06:30 AM', building: 'Alpha-1' },
  { id: 2, itemName: 'Grower Pellets (A)',   type: 'issued',   quantity: 380, unit: 'kg',    by: 'Pedro Reyes',      at: '07:10 AM', building: 'Beta-2'  },
  { id: 3, itemName: 'Newcastle Vaccine',    type: 'issued',   quantity:  80, unit: 'doses', by: 'Maria Santos',     at: '08:00 AM', building: 'Alpha-1' },
  { id: 4, itemName: 'Starter Mix (Type B)', type: 'received', quantity: 2000, unit: 'kg',   by: 'Supplier Delivery',at: 'Yesterday' },
  { id: 5, itemName: 'Gumboro Vaccine',      type: 'expired',  quantity:  30, unit: 'doses', by: 'System Auto',      at: '2 days ago' },
];

@Component({
  selector: 'app-monitor-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-lg max-w-5xl mx-auto pb-xl">

      <!-- Header -->
      <div class="flex items-center gap-md mb-lg">
        <a routerLink="/supervisor-home"
           class="p-sm hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant">
          <span class="material-symbols-outlined">arrow_back</span>
        </a>
        <div class="flex-1">
          <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">Inventory Monitor</h1>
          <p class="text-body-md text-on-surface-variant">{{ today }}</p>
        </div>
        <button class="flex items-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-lg
                       text-label-md font-bold hover:opacity-90 active:scale-95 transition-all">
          <span class="material-symbols-outlined text-[18px]">download</span>
          Export
        </button>
      </div>

      <!-- Alert strip: low/critical items -->
      @if (alertItems().length > 0) {
        <div class="bg-error-container border border-error rounded-xl p-md flex items-start gap-md mb-lg">
          <span class="material-symbols-outlined text-on-error-container text-[24px] flex-shrink-0 mt-xs"
                style="font-variation-settings:'FILL' 1">warning</span>
          <div>
            <p class="font-bold text-on-error-container">{{ alertItems().length }} items need attention</p>
            <p class="text-xs text-on-error-container mt-xs">
              @for (item of alertItems(); track item.id; let last = $last) {
                <span>{{ item.name }}{{ last ? '' : ' · ' }}</span>
              }
            </p>
          </div>
        </div>
      }

      <!-- Summary KPIs -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg">
        @for (kpi of summaryKpis(); track kpi.label) {
          <div class="bg-white border border-outline-variant rounded-xl p-md text-center">
            <div class="font-bold text-[24px]" [class]="kpi.color">{{ kpi.value }}</div>
            <div class="text-label-md text-on-surface-variant uppercase tracking-wide mt-xs">{{ kpi.label }}</div>
          </div>
        }
      </div>

      <!-- Category tabs + search -->
      <div class="bg-white border border-outline-variant rounded-xl p-md flex flex-wrap gap-md items-center mb-lg shadow-sm">
        <div class="flex gap-xs">
          @for (cat of categories; track cat.key) {
            <button (click)="activeCategory = cat.key"
                    class="px-md py-xs rounded-lg text-label-md font-bold transition-all flex items-center gap-xs"
                    [class]="activeCategory === cat.key
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'">
              <span class="material-symbols-outlined text-[16px]">{{ cat.icon }}</span>
              {{ cat.label }}
            </button>
          }
        </div>
        <select [(ngModel)]="filterLevel" class="ml-auto border border-outline-variant rounded-lg px-sm py-xs text-body-md">
          <option value="">All levels</option>
          <option value="critical">Critical</option>
          <option value="low">Low</option>
          <option value="ok">OK</option>
          <option value="full">Full</option>
        </select>
      </div>

      <!-- Inventory grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-md mb-xl">
        @for (item of filteredItems(); track item.id) {
          <div class="bg-white border rounded-2xl p-lg shadow-sm transition-all hover:shadow-md"
               [class]="stockBorder(stockLevel(item))">

            <div class="flex items-start justify-between mb-md">
              <div class="flex-1 min-w-0 pr-md">
                <p class="font-bold text-on-surface">{{ item.name }}</p>
                <p class="text-xs text-on-surface-variant mt-xs">{{ item.location }}</p>
                @if (item.supplier) {
                  <p class="text-xs text-on-surface-variant">{{ item.supplier }}</p>
                }
              </div>
              <span class="px-sm py-xs rounded-full text-[10px] font-bold uppercase flex-shrink-0"
                    [class]="stockChip(stockLevel(item))">
                {{ stockLevel(item) }}
              </span>
            </div>

            <!-- Progress bar -->
            <div class="mb-md">
              <div class="flex justify-between text-xs text-on-surface-variant mb-xs">
                <span>{{ item.current.toLocaleString() }} {{ item.unit }}</span>
                <span>{{ stockPct(item) }}% of capacity</span>
              </div>
              <div class="w-full bg-surface-container rounded-full h-3">
                <div class="h-3 rounded-full transition-all duration-500"
                     [class]="stockBar(stockLevel(item))"
                     [style.width.%]="Math.min(stockPct(item), 100)">
                </div>
              </div>
              <!-- Threshold markers -->
              <div class="relative h-1 mt-xs">
                <div class="absolute w-0.5 h-2 bg-error -top-0.5 rounded"
                     [style.left.%]="thresholdPct(item.minThreshold, item.capacity)"
                     title="Min threshold">
                </div>
                <div class="absolute w-0.5 h-2 bg-secondary -top-0.5 rounded"
                     [style.left.%]="thresholdPct(item.reorderPoint, item.capacity)"
                     title="Reorder point">
                </div>
              </div>
              <div class="flex gap-lg mt-xs text-[10px] text-on-surface-variant">
                <span class="flex items-center gap-xs">
                  <span class="w-2 h-2 bg-error rounded-sm inline-block"></span>Min: {{ item.minThreshold }}
                </span>
                <span class="flex items-center gap-xs">
                  <span class="w-2 h-2 bg-secondary rounded-sm inline-block"></span>Reorder: {{ item.reorderPoint }}
                </span>
              </div>
            </div>

            <!-- Footer row -->
            <div class="flex items-center justify-between pt-sm border-t border-outline-variant">
              <p class="text-xs text-on-surface-variant">Updated {{ item.lastUpdated }}</p>
              @if (item.expiryDate) {
                <span class="text-xs font-bold" [class]="isExpiringSoon(item.expiryDate) ? 'text-error' : 'text-on-surface-variant'">
                  Exp: {{ item.expiryDate }}{{ isExpiringSoon(item.expiryDate) ? ' ⚠' : '' }}
                </span>
              }
              @if (stockLevel(item) === 'critical' || stockLevel(item) === 'low') {
                <button class="text-label-md text-primary font-bold hover:underline">
                  Request reorder
                </button>
              }
            </div>
          </div>
        }
      </div>

      <!-- Stock movements log -->
      <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden">
        <div class="flex items-center justify-between px-lg py-md border-b border-outline-variant">
          <h3 class="font-bold text-on-surface" style="font-size:16px">Recent Stock Movements</h3>
          <button class="text-label-md text-primary hover:underline">View all</button>
        </div>
        <div class="divide-y divide-outline-variant">
          @for (mv of movements; track mv.id) {
            <div class="flex items-center gap-md px-lg py-md">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                   [class]="movementBg(mv.type)">
                <span class="material-symbols-outlined text-[16px]"
                      style="font-variation-settings:'FILL' 1">{{ movementIcon(mv.type) }}</span>
              </div>
              <div class="flex-1">
                <p class="text-body-md font-semibold text-on-surface">{{ mv.itemName }}</p>
                <p class="text-xs text-on-surface-variant">
                  {{ mv.type | titlecase }} by {{ mv.by }}{{ mv.building ? ' → ' + mv.building : '' }} · {{ mv.at }}
                </p>
              </div>
              <span class="font-bold text-body-md" [class]="mv.type === 'received' ? 'text-primary' : mv.type === 'expired' ? 'text-error' : 'text-on-surface'">
                {{ mv.type === 'received' ? '+' : mv.type === 'issued' ? '−' : '' }}{{ mv.quantity }} {{ mv.unit }}
              </span>
            </div>
          }
        </div>
      </div>

    </div>
  `,
})
export class MonitorInventoryComponent implements OnInit {
  private invSvc = inject(InventoryService);
  items  = signal<any[]>([]);
  alerts = signal<any[]>([]);

  ngOnInit(): void {
    this.invSvc.getAll().subscribe({
      next: (items) => { if (items?.length) this.items.set(items as any); },
      error: () => {},
    });
    this.invSvc.getAlerts().subscribe({
      next: (alerts) => { if (alerts?.length) this.alerts.set(alerts as any); },
      error: () => {},
    });
  }
  today       = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  Math        = Math;
  inventory   = signal<InventoryItem[]>(INVENTORY);
  movements   = MOVEMENTS;
  activeCategory: InventoryCategory | 'all' = 'all';
  filterLevel = '';

  categories = [
    { key: 'all'      as const, label: 'All',      icon: 'apps'         },
    { key: 'feed'     as const, label: 'Feed',      icon: 'grass'        },
    { key: 'medicine' as const, label: 'Medicine',  icon: 'vaccines'     },
    { key: 'eggs'     as const, label: 'Eggs',      icon: 'egg'          },
    { key: 'supplies' as const, label: 'Supplies',  icon: 'inventory_2'  },
  ];

  alertItems = computed(() =>
    this.inventory().filter(i => this.stockLevel(i) === 'critical' || this.stockLevel(i) === 'low')
  );

  summaryKpis = computed(() => {
    const items = this.inventory();
    return [
      { label: 'Total Items',  value: items.length,                                               color: 'text-primary' },
      { label: 'Critical',     value: items.filter(i => this.stockLevel(i) === 'critical').length, color: 'text-error' },
      { label: 'Low Stock',    value: items.filter(i => this.stockLevel(i) === 'low').length,      color: 'text-secondary' },
      { label: 'Expiring Soon',value: items.filter(i => i.expiryDate && this.isExpiringSoon(i.expiryDate)).length, color: 'text-error' },
    ];
  });

  filteredItems = computed(() =>
    this.inventory().filter(i => {
      if (this.activeCategory !== 'all' && i.category !== this.activeCategory) return false;
      if (this.filterLevel && this.stockLevel(i) !== this.filterLevel) return false;
      return true;
    })
  );

  stockPct(item: InventoryItem): number { return Math.round((item.current / item.capacity) * 100); }

  stockLevel(item: InventoryItem): StockLevel {
    const pct = this.stockPct(item);
    if (item.current <= item.minThreshold) return 'critical';
    if (item.current <= item.reorderPoint) return 'low';
    if (pct >= 85) return 'full';
    return 'ok';
  }

  thresholdPct(value: number, capacity: number): number {
    return Math.min(100, Math.round((value / capacity) * 100));
  }

  isExpiringSoon(date: string): boolean {
    const diff = (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff < 45;
  }

  stockBar(level: StockLevel): string {
    return { critical: 'bg-error', low: 'bg-secondary-container', ok: 'bg-primary', full: 'bg-primary' }[level];
  }

  stockChip(level: StockLevel): string {
    return {
      critical: 'bg-error text-on-error',
      low:      'bg-secondary-fixed text-on-secondary-fixed-variant',
      ok:       'bg-primary-fixed text-on-primary-fixed-variant',
      full:     'bg-primary-fixed text-on-primary-fixed-variant',
    }[level];
  }

  stockBorder(level: StockLevel): string {
    return { critical: 'border-error', low: 'border-secondary', ok: 'border-outline-variant', full: 'border-outline-variant' }[level];
  }

  movementIcon(type: StockMovement['type']): string {
    return { received: 'add_circle', issued: 'remove_circle', adjusted: 'tune', expired: 'cancel' }[type];
  }

  movementBg(type: StockMovement['type']): string {
    return {
      received: 'bg-primary-fixed text-on-primary-fixed-variant',
      issued:   'bg-secondary-fixed text-on-secondary-fixed-variant',
      adjusted: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
      expired:  'bg-error-container text-on-error-container',
    }[type];
  }
}
