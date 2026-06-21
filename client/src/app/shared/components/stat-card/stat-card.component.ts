import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

export type StatVariant = 'default' | 'warning' | 'success' | 'error';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [NgIf],
  template: `
    <div
      class="bg-surface-container-lowest border border-outline-variant p-md rounded-xl
             shadow-sm hover:shadow-md transition-all"
    >
      <div class="flex justify-between items-start mb-sm">
        <span
          class="material-symbols-outlined p-2 rounded-lg"
          [class]="iconBg"
        >{{ icon }}</span>
        <span class="text-xs font-bold" [class]="badgeColor">{{ badge }}</span>
      </div>

      <p class="text-on-surface-variant text-label-md uppercase tracking-wider mb-xs">{{ label }}</p>
      <h3 class="text-headline-lg font-bold text-primary leading-none" style="font-size:32px;line-height:40px">
        {{ value }}<span *ngIf="unit" class="text-title-md font-normal text-on-surface-variant ml-1">{{ unit }}</span>
      </h3>
    </div>
  `,
})
export class StatCardComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string | number;
  @Input({ required: true }) icon!: string;
  @Input() badge   = '';
  @Input() unit    = '';
  @Input() variant: StatVariant = 'default';

  get iconBg(): string {
    const map: Record<StatVariant, string> = {
      default: 'bg-primary-fixed text-on-primary-fixed-variant',
      warning: 'bg-secondary-fixed text-on-secondary-fixed-variant',
      success: 'bg-primary-fixed text-on-primary-fixed-variant',
      error:   'bg-error-container text-on-error-container',
    };
    return map[this.variant];
  }

  get badgeColor(): string {
    const map: Record<StatVariant, string> = {
      default: 'text-primary',
      warning: 'text-secondary',
      success: 'text-primary',
      error:   'text-error',
    };
    return map[this.variant];
  }
}
