import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedService } from '../../core/services/index';

type FeedCategory = 'starter' | 'grower' | 'finisher' | 'layer';
type SessionType  = 'Morning' | 'Noon' | 'Afternoon';

interface FeedStock {
  id: number; name: string; category: FeedCategory;
  quantityKg: number; pricePerKg: number;
  receivedDate: string; expiryDate?: string;
  supplier: string; stockPct: number;
  batchNo?: string; maxCapacityKg: number;
}

interface FeedIssuance {
  id: number; feedTypeId: number; feedType: string;
  building: string; batch: string;
  quantityKg: number; session: SessionType;
  issuedBy: string; issuedAt: string; notes?: string;
}

interface FeedReceiving {
  id: number; feedTypeId: number; feedType: string;
  supplier: string; quantityKg: number; pricePerKg: number;
  batchNo: string; receivedDate: string; expiryDate?: string;
  receivedBy: string;
}

interface FcrBatch { batch: string; building: string; fcr: number; feedKg: number; eggs: number; age: number; }

const MAX_CAPACITY = 10000;
const INITIAL_STOCK: FeedStock[] = [
  { id:1, name:'Starter Mix (Type A)', category:'starter',  quantityKg:4200, pricePerKg:28.50, receivedDate:'2024-01-20', supplier:'AgriFeeds Corp',  stockPct:42, maxCapacityKg:MAX_CAPACITY, batchNo:'FS-2024-001' },
  { id:2, name:'Starter Mix (Type B)', category:'starter',  quantityKg:1800, pricePerKg:26.00, receivedDate:'2024-01-20', supplier:'AgriFeeds Corp',  stockPct:18, maxCapacityKg:MAX_CAPACITY, batchNo:'FS-2024-002' },
  { id:3, name:'Grower Pellets (A)',   category:'grower',   quantityKg:3100, pricePerKg:24.00, receivedDate:'2024-01-18', supplier:'PrimeFeed Ltd',   stockPct:39, maxCapacityKg:MAX_CAPACITY },
  { id:4, name:'Finisher Crumbles',   category:'finisher', quantityKg: 950, pricePerKg:22.50, receivedDate:'2024-01-15', supplier:'PrimeFeed Ltd',   stockPct:19, maxCapacityKg:MAX_CAPACITY },
  { id:5, name:'Layer Mash (Premium)',category:'layer',    quantityKg:2750, pricePerKg:25.00, receivedDate:'2024-01-22', supplier:'NutriPro',        stockPct:46, maxCapacityKg:MAX_CAPACITY },
];
const INITIAL_ISSUANCES: FeedIssuance[] = [
  { id:1, feedTypeId:1, feedType:'Starter Mix (Type A)', building:'Alpha-1', batch:'B-2024-001', quantityKg:450, session:'Morning',   issuedBy:'Juan dela Cruz', issuedAt:'Today 06:30 AM' },
  { id:2, feedTypeId:3, feedType:'Grower Pellets (A)',   building:'Beta-2',  batch:'B-2024-002', quantityKg:380, session:'Morning',   issuedBy:'Pedro Reyes',    issuedAt:'Today 07:10 AM' },
  { id:3, feedTypeId:1, feedType:'Starter Mix (Type A)', building:'Alpha-1', batch:'B-2024-001', quantityKg:450, session:'Afternoon', issuedBy:'Juan dela Cruz', issuedAt:'Yesterday 3:00 PM' },
  { id:4, feedTypeId:5, feedType:'Layer Mash (Premium)', building:'Gamma-3', batch:'B-2024-003', quantityKg:320, session:'Morning',   issuedBy:'Rosa Mendoza',   issuedAt:'Yesterday 06:00 AM' },
];
const INITIAL_RECEIVINGS: FeedReceiving[] = [
  { id:1, feedTypeId:1, feedType:'Starter Mix (Type A)', supplier:'AgriFeeds Corp', quantityKg:5000, pricePerKg:28.50, batchNo:'FS-2024-001', receivedDate:'2024-01-20', receivedBy:'Maria Santos' },
  { id:2, feedTypeId:2, feedType:'Starter Mix (Type B)', supplier:'AgriFeeds Corp', quantityKg:2000, pricePerKg:26.00, batchNo:'FS-2024-002', receivedDate:'2024-01-20', receivedBy:'Maria Santos' },
];
const BUILDINGS = ['Alpha-1','Alpha-2','Beta-1','Beta-2','Gamma-1','Gamma-3','Delta-1'];
const BATCHES   = ['B-2024-001','B-2024-002','B-2024-004','B-2024-005'];
const WORKERS   = ['Juan dela Cruz','Pedro Reyes','Rosa Mendoza','Carlos Bautista','Maria Santos'];
const SUPPLIERS = ['AgriFeeds Corp','PrimeFeed Ltd','NutriPro','FarmChoice PH'];
const SESSIONS: SessionType[] = ['Morning','Noon','Afternoon'];

