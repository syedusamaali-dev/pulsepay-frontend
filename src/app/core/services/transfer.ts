import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TransferPayload {
  recipientAccountNumber: string;
  amount: number;
  description?: string;
  pin?: string;
}

export interface TransferResponse {
  success: boolean;
  message: string;
  data: {
    referenceId: string;
    amount: number;
    senderAccountNumber: string;
    recipientAccountNumber: string;
    newBalance: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class TransferService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  executeTransfer(payload: TransferPayload): Observable<TransferResponse> {
    return this.http.post<TransferResponse>(`${this.apiUrl}/transfer/execute`, payload);
  }

  getHistory(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/transaction/history`);
  }
}