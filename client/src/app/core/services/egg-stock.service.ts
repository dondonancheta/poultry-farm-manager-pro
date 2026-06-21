import { Injectable, signal, computed, inject } from '@angular/core';
import { EggCollectionService } from './egg-collection.service';

export type EggSize = 'small' | 'medium' | 'large' | 'extra_large' | 'jumbo';

export interface EggStock { small: number; medium: number; large: number; extra_large: number; jumbo: number; }

@Injectable({ providedIn: 'root' })
export class EggStockService {
  private eggSvc = inject(EggCollectionService);

  /** Single source of truth for egg stock — read by both Inventory and Sales */
  stock = signal<EggStock>({ small: 1100, medium: 3200, large: 8400, extra_large: 620, jumbo: 180 });
  loading = signal(false);

  totalEggs  = computed(() => Object.values(this.stock()).reduce((s, v) => s + v, 0));
  totalValue = computed(() => {
    const prices: Record<EggSize, number> = { small:1.80, medium:2.10, large:2.50, extra_large:3.00, jumbo:3.50 };
    return (Object.keys(this.stock()) as EggSize[])
      .reduce((s, k) => s + this.stock()[k] * prices[k], 0);
  });

  /** Reload from API and update signal */
  reload(): void {
    this.loading.set(true);
    this.eggSvc.getInventory().subscribe({
      next: (inv) => {
        this.stock.set({ small: inv.small, medium: inv.medium, large: inv.large, extra_large: inv.extra_large, jumbo: inv.jumbo });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /** Deduct sold quantities from stock (called by SalesComponent on sale save) */
  deductSale(items: { eggSize: EggSize; qty: number }[]): void {
    this.stock.update(current => {
      const updated = { ...current };
      for (const item of items) {
        if (item.eggSize in updated) {
          updated[item.eggSize] = Math.max(0, updated[item.eggSize] - item.qty);
        }
      }
      return updated;
    });
  }

  /** Add collected eggs (called by EggCollectionComponent on successful submit) */
  addCollection(sizes: Partial<EggStock>): void {
    this.stock.update(current => ({
      small:       current.small       + (sizes.small       ?? 0),
      medium:      current.medium      + (sizes.medium      ?? 0),
      large:       current.large       + (sizes.large       ?? 0),
      extra_large: current.extra_large + (sizes.extra_large ?? 0),
      jumbo:       current.jumbo       + (sizes.jumbo       ?? 0),
    }));
  }

  /** Manual adjustment (called by Inventory adjustment modal) */
  adjust(size: EggSize, delta: number): void {
    this.stock.update(current => ({
      ...current,
      [size]: Math.max(0, current[size] + delta),
    }));
  }
}