@Component({
  selector: 'app-feed-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-lg max-w-6xl mx-auto pb-xl">

  <!-- Header -->
  <div class="flex items-center justify-between mb-lg">
    <div>
      <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">Feed Inventory Management</h1>
      <p class="text-body-md text-on-surface-variant">{{ today }}</p>
    </div>
    <div class="flex gap-sm">
      <button (click)="activeTab='issuances'; showIssuanceForm=true"
              class="flex items-center gap-sm border border-outline text-on-surface px-lg py-sm rounded-lg text-label-md hover:bg-surface-container transition-all">
        <span class="material-symbols-outlined text-[18px]">output</span>Issue Feed
      </button>
      <button (click)="activeTab='receiving'; showReceivingForm=true"
              class="flex items-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-lg text-label-md font-bold hover:opacity-90 transition-all">
        <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">input</span>Receive Feed
      </button>
    </div>
  </div>

  <!-- Alert banners -->
  @if (criticalStock().length > 0) {
    <div class="bg-error-container border border-error rounded-xl p-md flex items-start gap-md mb-md">
      <span class="material-symbols-outlined text-on-error-container text-[22px] flex-shrink-0 mt-xs" style="font-variation-settings:'FILL' 1">warning</span>
      <div>
        <p class="font-bold text-on-error-container">{{ criticalStock().length }} feed type(s) critically low — reorder immediately</p>
        <p class="text-xs text-on-error-container mt-xs">{{ criticalStockNames() }}</p>
      </div>
    </div>
  }
  @if (expiringStock().length > 0) {
    <div class="bg-secondary-fixed border border-secondary-fixed-dim rounded-xl p-md flex items-center gap-md mb-lg">
      <span class="material-symbols-outlined text-on-secondary-fixed-variant text-[22px]" style="font-variation-settings:'FILL' 1">schedule</span>
      <p class="text-on-secondary-fixed-variant font-bold">
        {{ expiringStock().length }} batch(es) expiring within 30 days — use first
      </p>
    </div>
  }

  <!-- KPI strip -->
  <div class="grid grid-cols-2 md:grid-cols-5 gap-md mb-lg">
    @for (k of kpis(); track k.label) {
      <div class="bg-white border border-outline-variant rounded-xl p-md text-center">
        <div class="font-bold" [class]="k.color" style="font-size:20px">{{ k.value }}</div>
        <div class="text-label-md text-on-surface-variant uppercase tracking-wide mt-xs">{{ k.label }}</div>
      </div>
    }
  </div>

  <!-- Tabs -->
  <div class="flex gap-xs mb-lg border-b border-outline-variant overflow-x-auto pb-xs">
    @for (tab of tabs; track tab.key) {
      <button (click)="activeTab = tab.key"
              class="px-lg py-sm text-label-md font-bold transition-all border-b-2 -mb-px
                     whitespace-nowrap flex items-center gap-xs"
              [class]="activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'">
        <span class="material-symbols-outlined text-[16px]">{{ tab.icon }}</span>
        {{ tab.label }}
        @if (tab.badge && tab.badge > 0) {
          <span class="ml-xs px-xs rounded-full text-[10px] font-bold bg-error text-on-error">{{ tab.badge }}</span>
        }
      </button>
    }
  </div>

  <!-- ════════ STOCK LEVELS ════════ -->
  @if (activeTab === 'stock') {
    <div class="space-y-md">
      <!-- Filter + search bar -->
      <div class="bg-white border border-outline-variant rounded-xl p-md flex flex-wrap gap-md items-center shadow-sm">
        <div class="relative flex-1 min-w-40">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input [(ngModel)]="stockSearch" placeholder="Search feed..."
                 class="w-full pl-10 pr-md py-sm border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
        </div>
        <select [(ngModel)]="stockCategoryFilter"
                class="border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
          <option value="">All categories</option>
          <option value="starter">Starter</option>
          <option value="grower">Grower</option>
          <option value="finisher">Finisher</option>
          <option value="layer">Layer</option>
        </select>
        <div class="flex gap-xs">
          @for (level of ['all','critical','low','ok']; track level) {
            <button (click)="stockLevelFilter = level"
                    class="px-md py-xs rounded-lg text-label-md font-bold transition-all capitalize"
                    [class]="stockLevelFilter === level
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'">
              {{ level === 'all' ? 'All' : level }}
            </button>
          }
        </div>
      </div>

      @for (feed of filteredStock(); track feed.id) {
        <div class="bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all"
             [class]="stockLevel(feed) === 'critical' ? 'border-error'
                    : stockLevel(feed) === 'low'      ? 'border-secondary'
                    : 'border-outline-variant'">
          <div class="p-lg">
            <div class="flex items-start gap-md mb-md">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                   [class]="catBg(feed.category)">
                <span class="material-symbols-outlined text-[20px]" style="font-variation-settings:'FILL' 1">grass</span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-md">
                  <div>
                    <p class="font-bold text-on-surface">{{ feed.name }}</p>
                    <div class="flex items-center gap-md mt-xs flex-wrap">
                      <span class="text-xs px-sm py-xs rounded-full font-bold"
                            [class]="catColor(feed.category)">{{ feed.category | titlecase }}</span>
                      <span class="text-xs text-on-surface-variant">{{ feed.supplier }}</span>
                      <span class="text-xs text-on-surface-variant">Received: {{ feed.receivedDate }}</span>
                      @if (feed.batchNo) { <span class="text-xs font-mono text-on-surface-variant">{{ feed.batchNo }}</span> }
                    </div>
                  </div>
                  <div class="text-right flex-shrink-0">
                    <div class="font-bold text-primary" style="font-size:22px">{{ feed.quantityKg.toLocaleString() }} kg</div>
                    <div class="text-xs text-on-surface-variant">₱{{ feed.pricePerKg }}/kg · Value: ₱{{ (feed.quantityKg * feed.pricePerKg).toLocaleString() }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Stock progress bar with thresholds -->
            <div class="mb-sm">
              <div class="flex justify-between text-xs text-on-surface-variant mb-xs">
                <span>{{ stockLevel(feed) === 'critical' ? '⚠ Critical' : stockLevel(feed) === 'low' ? '⚠ Low' : 'OK' }}</span>
                <span>{{ feed.stockPct }}% of max capacity ({{ feed.maxCapacityKg.toLocaleString() }} kg)</span>
              </div>
              <div class="relative w-full bg-surface-container rounded-full h-3">
                <!-- Reorder line at 30% -->
                <div class="absolute top-0 bottom-0 w-0.5 bg-secondary/60 z-10 rounded" style="left:30%"
                     title="Reorder point (30%)"></div>
                <!-- Critical line at 15% -->
                <div class="absolute top-0 bottom-0 w-0.5 bg-error/60 z-10 rounded" style="left:15%"
                     title="Critical threshold (15%)"></div>
                <div class="h-3 rounded-full transition-all duration-700"
                     [class]="stockLevel(feed) === 'critical' ? 'bg-error'
                            : stockLevel(feed) === 'low'      ? 'bg-secondary-container'
                            : 'bg-primary'"
                     [style.width.%]="feed.stockPct"></div>
              </div>
              <div class="flex gap-lg mt-xs text-[10px] text-on-surface-variant">
                <span class="flex items-center gap-xs"><span class="w-2 h-2 bg-error/60 rounded-sm inline-block"></span>Critical &lt;15%</span>
                <span class="flex items-center gap-xs"><span class="w-2 h-2 bg-secondary/60 rounded-sm inline-block"></span>Reorder at 30%</span>
              </div>
            </div>

            <!-- Days of supply estimate -->
            <div class="flex items-center justify-between pt-sm border-t border-outline-variant">
              <div class="flex items-center gap-md">
                <span class="text-xs text-on-surface-variant">
                  Est. {{ daysOfSupply(feed) }} days remaining
                </span>
                @if (feed.expiryDate) {
                  <span class="text-xs font-bold"
                        [class]="isExpiringSoon(feed.expiryDate) ? 'text-error' : 'text-on-surface-variant'">
                    Exp: {{ feed.expiryDate }}{{ isExpiringSoon(feed.expiryDate) ? ' ⚠' : '' }}
                  </span>
                }
              </div>
              <div class="flex gap-sm">
                <button (click)="issueFrom(feed)"
                        class="px-md py-xs bg-surface-container text-on-surface rounded-lg text-label-md
                               hover:bg-surface-container-high transition-all">
                  Issue Feed
                </button>
                @if (stockLevel(feed) === 'critical' || stockLevel(feed) === 'low') {
                  <button (click)="reorderFor(feed)"
                          class="px-md py-xs bg-error-container text-on-error-container rounded-lg text-label-md font-bold
                                 hover:opacity-90 transition-all">
                    Reorder Now
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  }

  <!-- ════════ FEED ISSUANCES ════════ -->
  @if (activeTab === 'issuances') {
    <div>
      <!-- Quick-issue shortcut -->
      <div class="bg-primary-container rounded-2xl p-lg mb-md flex items-center gap-md">
        <span class="material-symbols-outlined text-on-primary-container text-[28px]" style="font-variation-settings:'FILL' 1">output</span>
        <div class="flex-1">
          <p class="font-bold text-on-primary-container">Quick Feed Issuance</p>
          <p class="text-xs text-on-primary-container opacity-80">Issue feed to a building and automatically deduct from stock</p>
        </div>
        <button (click)="showIssuanceForm=true"
                class="px-lg py-sm bg-primary text-on-primary rounded-lg text-label-md font-bold hover:opacity-90 transition-all">
          + New Issuance
        </button>
      </div>

      <!-- Issuance table -->
      <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
        <div class="flex items-center justify-between px-lg py-md border-b border-outline-variant bg-surface-container-low">
          <h3 class="font-bold text-on-surface" style="font-size:15px">
            Issuance Log <span class="text-on-surface-variant font-normal text-sm ml-sm">({{ issuances().length }} records)</span>
          </h3>
          <div class="flex gap-sm">
            <select [(ngModel)]="issuanceBuildingFilter"
                    class="border border-outline-variant rounded-lg px-sm py-xs text-body-md focus:outline-none">
              <option value="">All buildings</option>
              @for (b of buildings; track b) { <option>{{ b }}</option> }
            </select>
            <select [(ngModel)]="issuanceSessionFilter"
                    class="border border-outline-variant rounded-lg px-sm py-xs text-body-md focus:outline-none">
              <option value="">All sessions</option>
              @for (s of sessions; track s) { <option>{{ s }}</option> }
            </select>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead class="bg-surface-container-low border-b border-outline-variant">
              <tr>
                <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider">Feed Type</th>
                <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider">Building / Batch</th>
                <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider text-right">Qty (kg)</th>
                <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider text-right">Cost (₱)</th>
                <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider">Session</th>
                <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider">Issued By</th>
                <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider">Date / Time</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              @for (iss of filteredIssuances(); track iss.id) {
                <tr class="hover:bg-surface-container-lowest transition-colors">
                  <td class="px-md py-md font-semibold text-on-surface text-sm">{{ iss.feedType }}</td>
                  <td class="px-md py-md">
                    <div class="text-sm font-semibold text-on-surface">{{ iss.building }}</div>
                    <div class="text-xs text-on-surface-variant font-mono">{{ iss.batch }}</div>
                  </td>
                  <td class="px-md py-md text-right font-bold text-primary">{{ iss.quantityKg }}</td>
                  <td class="px-md py-md text-right text-sm text-on-surface-variant">
                    ₱{{ issuanceCost(iss) }}
                  </td>
                  <td class="px-md py-md">
                    <span class="px-sm py-xs rounded-full text-[10px] font-bold uppercase"
                          [class]="iss.session==='Morning' ? 'bg-primary-fixed text-on-primary-fixed-variant'
                                 : iss.session==='Noon'    ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
                                 : 'bg-secondary-fixed text-on-secondary-fixed-variant'">
                      {{ iss.session }}
                    </span>
                  </td>
                  <td class="px-md py-md text-sm text-on-surface-variant">{{ iss.issuedBy }}</td>
                  <td class="px-md py-md text-sm text-on-surface-variant">{{ iss.issuedAt }}</td>
                </tr>
              }
              @empty {
                <tr><td colspan="7" class="px-md py-xl text-center text-on-surface-variant">
                  No issuances match your filters.
                </td></tr>
              }
            </tbody>
            <tfoot class="bg-primary-container border-t-2 border-primary-fixed">
              <tr>
                <td class="px-md py-sm font-bold text-on-primary-container" colspan="2">Total (filtered)</td>
                <td class="px-md py-sm text-right font-bold text-on-primary">{{ totalIssuedKg() }} kg</td>
                <td class="px-md py-sm text-right font-bold text-on-primary">₱{{ totalIssuanceCost() }}</td>
                <td colspan="3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  }

  <!-- ════════ RECEIVING ════════ -->
  @if (activeTab === 'receiving') {
    <div>
      <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
        <div class="flex items-center justify-between px-lg py-md border-b border-outline-variant bg-surface-container-low">
          <h3 class="font-bold text-on-surface" style="font-size:15px">Feed Receiving History</h3>
          <button (click)="showReceivingForm=true"
                  class="flex items-center gap-xs bg-primary text-on-primary px-md py-xs rounded-lg text-label-md font-bold hover:opacity-90 transition-all">
            <span class="material-symbols-outlined text-[16px]">add</span>New Delivery
          </button>
        </div>
        <div class="divide-y divide-outline-variant">
          @for (r of receivings(); track r.id) {
            <div class="px-lg py-md hover:bg-surface-container-lowest transition-colors">
              <div class="flex items-start gap-md">
                <div class="w-10 h-10 rounded-xl bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center flex-shrink-0">
                  <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">local_shipping</span>
                </div>
                <div class="flex-1 grid grid-cols-2 md:grid-cols-4 gap-md">
                  <div>
                    <div class="text-[10px] font-bold text-on-surface-variant uppercase">Feed Type</div>
                    <div class="font-bold text-on-surface mt-xs">{{ r.feedType }}</div>
                    <div class="text-xs text-on-surface-variant">{{ r.supplier }}</div>
                  </div>
                  <div>
                    <div class="text-[10px] font-bold text-on-surface-variant uppercase">Quantity</div>
                    <div class="font-bold text-primary mt-xs">{{ r.quantityKg.toLocaleString() }} kg</div>
                    <div class="text-xs text-on-surface-variant">₱{{ r.pricePerKg }}/kg</div>
                  </div>
                  <div>
                    <div class="text-[10px] font-bold text-on-surface-variant uppercase">Total Value</div>
                    <div class="font-bold text-on-surface mt-xs">₱{{ (r.quantityKg * r.pricePerKg).toLocaleString() }}</div>
                    <div class="text-xs font-mono text-on-surface-variant">{{ r.batchNo }}</div>
                  </div>
                  <div>
                    <div class="text-[10px] font-bold text-on-surface-variant uppercase">Received</div>
                    <div class="font-semibold text-on-surface mt-xs">{{ r.receivedDate }}</div>
                    <div class="text-xs text-on-surface-variant">By {{ r.receivedBy }}</div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Receiving totals -->
        <div class="px-lg py-md bg-surface-container-low border-t border-outline-variant flex justify-between">
          <span class="font-bold text-on-surface">Total received (all time)</span>
          <span class="font-bold text-primary">{{ totalReceivedKg().toLocaleString() }} kg
            · ₱{{ totalReceivedValue().toLocaleString() }}</span>
        </div>
      </div>
    </div>
  }

  <!-- ════════ FCR ANALYSIS ════════ -->
  @if (activeTab === 'fcr') {
    <div class="space-y-md">
      <!-- Farm FCR summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div class="bg-primary rounded-2xl p-lg text-center">
          <div class="text-xs text-on-primary opacity-70 uppercase font-bold mb-xs">Farm Average FCR</div>
          <div class="font-bold text-on-primary" style="font-size:36px">1.38</div>
          <div class="text-xs text-on-primary opacity-70 mt-xs">Target: ≤ 1.45</div>
          <div class="mt-sm px-sm py-xs rounded-lg bg-primary-fixed inline-block">
            <span class="text-on-primary-fixed-variant text-xs font-bold">✓ On Target</span>
          </div>
        </div>
        <div class="bg-primary-fixed rounded-2xl p-lg text-center">
          <div class="text-xs text-on-primary-fixed-variant opacity-70 uppercase font-bold mb-xs">Best Batch</div>
          <div class="font-bold text-primary font-mono" style="font-size:28px">1.10</div>
          <div class="text-xs text-on-surface-variant mt-xs">B-2024-004 · Delta-1</div>
          <div class="text-xs text-on-surface-variant mt-xs">Day 5 · 2,800 kg feed</div>
        </div>
        <div class="bg-error-container rounded-2xl p-lg text-center">
          <div class="text-xs text-on-error-container opacity-70 uppercase font-bold mb-xs">Needs Attention</div>
          <div class="font-bold text-error font-mono" style="font-size:28px">1.68</div>
          <div class="text-xs text-on-surface-variant mt-xs">B-2024-005 · Alpha-2</div>
          <div class="text-xs text-error font-bold mt-xs">18% above target</div>
        </div>
      </div>

      <!-- Per-batch FCR table -->
      <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
        <div class="px-lg py-md border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
          <h3 class="font-bold text-on-surface" style="font-size:15px">FCR = Total Feed (kg) ÷ Total Eggs Produced</h3>
          <span class="text-xs text-on-surface-variant bg-surface-container px-sm py-xs rounded-lg">Target ≤ 1.45</span>
        </div>
        <div class="p-lg space-y-md">
          @for (b of fcrBatches; track b.batch) {
            <div class="p-md rounded-xl border"
                 [class]="b.fcr > 1.6 ? 'border-error bg-error-container/10'
                        : b.fcr > 1.45 ? 'border-secondary bg-secondary-fixed/10'
                        : 'border-outline-variant'">
              <div class="flex items-center justify-between mb-sm">
                <div>
                  <span class="font-bold text-on-surface font-mono">{{ b.batch }}</span>
                  <span class="text-xs text-on-surface-variant ml-md">{{ b.building }} · Day {{ b.age }}</span>
                </div>
                <div class="text-right">
                  <span class="font-bold text-[20px]"
                        [class]="b.fcr>1.6?'text-error':b.fcr>1.45?'text-secondary':'text-primary'">
                    FCR {{ b.fcr }}
                  </span>
                  @if (b.fcr > 1.45) {
                    <div class="text-xs text-error">+{{ ((b.fcr - 1.45) / 1.45 * 100).toFixed(0) }}% above target</div>
                  }
                </div>
              </div>
              <div class="w-full bg-surface-container rounded-full h-2.5 relative">
                <div class="absolute top-0 bottom-0 w-0.5 bg-secondary/80 z-10 rounded" style="left:72.5%"></div>
                <div class="h-2.5 rounded-full"
                     [class]="b.fcr>1.6?'bg-error':b.fcr>1.45?'bg-secondary-container':'bg-primary'"
                     [style.width.%]="Math.min(b.fcr/2*100,100)"></div>
              </div>
              <div class="flex justify-between mt-sm text-xs text-on-surface-variant">
                <span>Feed consumed: {{ b.feedKg.toLocaleString() }} kg</span>
                <span>Eggs produced: {{ b.eggs.toLocaleString() }}</span>
                <span class="font-bold">Cost/egg: ₱{{ fcrCostPerEgg(b) }}</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Feed cost analysis -->
      <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
        <h3 class="font-bold text-on-surface mb-md" style="font-size:15px">Feed Cost Analysis (Month-to-Date)</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-md">
          @for (cost of feedCostAnalysis; track cost.label) {
            <div class="bg-surface-container rounded-xl p-md text-center">
              <div class="font-bold" [class]="cost.color" style="font-size:18px">{{ cost.value }}</div>
              <div class="text-label-md text-on-surface-variant mt-xs">{{ cost.label }}</div>
            </div>
          }
        </div>
      </div>
    </div>
  }

  <!-- ════════ ISSUANCE MODAL ════════ -->
  @if (showIssuanceForm) {
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-lg">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto">
        <div class="px-xl py-lg border-b border-outline-variant flex items-center justify-between">
          <h3 class="font-bold text-on-surface" style="font-size:18px">Issue Feed to Building</h3>
          <button (click)="showIssuanceForm=false; resetIssuanceForm()"
                  class="p-xs hover:bg-surface-container rounded-lg">
            <span class="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div class="p-xl space-y-md">
          <div class="grid grid-cols-2 gap-md">
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Feed Type *</label>
              <select [(ngModel)]="issuanceForm.feedTypeId" (ngModelChange)="onIssuanceFeedChange()"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option [ngValue]="null">Select feed...</option>
                @for (f of feedStock(); track f.id) {
                  <option [ngValue]="f.id">{{ f.name }} ({{ f.quantityKg.toLocaleString() }} kg)</option>
                }
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Building *</label>
              <select [(ngModel)]="issuanceForm.building"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select building...</option>
                @for (b of buildings; track b) { <option>{{ b }}</option> }
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Flock Batch *</label>
              <select [(ngModel)]="issuanceForm.batch"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select batch...</option>
                @for (b of batches; track b) { <option>{{ b }}</option> }
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Session *</label>
              <select [(ngModel)]="issuanceForm.session"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
                @for (s of sessions; track s) { <option>{{ s }}</option> }
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Issued By *</label>
              <select [(ngModel)]="issuanceForm.issuedBy"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select worker...</option>
                @for (w of workers; track w) { <option>{{ w }}</option> }
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Quantity (kg) *</label>
              <div class="flex items-center gap-sm">
                <button (click)="issuanceForm.quantityKg = Math.max(0, issuanceForm.quantityKg - 50)"
                        class="w-8 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center font-bold">−</button>
                <input type="number" [(ngModel)]="issuanceForm.quantityKg" min="0"
                       class="flex-1 text-center border border-outline-variant rounded-lg px-sm py-sm text-body-md font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                <button (click)="issuanceForm.quantityKg = issuanceForm.quantityKg + 50"
                        class="w-8 h-9 rounded-lg bg-primary-fixed text-on-primary-fixed-variant hover:bg-primary hover:text-on-primary flex items-center justify-center font-bold">+</button>
              </div>
            </div>
          </div>
          <!-- Quick amounts -->
          <div class="flex gap-sm flex-wrap">
            <span class="text-label-md text-on-surface-variant self-center">Quick:</span>
            @for (amt of [100,200,350,450,500]; track amt) {
              <button (click)="issuanceForm.quantityKg = amt"
                      class="px-md py-xs rounded-lg border border-outline-variant text-label-md hover:border-primary hover:bg-primary-fixed transition-all">
                {{ amt }} kg
              </button>
            }
          </div>
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">Notes</label>
            <input [(ngModel)]="issuanceForm.notes" placeholder="Optional notes..."
                   class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
          </div>
          <!-- Summary -->
          @if (issuanceForm.feedTypeId && issuanceForm.quantityKg > 0) {
            <div class="bg-primary-container rounded-xl p-md flex justify-between items-center">
              <div>
                <div class="text-xs text-on-primary-container opacity-80">Deducting from stock</div>
                <div class="font-bold text-on-primary">{{ issuanceForm.quantityKg }} kg · ₱{{ issuanceSummaryCost() }}</div>
              </div>
              <div class="text-right">
                <div class="text-xs text-on-primary-container opacity-80">Remaining after issue</div>
                <div class="font-bold text-on-primary">{{ remainingAfterIssue() }} kg</div>
              </div>
            </div>
          }
          @if (issuanceError()) {
            <div class="bg-error-container text-on-error-container rounded-lg p-md text-sm flex items-center gap-sm">
              <span class="material-symbols-outlined text-[16px]">error</span>{{ issuanceError() }}
            </div>
          }
          <div class="flex gap-md pt-md border-t border-outline-variant">
            <button (click)="showIssuanceForm=false; resetIssuanceForm()"
                    class="flex-1 py-sm border border-outline rounded-lg text-label-md text-on-surface hover:bg-surface-container">Cancel</button>
            <button (click)="submitIssuance()"
                    class="flex-1 py-sm bg-primary text-on-primary rounded-lg text-label-md font-bold hover:opacity-90">
              Issue Feed
            </button>
          </div>
        </div>
      </div>
    </div>
  }

  <!-- ════════ RECEIVING MODAL ════════ -->
  @if (showReceivingForm) {
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-lg">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto">
        <div class="px-xl py-lg border-b border-outline-variant flex items-center justify-between">
          <h3 class="font-bold text-on-surface" style="font-size:18px">Receive Feed Delivery</h3>
          <button (click)="showReceivingForm=false; resetReceivingForm()"
                  class="p-xs hover:bg-surface-container rounded-lg">
            <span class="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div class="p-xl space-y-md">
          <div class="grid grid-cols-2 gap-md">
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Feed Type *</label>
              <select [(ngModel)]="receivingForm.feedTypeId"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option [ngValue]="null">Select feed type...</option>
                @for (f of feedStock(); track f.id) { <option [ngValue]="f.id">{{ f.name }}</option> }
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Supplier *</label>
              <select [(ngModel)]="receivingForm.supplier"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select supplier...</option>
                @for (s of suppliers; track s) { <option>{{ s }}</option> }
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Quantity (kg) *</label>
              <input type="number" [(ngModel)]="receivingForm.quantityKg" min="1"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Price per kg (₱) *</label>
              <input type="number" [(ngModel)]="receivingForm.pricePerKg" step="0.50" min="0"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">DR / Batch No.</label>
              <input [(ngModel)]="receivingForm.batchNo" placeholder="DR-2024-XXX"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Expiry Date</label>
              <input type="date" [(ngModel)]="receivingForm.expiryDate"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Received Date</label>
              <input type="date" [(ngModel)]="receivingForm.receivedDate"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Received By</label>
              <select [(ngModel)]="receivingForm.receivedBy"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select staff...</option>
                @for (w of workers; track w) { <option>{{ w }}</option> }
              </select>
            </div>
          </div>
          @if (receivingForm.quantityKg && receivingForm.pricePerKg) {
            <div class="bg-primary-container rounded-xl p-md flex justify-between items-center">
              <span class="font-bold text-on-primary-container">Total Delivery Value</span>
              <span class="font-bold text-on-primary" style="font-size:20px">
                ₱{{ (receivingForm.quantityKg * receivingForm.pricePerKg).toLocaleString() }}
              </span>
            </div>
          }
          @if (receivingError()) {
            <div class="bg-error-container text-on-error-container rounded-lg p-md text-sm flex items-center gap-sm">
              <span class="material-symbols-outlined text-[16px]">error</span>{{ receivingError() }}
            </div>
          }
          <div class="flex gap-md pt-md border-t border-outline-variant">
            <button (click)="showReceivingForm=false; resetReceivingForm()"
                    class="flex-1 py-sm border border-outline rounded-lg text-label-md text-on-surface hover:bg-surface-container">Cancel</button>
            <button (click)="submitReceiving()"
                    class="flex-1 py-sm bg-primary text-on-primary rounded-lg text-label-md font-bold hover:opacity-90">
              Confirm Receipt
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
export class FeedManagementComponent implements OnInit {
  private feedSvc = inject(FeedService);

  today = new Date().toLocaleDateString('en-PH',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  Math = Math;
  activeTab = 'stock';
  buildings = BUILDINGS;
  batches   = BATCHES;
  workers   = WORKERS;
  suppliers = SUPPLIERS;
  sessions  = SESSIONS;

  feedStock  = signal<FeedStock[]>(INITIAL_STOCK);
  issuances  = signal<FeedIssuance[]>(INITIAL_ISSUANCES);
  receivings = signal<FeedReceiving[]>(INITIAL_RECEIVINGS);
  toast      = signal('');
  private nextIssuanceId  = 5;
  private nextReceivingId = 3;

  // ── Filters ────────────────────────────────────────────────────────────────
  stockSearch          = '';
  stockCategoryFilter  = '';
  stockLevelFilter     = 'all';
  issuanceBuildingFilter = '';
  issuanceSessionFilter  = '';

  // ── Modal state ────────────────────────────────────────────────────────────
  showIssuanceForm  = false;
  showReceivingForm = false;
  issuanceError  = signal('');
  receivingError = signal('');

  issuanceForm = {
    feedTypeId: null as number|null, building:'', batch:'', session:'Morning' as SessionType,
    issuedBy:'', quantityKg:0, notes:'',
  };
  receivingForm = {
    feedTypeId: null as number|null, supplier:'', quantityKg:0, pricePerKg:0,
    batchNo:'', expiryDate:'', receivedDate: new Date().toISOString().split('T')[0],
    receivedBy:'',
  };

  get tabs() {
    return [
      { key:'stock',     label:'Stock Levels',     icon:'inventory_2',    badge: this.criticalStock().length },
      { key:'issuances', label:'Feed Issuances',   icon:'output',         badge: 0 },
      { key:'receiving', label:'Receiving',         icon:'local_shipping', badge: 0 },
      { key:'fcr',       label:'FCR Analysis',      icon:'analytics',      badge: 0 },
    ];
  }

  fcrBatches: FcrBatch[] = [
    { batch:'B-2024-004', building:'Delta-1', fcr:1.10, feedKg:2800,  eggs:2548,  age:5  },
    { batch:'B-2024-002', building:'Beta-2',  fcr:1.35, feedKg:18900, eggs:14000, age:18 },
    { batch:'B-2024-001', building:'Alpha-1', fcr:1.42, feedKg:58000, eggs:40845, age:32 },
    { batch:'B-2024-003', building:'Gamma-3', fcr:1.55, feedKg:72000, eggs:46452, age:45 },
    { batch:'B-2024-005', building:'Alpha-2', fcr:1.68, feedKg:9800,  eggs:5833,  age:12 },
  ];

  feedCostAnalysis = [
    { label:'Total Feed Cost MTD', value:'₱22,800',  color:'text-primary'   },
    { label:'Cost per Egg',         value:'₱0.54',    color:'text-secondary' },
    { label:'Feed % of Revenue',    value:'18.3%',    color:'text-on-surface'},
    { label:'Avg FCR this Month',   value:'1.38',     color:'text-primary'   },
  ];

  // ── Computed ───────────────────────────────────────────────────────────────
  criticalStock = computed(() => this.feedStock().filter(f => f.stockPct < 20));
  expiringStock = computed(() => this.feedStock().filter(f => f.expiryDate && this.isExpiringSoon(f.expiryDate)));

  kpis = computed(() => {
    const stock = this.feedStock();
    const totalKg  = stock.reduce((s,f) => s+f.quantityKg, 0);
    const totalVal = stock.reduce((s,f) => s+f.quantityKg*f.pricePerKg, 0);
    return [
      { label:'Total Stock',  value: `${(totalKg/1000).toFixed(1)}t`,            color:'text-primary'   },
      { label:'Stock Value',  value: '₱' + (totalVal/1000).toFixed(0) + 'k',     color:'text-primary'   },
      { label:'Critical',     value: this.criticalStock().length.toString(),      color:'text-error'     },
      { label:'Types',        value: stock.length.toString(),                     color:'text-on-surface'},
      { label:'Avg FCR',      value: '1.38',                                      color:'text-primary'   },
    ];
  });

  filteredStock = computed(() =>
    this.feedStock().filter(f => {
      const q = this.stockSearch.toLowerCase();
      if (q && !f.name.toLowerCase().includes(q) && !f.supplier.toLowerCase().includes(q)) return false;
      if (this.stockCategoryFilter && f.category !== this.stockCategoryFilter) return false;
      if (this.stockLevelFilter !== 'all' && this.stockLevel(f) !== this.stockLevelFilter) return false;
      return true;
    })
  );

  filteredIssuances = computed(() =>
    this.issuances().filter(i => {
      if (this.issuanceBuildingFilter && i.building !== this.issuanceBuildingFilter) return false;
      if (this.issuanceSessionFilter  && i.session  !== this.issuanceSessionFilter)  return false;
      return true;
    })
  );

  totalIssuedKg    = computed(() => this.filteredIssuances().reduce((s,i) => s+i.quantityKg, 0));
  totalReceivedKg  = computed(() => this.receivings().reduce((s,r) => s+r.quantityKg, 0));
  totalReceivedValue = computed(() => this.receivings().reduce((s,r) => s+r.quantityKg*r.pricePerKg, 0));

  totalIssuanceCost = computed(() => {
    return this.filteredIssuances().reduce((s,i) => {
      const stock = this.feedStock().find(f => f.id === i.feedTypeId);
      return s + i.quantityKg * (stock?.pricePerKg ?? 0);
    }, 0).toLocaleString();
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.feedSvc.getFcr().subscribe({
      next: (data: any) => {
        if (data?.by_batch?.length) {
          this.fcrBatches = data.by_batch.map((b: any) => ({
            batch:    b.batch ?? b.batchCode ?? '',
            building: b.building ?? b.houseName ?? '',
            fcr:      b.fcr ?? 1.38,
            age:      b.age ?? b.ageDays ?? 0,
            feedKg:   b.feed_kg ?? b.feedKg ?? 0,
            eggs:     b.eggs ?? b.eggs_produced ?? 0,
          }));
        }
      },
      error: () => {},
    });
    this.feedSvc.getStock().subscribe({
      next: (data: any) => {
        if (data?.length) this.feedStock.set(data.map((f: any) => ({
          id:f.id, name:f.name, category:f.category as FeedCategory,
          quantityKg:f.quantity_kg??f.quantityKg??0,
          pricePerKg:f.price_per_kg??f.pricePerKg??0,
          receivedDate:f.received_date??f.receivedDate??'',
          supplier:f.supplier??'',
          stockPct:Math.round((f.quantity_kg??f.quantityKg??0)/MAX_CAPACITY*100),
          maxCapacityKg:MAX_CAPACITY,
        })));
      },
      error: () => {}, // keep initial data
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  stockLevel(f: FeedStock): string {
    return f.stockPct < 15 ? 'critical' : f.stockPct < 30 ? 'low' : 'ok';
  }

  daysOfSupply(f: FeedStock): number {
    const avgDailyUse = this.issuances()
      .filter(i => i.feedTypeId === f.id)
      .reduce((s,i) => s+i.quantityKg, 0) / 7;
    return avgDailyUse > 0 ? Math.round(f.quantityKg / avgDailyUse) : 99;
  }

  isExpiringSoon(date: string): boolean {
    return (new Date(date).getTime() - Date.now()) < 30 * 86400000;
  }

  issuanceCost(iss: FeedIssuance): string {
    const stock = this.feedStock().find(f => f.id === iss.feedTypeId);
    return stock ? (iss.quantityKg * stock.pricePerKg).toLocaleString() : '—';
  }

  fcrCostPerEgg(b: FcrBatch): string {
    const avgPrice = this.feedStock().reduce((s,f)=>s+f.pricePerKg,0) / this.feedStock().length;
    return ((b.feedKg * avgPrice) / b.eggs).toFixed(2);
  }

  catBg(cat: FeedCategory): string {
    const m: Record<FeedCategory,string> = { starter:'bg-primary-fixed text-on-primary-fixed-variant', grower:'bg-secondary-fixed text-on-secondary-fixed-variant', finisher:'bg-tertiary-fixed text-on-tertiary-fixed-variant', layer:'bg-primary-container text-on-primary-container' };
    return m[cat];
  }

  catColor(cat: FeedCategory): string {
    const m: Record<FeedCategory,string> = { starter:'bg-primary-fixed text-on-primary-fixed-variant', grower:'bg-secondary-fixed text-on-secondary-fixed-variant', finisher:'bg-tertiary-fixed text-on-tertiary-fixed-variant', layer:'bg-primary-container text-on-primary-container' };
    return m[cat];
  }

  // ── Quick actions ──────────────────────────────────────────────────────────
  issueFrom(feed: FeedStock): void {
    this.issuanceForm.feedTypeId = feed.id;
    this.activeTab = 'issuances';
    this.showIssuanceForm = true;
  }

  reorderFor(feed: FeedStock): void {
    this.receivingForm.feedTypeId = feed.id;
    this.receivingForm.supplier   = feed.supplier;
    this.receivingForm.pricePerKg = feed.pricePerKg;
    this.activeTab = 'receiving';
    this.showReceivingForm = true;
  }

  // ── Issuance form ──────────────────────────────────────────────────────────
  onIssuanceFeedChange(): void { this.issuanceForm.quantityKg = 0; }

  issuanceSummaryCost(): string {
    const stock = this.feedStock().find(f => f.id === this.issuanceForm.feedTypeId);
    return stock ? (this.issuanceForm.quantityKg * stock.pricePerKg).toLocaleString() : '0';
  }

  remainingAfterIssue(): string {
    const stock = this.feedStock().find(f => f.id === this.issuanceForm.feedTypeId);
    return stock ? Math.max(0, stock.quantityKg - this.issuanceForm.quantityKg).toLocaleString() : '—';
  }

  submitIssuance(): void {
    if (!this.issuanceForm.feedTypeId) { this.issuanceError.set('Select a feed type.'); return; }
    if (!this.issuanceForm.building)   { this.issuanceError.set('Select a building.');  return; }
    if (!this.issuanceForm.batch)      { this.issuanceError.set('Select a batch.');      return; }
    if (!this.issuanceForm.issuedBy)   { this.issuanceError.set('Select issuer.');       return; }
    if (this.issuanceForm.quantityKg <= 0) { this.issuanceError.set('Enter quantity > 0.'); return; }

    const stock = this.feedStock().find(f => f.id === this.issuanceForm.feedTypeId)!;
    if (this.issuanceForm.quantityKg > stock.quantityKg) {
      this.issuanceError.set(`Insufficient stock. Only ${stock.quantityKg} kg available.`); return;
    }

    // Deduct from stock
    this.feedStock.update(list => list.map(f => f.id === this.issuanceForm.feedTypeId
      ? { ...f, quantityKg: f.quantityKg - this.issuanceForm.quantityKg,
          stockPct: Math.round(((f.quantityKg - this.issuanceForm.quantityKg) / f.maxCapacityKg) * 100) }
      : f
    ));

    this.issuances.update(list => [{
      id: this.nextIssuanceId++,
      feedTypeId: this.issuanceForm.feedTypeId!,
      feedType:   stock.name,
      building:   this.issuanceForm.building,
      batch:      this.issuanceForm.batch,
      quantityKg: this.issuanceForm.quantityKg,
      session:    this.issuanceForm.session,
      issuedBy:   this.issuanceForm.issuedBy,
      issuedAt:   'Just now',
      notes:      this.issuanceForm.notes,
    }, ...list]);

    // Also call API
    this.feedSvc.logIssuance({
      feed_stock_id:  this.issuanceForm.feedTypeId!,
      flock_batch_id: 1,
      building_id:    1,
      issued_by:      1,
      quantity_kg:    this.issuanceForm.quantityKg,
      session:        this.issuanceForm.session,
      notes:          this.issuanceForm.notes,
    }).subscribe();

    this.showIssuanceForm = false;
    this.resetIssuanceForm();
    this.showToast(`Feed issued: ${this.issuanceForm.quantityKg || ''} kg deducted from ${stock.name}.`);
  }

  resetIssuanceForm(): void {
    this.issuanceForm = { feedTypeId:null, building:'', batch:'', session:'Morning', issuedBy:'', quantityKg:0, notes:'' };
    this.issuanceError.set('');
  }

  // ── Receiving form ─────────────────────────────────────────────────────────
  submitReceiving(): void {
    if (!this.receivingForm.feedTypeId) { this.receivingError.set('Select a feed type.'); return; }
    if (!this.receivingForm.supplier)   { this.receivingError.set('Select a supplier.');  return; }
    if (this.receivingForm.quantityKg <= 0) { this.receivingError.set('Enter quantity > 0.'); return; }
    if (this.receivingForm.pricePerKg <= 0) { this.receivingError.set('Enter price > 0.');    return; }

    const stock = this.feedStock().find(f => f.id === this.receivingForm.feedTypeId)!;

    // Add to stock
    this.feedStock.update(list => list.map(f => f.id === this.receivingForm.feedTypeId
      ? { ...f, quantityKg: f.quantityKg + this.receivingForm.quantityKg,
          pricePerKg: this.receivingForm.pricePerKg,
          stockPct: Math.min(100, Math.round(((f.quantityKg + this.receivingForm.quantityKg) / f.maxCapacityKg) * 100)),
          receivedDate: this.receivingForm.receivedDate,
          batchNo: this.receivingForm.batchNo || f.batchNo,
          expiryDate: this.receivingForm.expiryDate || f.expiryDate,
          supplier: this.receivingForm.supplier,
        }
      : f
    ));

    this.receivings.update(list => [{
      id: this.nextReceivingId++,
      feedTypeId:   this.receivingForm.feedTypeId!,
      feedType:     stock.name,
      supplier:     this.receivingForm.supplier,
      quantityKg:   this.receivingForm.quantityKg,
      pricePerKg:   this.receivingForm.pricePerKg,
      batchNo:      this.receivingForm.batchNo || `FS-${Date.now()}`,
      receivedDate: this.receivingForm.receivedDate,
      expiryDate:   this.receivingForm.expiryDate,
      receivedBy:   this.receivingForm.receivedBy || 'Staff',
    }, ...list]);

    // Call API to record the delivery
    this.feedSvc.logReceiving({
      feed_type_id:  this.receivingForm.feedTypeId!,
      supplier:      this.receivingForm.supplier,
      quantity_kg:   this.receivingForm.quantityKg,
      price_per_kg:  this.receivingForm.pricePerKg,
      batch_number:  this.receivingForm.batchNo,
      expiry_date:   this.receivingForm.expiryDate,
      received_date: this.receivingForm.receivedDate,
      received_by:   this.receivingForm.receivedBy,
    }).subscribe();
    this.showReceivingForm = false;
    this.resetReceivingForm();
    this.showToast(`${this.receivingForm.quantityKg || ''} kg of ${stock?.name} added to stock.`);
  }

  resetReceivingForm(): void {
    this.receivingForm = {
      feedTypeId:null, supplier:'', quantityKg:0, pricePerKg:0,
      batchNo:'', expiryDate:'', receivedDate:new Date().toISOString().split('T')[0], receivedBy:''
    };
    this.receivingError.set('');
  }

  private showToast(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 4000);
  }
  criticalStockNames(): string { return this.criticalStock().map((f: any) => f.name).join(', '); }

}
