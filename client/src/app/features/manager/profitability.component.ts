import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../../core/services/index';

interface PnlRow {
  label: string;
  amount: number;
  isSubtotal?: boolean;
  isTotal?: boolean;
  isNegative?: boolean;
  indent?: boolean;
}

interface CostBreakdown {
  label: string;
  amount: number;
  pct: number;
  color: string;
  icon: string;
}

interface BatchProfit {
  batch: string;
  building: string;
  revenue: number;
  feedCost: number;
  medicineCost: number;
  laborAlloc: number;
  mortalityLoss: number;
  grossProfit: number;
  grossMarginPct: number;
  costPerEgg: number;
  eggsProduced: number;
}

@Component({
  selector: 'app-profitability',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-lg max-w-5xl mx-auto pb-xl space-y-gutter">

      <!-- Header -->
      <div class="flex items-center gap-md">
        <a routerLink="/manager/dashboard"
           class="p-sm hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant">
          <span class="material-symbols-outlined">arrow_back</span>
        </a>
        <div class="flex-1">
          <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">Profitability Tracker</h1>
          <p class="text-body-md text-on-surface-variant">{{ today }}</p>
        </div>
        <div class="flex gap-sm">
          <select [(ngModel)]="period"
                  class="border border-outline-variant rounded-lg px-md py-sm text-body-md
                         focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option value="mtd">Month to Date</option>
            <option value="q1">Q1 2024</option>
            <option value="ytd">Year to Date</option>
          </select>
          <button class="flex items-center gap-sm border border-outline text-on-surface px-lg py-sm
                         rounded-lg text-label-md hover:bg-surface-container transition-all">
            <span class="material-symbols-outlined text-[18px]">download</span> Export
          </button>
        </div>
      </div>

      <!-- Hero profit gauge -->
      <div class="bg-primary rounded-2xl p-xl relative overflow-hidden">
        <div class="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-xl items-center">

          <!-- Left: gauge -->
          <div class="flex flex-col items-center">
            <div class="relative w-40 h-40">
              <svg class="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="12"/>
                <circle cx="60" cy="60" r="50" fill="none" stroke="#a5d0b9" stroke-width="12"
                        stroke-dasharray="314"
                        [attr.stroke-dashoffset]="314 * (1 - grossMarginPct / 100)"
                        stroke-linecap="round"/>
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="font-bold text-on-primary" style="font-size:28px;line-height:32px">{{ grossMarginPct }}%</span>
                <span class="text-xs text-on-primary opacity-70 mt-xs">Gross Margin</span>
              </div>
            </div>
            <p class="text-on-primary opacity-70 text-xs mt-md text-center">Target: ≥ 65% gross margin</p>
          </div>

          <!-- Middle: P&L summary -->
          <div class="space-y-md">
            @for (row of heroRows; track row.label) {
              <div class="flex justify-between items-center border-b border-on-primary/20 pb-sm last:border-0">
                <span class="text-on-primary opacity-80 text-sm">{{ row.label }}</span>
                <span class="font-bold text-on-primary" [style.font-size]="row.big ? '20px' : '15px'">
                  ₱{{ row.amount.toLocaleString() }}
                </span>
              </div>
            }
          </div>

          <!-- Right: unit economics -->
          <div class="space-y-md">
            @for (metric of unitMetrics; track metric.label) {
              <div class="bg-white/10 rounded-xl p-md">
                <div class="text-xs text-on-primary opacity-70 uppercase font-bold mb-xs">{{ metric.label }}</div>
                <div class="font-bold text-on-primary" style="font-size:20px">{{ metric.value }}</div>
                <div class="text-xs text-on-primary opacity-60 mt-xs">{{ metric.note }}</div>
              </div>
            }
          </div>
        </div>
        <div class="absolute -top-12 -right-12 w-48 h-48 bg-primary-container/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      <!-- Main content grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-gutter">

        <!-- P&L Statement -->
        <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
          <div class="px-lg py-md bg-surface-container-low border-b border-outline-variant">
            <h3 class="font-bold text-on-surface" style="font-size:16px">P&L Statement</h3>
            <p class="text-xs text-on-surface-variant mt-xs">{{ periodLabel }}</p>
          </div>
          <div class="divide-y divide-outline-variant">
            @for (row of pnlRows; track row.label) {
              <div class="flex items-center justify-between px-lg py-sm"
                   [class]="row.isTotal ? 'bg-primary-container' : row.isSubtotal ? 'bg-surface-container-low' : ''">
                <span class="text-sm"
                      [class]="row.isTotal ? 'font-bold text-on-primary' : row.isSubtotal ? 'font-bold text-on-surface' : row.indent ? 'text-on-surface-variant pl-md' : 'text-on-surface'">
                  {{ row.label }}
                </span>
                <span class="font-bold text-sm"
                      [class]="row.isTotal ? 'text-on-primary' : row.isNegative ? 'text-error' : 'text-primary'">
                  {{ row.isNegative ? '−' : '' }}₱{{ row.amount.toLocaleString() }}
                </span>
              </div>
            }
          </div>
        </div>

        <!-- Cost breakdown donut + list -->
        <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
          <h3 class="font-bold text-on-surface mb-lg" style="font-size:16px">Cost Breakdown</h3>

          <!-- Simple visual bars -->
          <div class="space-y-md mb-lg">
            @for (cost of costBreakdown; track cost.label) {
              <div>
                <div class="flex justify-between text-sm mb-xs">
                  <div class="flex items-center gap-sm">
                    <span class="material-symbols-outlined text-[16px]" [class]="cost.color"
                          style="font-variation-settings:'FILL' 1">{{ cost.icon }}</span>
                    <span class="font-semibold text-on-surface">{{ cost.label }}</span>
                  </div>
                  <div class="text-right">
                    <span class="font-bold text-on-surface">₱{{ cost.amount.toLocaleString() }}</span>
                    <span class="text-on-surface-variant ml-sm text-xs">{{ cost.pct }}%</span>
                  </div>
                </div>
                <div class="w-full bg-surface-container rounded-full h-2.5">
                  <div class="h-2.5 rounded-full transition-all duration-500"
                       [class]="cost.color.replace('text-', 'bg-').replace('-fixed-variant','').replace('-container','').replace('-on-','bg-').split(' ')[0]"
                       [style.width.%]="cost.pct">
                  </div>
                </div>
              </div>
            }
          </div>

          <div class="pt-md border-t border-outline-variant flex justify-between">
            <span class="font-bold text-on-surface">Total Operating Cost</span>
            <span class="font-bold text-on-surface">₱{{ totalCosts.toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- Per-batch profitability table -->
      <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
        <div class="flex items-center justify-between px-lg py-md border-b border-outline-variant">
          <h3 class="font-bold text-on-surface" style="font-size:16px">Profitability by Batch</h3>
          <span class="text-xs text-on-surface-variant">Cost per egg includes: feed + medicine + labor + mortality</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead class="bg-surface-container-low">
              <tr>
                @for (h of tableHeaders; track h) {
                  <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider"
                      [class]="h.right ? 'text-right' : ''">
                    {{ h.label }}
                  </th>
                }
              </tr>
            </thead>
            <tbody class="divide-y divide-outline-variant">
              @for (b of batchProfits; track b.batch) {
                <tr class="hover:bg-surface-container-lowest transition-colors">
                  <td class="px-md py-md">
                    <p class="font-bold text-on-surface text-sm">{{ b.batch }}</p>
                    <p class="text-xs text-on-surface-variant">{{ b.building }}</p>
                  </td>
                  <td class="px-md py-md text-right">
                    <span class="font-bold text-primary">₱{{ b.revenue.toLocaleString() }}</span>
                  </td>
                  <td class="px-md py-md text-right text-on-surface-variant text-sm">
                    ₱{{ b.feedCost.toLocaleString() }}
                  </td>
                  <td class="px-md py-md text-right text-on-surface-variant text-sm">
                    ₱{{ (b.medicineCost + b.laborAlloc + b.mortalityLoss).toLocaleString() }}
                  </td>
                  <td class="px-md py-md text-right">
                    <span class="font-bold" [class]="b.grossProfit > 0 ? 'text-primary' : 'text-error'">
                      ₱{{ b.grossProfit.toLocaleString() }}
                    </span>
                  </td>
                  <td class="px-md py-md text-center">
                    <span class="px-sm py-xs rounded-full text-[10px] font-bold"
                          [class]="b.grossMarginPct >= 65 ? 'bg-primary-fixed text-on-primary-fixed-variant'
                                 : b.grossMarginPct >= 50 ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                                 : 'bg-error-container text-on-error-container'">
                      {{ b.grossMarginPct }}%
                    </span>
                  </td>
                  <td class="px-md py-md text-right">
                    <span class="font-bold text-sm"
                          [class]="b.costPerEgg < 2.0 ? 'text-primary' : b.costPerEgg < 2.5 ? 'text-secondary' : 'text-error'">
                      ₱{{ b.costPerEgg.toFixed(2) }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
            <tfoot class="bg-primary-container border-t-2 border-primary-fixed">
              <tr>
                <td class="px-md py-md font-bold text-on-primary">Total / Average</td>
                <td class="px-md py-md text-right font-bold text-on-primary">
                  ₱{{ totalRevenue.toLocaleString() }}
                </td>
                <td class="px-md py-md text-right font-bold text-on-primary">
                  ₱{{ totalFeed.toLocaleString() }}
                </td>
                <td class="px-md py-md text-right font-bold text-on-primary">
                  ₱{{ totalOther.toLocaleString() }}
                </td>
                <td class="px-md py-md text-right font-bold text-on-primary">
                  ₱{{ totalGrossProfit.toLocaleString() }}
                </td>
                <td class="px-md py-md text-center font-bold text-on-primary">
                  {{ grossMarginPct }}%
                </td>
                <td class="px-md py-md text-right font-bold text-on-primary">
                  ₱{{ avgCostPerEgg.toFixed(2) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </div>
  `,
})
export class ProfitabilityComponent implements OnInit {
  private analyticsSvc = inject(AnalyticsService);

  ngOnInit(): void {
    this.analyticsSvc.getProfitability().subscribe({
      next: (data: any) => {
        if (!data) return;
        if (data.gross_margin_pct) this.grossMarginPct = data.gross_margin_pct;
        if (data.revenue)          this.heroRows[0].amount = data.revenue;
        if (data.feed_costs)       this.heroRows[1].amount = data.feed_costs;
        if (data.gross_profit)     this.heroRows[2].amount = data.gross_profit;
        if (data.cost_per_egg)     this.unitMetrics[0].value = '₱' + data.cost_per_egg;
        if (data.revenue_per_egg)  this.unitMetrics[1].value = '₱' + data.revenue_per_egg;
        if (data.margin_per_egg)   this.unitMetrics[2].value = '₱' + data.margin_per_egg;
        if (data.by_batch?.length) {
          this.batchProfits = data.by_batch.map((b: any) => ({
            batch:          b.batch ?? b.batchCode ?? '',
            building:       b.building ?? b.houseName ?? '',
            revenue:        b.revenue ?? 0,
            feedCost:       b.feed_cost ?? b.feedCost ?? 0,
            medicineCost:   b.medicine_costs ?? b.medicineCost ?? 0,
            laborAlloc:     b.labor ?? b.laborAlloc ?? 0,
            mortalityLoss:  b.mortality_loss ?? b.mortalityLoss ?? 0,
            grossProfit:    b.gross_profit ?? b.grossProfit ?? 0,
            grossMarginPct: b.gross_margin_pct ?? b.grossMarginPct ?? 0,
            costPerEgg:     parseFloat(b.cost_per_egg ?? b.costPerEgg ?? 0),
            eggsProduced:   b.eggs_produced ?? b.eggsProduced ?? 0,
          }));
        }
      },
      error: () => {}, // keep hardcoded fallback data
    });
  }
  today  = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  period = 'mtd';

  get periodLabel(): string {
    return this.period === 'mtd' ? 'Month to Date (Feb 2024)' : this.period === 'q1' ? 'Q1 2024 (Jan–Mar)' : 'Year to Date 2024';
  }

  grossMarginPct = 75;

  heroRows = [
    { label: 'Gross Revenue',   amount: 124500, big: false },
    { label: 'Total Costs',     amount:  31125, big: false },
    { label: 'Net Profit',      amount:  93375, big: true  },
  ];

  unitMetrics = [
    { label: 'Cost per Egg',      value: '₱1.84',  note: 'Feed + Medicine + Labor' },
    { label: 'Revenue per Egg',   value: '₱2.50',  note: 'Avg selling price' },
    { label: 'Margin per Egg',    value: '₱0.66',  note: '26.5% net margin' },
  ];

  pnlRows: PnlRow[] = [
    { label: 'REVENUE',                               amount: 124500, isSubtotal: true },
    { label: 'Egg sales (large)',                     amount:  84000, indent: true },
    { label: 'Egg sales (medium)',                    amount:  28000, indent: true },
    { label: 'Egg sales (small/jumbo)',               amount:  12500, indent: true },
    { label: 'COST OF GOODS',                         amount:  22800, isSubtotal: true },
    { label: 'Feed costs',                            amount:  18200, indent: true, isNegative: true },
    { label: 'Packaging & storage',                   amount:   4600, indent: true, isNegative: true },
    { label: 'GROSS PROFIT',                          amount: 101700, isSubtotal: true },
    { label: 'OPERATING EXPENSES',                    amount:   8325, isSubtotal: true },
    { label: 'Medicine & vaccines',                   amount:   3200, indent: true, isNegative: true },
    { label: 'Labor (direct)',                        amount:   5125, indent: true, isNegative: true },
    { label: 'NET PROFIT',                            amount:  93375, isTotal: true },
  ];

  costBreakdown: CostBreakdown[] = [
    { label: 'Feed Costs',       amount: 18200, pct: 58, color: 'text-primary',             icon: 'grass'         },
    { label: 'Labor',            amount:  5125, pct: 16, color: 'text-secondary',           icon: 'people'        },
    { label: 'Medicine',         amount:  3200, pct: 10, color: 'text-on-surface',          icon: 'vaccines'      },
    { label: 'Packaging',        amount:  4600, pct: 15, color: 'text-on-tertiary-fixed-variant', icon: 'inventory_2' },
  ];

  get totalCosts(): number { return this.costBreakdown.reduce((s, c) => s + c.amount, 0); }

  batchProfits: BatchProfit[] = [
    { batch: 'B-2024-001', building: 'Alpha-1', revenue: 42000, feedCost: 8200, medicineCost: 800,  laborAlloc: 1500, mortalityLoss: 600,  grossProfit: 30900, grossMarginPct: 74, costPerEgg: 1.71, eggsProduced: 12800 },
    { batch: 'B-2024-002', building: 'Beta-2',  revenue: 38000, feedCost: 7100, medicineCost: 1200, laborAlloc: 1500, mortalityLoss: 200,  grossProfit: 28000, grossMarginPct: 74, costPerEgg: 1.58, eggsProduced: 15000 },
    { batch: 'B-2024-004', building: 'Delta-1', revenue: 22000, feedCost: 2800, medicineCost: 200,  laborAlloc: 1000, mortalityLoss:  80,  grossProfit: 17920, grossMarginPct: 81, costPerEgg: 1.30, eggsProduced:  9800 },
    { batch: 'B-2024-005', building: 'Alpha-2', revenue: 14500, feedCost: 4200, medicineCost: 900,  laborAlloc: 1125, mortalityLoss: 800,  grossProfit:  7475, grossMarginPct: 52, costPerEgg: 2.53, eggsProduced:  7200 },
    { batch: 'B-2024-003', building: 'Gamma-3', revenue:  8000, feedCost: 2100, medicineCost: 100,  laborAlloc: 1000, mortalityLoss: 200,  grossProfit:  4600, grossMarginPct: 58, costPerEgg: 2.10, eggsProduced:  8900 },
  ];

  get totalRevenue():     number { return this.batchProfits.reduce((s, b) => s + b.revenue,     0); }
  get totalFeed():        number { return this.batchProfits.reduce((s, b) => s + b.feedCost,    0); }
  get totalOther():       number { return this.batchProfits.reduce((s, b) => s + b.medicineCost + b.laborAlloc + b.mortalityLoss, 0); }
  get totalGrossProfit(): number { return this.batchProfits.reduce((s, b) => s + b.grossProfit, 0); }
  get avgCostPerEgg():    number {
    const totalEggs = this.batchProfits.reduce((s, b) => s + b.eggsProduced, 0);
    const totalCost = this.batchProfits.reduce((s, b) => s + b.feedCost + b.medicineCost + b.laborAlloc + b.mortalityLoss, 0);
    return totalEggs ? totalCost / totalEggs : 0;
  }

  tableHeaders = [
    { label: 'Batch',         right: false },
    { label: 'Revenue',       right: true  },
    { label: 'Feed Cost',     right: true  },
    { label: 'Other Costs',   right: true  },
    { label: 'Gross Profit',  right: true  },
    { label: 'Margin',        right: false },
    { label: 'Cost / Egg',    right: true  },
  ];
}
