import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type RefreshEvent =
  | 'egg-collections'
  | 'flock-batches'
  | 'mortality'
  | 'feed'
  | 'sales'
  | 'vaccinations'
  | 'treatments'
  | 'users'
  | 'all';

@Injectable({ providedIn: 'root' })
export class DataRefreshService {
  private _refresh$ = new Subject<RefreshEvent>();
  readonly refresh$ = this._refresh$.asObservable();

  emit(event: RefreshEvent): void {
    this._refresh$.next(event);
  }
}
