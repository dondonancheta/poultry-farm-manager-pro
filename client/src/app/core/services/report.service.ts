import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { environment } from '../../../../environments/environment';

export interface ReportParams {
  report_type: string;
  format:      'pdf' | 'csv';
  date_from:   string;
  date_to:     string;
  building?:   string;
}

export interface ReportJob {
  job_id:      string;
  name:        string;
  format:      string;
  status:      'processing' | 'ready' | 'failed';
  progress:    number;
  created_at:  string;
}

@Injectable({ providedIn: 'root' })
export class ReportService extends ApiService {
  private httpClient = inject(HttpClient);

  generate(params: ReportParams): Observable<{ job_id: string; name: string; status: string }> {
    return this.post<{ job_id: string; name: string; status: string }>('reports', params);
  }

  getStatus(jobId: string): Observable<ReportJob> {
    return this.get<ReportJob>(`reports/${jobId}`);
  }

  /** Opens the download URL in a new tab — browser handles file save */
  downloadUrl(jobId: string): string {
    return `${environment.apiUrl}/reports/${jobId}/download`;
  }

  /** Download with Authorization header (for JWT-protected endpoints) */
  download(jobId: string): Observable<Blob> {
    const token = localStorage.getItem('pfp_token');
    return this.httpClient.get(
      `${environment.apiUrl}/reports/${jobId}/download`,
      {
        responseType: 'blob',
        headers: token && !token.startsWith('demo-token-')
          ? { Authorization: `Bearer ${token}` }
          : {},
      }
    );
  }
}
