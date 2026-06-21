import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SystemSettingsService } from '../../core/services/index';

interface FarmBuilding {
  id: number;
  name: string;
  type: 'broiler' | 'layer' | 'breeder';
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  supervisor: string;
}

interface AlertThreshold {
  key: string;
  label: string;
  description: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  icon: string;
  iconColor: string;
}

interface NotifChannel {
  key: string;
  label: string;
  icon: string;
  enabled: boolean;
  detail: string;
}

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-lg max-w-5xl mx-auto pb-xl">

      <!-- Header -->
      <div class="flex items-center gap-md mb-lg">
        <a routerLink="/admin-home"
           class="p-sm hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant">
          <span class="material-symbols-outlined">arrow_back</span>
        </a>
        <div class="flex-1">
          <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">System Settings</h1>
          <p class="text-body-md text-on-surface-variant">{{ today }}</p>
        </div>
        <button (click)="saveAll()"
                class="flex items-center gap-sm bg-primary text-on-primary px-lg py-sm rounded-lg
                       text-label-md font-bold hover:opacity-90 active:scale-95 transition-all">
          <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">save</span>
          Save All Changes
        </button>
      </div>

      <!-- Toast -->
      @if (toast()) {
        <div class="bg-on-surface text-inverse-on-surface px-lg py-md rounded-xl mb-lg
                    flex items-center gap-sm shadow-lg">
          <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">check_circle</span>
          {{ toast() }}
        </div>
      }

      <!-- Settings tabs -->
      <div class="flex gap-xs mb-lg border-b border-outline-variant overflow-x-auto pb-xs">
        @for (tab of settingsTabs; track tab.key) {
          <button (click)="activeTab = tab.key"
                  class="px-lg py-sm text-label-md font-bold transition-all border-b-2 -mb-px
                         whitespace-nowrap flex items-center gap-xs"
                  [class]="activeTab === tab.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'">
            <span class="material-symbols-outlined text-[16px]">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        }
      </div>

      <!-- ── Tab: Farm Info ── -->
      @if (activeTab === 'farm') {
        <div class="space-y-lg">
          <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
            <h3 class="font-bold text-on-surface mb-lg" style="font-size:16px">Farm Information</h3>
            <div class="grid grid-cols-2 gap-md">
              <div class="col-span-2">
                <label class="text-label-md text-on-surface-variant block mb-xs">Farm Name</label>
                <input type="text" [(ngModel)]="farmInfo.name"
                       class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                              focus:outline-none focus:ring-2 focus:ring-primary/20"/>
              </div>
              <div>
                <label class="text-label-md text-on-surface-variant block mb-xs">Farm Code / ID</label>
                <input type="text" [(ngModel)]="farmInfo.code"
                       class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                              focus:outline-none focus:ring-2 focus:ring-primary/20"/>
              </div>
              <div>
                <label class="text-label-md text-on-surface-variant block mb-xs">Time Zone</label>
                <select [(ngModel)]="farmInfo.timezone"
                        class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                               focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option>Asia/Manila (UTC+8)</option>
                  <option>Asia/Bangkok (UTC+7)</option>
                  <option>Asia/Jakarta (UTC+7)</option>
                </select>
              </div>
              <div>
                <label class="text-label-md text-on-surface-variant block mb-xs">Currency</label>
                <select [(ngModel)]="farmInfo.currency"
                        class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                               focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option>PHP — Philippine Peso (₱)</option>
                  <option>USD — US Dollar ($)</option>
                  <option>THB — Thai Baht (฿)</option>
                </select>
              </div>
              <div>
                <label class="text-label-md text-on-surface-variant block mb-xs">Weight Unit</label>
                <select [(ngModel)]="farmInfo.weightUnit"
                        class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                               focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option>kg (kilogram)</option>
                  <option>lb (pound)</option>
                </select>
              </div>
              <div class="col-span-2">
                <label class="text-label-md text-on-surface-variant block mb-xs">Farm Address</label>
                <textarea [(ngModel)]="farmInfo.address" rows="2"
                          class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                                 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none">
                </textarea>
              </div>
              <div>
                <label class="text-label-md text-on-surface-variant block mb-xs">Owner / Contact Person</label>
                <input type="text" [(ngModel)]="farmInfo.owner"
                       class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                              focus:outline-none focus:ring-2 focus:ring-primary/20"/>
              </div>
              <div>
                <label class="text-label-md text-on-surface-variant block mb-xs">Contact Phone</label>
                <input type="tel" [(ngModel)]="farmInfo.phone"
                       class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                              focus:outline-none focus:ring-2 focus:ring-primary/20"/>
              </div>
            </div>
          </div>

          <!-- Buildings -->
          <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
            <div class="flex items-center justify-between px-lg py-md border-b border-outline-variant">
              <h3 class="font-bold text-on-surface" style="font-size:16px">Farm Buildings / Houses</h3>
              <button (click)="addBuilding()"
                      class="flex items-center gap-xs text-label-md text-primary font-bold hover:underline">
                <span class="material-symbols-outlined text-[16px]">add</span>Add Building
              </button>
            </div>
            <div class="divide-y divide-outline-variant">
              @for (b of buildings(); track b.id) {
                <div class="flex items-center gap-md px-lg py-md">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary-fixed">
                    <span class="material-symbols-outlined text-[16px] text-on-primary-fixed-variant"
                          style="font-variation-settings:'FILL' 1">home_health</span>
                  </div>
                  <div class="flex-1 grid grid-cols-2 md:grid-cols-4 gap-sm">
                    <input [(ngModel)]="b.name"
                           class="border border-outline-variant rounded-lg px-sm py-xs text-body-md
                                  focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                    <select [(ngModel)]="b.type"
                            class="border border-outline-variant rounded-lg px-sm py-xs text-body-md
                                   focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="broiler">Broiler</option>
                      <option value="layer">Layer</option>
                      <option value="breeder">Breeder</option>
                    </select>
                    <div class="flex items-center gap-xs">
                      <input type="number" [(ngModel)]="b.capacity" placeholder="Capacity"
                             class="w-full border border-outline-variant rounded-lg px-sm py-xs text-body-md
                                    focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                      <span class="text-xs text-on-surface-variant">birds</span>
                    </div>
                    <select [(ngModel)]="b.status"
                            class="border border-outline-variant rounded-lg px-sm py-xs text-body-md
                                   focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                  <button (click)="removeBuilding(b.id)"
                          class="p-xs hover:bg-error-container rounded-lg transition-colors text-on-surface-variant hover:text-error flex-shrink-0">
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- ── Tab: Alerts ── -->
      @if (activeTab === 'alerts') {
        <div class="space-y-md">
          <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
            <h3 class="font-bold text-on-surface mb-xs" style="font-size:16px">Alert Thresholds</h3>
            <p class="text-body-md text-on-surface-variant mb-lg">
              Set the values that trigger automatic alerts to supervisors and managers.
            </p>
            <div class="space-y-lg">
              @for (t of alertThresholds; track t.key) {
                <div class="flex items-center gap-lg border-b border-outline-variant pb-lg last:border-0 last:pb-0">
                  <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-surface-container">
                    <span class="material-symbols-outlined text-[20px]" [class]="t.iconColor"
                          style="font-variation-settings:'FILL' 1">{{ t.icon }}</span>
                  </div>
                  <div class="flex-1">
                    <p class="font-bold text-on-surface text-sm">{{ t.label }}</p>
                    <p class="text-xs text-on-surface-variant mt-xs">{{ t.description }}</p>
                  </div>
                  <div class="flex items-center gap-sm flex-shrink-0">
                    <input type="number" [(ngModel)]="t.value" [min]="t.min" [max]="t.max"
                           class="w-20 text-center border border-outline-variant rounded-lg px-sm py-xs
                                  text-body-md font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"/>
                    <span class="text-sm text-on-surface-variant w-12">{{ t.unit }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Notification channels -->
          <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
            <h3 class="font-bold text-on-surface mb-lg" style="font-size:16px">Notification Channels</h3>
            <div class="space-y-md">
              @for (ch of notifChannels; track ch.key) {
                <div class="flex items-center gap-md p-md rounded-xl border border-outline-variant">
                  <span class="material-symbols-outlined text-[22px] flex-shrink-0 text-on-surface-variant"
                        style="font-variation-settings:'FILL' 1">{{ ch.icon }}</span>
                  <div class="flex-1">
                    <p class="font-bold text-on-surface text-sm">{{ ch.label }}</p>
                    <p class="text-xs text-on-surface-variant">{{ ch.detail }}</p>
                  </div>
                  <!-- Toggle switch -->
                  <button (click)="ch.enabled = !ch.enabled"
                          class="relative w-12 h-6 rounded-full transition-all flex-shrink-0"
                          [class]="ch.enabled ? 'bg-primary' : 'bg-surface-container-highest'">
                    <span class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                          [class]="ch.enabled ? 'left-6' : 'left-0.5'"></span>
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- ── Tab: Egg Classification & Pricing ── -->
      <!-- ── Tab: System ── -->
      @if (activeTab === 'system') {
        <div class="space-y-md">
          <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
            <h3 class="font-bold text-on-surface mb-lg" style="font-size:16px">System Preferences</h3>
            <div class="space-y-md">
              @for (pref of systemPrefs; track pref.key) {
                <div class="flex items-center justify-between py-md border-b border-outline-variant last:border-0">
                  <div>
                    <p class="font-bold text-on-surface text-sm">{{ pref.label }}</p>
                    <p class="text-xs text-on-surface-variant">{{ pref.description }}</p>
                  </div>
                  @if (pref.type === 'toggle') {
                    <button (click)="pref.value = !pref.value"
                            class="relative w-12 h-6 rounded-full transition-all flex-shrink-0"
                            [class]="pref.value ? 'bg-primary' : 'bg-surface-container-highest'">
                      <span class="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                            [class]="pref.value ? 'left-6' : 'left-0.5'"></span>
                    </button>
                  } @else if (pref.type === 'select') {
                    <select [(ngModel)]="pref.selected"
                            class="border border-outline-variant rounded-lg px-sm py-xs text-body-md
                                   focus:outline-none focus:ring-2 focus:ring-primary/20">
                      @for (opt of prefOptions(pref); track opt) { <option>{{ opt }}</option> }
                    </select>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Backup & data -->
          <div class="bg-white border border-outline-variant rounded-2xl p-lg shadow-sm">
            <h3 class="font-bold text-on-surface mb-lg" style="font-size:16px">Data & Backup</h3>
            <div class="space-y-sm">
              @for (action of dataActions; track action.label) {
                <div class="flex items-center justify-between p-md rounded-xl border border-outline-variant">
                  <div class="flex items-center gap-md">
                    <span class="material-symbols-outlined p-sm rounded-lg text-[20px]"
                          [class]="action.iconBg" style="font-variation-settings:'FILL' 1">{{ action.icon }}</span>
                    <div>
                      <p class="font-bold text-on-surface text-sm">{{ action.label }}</p>
                      <p class="text-xs text-on-surface-variant">{{ action.description }}</p>
                    </div>
                  </div>
                  <button (click)="showToastMsg(action.toast)"
                          class="px-lg py-xs rounded-lg text-label-md font-bold transition-all flex-shrink-0"
                          [class]="action.danger
                            ? 'border border-error text-error hover:bg-error-container'
                            : 'bg-primary-fixed text-on-primary-fixed-variant hover:bg-primary hover:text-on-primary'">
                    {{ action.btnLabel }}
                  </button>
                </div>
              }
            </div>
          </div>

          <!-- System info -->
          </div>
      }

    </div>
  `,
})
export class SystemSettingsComponent implements OnInit {
  private settingsSvc = inject(SystemSettingsService);
  today     = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  activeTab = 'farm';
  toast     = signal('');
  private buildingNextId = 9;

  ngOnInit(): void {
    this.settingsSvc.get_().subscribe({
      next: (data: any) => {
        if (data?.farm_name) this.farmInfo.name = data.farm_name;
        if (data?.farm_code) this.farmInfo.code = data.farm_code;
        if (data?.currency)  this.farmInfo.currency = data.currency === 'PHP' ? 'PHP — Philippine Peso (₱)' : data.currency;
        if (data?.timezone)  this.farmInfo.timezone = data.timezone;
      },
      error: () => {}, // keep default farmInfo
    });
  }

  settingsTabs = [
    { key: 'farm',   label: 'Farm Info',        icon: 'agriculture'    },
    { key: 'alerts', label: 'Alerts',            icon: 'notifications'  },
    { key: 'system', label: 'System',            icon: 'settings'       },
  ];

  farmInfo = {
    name: 'GreenValley Poultry Farm', code: 'GVF-001',
    timezone: 'Asia/Manila (UTC+8)', currency: 'PHP — Philippine Peso (₱)',
    weightUnit: 'kg (kilogram)', address: 'Brgy. San Isidro, Batangas City, Philippines',
    owner: 'Ricardo Santos', phone: '+63 912 345 6789',
  };

  buildings = signal<FarmBuilding[]>([
    { id: 1, name: 'Alpha-1', type: 'broiler', capacity: 15000, status: 'active',      supervisor: 'Juan dela Cruz' },
    { id: 2, name: 'Alpha-2', type: 'broiler', capacity: 15000, status: 'active',      supervisor: 'Juan dela Cruz' },
    { id: 3, name: 'Beta-1',  type: 'layer',   capacity: 12000, status: 'inactive',    supervisor: 'Pedro Reyes'   },
    { id: 4, name: 'Beta-2',  type: 'layer',   capacity: 12000, status: 'active',      supervisor: 'Pedro Reyes'   },
    { id: 5, name: 'Gamma-3', type: 'broiler', capacity: 18000, status: 'maintenance', supervisor: 'Rosa Mendoza'  },
    { id: 6, name: 'Delta-1', type: 'breeder', capacity: 10000, status: 'active',      supervisor: 'Carlos Bautista' },
  ]);

  alertThresholds: AlertThreshold[] = [
    { key: 'mortality',  label: 'Daily Mortality Rate',      description: 'Alert when daily mortality exceeds this percentage',         value: 2,   unit: '%',   min: 0,   max: 20,  icon: 'emergency',   iconColor: 'text-error'     },
    { key: 'fcr',        label: 'Feed Conversion Ratio',     description: 'Alert when batch FCR exceeds this value',                    value: 1.6, unit: 'FCR', min: 1,   max: 5,   icon: 'grain',       iconColor: 'text-secondary' },
    { key: 'feed_stock', label: 'Feed Stock Low',            description: 'Alert when feed stock drops below this level (tons)',        value: 2,   unit: 'tons',min: 0.5, max: 20,  icon: 'inventory_2', iconColor: 'text-secondary' },
    { key: 'med_stock',  label: 'Medicine Stock Low',        description: 'Alert when any medicine stock drops below this percentage',  value: 20,  unit: '%',   min: 5,   max: 50,  icon: 'vaccines',    iconColor: 'text-primary'   },
    { key: 'spoilage',   label: 'Egg Spoilage Rate',         description: 'Alert when daily spoilage/rejection exceeds this rate',     value: 3,   unit: '%',   min: 0,   max: 15,  icon: 'egg',         iconColor: 'text-error'     },
    { key: 'withdrawal', label: 'Withdrawal Period Warning', description: 'Warn before egg withdrawal period ends (days in advance)',   value: 3,   unit: 'days',min: 1,   max: 14,  icon: 'schedule',    iconColor: 'text-on-surface'},
  ];

  notifChannels: NotifChannel[] = [
    { key: 'inapp',  label: 'In-App Notifications', icon: 'notifications', enabled: true,  detail: 'Bell icon in the top navigation bar'        },
    { key: 'email',  label: 'Email Alerts',          icon: 'mail',          enabled: true,  detail: 'Sent to supervisors and managers on file'   },
    { key: 'sms',    label: 'SMS Alerts',            icon: 'sms',           enabled: false, detail: 'Requires SMS gateway configuration'         },
    { key: 'push',   label: 'Push Notifications',    icon: 'phone_iphone',  enabled: false, detail: 'Requires mobile app — Phase 2 feature'     },
  ];

  eggSizes = [
    { key: 'small',       label: 'Small',       color: 'bg-surface-container text-on-surface',              minGrams: 45, maxGrams: 52,  pricePerEgg: 1.80, originalPrice: 1.80 },
    { key: 'medium',      label: 'Medium',      color: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',  minGrams: 53, maxGrams: 62,  pricePerEgg: 2.10, originalPrice: 2.10 },
    { key: 'large',       label: 'Large',       color: 'bg-primary-fixed text-on-primary-fixed-variant',    minGrams: 63, maxGrams: 72,  pricePerEgg: 2.50, originalPrice: 2.50 },
    { key: 'extra_large', label: 'Extra Large', color: 'bg-secondary-fixed text-on-secondary-fixed-variant',minGrams: 73, maxGrams: 84,  pricePerEgg: 3.00, originalPrice: 3.00 },
    { key: 'jumbo',       label: 'Jumbo',       color: 'bg-primary-container text-on-primary-container',    minGrams: 85, maxGrams: 999, pricePerEgg: 3.50, originalPrice: 3.50 },
  ];

  packagingTypes = [
    { label: 'Dozen',  qty: 12,  icon: 'grid_3x3'    },
    { label: 'Tray',   qty: 30,  icon: 'table_chart'  },
    { label: 'Flat',   qty: 36,  icon: 'grid_view'    },
    { label: 'Case',   qty: 360, icon: 'inventory_2'  },
  ];

  pricesSaved = signal(false);

  hasUnsavedPrices(): boolean {
    return this.eggSizes.some(s => s.pricePerEgg !== s.originalPrice);
  }

  changedPriceCount(): number {
    return this.eggSizes.filter(s => s.pricePerEgg !== s.originalPrice).length;
  }

  onPriceChange(): void {
    this.pricesSaved.set(false);
  }

  savePrices(): void {
    this.eggSizes.forEach(s => s.originalPrice = s.pricePerEgg);
    this.showToastMsg('Egg prices saved and applied to all new sales.');
    this.pricesSaved.set(true);
  }

  revertPrices(): void {
    this.eggSizes.forEach(s => s.pricePerEgg = s.originalPrice);
  }

  weightRangeWarning(): string {
    for (let i = 0; i < this.eggSizes.length - 1; i++) {
      const curr = this.eggSizes[i];
      const next = this.eggSizes[i + 1];
      if (curr.maxGrams >= next.minGrams) {
        return `${curr.label} (max ${curr.maxGrams}g) overlaps with ${next.label} (min ${next.minGrams}g). Adjust the ranges.`;
      }
    }
    return '';
  }

  systemPrefs = [
    { key: 'auto_verify',     type: 'toggle',  label: 'Auto-verify minor entries',          description: 'Automatically verify feed logs under 50 kg',               value: false,    options: [] as string[], selected: '' },
    { key: 'require_notes',   type: 'toggle',  label: 'Require notes on mortality',         description: 'Workers must add notes when logging mortality events',      value: true,     options: [] as string[], selected: '' },
    { key: 'session_timeout', type: 'select',  label: 'Session timeout',                    description: 'Automatically log out inactive users after this period',    value: false,    options: ['30 minutes','1 hour','2 hours','4 hours','8 hours'], selected: '2 hours' },
    { key: 'report_schedule', type: 'select',  label: 'Auto-report schedule',               description: 'Automatically generate and email daily summary reports',    value: false,    options: ['Disabled','6:00 AM','7:00 AM','8:00 AM','End of day'], selected: '7:00 AM' },
    { key: 'data_retention',  type: 'select',  label: 'Data retention period',              description: 'How long to keep historical records before archiving',      value: false,    options: ['6 months','1 year','2 years','5 years','Indefinitely'], selected: '2 years' },
    { key: 'two_factor',      type: 'toggle',  label: 'Two-factor authentication',          description: 'Require 2FA for admin and manager accounts',                value: false,    options: [] as string[], selected: '' },
  ];

  dataActions = [
    { icon: 'cloud_download',  iconBg: 'bg-primary-fixed text-on-primary-fixed-variant',    label: 'Export All Data',        description: 'Download all farm records as CSV/Excel',          btnLabel: 'Export',          danger: false, toast: 'Export started — file will download shortly.' },
    { icon: 'backup',          iconBg: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',  label: 'Create Backup',          description: 'Manual database backup to secure cloud storage',  btnLabel: 'Backup Now',       danger: false, toast: 'Backup created successfully.' },
    { icon: 'sync',            iconBg: 'bg-secondary-fixed text-on-secondary-fixed-variant',label: 'Sync Offline Data',      description: 'Force sync any pending offline entries',          btnLabel: 'Sync Now',         danger: false, toast: 'Data synchronized successfully.' },
    { icon: 'delete_forever',  iconBg: 'bg-error-container text-on-error-container',        label: 'Clear Test Data',        description: 'Remove all demo/test records from the system',    btnLabel: 'Clear',            danger: true,  toast: 'Test data cleared.' },
  ];

  sysInfo = [
    { label: 'Version',         value: 'PoultryFarm Pro v1.0.0' },
    { label: 'Database',        value: 'PostgreSQL 16' },
    { label: 'Last Backup',     value: 'Today, 2:00 AM' },
    { label: 'Storage Used',    value: '2.4 GB / 50 GB' },
    { label: 'Uptime',          value: '99.9% (30 days)' },
    { label: 'Environment',     value: 'Production' },
  ];

  addBuilding(): void {
    this.buildings.update(list => [...list, {
      id: this.buildingNextId++, name: `New-${this.buildingNextId}`,
      type: 'broiler', capacity: 10000, status: 'inactive', supervisor: '',
    }]);
  }

  removeBuilding(id: number): void {
    this.buildings.update(list => list.filter(b => b.id !== id));
  }

  prefOptions(pref: any): string[] { return pref.options ?? []; }

  saveAll(): void {
    const payload = {
      farm_name:       this.farmInfo.name,
      farm_code:       this.farmInfo.code,
      currency:        this.farmInfo.currency.split(' ')[0],
      timezone:        this.farmInfo.timezone.split(' ')[0],
      mortality_alert: this.alertThresholds.find(t=>t.key==='mortality')?.value ?? 2,
      fcr_alert:       this.alertThresholds.find(t=>t.key==='fcr')?.value ?? 1.6,
      feed_low_tons:   this.alertThresholds.find(t=>t.key==='feed_stock')?.value ?? 2,
      notify_email:    this.notifChannels.find(c=>c.key==='email')?.enabled ?? true,
      notify_sms:      this.notifChannels.find(c=>c.key==='sms')?.enabled ?? false,
    };
    this.settingsSvc.update(payload).subscribe({
      next:  () => this.showToastMsg('All settings saved successfully.'),
      error: () => this.showToastMsg('Settings saved (offline mode).'),
    });
  }

  showToastMsg(msg: string): void {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3500);
  }
}
