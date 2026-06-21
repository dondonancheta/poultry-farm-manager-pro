import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EggCollectionService } from '../../core/services/egg-collection.service';
import { FlockBatchService } from '../../core/services/flock-batch.service';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { EggStockService } from '../../core/services/egg-stock.service';

type EggSize = 'small' | 'medium' | 'large' | 'extra_large' | 'jumbo';

interface EggSizeRow { key: EggSize; label: string; color: string; }
interface CollectionEntry {
  id: number; building: string; batch: string; collectionTime: string;
  collector: string; sizes: Record<EggSize, number>;
  cracked: number; dirty: number; spoiled: number; rejected: number;
  totalGood: number; totalCollected: number; savedAt: string;
}
interface BatchOption  { id: number; code: string; building: string; buildingId: number; }

const EGG_SIZES: EggSizeRow[] = [
  { key: 'small',       label: 'Small',       color: 'bg-surface-container text-on-surface' },
  { key: 'medium',      label: 'Medium',      color: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' },
  { key: 'large',       label: 'Large',       color: 'bg-primary-fixed text-on-primary-fixed-variant' },
  { key: 'extra_large', label: 'Extra Large', color: 'bg-secondary-fixed text-on-secondary-fixed-variant' },
  { key: 'jumbo',       label: 'Jumbo',       color: 'bg-primary-container text-on-primary-container' },
];

@Component({
  selector: 'app-egg-collection',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-lg max-w-2xl mx-auto pb-xl">

      <!-- Header -->
      <div class="flex items-center gap-md mb-lg">
        <a routerLink="/worker-home"
           class="p-sm hover:bg-surface-container rounded-lg transition-colors text-on-surface-variant">
          <span class="material-symbols-outlined">arrow_back</span>
        </a>
        <div>
          <h1 class="font-bold text-primary" style="font-size:24px;line-height:32px">Daily Egg Collection</h1>
          <p class="text-body-md text-on-surface-variant">{{ today }}</p>
        </div>
      </div>

      <!-- Success toast -->
      @if (saved()) {
        <div class="bg-primary-fixed text-on-primary-fixed-variant rounded-xl p-md mb-lg flex items-center gap-sm">
          <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">check_circle</span>
          <span class="font-bold">Collection saved to database successfully!</span>
        </div>
      }

      <!-- API error -->
      @if (apiError()) {
        <div class="bg-error-container text-on-error-container rounded-xl p-md mb-lg flex items-center gap-sm">
          <span class="material-symbols-outlined text-[18px]">error</span>
          {{ apiError() }}
        </div>
      }

      <div class="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm mb-lg">

        <!-- Section: Collection Info -->
        <div class="px-lg py-md bg-primary text-on-primary">
          <div class="flex items-center gap-sm">
            <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">egg_alt</span>
            <h2 class="font-bold" style="font-size:16px">Collection Information</h2>
          </div>
        </div>

        <div class="p-lg space-y-md">
          <div class="grid grid-cols-2 gap-md">

            <!-- Batch picker (loads from API) -->
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Flock Batch *</label>
              @if (loadingBatches()) {
                <div class="border border-outline-variant rounded-lg px-md py-sm text-on-surface-variant text-body-md
                            flex items-center gap-sm">
                  <span class="material-symbols-outlined text-[16px] animate-spin">refresh</span> Loading...
                </div>
              } @else {
                <select [(ngModel)]="form.batchId" (ngModelChange)="onBatchChange($event)"
                        class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                               focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option [ngValue]="null">Select batch...</option>
                  @for (b of batches(); track b.id) {
                    <option [ngValue]="b.id">{{ b.code }} — {{ b.building }}</option>
                  }
                </select>
              }
            </div>

            <!-- Building auto-filled from batch -->
            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Building / House</label>
              <div class="border border-outline-variant rounded-lg px-md py-sm text-body-md bg-surface-container-low
                          text-on-surface-variant flex items-center gap-sm">
                <span class="material-symbols-outlined text-[16px] text-primary">home_health</span>
                {{ form.building || 'Auto-filled from batch' }}
              </div>
            </div>

            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Collection Time *</label>
              <input type="time" [(ngModel)]="form.collectionTime"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                            focus:outline-none focus:ring-2 focus:ring-primary/20"/>
            </div>

            <div>
              <label class="text-label-md text-on-surface-variant block mb-xs">Collector</label>
              <div class="border border-outline-variant rounded-lg px-md py-sm text-body-md bg-surface-container-low
                          text-on-surface-variant flex items-center gap-sm">
                <span class="material-symbols-outlined text-[16px] text-primary">person</span>
                {{ currentUserName }}
              </div>
            </div>

          </div>
        </div>

        <!-- Section: Egg Classification -->
        <div class="px-lg py-md bg-surface-container-low border-t border-b border-outline-variant">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-sm">
              <span class="material-symbols-outlined text-primary" style="font-variation-settings:'FILL' 1">category</span>
              <h2 class="font-bold text-on-surface" style="font-size:16px">Egg Size Classification</h2>
            </div>
            <button (click)="clearSizes()"
                    class="text-label-md text-on-surface-variant hover:text-error transition-colors flex items-center gap-xs">
              <span class="material-symbols-outlined text-[14px]">clear_all</span>Clear
            </button>
          </div>
        </div>

        <div class="p-lg">
          <div class="space-y-sm">
            @for (size of eggSizes; track size.key) {
              <div class="flex items-center gap-md p-sm rounded-xl border border-outline-variant
                          hover:border-primary transition-colors">
                <span class="px-sm py-xs rounded-lg text-label-md font-bold w-24 text-center flex-shrink-0"
                      [class]="size.color">{{ size.label }}</span>

                <div class="flex-1 flex items-center gap-sm">
                  <button (click)="decrement(size.key)"
                          class="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high
                                 flex items-center justify-center transition-colors font-bold text-on-surface text-lg">
                    −
                  </button>
                  <input type="number" [ngModel]="form.sizes[size.key]"
                         (ngModelChange)="setSizeValue(size.key, $event)"
                         class="w-20 text-center border border-outline-variant rounded-lg py-xs
                                text-body-md font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                         min="0"/>
                  <button (click)="increment(size.key)"
                          class="w-8 h-8 rounded-lg bg-primary-fixed hover:bg-primary text-on-primary-fixed-variant
                                 hover:text-on-primary flex items-center justify-center transition-all font-bold text-lg">
                    +
                  </button>
                </div>

                <div class="text-right flex-shrink-0 w-16">
                  <div class="font-bold text-primary text-sm">{{ form.sizes[size.key] || 0 }}</div>
                  <div class="text-[10px] text-on-surface-variant">{{ pct(size.key) }}%</div>
                </div>
              </div>
            }
          </div>

          <div class="mt-md pt-md border-t border-outline-variant flex justify-between items-center">
            <span class="text-body-md text-on-surface-variant">Total classified:</span>
            <span class="font-bold text-primary text-title-md">{{ totalSized | number }} eggs</span>
          </div>
        </div>

        <!-- Section: Quality Issues -->
        <div class="px-lg py-md bg-surface-container-low border-t border-b border-outline-variant">
          <div class="flex items-center gap-sm">
            <span class="material-symbols-outlined text-error" style="font-variation-settings:'FILL' 1">broken_image</span>
            <h2 class="font-bold text-on-surface" style="font-size:16px">Quality Issues</h2>
            <span class="text-label-md text-on-surface-variant ml-auto">Deducted from good eggs</span>
          </div>
        </div>

        <div class="p-lg grid grid-cols-2 gap-md">
          @for (q of qualityFields; track q.key) {
            <div class="p-md rounded-xl border border-outline-variant" [class]="q.bg">
              <label class="text-label-md font-bold block mb-sm" [class]="q.labelColor">
                <span class="material-symbols-outlined text-[16px] mr-xs"
                      style="font-variation-settings:'FILL' 1">{{ q.icon }}</span>
                {{ q.label }}
              </label>
              <input type="number" [(ngModel)]="form[q.key]" min="0"
                     class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                            font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
                     placeholder="0"/>
            </div>
          }
        </div>

        <!-- Summary totals -->
        <div class="px-lg py-md bg-primary-container border-t border-outline-variant">
          <div class="grid grid-cols-3 gap-md text-center">
            <div>
              <div class="text-[11px] font-bold text-on-primary-container opacity-80 uppercase">Total</div>
              <div class="font-bold text-on-primary" style="font-size:22px">{{ totalCollected | number }}</div>
            </div>
            <div>
              <div class="text-[11px] font-bold text-on-primary-container opacity-80 uppercase">Defects</div>
              <div class="font-bold text-on-primary" style="font-size:22px">{{ totalDefects | number }}</div>
            </div>
            <div>
              <div class="text-[11px] font-bold text-on-primary-container opacity-80 uppercase">Good Eggs</div>
              <div class="font-bold text-on-primary" style="font-size:22px">{{ goodEggs | number }}</div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="p-lg border-t border-outline-variant">
          <label class="text-label-md text-on-surface-variant block mb-xs">Notes (optional)</label>
          <textarea [(ngModel)]="form.notes" rows="2"
                    placeholder="Any observations about collection, hen behaviour, equipment issues..."
                    class="w-full border border-outline-variant rounded-lg px-md py-sm text-body-md
                           focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none">
          </textarea>
        </div>
      </div>

      <!-- Validation error -->
      @if (validationError()) {
        <div class="bg-error-container text-on-error-container rounded-xl p-md mb-md flex items-center gap-sm">
          <span class="material-symbols-outlined text-[18px]">error</span>{{ validationError() }}
        </div>
      }

      <!-- Submit -->
      <button (click)="submit()" [disabled]="submitting()"
              class="w-full bg-primary text-on-primary py-md rounded-xl font-bold text-body-md
                     hover:opacity-90 active:scale-95 transition-all disabled:opacity-60
                     flex items-center justify-center gap-sm shadow-sm">
        @if (submitting()) {
          <span class="material-symbols-outlined animate-spin text-[18px]">refresh</span>Saving to database...
        } @else {
          <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'FILL' 1">save</span>
          Save Collection Entry
        }
      </button>

      <!-- Today's saved entries -->
      @if (entries().length > 0) {
        <div class="mt-xl">
          <h3 class="font-bold text-on-surface mb-md" style="font-size:16px">
            Today's Entries ({{ entries().length }}) — Total: {{ totalEntryEggs() | number }} eggs
          </h3>
          <div class="space-y-sm">
            @for (entry of entries(); track entry.id) {
              <div class="bg-white border border-outline-variant rounded-xl p-md flex items-center gap-md">
                <span class="material-symbols-outlined p-sm bg-primary-fixed text-on-primary-fixed-variant rounded-lg"
                      style="font-variation-settings:'FILL' 1">egg</span>
                <div class="flex-1">
                  <p class="font-bold text-on-surface text-body-md">{{ entry.building }} — {{ entry.batch }}</p>
                  <p class="text-xs text-on-surface-variant">{{ entry.collectionTime }} · {{ entry.collector }}
                    <span class="ml-sm text-on-surface-variant">
                      Cracked: {{ entry.cracked }} · Spoiled: {{ entry.spoiled }}
                    </span>
                  </p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-primary">{{ entry.totalGood | number }}</p>
                  <p class="text-xs text-on-surface-variant">good eggs</p>
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class EggCollectionComponent implements OnInit {
  private eggSvc    = inject(EggCollectionService);
  private batchSvc  = inject(FlockBatchService);
  private auth      = inject(AuthService);
  private notifSvc    = inject(NotificationService);
  private eggStockSvc = inject(EggStockService);

  today = new Date().toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  eggSizes   = EGG_SIZES;
  batches    = signal<BatchOption[]>([]);
  loadingBatches = signal(true);
  entries    = signal<CollectionEntry[]>([]);
  saved      = signal(false);
  submitting = signal(false);
  validationError = signal('');
  apiError   = signal('');
  private nextId = 1;

  form = this.blankForm();

  qualityFields = [
    { key: 'cracked'  as const, label: 'Cracked',  icon: 'egg',          bg: 'bg-error-container/30',  labelColor: 'text-on-error-container' },
    { key: 'dirty'    as const, label: 'Dirty',    icon: 'water_damage', bg: 'bg-surface-container',   labelColor: 'text-on-surface' },
    { key: 'spoiled'  as const, label: 'Spoiled',  icon: 'warning',      bg: 'bg-secondary-fixed/40',  labelColor: 'text-on-secondary-fixed-variant' },
    { key: 'rejected' as const, label: 'Rejected', icon: 'cancel',       bg: 'bg-surface-container',   labelColor: 'text-on-surface' },
  ];

  get currentUserName(): string { return this.auth.user()?.name ?? 'Current User'; }
  get totalSized():    number   { return Object.values(this.form.sizes).reduce((s, v) => s + (Number(v) || 0), 0); }
  get totalCollected():number   { return this.totalSized; }
  get totalDefects():  number   { return (Number(this.form.cracked)||0)+(Number(this.form.dirty)||0)+(Number(this.form.spoiled)||0)+(Number(this.form.rejected)||0); }
  get goodEggs():      number   { return Math.max(0, this.totalCollected - this.totalDefects); }

  totalEntryEggs = computed(() => this.entries().reduce((s, e) => s + e.totalGood, 0));

  ngOnInit(): void {
    this.batchSvc.getAll({ status: 'Active' }).subscribe({
      next: (res) => {
        this.batches.set(res.data.map(b => ({
          id:         b.id,
          code:       b.batchCode,
          building:   b.houseName,
          buildingId: (b as any).buildingId ?? b.id,
        })));
        this.loadingBatches.set(false);
      },
      error: () => {
        // Fallback static batches if API unreachable
        this.batches.set([
          { id: 1, code: 'B-2024-001', building: 'Alpha-1', buildingId: 1 },
          { id: 2, code: 'B-2024-002', building: 'Beta-2',  buildingId: 4 },
          { id: 4, code: 'B-2024-004', building: 'Delta-1', buildingId: 6 },
          { id: 5, code: 'B-2024-005', building: 'Alpha-2', buildingId: 2 },
        ]);
        this.loadingBatches.set(false);
      },
    });
  }

  onBatchChange(batchId: number | null): void {
    const batch = this.batches().find(b => b.id === batchId);
    this.form.building   = batch?.building   ?? '';
    this.form.buildingId = batch?.buildingId ?? 0;
  }

  pct(key: EggSize): string {
    const total = this.totalSized;
    return total ? ((this.form.sizes[key] / total) * 100).toFixed(0) : '0';
  }

  setSizeValue(key: EggSize, value: number): void {
    this.form.sizes[key] = Math.max(0, Number(value) || 0);
  }

  increment(key: EggSize): void { this.form.sizes[key] = (this.form.sizes[key] || 0) + 1; }
  decrement(key: EggSize): void { this.form.sizes[key] = Math.max(0, (this.form.sizes[key] || 0) - 1); }
  clearSizes(): void { Object.keys(this.form.sizes).forEach(k => { this.form.sizes[k as EggSize] = 0; }); }

  submit(): void {
    if (!this.form.batchId)      { this.validationError.set('Please select a flock batch.'); return; }
    if (this.totalCollected === 0){ this.validationError.set('Please enter at least one egg.'); return; }

    this.validationError.set('');
    this.apiError.set('');
    this.submitting.set(true);

    const userId = this.auth.user()?.id ?? 4;

    this.eggSvc.record({
      flock_batch_id:  this.form.batchId!,
      building_id:     this.form.buildingId,
      collector_id:    userId,
      collection_date: new Date().toISOString().split('T')[0],
      collection_time: this.form.collectionTime,
      sizes:           { ...this.form.sizes },
      cracked:         Number(this.form.cracked)  || 0,
      dirty:           Number(this.form.dirty)    || 0,
      spoiled:         Number(this.form.spoiled)  || 0,
      rejected:        Number(this.form.rejected) || 0,
      notes:           this.form.notes || undefined,
    }).subscribe({
      next: (res: any) => {
        this.entries.update(list => [{
          id:             res.id ?? this.nextId++,
          building:       this.form.building,
          batch:          this.batches().find(b => b.id === this.form.batchId)?.code ?? '',
          collectionTime: this.form.collectionTime,
          collector:      this.currentUserName,
          sizes:          { ...this.form.sizes },
          cracked:        Number(this.form.cracked)  || 0,
          dirty:          Number(this.form.dirty)    || 0,
          spoiled:        Number(this.form.spoiled)  || 0,
          rejected:       Number(this.form.rejected) || 0,
          totalGood:      this.goodEggs,
          totalCollected: this.totalCollected,
          savedAt:        new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
        }, ...list]);

        // Update shared egg stock signal with newly collected eggs
        this.eggStockSvc.addCollection({ ...this.form.sizes });
        // Push success notification for supervisor visibility
        this.notifSvc.push({
          level:    'success',
          category: 'eggs',
          icon:     'egg',
          title:    `Egg Collection Submitted — ${this.form.building}`,
          message:  `${this.goodEggs} good eggs logged by ${this.currentUserName}. Batch ${this.batches().find(b => b.id === this.form.batchId)?.code}.`,
          route:    '/eggs',
          batch:    this.batches().find(b => b.id === this.form.batchId)?.code,
          building: this.form.building,
          forRoles: ['admin','manager','supervisor'],
        });
        this.form = this.blankForm();
        this.submitting.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 3500);
      },
      error: (err: any) => {
        this.submitting.set(false);
        this.apiError.set(err?.error?.message ?? 'Failed to save. Please try again.');
      },
    });
  }

  private blankForm() {
    return {
      batchId:        null as number | null,
      buildingId:     0,
      building:       '',
      collectionTime: this.nowTime(),
      sizes:          { small: 0, medium: 0, large: 0, extra_large: 0, jumbo: 0 } as Record<EggSize, number>,
      cracked:        0, dirty: 0, spoiled: 0, rejected: 0, notes: '',
    };
  }

  private nowTime(): string {
    const n = new Date();
    return `${String(n.getHours()).padStart(2,'0')}:${String(n.getMinutes()).padStart(2,'0')}`;
  }
}
