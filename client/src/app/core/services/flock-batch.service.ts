import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PagedResponse } from './api.service';
import { FlockBatch } from '../models';

export interface BatchPerformance {
  batch_id:    number;
  age_curve:   { day: number; weight_g: number }[];
  daily_eggs:  { date: string; count: number }[];
}

@Injectable({ providedIn: 'root' })
export class FlockBatchService extends ApiService {

  getAll(params?: { status?: string; page?: number; per_page?: number }): Observable<PagedResponse<FlockBatch>> {
    return this.get<PagedResponse<FlockBatch>>('flock-batches', params);
  }

  getById(id: number): Observable<FlockBatch> {
    return this.get<FlockBatch>(`flock-batches/${id}`);
  }

  getPerformance(id: number): Observable<BatchPerformance> {
    return this.get<BatchPerformance>(`flock-batches/${id}/performance`);
  }

  create(data: Partial<FlockBatch>): Observable<FlockBatch> {
    return this.post<FlockBatch>('flock-batches', data);
  }

  update(id: number, data: Partial<FlockBatch>): Observable<FlockBatch> {
    return this.put<FlockBatch>(`flock-batches/${id}`, data);
  }

  remove(id: number): Observable<void> {
    return this.delete<void>(`flock-batches/${id}`);
  }
}
