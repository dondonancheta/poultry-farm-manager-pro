import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, PagedResponse } from './api.service';

export interface SaleItem {
  egg_size:   string;
  quantity:   number;
  unit_price: number;
  subtotal:   number;
}

export interface Sale {
  id:             number;
  invoice_no:     string;
  customer_id:    number;
  customer_name:  string;
  customer_type:  string;
  sale_date:      string;
  payment_method: string;
  status:         'pending' | 'paid' | 'overdue';
  subtotal:       number;
  discount:       number;
  total:          number;
  notes?:         string;
  items:          SaleItem[];
}

export interface Customer {
  id:           number;
  name:         string;
  type:         string;
  contact?:     string;
  phone?:       string;
  email?:       string;
  credit_limit: number;
  balance:      number;
  active:       boolean;
}

export interface SaleDto {
  customer_id:    number;
  sale_date:      string;
  payment_method: string;
  items:          Omit<SaleItem, 'subtotal'>[];
  discount?:      number;
  notes?:         string;
}

@Injectable({ providedIn: 'root' })
export class SalesService extends ApiService {

  getSales(params?: { status?: string; customer_id?: number; date_from?: string; date_to?: string }): Observable<{ data: Sale[] }> {
    return this.get<{ data: Sale[] }>('sales', params);
  }

  createSale(dto: SaleDto): Observable<Sale> {
    return this.post<Sale>('sales', dto);
  }

  markPaid(id: number): Observable<{ message: string }> {
    return this.post<{ message: string }>(`sales/${id}/mark-paid`, {});
  }

  getInvoice(id: number): Observable<Sale> {
    return this.get<Sale>(`sales/${id}/invoice`);
  }

  // ── Customers ─────────────────────────────────────────────────────────────
  getCustomers(): Observable<{ data: Customer[] }> {
    return this.get<{ data: Customer[] }>('customers');
  }

  createCustomer(dto: Partial<Customer>): Observable<Customer> {
    return this.post<Customer>('customers', dto);
  }

  updateCustomer(id: number, dto: Partial<Customer>): Observable<Customer> {
    return this.put<Customer>(`customers/${id}`, dto);
  }
}
