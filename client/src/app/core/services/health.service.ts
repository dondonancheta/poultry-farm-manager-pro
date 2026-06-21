import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Medicine {
  id:              number;
  name:            string;
  type:            string;
  active_ingredient?: string;
  withdrawal_days: number;
  storage_temp:    string;
  supplier?:       string;
  stock:           number;
  unit:            string;
  expiry_date?:    string;
  active:          boolean;
}

export interface Treatment {
  id:              number;
  batch:           string;
  medicine:        string;
  dosage_ml:       number;
  duration_days:   number;
  birds_treated:   number;
  symptoms?:       string;
  diagnosis?:      string;
  withdrawal_end?: string;
  withdrawal_days: number;
  administered_at: string;
  administered_by: string;
}

export interface TreatmentDto {
  flock_batch_id:  number;
  medicine_id:     number;
  dosage_ml?:      number;
  duration_days?:  number;
  birds_treated?:  number;
  symptoms?:       string;
  diagnosis?:      string;
}

export interface Vaccination {
  id:              number;
  batch:           string;
  building:        string;
  vaccine_name:    string;
  scheduled_date:  string;
  status:          'scheduled' | 'completed' | 'overdue';
  completed_date?: string;
  administered_by?: string;
  batch_no?:       string;
  notes?:          string;
}

export interface VaccinationDto {
  flock_batch_id: number;
  vaccine_name:   string;
  scheduled_date: string;
  notes?:         string;
}

@Injectable({ providedIn: 'root' })
export class HealthService extends ApiService {

  getMedicines(): Observable<{ data: Medicine[] }> {
    return this.get<{ data: Medicine[] }>('medicines');
  }

  getTreatments(): Observable<{ data: Treatment[] }> {
    return this.get<{ data: Treatment[] }>('treatments');
  }

  logTreatment(dto: TreatmentDto): Observable<Treatment> {
    return this.post<Treatment>('treatments', dto);
  }

  getActiveWithdrawals(): Observable<{ data: any[] }> {
    return this.get<{ data: any[] }>('treatments/active-withdrawal');
  }

  getVaccinations(): Observable<{ data: Vaccination[] }> {
    return this.get<{ data: Vaccination[] }>('vaccinations');
  }

  scheduleVaccination(dto: VaccinationDto): Observable<Vaccination> {
    return this.post<Vaccination>('vaccinations', dto);
  }

  updateVaccination(id: number, dto: Partial<VaccinationDto & { status: string }>): Observable<Vaccination> {
    return this.put<Vaccination>(`vaccinations/${id}`, dto);
  }

  markVaccinationDone(id: number, administered_by?: string, batch_no?: string, notes?: string): Observable<Vaccination> {
    return this.post<Vaccination>(`vaccinations/${id}/complete`, { administered_by, batch_no, notes });
  }
}
