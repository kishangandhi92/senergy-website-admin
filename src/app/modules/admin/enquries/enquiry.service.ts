import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { BehaviorSubject, Observable, catchError, of, tap } from 'rxjs';

type EnquiryType = 'general' | 'career' | 'product';

interface EnquiryResponse {
    status: boolean;
    data: any[];
}

@Injectable({ providedIn: 'root' })
export class EnquiryService {
    private readonly _enquiries = new BehaviorSubject<any[]>([]);
    private readonly apiUrl = environment.apiBaseUrl + '/api/a/enquiries';

    constructor(private readonly _httpClient: HttpClient) {}

    get enquiries$(): Observable<any[]> {
        return this._enquiries.asObservable();
    }

    getEnquiries(type: EnquiryType): Observable<EnquiryResponse> {
        this._enquiries.next([]);

        return this._httpClient.get<EnquiryResponse>(this.apiUrl + '/' + type).pipe(
            tap((response) => {
                this._enquiries.next(response.status ? (response.data ?? []) : []);
            }),
            catchError(() => {
                this._enquiries.next([]);

                return of({
                    status: false,
                    data: [],
                });
            })
        );
    }

    downloadExcel(type: EnquiryType): void {
        window.open(
            environment.apiBaseUrl + '/api/u/enquiries/export/' + type,
            '_blank'
        );
    }
}
