import { DataRefreshService } from '../../core/services/data-refresh.service';
import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { EggStockService } from '../../core/services/egg-stock.service';
import { NotificationService } from '../../core/services/notification.service';

type EggSize   = 'small' | 'medium' | 'large' | 'extra_large' | 'jumbo';
type PayMethod = 'cash' | 'credit' | 'bank-transfer';
type SaleStatus = 'paid' | 'pending' | 'overdue';
type ActiveTab  = 'sales' | 'customers' | 'reports';

interface Customer {
  id: number; name: string; type: 'Wholesale'|'Retail'|'Restaurant';
  contact: string; phone: string; email: string;
  address: string; balance: number; creditLimit: number; active: boolean;
}

interface LineItem  { eggSize: EggSize; qty: number; unitPrice: number; }
interface Sale {
  id: number; invoiceNo: string; customerId: number; customerName: string;
  date: string; saleDate: string; total: number;
  payMethod: PayMethod; status: SaleStatus; items: LineItem[];
  notes?: string;
}

interface SalesKpi { label: string; value: string; color: string; sub: string; }

const SIZE_PRICES: Record<EggSize, number> = { small:1.80, medium:2.10, large:2.50, extra_large:3.00, jumbo:3.50 };
const SIZE_LABELS: Record<EggSize, string> = { small:'Small', medium:'Medium', large:'Large', extra_large:'Extra Large', jumbo:'Jumbo' };
const EGG_SIZES: EggSize[] = ['small','medium','large','extra_large','jumbo'];

const INITIAL_CUSTOMERS: Customer[] = [
  { id:1, name:'Metro Fresh Market',     type:'Wholesale',  contact:'Ramon Gil',    phone:'+63 912 777 8888', email:'order@metrofresh.ph',  address:'Batangas City', balance:12500, creditLimit:50000, active:true  },
  { id:2, name:'Sunrise Supermarket',    type:'Wholesale',  contact:'Elena Santos', phone:'+63 913 888 9999', email:'buy@sunrise.ph',        address:'Lipa City',     balance:0,     creditLimit:30000, active:true  },
  { id:3, name:'Casa Manila Restaurant', type:'Restaurant', contact:'Chef Marcos',  phone:'+63 914 999 0000', email:'chef@casamanila.com',   address:'Batangas City', balance:5000,  creditLimit:20000, active:true  },
  { id:4, name:"Aling Nena's Store",     type:'Retail',     contact:'Nena Reyes',   phone:'+63 915 000 1111', email:'',                      address:'Rosario, Batangas', balance:1200, creditLimit:5000, active:true  },
  { id:5, name:'Golden Egg Distributors',type:'Wholesale',  contact:'Gary Tan',     phone:'+63 916 111 2222', email:'g.tan@goldenegg.ph',    address:'Manila',        balance:25000, creditLimit:80000, active:false },
];

const INITIAL_SALES: Sale[] = [
  { id:1, invoiceNo:'INV-1042', customerId:1, customerName:'Metro Fresh Market',     date:'Today 10:15 AM',    saleDate:today(), total:24500, payMethod:'cash',          status:'paid',    items:[{eggSize:'large',qty:8000,unitPrice:2.50},{eggSize:'medium',qty:2000,unitPrice:2.10}] },
  { id:2, invoiceNo:'INV-1041', customerId:2, customerName:'Sunrise Supermarket',    date:'Yesterday 2:30 PM', saleDate:daysAgo(1), total:15600, payMethod:'bank-transfer', status:'paid', items:[{eggSize:'large',qty:5000,unitPrice:2.50},{eggSize:'small',qty:1200,unitPrice:1.80}] },
  { id:3, invoiceNo:'INV-1040', customerId:3, customerName:'Casa Manila Restaurant', date:'2 days ago',        saleDate:daysAgo(2), total:8750,  payMethod:'credit',     status:'pending', items:[{eggSize:'extra_large',qty:2500,unitPrice:3.00},{eggSize:'jumbo',qty:500,unitPrice:3.50}] },
  { id:4, invoiceNo:'INV-1039', customerId:4, customerName:"Aling Nena's Store",     date:'3 days ago',        saleDate:daysAgo(3), total:2160,  payMethod:'cash',       status:'paid',    items:[{eggSize:'medium',qty:800,unitPrice:2.10},{eggSize:'small',qty:300,unitPrice:1.80}] },
  { id:5, invoiceNo:'INV-1038', customerId:1, customerName:'Metro Fresh Market',     date:'4 days ago',        saleDate:daysAgo(4), total:31250, payMethod:'credit',     status:'overdue', items:[{eggSize:'large',qty:10000,unitPrice:2.50},{eggSize:'extra_large',qty:2500,unitPrice:3.00}] },
  { id:6, invoiceNo:'INV-1037', customerId:5, customerName:'Golden Egg Distributors',date:'5 days ago',        saleDate:daysAgo(5), total:45000, payMethod:'credit',     status:'overdue', items:[{eggSize:'large',qty:12000,unitPrice:2.50},{eggSize:'extra_large',qty:6000,unitPrice:3.00}] },
];

function today(): string { return new Date().toISOString().split('T')[0]; }
function daysAgo(n: number): string { const d = new Date(); d.setDate(d.getDate()-n); return d.toISOString().split('T')[0]; }

