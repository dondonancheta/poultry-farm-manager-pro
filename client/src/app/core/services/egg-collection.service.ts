import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PagedResponse } from './api.service';
import { EggCollection, EggSize } from '../models';

export interface EggCollectionDto {
  flock_batch_id:   number;
  building_id:      number;
  collector_id:     number;
  collection_date:  string;
  collection_time:  string;
  sizes:            Record<EggSize, number>;
  cracked:          number;
  dirty:            number;
  spoiled:          number;
  rejected:         number;
  notes?:           string;
}

export interface EggSummary {
  period:           { from: string; to: string };
  total_collected:  number;
  good_eggs:        number;
  defect_count:     number;
  spoilage_pct:     number;
  by_size:          Record<EggSize, number>;
}

export interface EggInventory {
  small: number; medium: number; large: number;
  extra_large: number; jumbo: number;  // underscore matches EggSize type
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class EggCollectionService extends ApiService {

  getAll(params?: { date?: string; building_id?: number; batch_id?: number; page?: number; per_page?: number; status?: string }): Observable<PagedResponse<EggCollection>> {
    return this.get<PagedResponse<EggCollection>>('egg-collections', params);
  }

  record(dto: EggCollectionDto): Observable<EggCollection> {
    return this.post<EggCollection>('egg-collections', dto);
  }

  getSummary(params?: { date_from?: string; date_to?: string; building_id?: number }): Observable<EggSummary> {
    return this.get<EggSummary>('egg-collections/summary', params);
  }

  getInventory(): Observable<EggInventory> {
    return this.get<EggInventory>('egg-inventory');
  }

  update(id: number, data: Partial<EggCollectionDto>): Observable<EggCollection> {
    return this.put<EggCollection>(`egg-collections/${id}`, data);
  }

  remove(id: number): Observable<void> {
    return this.delete<void>(`egg-collections/${id}`);
  }
}
