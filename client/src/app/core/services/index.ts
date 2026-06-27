import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PagedResponse } from './api.service';

// ── Feed Service ──────────────────────────────────────────────────────────────
export interface FeedStock {
  id: number; name: string; category: string;
  quantity_kg: number; price_per_kg: number;
  expiry_date?: string; received_date: string;
}

export interface FeedIssuanceDto {
  feed_stock_id: number; flock_batch_id: number;
  building_id: number; issued_by: number;
  quantity_kg: number; session: string; notes?: string;
}

export interface FcrResult {
  farm_avg: number;
  by_batch: { batch: string; building: string; fcr: number }[];
}

@Injectable({ providedIn: 'root' })
export class FeedService extends ApiService {
  getStock():                          Observable<FeedStock[]>    { return this.get<FeedStock[]>('feed-stock'); }
  logIssuance(dto: FeedIssuanceDto):   Observable<unknown>        { return this.post('feed-issuance', dto); }
  logReceiving(dto: unknown):          Observable<unknown>        { return this.post('feed-receiving', dto); }
  getFcr(params?: { date_from?: string; date_to?: string }): Observable<FcrResult> {
    return this.get<FcrResult>('feed/fcr', params);
  }
}

// ── Mortality Service ─────────────────────────────────────────────────────────
export interface MortalityDto {
  flock_batch_id: number; building_id: number; recorded_by: number;
  count: number; cause: string; location?: string;
  symptoms?: string; disposal_method?: string; severity: string;
}

@Injectable({ providedIn: 'root' })
export class MortalityService extends ApiService {
  getAll(params?: { batch_id?: number; page?: number }): Observable<PagedResponse<MortalityDto & { id: number; recorded_at: string }>> {
    return this.get('mortality-logs', params);
  }
  log(dto: MortalityDto): Observable<unknown> { return this.post('mortality-logs', dto); }
}

// ── Health Service ────────────────────────────────────────────────────────────
export interface MedicineItem {
  id: number; name: string; type: string; withdrawalDays: number;
  storageTemp: string; stock: number; unit: string; expiryDate?: string;
}

export interface VaccinationItem {
  id: number; batchId: number; batchCode: string; building: string;
  vaccineName: string; scheduledDate: string; status: string;
  completedDate?: string; administeredBy?: string;
}

@Injectable({ providedIn: 'root' })
export class HealthService extends ApiService {
  getMedicines():       Observable<MedicineItem[]>      { return this.get<MedicineItem[]>('medicines'); }
  getVaccinations():    Observable<VaccinationItem[]>   { return this.get<VaccinationItem[]>('vaccinations'); }
  getTreatments():      Observable<unknown[]>           { return this.get<unknown[]>('treatments'); }
  getActiveWithdrawals(): Observable<unknown[]>         { return this.get<unknown[]>('treatments/active-withdrawal'); }
  logTreatment(dto: unknown): Observable<unknown>       { return this.post('treatments', dto); }
  markVaccinationDone(id: number, by?: string, batchNo?: string, notes?: string): Observable<unknown> {
    return this.post(`vaccinations/${id}/complete`, { administered_by: by, batch_no: batchNo, notes });
  }
  scheduleVaccination(dto: unknown): Observable<unknown>  { return this.post('vaccinations', dto); }
  updateVaccination(id: number, dto: unknown): Observable<unknown> { return this.put(`vaccinations/${id}`, dto); }
}

// ── Inventory Service ─────────────────────────────────────────────────────────
export interface InventoryItem {
  id: number; category: string; name: string;
  current: number; capacity: number; unit: string;
  minThreshold: number; reorderPoint: number;
  lastUpdated: string; supplier?: string; location: string;
  expiryDate?: string;
}

@Injectable({ providedIn: 'root' })
export class InventoryService extends ApiService {
  getAll():    Observable<InventoryItem[]>  { return this.get<InventoryItem[]>('inventory'); }
  getAlerts(): Observable<InventoryItem[]>  { return this.get<InventoryItem[]>('inventory/alerts'); }
}