@Component({
  selector: 'app-sales',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-lg max-w-6xl mx-auto pb-xl">

  <!-- Header -->
  <div class="flex items-center justify-between mb-lg">
    <div>
      <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">Sales Management</h1>
      <p class="text-body-md text-on-surface-variant">
        {{ today }}
        @if (loading()) {
          <span class="inline-flex items-center gap-xs ml-sm">
            <span class="material-symbols-outlined text-[14px] animate-spin">refresh</span>Loading...
          </span>
        }
      </p>
    </div>
    <div class="flex gap-sm">
      <button (click)="activeTab='customers'; showCustomerForm=true"
              class="flex items-center gap-sm border border-outline text-on-surface px-lg py-sm rounded-lg text-label-md hover:bg-surface-container transition-all">
        <span class="material-symbols-outlined text-[18px]">person_add</span>Add Customer
      </button>
      <button (click)="openNewSale()"
              class="flex items-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-lg text-label-md font-bold hover:opacity-90 transition-all">
        <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">add_shopping_cart</span>New Sale
      </button>
    </div>
  </div>

  <!-- KPI strip -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-md mb-lg">
    @for (k of kpis(); track k.label) {
      <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm text-center hover:shadow-md transition-all">
        <div class="font-bold" [class]="k.color" style="font-size:24px">{{ k.value }}</div>
        <div class="text-label-md text-on-surface-variant uppercase tracking-wide mt-xs">{{ k.label }}</div>
        <div class="text-xs text-on-surface-variant mt-xs">{{ k.sub }}</div>
      </div>
    }
  </div>

  <!-- Tabs -->
  <div class="flex gap-xs mb-lg border-b border-outline-variant overflow-x-auto pb-xs">
    @for (tab of tabs; track tab.key) {
      <button (click)="activeTab = $any(tab.key)"
              class="px-lg py-sm text-label-md font-bold transition-all border-b-2 -mb-px whitespace-nowrap flex items-center gap-xs"
              [class]="activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'">
        <span class="material-symbols-outlined text-[16px]">{{ tab.icon }}</span>{{ tab.label }}
        @if (tab.key === 'sales' && pendingCount() > 0) {
          <span class="ml-xs px-xs rounded-full text-[10px] font-bold bg-secondary-fixed text-on-secondary-fixed-variant">{{ pendingCount() }}</span>
        }
        @if (tab.key === 'customers' && overdueCustomers().length > 0) {
          <span class="ml-xs px-xs rounded-full text-[10px] font-bold bg-error text-on-error">{{ overdueCustomers().length }}</span>
        }
      </button>
    }
  </div>

  <!-- ════════ SALES TAB ════════ -->
  @if (activeTab === 'sales') {
    <!-- Filter bar -->
    <div class="bg-white border border-outline-variant rounded-xl p-md flex flex-wrap gap-md items-center mb-md shadow-sm">
      <div class="relative flex-1 min-w-40">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
        <input [(ngModel)]="salesSearch" placeholder="Search invoice or customer..."
               class="w-full pl-10 pr-md py-sm border border-outline-variant rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
      </div>
      <input type="date" [(ngModel)]="salesDateFilter"
             class="border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
      <div class="flex gap-xs">
        @for (s of ['All','Paid','Pending','Overdue']; track s) {
          <button (click)="salesStatusFilter = s"
                  class="px-md py-xs rounded-lg text-label-md font-bold transition-all"
                  [class]="salesStatusFilter === s
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'">
            {{ s }}
          </button>
        }
      </div>
      <button (click)="salesSearch=''; salesDateFilter=''; salesStatusFilter='All'"
              class="text-label-md text-on-surface-variant hover:text-error flex items-center gap-xs">
        <span class="material-symbols-outlined text-[16px]">filter_list_off</span>
      </button>
    </div>

    <!-- Sales table -->
    <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
      <table class="w-full text-left border-collapse">
        <thead class="bg-surface-container-low border-b border-outline-variant">
          <tr>
            <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider">Invoice</th>
            <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider">Customer</th>
            <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider hidden md:table-cell">Date</th>
            <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider text-right">Amount</th>
            <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider hidden md:table-cell">Payment</th>
            <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider text-center">Status</th>
            <th class="px-md py-sm text-label-md text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-variant">
          @for (sale of filteredSales(); track sale.id) {
            <tr class="hover:bg-surface-container-lowest transition-colors cursor-pointer"
                (click)="toggleExpanded(sale.id)">
              <td class="px-md py-md font-mono text-primary text-sm font-bold">{{ sale.invoiceNo }}</td>
              <td class="px-md py-md">
                <p class="font-semibold text-on-surface text-sm">{{ sale.customerName }}</p>
                <p class="text-xs text-on-surface-variant">{{ custType(sale.customerId) }}</p>
              </td>
              <td class="px-md py-md text-sm text-on-surface-variant hidden md:table-cell">{{ sale.date }}</td>
              <td class="px-md py-md text-right">
                <p class="font-bold text-primary">₱{{ sale.total.toLocaleString() }}</p>
                <p class="text-xs text-on-surface-variant">{{ sale.items.length }} item(s)</p>
              </td>
              <td class="px-md py-md hidden md:table-cell">
                <span class="px-sm py-xs rounded-full text-[10px] font-bold uppercase" [class]="payClass(sale.payMethod)">{{ sale.payMethod }}</span>
              </td>
              <td class="px-md py-md text-center">
                <span class="px-sm py-xs rounded-full text-[10px] font-bold uppercase" [class]="statusClass(sale.status)">{{ sale.status }}</span>
              </td>
              <td class="px-md py-md text-right">
                <div class="flex items-center justify-end gap-xs">
                  @if (sale.status === 'pending') {
                    <button (click)="$event.stopPropagation(); markPaid(sale)"
                            class="px-sm py-xs bg-primary-fixed text-on-primary-fixed-variant rounded-lg text-[10px] font-bold hover:bg-primary hover:text-on-primary transition-all">
                      Mark Paid
                    </button>
                  }
                  @if (sale.status === 'overdue') {
                    <button (click)="$event.stopPropagation(); markPaid(sale)"
                            class="px-sm py-xs bg-error text-on-error rounded-lg text-[10px] font-bold hover:opacity-80 transition-all">
                      Collect
                    </button>
                  }
                  <button (click)="$event.stopPropagation(); printInvoice(sale)"
                          title="Print invoice"
                          class="p-xs hover:bg-primary-fixed rounded-lg transition-colors text-on-surface-variant hover:text-primary">
                    <span class="material-symbols-outlined text-[18px]">print</span>
                  </button>
                </div>
              </td>
            </tr>
            <!-- Expanded row -->
            @if (expandedSaleId === sale.id) {
              <tr class="bg-primary-fixed/20">
                <td colspan="7" class="px-lg py-md">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    <div>
                      <p class="text-label-md text-on-surface-variant font-bold uppercase mb-sm">Line Items</p>
                      <div class="space-y-xs">
                        @for (item of sale.items; track item.eggSize) {
                          <div class="flex items-center justify-between bg-white rounded-lg px-md py-sm border border-outline-variant">
                            <div class="flex items-center gap-sm">
                              <span class="text-xs px-sm py-xs rounded-full font-bold" [class]="sizeBadge(item.eggSize)">{{ sizeLabel(item.eggSize) }}</span>
                              <span class="text-sm text-on-surface">{{ item.qty.toLocaleString() }} eggs</span>
                            </div>
                            <div class="text-right">
                              <span class="text-xs text-on-surface-variant">₱{{ item.unitPrice }}/egg</span>
                              <span class="font-bold text-primary ml-md">₱{{ (item.qty * item.unitPrice).toLocaleString() }}</span>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                    <div class="bg-white rounded-xl p-md border border-outline-variant">
                      <p class="text-label-md text-on-surface-variant font-bold uppercase mb-sm">Summary</p>
                      <div class="space-y-xs text-sm">
                        <div class="flex justify-between"><span class="text-on-surface-variant">Invoice No.</span><span class="font-mono font-bold">{{ sale.invoiceNo }}</span></div>
                        <div class="flex justify-between"><span class="text-on-surface-variant">Payment Method</span><span class="capitalize">{{ sale.payMethod }}</span></div>
                        <div class="flex justify-between"><span class="text-on-surface-variant">Total Eggs</span><span class="font-bold">{{ totalEggsInSale(sale).toLocaleString() }}</span></div>
                        <div class="flex justify-between border-t border-outline-variant pt-xs">
                          <span class="font-bold text-on-surface">Total Amount</span>
                          <span class="font-bold text-primary">₱{{ sale.total.toLocaleString() }}</span>
                        </div>
                      </div>
                      @if (sale.notes) {
                        <p class="text-xs text-on-surface-variant mt-sm italic">{{ sale.notes }}</p>
                      }
                    </div>
                  </div>
                </td>
              </tr>
            }
          }
          @empty {
            <tr><td colspan="7" class="px-lg py-xl text-center text-on-surface-variant">
              <span class="material-symbols-outlined text-4xl block mb-sm opacity-30">receipt_long</span>
              No sales match your filters.
            </td></tr>
          }
        </tbody>
        <tfoot class="bg-surface-container-low border-t-2 border-outline-variant">
          <tr>
            <td colspan="3" class="px-md py-sm font-bold text-on-surface">
              Showing {{ filteredSales().length }} of {{ sales().length }} sales
            </td>
            <td class="px-md py-sm text-right font-bold text-primary">
              ₱{{ filteredTotal().toLocaleString() }}
            </td>
            <td colspan="3"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  }

  <!-- ════════ CUSTOMERS TAB ════════ -->
  @if (activeTab === 'customers') {
    <div class="space-y-md">
      <!-- Overdue alert -->
      @if (overdueCustomers().length > 0) {
        <div class="bg-error-container border border-error rounded-xl p-md flex items-start gap-md">
          <span class="material-symbols-outlined text-on-error-container text-[22px] flex-shrink-0 mt-xs" style="font-variation-settings:'FILL' 1">warning</span>
          <div>
            <p class="font-bold text-on-error-container">{{ overdueCustomers().length }} customer(s) with overdue balance</p>
            <p class="text-xs text-on-error-container mt-xs">{{ overdueNames() }}</p>
          </div>
        </div>
      }

      <!-- Customer cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-md">
        @for (c of customers(); track c.id) {
          <div class="bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all"
               [class]="!c.active ? 'border-outline opacity-60' : c.balance > c.creditLimit * 0.8 ? 'border-error' : 'border-outline-variant'">
            <div class="p-lg">
              <div class="flex items-start gap-md mb-md">
                <div class="w-11 h-11 rounded-xl bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center font-bold text-lg flex-shrink-0">
                  {{ custInitials(c.name) }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-sm">
                    <p class="font-bold text-on-surface">{{ c.name }}</p>
                    <div class="flex items-center gap-xs flex-shrink-0">
                      <span class="px-sm py-xs rounded-full text-[10px] font-bold uppercase"
                            [class]="c.type==='Wholesale' ? 'bg-primary-fixed text-on-primary-fixed-variant'
                                   : c.type==='Restaurant' ? 'bg-secondary-fixed text-on-secondary-fixed-variant'
                                   : 'bg-surface-container text-on-surface'">{{ c.type }}</span>
                      <span class="px-sm py-xs rounded-full text-[10px] font-bold"
                            [class]="c.active ? 'bg-primary-fixed text-on-primary-fixed-variant' : 'bg-surface-container text-on-surface-variant'">
                        {{ c.active ? 'Active' : 'Inactive' }}
                      </span>
                    </div>
                  </div>
                  <p class="text-xs text-on-surface-variant mt-xs">{{ c.contact }} · {{ c.phone }}</p>
                  <p class="text-xs text-on-surface-variant">{{ c.address }}</p>
                </div>
              </div>

              <!-- Credit utilisation -->
              <div class="mb-md">
                <div class="flex justify-between text-xs mb-xs">
                  <span class="text-on-surface-variant">Credit utilisation</span>
                  <div class="flex gap-md">
                    <span class="text-on-surface-variant">Limit: ₱{{ c.creditLimit.toLocaleString() }}</span>
                    <span class="font-bold" [class]="c.balance > 0 ? 'text-error' : 'text-primary'">
                      Balance: ₱{{ c.balance.toLocaleString() }}
                    </span>
                  </div>
                </div>
                <div class="w-full bg-surface-container rounded-full h-2.5">
                  <div class="h-2.5 rounded-full transition-all duration-500"
                       [class]="c.balance / c.creditLimit > 0.8 ? 'bg-error' : c.balance > 0 ? 'bg-secondary-container' : 'bg-primary'"
                       [style.width.%]="Math.min(c.creditLimit ? c.balance / c.creditLimit * 100 : 0, 100)">
                  </div>
                </div>
                <div class="text-[10px] text-on-surface-variant mt-xs">
                  {{ c.creditLimit ? (c.balance / c.creditLimit * 100).toFixed(0) : 0 }}% used
                  @if (c.balance > c.creditLimit * 0.8 && c.balance > 0) {
                    · <span class="text-error font-bold">Near limit — collect payment</span>
                  }
                </div>
              </div>

              <!-- Purchase history quick stat -->
              <div class="grid grid-cols-2 gap-sm mb-md text-center">
                <div class="bg-surface-container rounded-lg p-sm">
                  <div class="font-bold text-primary text-sm">{{ custSaleCount(c.id) }}</div>
                  <div class="text-[10px] text-on-surface-variant uppercase">Total Sales</div>
                </div>
                <div class="bg-surface-container rounded-lg p-sm">
                  <div class="font-bold text-primary text-sm">₱{{ custTotalRevenue(c.id).toLocaleString() }}</div>
                  <div class="text-[10px] text-on-surface-variant uppercase">Total Revenue</div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-sm pt-sm border-t border-outline-variant">
                <button (click)="openNewSaleForCustomer(c)"
                        class="flex-1 py-xs bg-primary text-on-primary rounded-lg text-label-md font-bold hover:opacity-90 transition-all text-center">
                  New Sale
                </button>
                <button (click)="openEditCustomer(c)"
                        class="px-md py-xs border border-outline text-on-surface rounded-lg text-label-md hover:bg-surface-container transition-all">
                  Edit
                </button>
                <button (click)="toggleCustomerStatus(c)"
                        class="px-md py-xs border rounded-lg text-label-md transition-all"
                        [class]="c.active ? 'border-outline text-on-surface-variant hover:bg-surface-container' : 'border-primary text-primary hover:bg-primary-fixed'">
                  {{ c.active ? 'Deactivate' : 'Activate' }}
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  }

  <!-- ════════ REPORTS TAB ════════ -->
  @if (activeTab === 'reports') {
    <div class="space-y-md">
      <!-- Revenue trend chart -->
      <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
        <div class="flex items-center justify-between mb-lg">
          <div>
            <h3 class="font-bold text-on-surface" style="font-size:16px">Revenue Trend</h3>
            <p class="text-xs text-on-surface-variant mt-xs">Last 7 days</p>
          </div>
          <div class="text-right">
            <div class="font-bold text-primary" style="font-size:20px">₱{{ weekRevenue().toLocaleString() }}</div>
            <div class="text-xs text-on-surface-variant">This week</div>
          </div>
        </div>
        <div style="height:160px" class="relative">
          <svg class="w-full h-full" viewBox="0 0 700 140" preserveAspectRatio="none">
            @for (y of [0,35,70,105,140]; track y) {
              <line [attr.y1]="y" [attr.y2]="y" x1="0" x2="700" stroke="#c1c8c2" stroke-width="0.5" opacity="0.5"/>
            }
            @for (d of revenueDays; track d.label; let i = $index) {
              <rect [attr.x]="i*100+10" [attr.y]="140-revenueBarH(d.revenue)"
                    width="80" [attr.height]="revenueBarH(d.revenue)"
                    [attr.fill]="d.revenue > 0 ? '#3f6653' : '#c1c8c2'" rx="4" opacity="0.85"/>
              <text [attr.x]="i*100+50" y="135" text-anchor="middle" font-size="9" fill="#717973">{{ d.label }}</text>
              @if (d.revenue > 0) {
                <text [attr.x]="i*100+50" [attr.y]="140-revenueBarH(d.revenue)-6"
                      text-anchor="middle" font-size="9" font-weight="600" fill="#012d1d">
                  ₱{{ (d.revenue/1000).toFixed(0) }}k
                </text>
              }
            }
          </svg>
        </div>
      </div>

      <!-- Summary stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-md">
        @for (s of reportStats(); track s.label) {
          <div class="bg-white border border-outline-variant rounded-xl p-md text-center">
            <div class="font-bold" [class]="s.color" style="font-size:20px">{{ s.value }}</div>
            <div class="text-label-md text-on-surface-variant uppercase tracking-wide mt-xs">{{ s.label }}</div>
          </div>
        }
      </div>

      <!-- Sales by egg size -->
      <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
        <h3 class="font-bold text-on-surface mb-md" style="font-size:16px">Sales by Egg Size</h3>
        <div class="space-y-sm">
          @for (size of eggSizes; track size) {
            @let vol = sizeVolume(size);
            @let rev = sizeRevenue(size);
            @let pct = totalVolumeAll() ? Math.round(vol / totalVolumeAll() * 100) : 0;
            <div>
              <div class="flex justify-between text-sm mb-xs">
                <span class="flex items-center gap-sm">
                  <span class="px-sm py-xs rounded-full text-[10px] font-bold" [class]="sizeBadge(size)">{{ sizeLabel(size) }}</span>
                  <span class="text-on-surface-variant">{{ vol.toLocaleString() }} eggs</span>
                </span>
                <div class="text-right">
                  <span class="font-bold text-primary">₱{{ rev.toLocaleString() }}</span>
                  <span class="text-on-surface-variant ml-sm text-xs">{{ pct }}%</span>
                </div>
              </div>
              <div class="w-full bg-surface-container rounded-full h-2">
                <div class="h-2 rounded-full bg-primary transition-all" [style.width.%]="pct"></div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Top customers -->
      <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
        <h3 class="font-bold text-on-surface mb-md" style="font-size:16px">Top Customers by Revenue</h3>
        <div class="space-y-sm">
          @for (c of topCustomers(); track c.id; let i = $index) {
            <div class="flex items-center gap-md p-sm rounded-xl hover:bg-surface-container transition-colors">
              <span class="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold flex-shrink-0">{{ i+1 }}</span>
              <div class="flex-1">
                <p class="font-bold text-on-surface text-sm">{{ c.name }}</p>
                <p class="text-xs text-on-surface-variant">{{ custSaleCount(c.id) }} orders</p>
              </div>
              <span class="font-bold text-primary">₱{{ custTotalRevenue(c.id).toLocaleString() }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  }

  <!-- ════════ NEW SALE MODAL ════════ -->
  @if (showSaleForm) {
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-lg">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-screen overflow-y-auto">
        <div class="px-xl py-lg border-b border-outline-variant flex items-center justify-between">
          <h3 class="font-bold text-on-surface" style="font-size:18px">New Sale</h3>
          <button (click)="closeSaleForm()" class="p-xs hover:bg-surface-container rounded-lg">
            <span class="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div class="p-xl space-y-md">
          <div class="grid grid-cols-2 gap-md">
            <div class="col-span-2">
              <label class="text-label-md text-on-surface-variant block mb-xs">Customer *</label>
              <select [(ngModel)]="saleForm.customerId"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option [ngValue]="null">Select customer...</option>
                @for (c of activeCustomers(); track c.id) { <option [ngValue]="c.id">{{ c.name }} ({{ c.type }})</option> }
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Sale Date</label>
              <input type="date" [(ngModel)]="saleForm.saleDate"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Payment Method *</label>
              <div class="grid grid-cols-3 gap-xs">
                @for (p of ['cash','credit','bank-transfer']; track p) {
                  <button (click)="saleForm.payMethod = $any(p)"
                          class="py-sm rounded-lg border-2 text-label-md font-bold transition-all capitalize text-center"
                          [class]="saleForm.payMethod === p
                            ? 'border-primary bg-primary-fixed text-on-primary-fixed-variant'
                            : 'border-outline-variant text-on-surface-variant hover:border-outline'">
                    {{ p }}
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Line items -->
          <div>
            <div class="flex items-center justify-between mb-sm">
              <label class="text-label-md text-on-surface-variant font-bold">Egg Line Items *</label>
              <button (click)="addLine()"
                      class="flex items-center gap-xs text-label-md text-primary font-bold hover:underline">
                <span class="material-symbols-outlined text-[14px]">add</span>Add Size
              </button>
            </div>
            <div class="space-y-sm">
              @for (item of saleForm.items; track $index; let idx = $index) {
                <div class="grid grid-cols-12 gap-sm items-center p-sm rounded-xl border border-outline-variant hover:border-primary transition-colors">
                  <div class="col-span-4">
                    <select [(ngModel)]="item.eggSize" (ngModelChange)="item.unitPrice = getPrice(item.eggSize)"
                            class="w-full border border-outline-variant rounded-lg px-sm py-xs text-body-md focus:outline-none text-sm">
                      @for (s of eggSizes; track s) { <option [value]="s">{{ sizeLabel(s) }}</option> }
                    </select>
                  </div>
                  <div class="col-span-3 flex items-center gap-xs">
                    <button (click)="item.qty = Math.max(0, item.qty - 100)"
                            class="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center font-bold">−</button>
                    <input type="number" [(ngModel)]="item.qty" min="0" placeholder="Qty"
                           class="flex-1 w-full text-center border border-outline-variant rounded-lg px-xs py-xs text-body-md font-bold focus:outline-none text-sm"/>
                    <button (click)="item.qty = item.qty + 100"
                            class="w-7 h-7 rounded-lg bg-primary-fixed text-on-primary-fixed-variant hover:bg-primary hover:text-on-primary flex items-center justify-center font-bold">+</button>
                  </div>
                  <div class="col-span-2">
                    <div class="flex items-center gap-xs">
                      <span class="text-xs text-on-surface-variant">₱</span>
                      <input type="number" [(ngModel)]="item.unitPrice" step="0.10" min="0"
                             class="w-full border border-outline-variant rounded-lg px-xs py-xs text-body-md text-center focus:outline-none text-sm"/>
                    </div>
                  </div>
                  <div class="col-span-2 text-right">
                    <p class="font-bold text-primary text-sm">₱{{ ((item.qty||0)*(item.unitPrice||0)).toLocaleString() }}</p>
                    <p class="text-[10px] text-on-surface-variant">subtotal</p>
                  </div>
                  <div class="col-span-1 flex justify-end">
                    <button (click)="removeLine(idx)"
                            class="p-xs hover:bg-error-container rounded text-on-surface-variant hover:text-error transition-colors">
                      <span class="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                </div>
              }
            </div>
            <!-- Quick qty presets -->
            <div class="flex gap-xs mt-sm flex-wrap">
              <span class="text-[11px] text-on-surface-variant self-center">Quick qty:</span>
              @for (qty of [100,500,1000,2000,5000,10000]; track qty) {
                <button (click)="setLastQty(qty)"
                        class="px-sm py-xs rounded-lg border border-outline-variant text-[11px] hover:border-primary hover:bg-primary-fixed transition-all">
                  {{ qty.toLocaleString() }}
                </button>
              }
            </div>
          </div>

          <!-- Notes -->
          <div>
            <label class="text-label-md text-on-surface-variant block mb-xs">Notes (optional)</label>
            <input [(ngModel)]="saleForm.notes" placeholder="Delivery notes, special instructions..."
                   class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
          </div>

          <!-- Total summary -->
          @if (saleFormTotal() > 0) {
            <div class="bg-primary-container rounded-2xl p-lg">
              <div class="grid grid-cols-3 gap-md text-center">
                <div>
                  <div class="text-xs text-on-primary-container opacity-70 uppercase font-bold mb-xs">Total Eggs</div>
                  <div class="font-bold text-on-primary" style="font-size:18px">{{ saleFormTotalEggs().toLocaleString() }}</div>
                </div>
                <div>
                  <div class="text-xs text-on-primary-container opacity-70 uppercase font-bold mb-xs">Line Items</div>
                  <div class="font-bold text-on-primary" style="font-size:18px">{{ saleForm.items.length }}</div>
                </div>
                <div>
                  <div class="text-xs text-on-primary-container opacity-70 uppercase font-bold mb-xs">Grand Total</div>
                  <div class="font-bold text-on-primary" style="font-size:22px">₱{{ saleFormTotal().toLocaleString() }}</div>
                </div>
              </div>
            </div>
          }

          @if (saleError()) {
            <div class="bg-error-container text-on-error-container rounded-lg p-md flex items-center gap-sm text-sm">
              <span class="material-symbols-outlined text-[16px]">error</span>{{ saleError() }}
            </div>
          }

          <div class="flex gap-md pt-md border-t border-outline-variant">
            <button (click)="closeSaleForm()"
                    class="flex-1 py-sm border border-outline rounded-lg text-label-md text-on-surface hover:bg-surface-container">Cancel</button>
            <button (click)="submitSale()" [disabled]="submitting()"
                    class="flex-1 py-sm bg-primary text-on-primary rounded-lg text-label-md font-bold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-xs">
              @if (submitting()) { <span class="material-symbols-outlined text-[16px] animate-spin">refresh</span>Saving... }
              @else { <span class="material-symbols-outlined text-[16px]" style="font-variation-settings:'FILL' 1">receipt</span>Save Sale }
            </button>
          </div>
        </div>
      </div>
    </div>
  }

  <!-- ════════ CUSTOMER FORM MODAL ════════ -->
  @if (showCustomerForm) {
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-lg">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto">
        <div class="px-xl py-lg border-b border-outline-variant flex items-center justify-between">
          <h3 class="font-bold text-on-surface" style="font-size:18px">{{ editingCustomer ? 'Edit Customer' : 'Add Customer' }}</h3>
          <button (click)="closeCustomerForm()" class="p-xs hover:bg-surface-container rounded-lg">
            <span class="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div class="p-xl space-y-md">
          <div class="grid grid-cols-2 gap-md">
            <div class="col-span-2">
              <label class="text-label-md text-on-surface-variant block mb-xs">Business Name *</label>
              <input [(ngModel)]="customerForm.name" placeholder="e.g. Metro Fresh Market"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Type *</label>
              <select [(ngModel)]="customerForm.type"
                      class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="Wholesale">Wholesale</option>
                <option value="Retail">Retail</option>
                <option value="Restaurant">Restaurant</option>
              </select>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Credit Limit (₱)</label>
              <input type="number" [(ngModel)]="customerForm.creditLimit" min="0" step="1000"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Contact Person</label>
              <input [(ngModel)]="customerForm.contact" placeholder="Full name"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Phone</label>
              <input type="tel" [(ngModel)]="customerForm.phone" placeholder="+63 9XX XXX XXXX"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
            <div class="col-span-2">
              <label class="text-label-md text-on-surface-variant block mb-xs">Email</label>
              <input type="email" [(ngModel)]="customerForm.email"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
            <div class="col-span-2">
              <label class="text-label-md text-on-surface-variant block mb-xs">Address</label>
              <input [(ngModel)]="customerForm.address"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>
          </div>
          @if (customerError()) {
            <div class="bg-error-container text-on-error-container rounded-lg p-md text-sm flex items-center gap-sm">
              <span class="material-symbols-outlined text-[16px]">error</span>{{ customerError() }}
            </div>
          }
          <div class="flex gap-md pt-md border-t border-outline-variant">
            <button (click)="closeCustomerForm()" class="flex-1 py-sm border border-outline rounded-lg text-label-md text-on-surface hover:bg-surface-container">Cancel</button>
            <button (click)="saveCustomer()" class="flex-1 py-sm bg-primary text-on-primary rounded-lg text-label-md font-bold hover:opacity-90">
              {{ editingCustomer ? 'Save Changes' : 'Add Customer' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  }

  <!-- ════════ PRINT INVOICE ════════ -->
  @if (printingSale) {
    <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-lg">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg" style="font-family:monospace">
        <div class="p-xl border-b border-outline-variant flex items-center justify-between">
          <h3 class="font-bold text-on-surface" style="font-size:16px">Invoice Preview</h3>
          <div class="flex gap-sm">
            <button (click)="window.print()"
                    class="flex items-center gap-xs bg-primary text-on-primary px-md py-xs rounded-lg text-label-md font-bold hover:opacity-90">
              <span class="material-symbols-outlined text-[16px]">print</span>Print
            </button>
            <button (click)="printingSale=null" class="p-xs hover:bg-surface-container rounded-lg">
              <span class="material-symbols-outlined text-on-surface-variant">close</span>
            </button>
          </div>
        </div>
        <div class="p-xl space-y-md">
          <div class="text-center border-b border-outline-variant pb-md">
            <p class="font-bold text-primary" style="font-size:18px">GreenValley Poultry Farm</p>
            <p class="text-xs text-on-surface-variant">Brgy. San Isidro, Batangas City</p>
            <p class="text-xs text-on-surface-variant">Tel: +63 912 345 6789</p>
          </div>
          <div class="flex justify-between text-sm">
            <div>
              <p class="font-bold">INVOICE</p>
              <p class="text-on-surface-variant">{{ printingSale.invoiceNo }}</p>
              <p class="text-on-surface-variant">{{ printingSale.date }}</p>
            </div>
            <div class="text-right">
              <p class="font-bold">Bill To:</p>
              <p>{{ printingSale.customerName }}</p>
            </div>
          </div>
          <table class="w-full text-sm border-collapse border border-outline-variant">
            <thead><tr class="bg-surface-container-low">
              <th class="p-sm text-left border border-outline-variant">Size</th>
              <th class="p-sm text-right border border-outline-variant">Qty</th>
              <th class="p-sm text-right border border-outline-variant">Unit Price</th>
              <th class="p-sm text-right border border-outline-variant">Subtotal</th>
            </tr></thead>
            <tbody>
              @for (item of printingSale.items; track item.eggSize) {
                <tr>
                  <td class="p-sm border border-outline-variant">{{ sizeLabel(item.eggSize) }}</td>
                  <td class="p-sm text-right border border-outline-variant">{{ item.qty.toLocaleString() }}</td>
                  <td class="p-sm text-right border border-outline-variant">₱{{ item.unitPrice }}</td>
                  <td class="p-sm text-right border border-outline-variant font-bold">₱{{ (item.qty*item.unitPrice).toLocaleString() }}</td>
                </tr>
              }
            </tbody>
            <tfoot>
              <tr class="bg-primary-container">
                <td colspan="3" class="p-sm font-bold border border-outline-variant">TOTAL</td>
                <td class="p-sm text-right font-bold border border-outline-variant">₱{{ printingSale.total.toLocaleString() }}</td>
              </tr>
            </tfoot>
          </table>
          <div class="flex justify-between text-sm">
            <span class="text-on-surface-variant">Payment: <strong class="capitalize">{{ printingSale.payMethod }}</strong></span>
            <span class="text-on-surface-variant">Status: <strong class="capitalize">{{ printingSale.status }}</strong></span>
          </div>
          <p class="text-xs text-on-surface-variant text-center border-t border-outline-variant pt-md">Thank you for your business!</p>
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
export class SalesComponent implements OnInit, OnDestroy {
  private refreshSvc = inject(DataRefreshService);
  private api    = inject(ApiService);
  private eggStockSvc = inject(EggStockService);
  private notifSvc    = inject(NotificationService);

  today = new Date().toLocaleDateString('en-PH',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  Math  = Math;
  window = window;
  eggSizes = EGG_SIZES;

  // State
  sales     = signal<Sale[]>(INITIAL_SALES);
  customers = signal<Customer[]>(INITIAL_CUSTOMERS);
  loading   = signal(false);
  submitting = signal(false);
  toast     = signal('');
  activeTab: ActiveTab = 'sales';
  expandedSaleId: number | null = null;
  printingSale: Sale | null = null;

  // Filters
  salesSearch = ''; salesDateFilter = ''; salesStatusFilter = 'All';

  // Modals
  showSaleForm     = false;
  showCustomerForm = false;
  editingCustomer: Customer | null = null;
  saleError     = signal('');
  customerError = signal('');

  // Forms
  saleForm = this.blankSaleForm();
  customerForm = this.blankCustomerForm();

  private nextSaleId = 7;
  private nextInvoiceNo = 1043;
  private nextCustomerId = 6;
  private overdueTimer: any = null;

  tabs = [
    { key: 'sales',     label: 'Sales',     icon: 'receipt_long'    },
    { key: 'customers', label: 'Customers',  icon: 'store'           },
    { key: 'reports',   label: 'Sales Reports', icon: 'bar_chart'   },
  ];

  revenueDays = Array.from({length:7},(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()-(6-i));
    const label=d.toLocaleDateString('en-PH',{weekday:'short'});
    const dateStr=d.toISOString().split('T')[0];
    return {label, dateStr, revenue:0};
  });

  // ── Computed ────────────────────────────────────────────────────────────────
  kpis = computed((): SalesKpi[] => {
    const s   = this.sales();
    const now = today();
    const todayRev   = s.filter(x=>x.saleDate===now).reduce((t,x)=>t+x.total,0);
    const monthRev   = s.reduce((t,x)=>t+x.total,0);
    const outstanding= s.filter(x=>x.status==='pending'||x.status==='overdue').reduce((t,x)=>t+x.total,0);
    return [
      { label:"Today's Revenue",  value:'₱'+todayRev.toLocaleString(), color:'text-primary',   sub:'Cash + Credit' },
      { label:'Month Revenue',    value:'₱'+monthRev.toLocaleString(), color:'text-primary',   sub:'All transactions' },
      { label:'Outstanding',      value:'₱'+outstanding.toLocaleString(), color:outstanding>0?'text-error':'text-primary', sub:'Pending + Overdue' },
      { label:'Customers',        value: this.customers().filter(c=>c.active).length.toString(), color:'text-on-surface', sub:'Active accounts' },
    ];
  });

  overdueNames(): string { return this.overdueCustomers().map(c => c.name).join(' · '); }

  filteredSales = computed(() =>
    this.sales().filter(s => {
      const q = this.salesSearch.toLowerCase();
      if (q && !s.invoiceNo.toLowerCase().includes(q) && !s.customerName.toLowerCase().includes(q)) return false;
      if (this.salesDateFilter && s.saleDate !== this.salesDateFilter) return false;
      if (this.salesStatusFilter !== 'All' && s.status !== this.salesStatusFilter.toLowerCase()) return false;
      return true;
    })
  );

  filteredTotal   = computed(() => this.filteredSales().reduce((t,s)=>t+s.total,0));
  pendingCount    = computed(() => this.sales().filter(s=>s.status==='pending'||s.status==='overdue').length);
  activeCustomers = computed(() => this.customers().filter(c=>c.active));
  overdueCustomers = computed(() => this.customers().filter(c => {
    const balance = c.balance;
    return balance > 0 && this.sales().some(s => s.customerId === c.id && s.status === 'overdue');
  }));

  weekRevenue = computed(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-7);
    return this.sales()
      .filter(s => new Date(s.saleDate) >= weekAgo)
      .reduce((t,s) => t+s.total, 0);
  });

  reportStats = computed(() => {
    const s = this.sales();
    return [
      { label:'Total Sales',    value: s.length.toString(),                              color:'text-primary'   },
      { label:'Avg Sale Value', value:'₱'+(s.length?Math.round(s.reduce((t,x)=>t+x.total,0)/s.length).toLocaleString():'0'), color:'text-primary' },
      { label:'Paid',           value: s.filter(x=>x.status==='paid').length.toString(), color:'text-primary'   },
      { label:'Overdue',        value: s.filter(x=>x.status==='overdue').length.toString(), color:'text-error'  },
    ];
  });

  topCustomers = computed(() =>
    this.customers()
      .filter(c=>c.active)
      .sort((a,b) => this.custTotalRevenue(b.id) - this.custTotalRevenue(a.id))
      .slice(0,5)
  );

  saleFormTotal     = computed(() => this.saleForm.items.reduce((t,i)=>t+(i.qty||0)*(i.unitPrice||0),0));
  saleFormTotalEggs = computed(() => this.saleForm.items.reduce((t,i)=>t+(i.qty||0),0));

  totalVolumeAll = computed(() =>
    EGG_SIZES.reduce((t,s) => t + this.sizeVolume(s), 0)
  );

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // Run overdue check immediately and then every hour
    this.checkOverdueSales();
    this.overdueTimer = setInterval(() => this.checkOverdueSales(), 60 * 60 * 1000);
    this.loading.set(true);
    this.api['get']<any>('customers').subscribe({
      next: (data) => {
        if (Array.isArray(data) && data.length) this.customers.set(data.map(this.mapCustomer));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.api['get']<any>('sales').subscribe({
      next: (data) => {
        if (data?.data?.length) this.sales.set(data.data);
        else if (Array.isArray(data) && data.length) this.sales.set(data);
      },
      error: () => {},
    });

    // Populate revenue days from existing sales
    this.revenueDays = this.revenueDays.map(d => ({
      ...d,
      revenue: this.sales().filter(s=>s.saleDate===d.dateStr).reduce((t,s)=>t+s.total,0)
    }));
  }

  private mapCustomer(c: any): Customer {
    return { id:c.id, name:c.name, type:c.type??'Wholesale', contact:c.contact??'', phone:c.phone??'', email:c.email??'', address:c.address??'', balance:c.balance??0, creditLimit:c.creditLimit??c.credit_limit??0, active:c.active??true };
  }

  // ── Sale actions ─────────────────────────────────────────────────────────────
  openNewSale(): void {
    this.saleForm = this.blankSaleForm();
    this.saleError.set('');
    this.showSaleForm = true;
    this.activeTab = 'sales';
  }

  openNewSaleForCustomer(c: Customer): void {
    this.saleForm = this.blankSaleForm();
    this.saleForm.customerId = c.id;
    this.saleError.set('');
    this.showSaleForm = true;
    this.activeTab = 'sales';
  }

  closeSaleForm(): void { this.showSaleForm = false; }
  toggleExpanded(id: number): void { this.expandedSaleId = this.expandedSaleId === id ? null : id; }

  addLine(): void { this.saleForm.items.push({eggSize:'large',qty:0,unitPrice:2.50}); }
  removeLine(i: number): void { if (this.saleForm.items.length > 1) this.saleForm.items.splice(i,1); }
  setLastQty(qty: number): void { if (this.saleForm.items.length) this.saleForm.items[this.saleForm.items.length-1].qty = qty; }
  getPrice(s: EggSize): number { return SIZE_PRICES[s]; }

  submitSale(): void {
    if (!this.saleForm.customerId) { this.saleError.set('Select a customer.');         return; }
    if (!this.saleForm.items.length || this.saleFormTotal() === 0)
      { this.saleError.set('Add at least one line item with quantity > 0.'); return; }

    this.submitting.set(true);
    const cust = this.customers().find(c=>c.id===this.saleForm.customerId)!;
    const payload = {
      customer_id:  this.saleForm.customerId,
      sale_date:    this.saleForm.saleDate,
      line_items:   this.saleForm.items,
      total_amount: this.saleFormTotal(),
      payment_method: this.saleForm.payMethod,
      notes:        this.saleForm.notes,
    };

    this.api['post']<any>('sales', payload).subscribe({
      next: (res) => this.finishSale(res?.id ?? this.nextSaleId, cust),
      error: ()   => this.finishSale(this.nextSaleId, cust),
    });
  }

  private finishSale(id: number, cust: Customer): void {
    const sale: Sale = {
      id, invoiceNo:`INV-${this.nextInvoiceNo++}`, customerId:this.saleForm.customerId!,
      customerName: cust.name, date:'Just now', saleDate:this.saleForm.saleDate,
      total: this.saleFormTotal(), payMethod: this.saleForm.payMethod,
      status: this.saleForm.payMethod === 'cash' ? 'paid' : 'pending',
      items: [...this.saleForm.items], notes:this.saleForm.notes,
    };
    this.nextSaleId++;
    this.sales.update(list => [sale, ...list]);
    // Deduct each line item from the shared egg stock signal
    this.eggStockSvc.deductSale(
      sale.items.map(i => ({ eggSize: i.eggSize as any, qty: i.qty }))
    );

    // Update customer balance for credit sales
    if (this.saleForm.payMethod === 'credit') {
      this.customers.update(list => list.map(c => c.id === cust.id
        ? { ...c, balance: c.balance + sale.total }
        : c
      ));
    }

    this.submitting.set(false);
    this.showSaleForm = false;
    this.showToast(`Sale ${sale.invoiceNo} saved — ₱${sale.total.toLocaleString()}`);
    this.revenueDays = this.revenueDays.map(d => ({
      ...d,
      revenue: this.sales().filter(s=>s.saleDate===d.dateStr).reduce((t,s)=>t+s.total,0)
    }));
  }

  markPaid(sale: Sale): void {
    this.sales.update(list => list.map(s => s.id === sale.id ? {...s, status:'paid'} : s));
    // Clear customer balance
    this.customers.update(list => list.map(c => c.id === sale.customerId
      ? { ...c, balance: Math.max(0, c.balance - sale.total) }
      : c
    ));
    this.api['post']<any>(`sales/${sale.id}/mark-paid`, {}).subscribe();
    this.showToast(`${sale.invoiceNo} marked as paid.`);
  }

  printInvoice(sale: Sale): void { this.printingSale = sale; }

  // ── Customer actions ─────────────────────────────────────────────────────────
  openEditCustomer(c: Customer): void {
    this.editingCustomer = c;
    this.customerForm = { name:c.name, type:c.type, contact:c.contact, phone:c.phone, email:c.email, address:c.address, creditLimit:c.creditLimit };
    this.customerError.set('');
    this.showCustomerForm = true;
    this.activeTab = 'customers';
  }

  closeCustomerForm(): void { this.showCustomerForm = false; this.editingCustomer = null; }

  saveCustomer(): void {
    if (!this.customerForm.name.trim()) { this.customerError.set('Business name is required.'); return; }

    if (this.editingCustomer) {
      const id = this.editingCustomer.id;
      this.customers.update(list => list.map(c => c.id === id ? { ...c, ...this.customerForm } : c));
      this.api['put']<any>(`customers/${id}`, this.customerForm).subscribe();
      this.showToast(`${this.customerForm.name} updated.`);
    } else {
      const newC: Customer = {
        id: this.nextCustomerId++, ...this.customerForm,
        balance: 0, active: true,
      };
      this.customers.update(list => [...list, newC]);
      this.api['post']<any>('customers', this.customerForm).subscribe();
      this.showToast(`${newC.name} added as a customer.`);
    }
    this.closeCustomerForm();
  }

  toggleCustomerStatus(c: Customer): void {
    this.customers.update(list => list.map(x => x.id === c.id ? {...x, active:!x.active} : x));
    this.showToast(`${c.name} ${c.active ? 'deactivated' : 'activated'}.`);
  }

  // ── Report helpers ───────────────────────────────────────────────────────────
  sizeVolume(size: EggSize): number {
    return this.sales().reduce((t,s) => t + s.items.filter(i=>i.eggSize===size).reduce((tt,i)=>tt+i.qty,0), 0);
  }
  sizeRevenue(size: EggSize): number {
    return this.sales().reduce((t,s) => t + s.items.filter(i=>i.eggSize===size).reduce((tt,i)=>tt+i.qty*i.unitPrice,0), 0);
  }
  custSaleCount(id: number): number { return this.sales().filter(s=>s.customerId===id).length; }
  custTotalRevenue(id: number): number { return this.sales().filter(s=>s.customerId===id).reduce((t,s)=>t+s.total,0); }
  custType(id: number): string { return this.customers().find(c=>c.id===id)?.type ?? ''; }
  totalEggsInSale(s: Sale): number { return s.items.reduce((t,i)=>t+i.qty,0); }
  revenueBarH(rev: number): number { const max=Math.max(...this.revenueDays.map(d=>d.revenue),1); return Math.round((rev/max)*120); }

  // ── Display helpers ──────────────────────────────────────────────────────────
  sizeLabel(k: EggSize): string { return SIZE_LABELS[k]; }
  sizeBadge(k: EggSize): string {
    const m: Record<EggSize,string> = { small:'bg-surface-container text-on-surface', medium:'bg-tertiary-fixed text-on-tertiary-fixed-variant', large:'bg-primary-fixed text-on-primary-fixed-variant', extra_large:'bg-secondary-fixed text-on-secondary-fixed-variant', jumbo:'bg-primary-container text-on-primary-container' };
    return m[k];
  }
  statusClass(s: SaleStatus): string {
    return {paid:'bg-primary-fixed text-on-primary-fixed-variant', pending:'bg-secondary-fixed text-on-secondary-fixed-variant', overdue:'bg-error text-on-error'}[s];
  }
  payClass(p: PayMethod): string {
    return {cash:'bg-primary-fixed text-on-primary-fixed-variant','bank-transfer':'bg-tertiary-fixed text-on-tertiary-fixed-variant',credit:'bg-secondary-fixed text-on-secondary-fixed-variant'}[p];
  }

  private blankSaleForm() {
    return { customerId: null as number|null, saleDate: today(), payMethod:'cash' as PayMethod, items:[{eggSize:'large' as EggSize, qty:0, unitPrice:2.50}], notes:'' };
  }
  private blankCustomerForm() {
    return { name:'', type:'Wholesale' as Customer['type'], contact:'', phone:'', email:'', address:'', creditLimit:10000 };
  }
  custInitials(name: string): string {
    return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  }

  ngOnDestroy(): void { if (this.overdueTimer) clearInterval(this.overdueTimer); }

  /** Auto-flip pending credit sales to overdue after 7 days with no payment */
  private checkOverdueSales(): void {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().split('T')[0];

    let flipped = 0;
    this.sales.update(list => list.map(sale => {
      if (
        sale.status === 'pending' &&
        sale.payMethod === 'credit' &&
        sale.saleDate <= cutoff
      ) {
        flipped++;
        return { ...sale, status: 'overdue' as SaleStatus };
      }
      return sale;
    }));

    if (flipped > 0) {
      // Push alert to managers/admins
      this.notifSvc.push({
        level:    'warning',
        category: 'sales',
        icon:     'payments',
        title:    `${flipped} Sale(s) Now Overdue`,
        message:  `${flipped} credit sale(s) have exceeded the 7-day payment window.`,
        route:    '/sales',
        forRoles: ['admin', 'manager'],
      });
    }
  }

  private showToast(msg: string): void { this.toast.set(msg); setTimeout(()=>this.toast.set(''),3500); }
}
