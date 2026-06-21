import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Building {
  id:           number;
  name:         string;
  type:         string;
  capacity:     number;
  status:       'active' | 'inactive' | 'maintenance';
  batchCode?:   string;
  population:   number;
  supervisor:   string;
  fcr?:         number | null;
  mortalityPct?:number | null;
}

export interface BuildingsMeta {
  total_capacity:   number;
  total_population: number;
  active_count:     number;
  occupancy_pct:    number;
}

export interface BuildingsResponse {
  data: Building[];
  total: number;
  meta: BuildingsMeta;
}

@Injectable({ providedIn: 'root' })
export class FarmService extends ApiService {
  getBuildings(): Observable<BuildingsResponse> {
    return this.get<BuildingsResponse>('farm/buildings');
  }

  updateBuilding(id: number, data: Partial<Building>): Observable<Building> {
    return this.put<Building>(`farm/buildings/${id}`, data);
  }
}