// ── User Service (Admin) ──────────────────────────────────────────────────────
export interface UserDto {
  name: string; email: string; role: string;
  building?: string; phone?: string; password?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService extends ApiService {
  getAll(params?: { role?: string; status?: string; page?: number; per_page?: number }): Observable<PagedResponse<UserDto & { id: number }>> {
    return this.get('users', params);
  }
  create(dto: UserDto):          Observable<unknown>  { return this.post('users', dto); }
  update(id: number, dto: Partial<UserDto>): Observable<unknown> { return this.put(`users/${id}`, dto); }
  remove(id: number):            Observable<void>     { return this.delete<void>(`users/${id}`); }
  toggleStatus(id: number):      Observable<unknown>  { return this.post(`users/${id}/toggle-status`, {}); }
  resetPassword(id: number):     Observable<unknown>  { return this.post(`users/${id}/reset-password`, {}); }
}

// ── Analytics Service ─────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AnalyticsService extends ApiService {
  getProduction(params?: { date_from?: string; date_to?: string; building_id?: string }): Observable<unknown> {
    return this.get('analytics/production', params);
  }
  getFcr(params?: { date_from?: string; date_to?: string }):  Observable<unknown> { return this.get('analytics/fcr', params); }
  getMortality(params?: { date_from?: string; date_to?: string }): Observable<unknown> { return this.get('analytics/mortality', params); }
  getBuildings(params?: { date_from?: string; date_to?: string }): Observable<unknown>  { return this.get('analytics/buildings', params); }
  getProfitability(params?: { date_from?: string; date_to?: string }): Observable<unknown> { return this.get('analytics/profitability', params); }
}

// ── Reports Service ───────────────────────────────────────────────────────────
export interface ReportParams {
  report_type: string; format: 'pdf' | 'xlsx';
  date_from: string; date_to: string; building?: string;
}

export interface ReportJob {
  job_id: string; name: string; format: string;
  status: 'processing' | 'ready' | 'failed';
  progress: number; created_at: string;
  size?: string; download_url?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportService extends ApiService {
  generate(params: ReportParams): Observable<{ job_id: string }> {
    return this.post<{ job_id: string }>('reports', params);
  }
  getStatus(jobId: string): Observable<ReportJob> {
    return this.get<ReportJob>(`reports/${jobId}`);
  }
}

// ── System Settings Service ───────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class SystemSettingsService extends ApiService {
  get_():    Observable<Record<string, unknown>> { return this.get('system-settings'); }
  update(settings: Record<string, unknown>): Observable<unknown> { return this.put('system-settings', settings); }
}

// ── Master Data Service ───────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class MasterDataService extends ApiService {
  getBreeds():     Observable<unknown[]> { return this.get('master-data/breeds'); }
  getFeedTypes():  Observable<unknown[]> { return this.get('master-data/feed-types'); }
  getSuppliers():  Observable<unknown[]> { return this.get('master-data/suppliers'); }
  getMedicines():  Observable<unknown[]> { return this.get('master-data/medicines'); }
  getCustomers():  Observable<unknown[]> { return this.get('master-data/customers'); }

  createBreed(data: unknown):    Observable<unknown> { return this.post('master-data/breeds', data); }
  updateBreed(id: number, data: unknown): Observable<unknown> { return this.put(`master-data/breeds/${id}`, data); }
  deleteBreed(id: number):       Observable<void>    { return this.delete<void>(`master-data/breeds/${id}`); }

  createFeedType(data: unknown):    Observable<unknown> { return this.post('master-data/feed-types', data); }
  updateFeedType(id: number, data: unknown): Observable<unknown> { return this.put(`master-data/feed-types/${id}`, data); }

  createSupplier(data: unknown):    Observable<unknown> { return this.post('master-data/suppliers', data); }
  updateSupplier(id: number, data: unknown): Observable<unknown> { return this.put(`master-data/suppliers/${id}`, data); }
}

// Re-export new dedicated service files
export { SalesService } from './sales.service';
export { HealthService as HealthServiceV2 } from './health.service';
export { ReportService as ReportServiceV2 } from './report.service';
export { DataRefreshService } from './data-refresh.service';
