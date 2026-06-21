import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { DashboardKPIs, ActivityItem } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService extends ApiService {

  getKPIs(): Observable<DashboardKPIs> {
    return this.get<DashboardKPIs>('dashboard/kpis');
  }

  getActivity(): Observable<ActivityItem[]> {
    return this.get<ActivityItem[]>('dashboard/activity');
  }
}
