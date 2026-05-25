import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class EnquiryService {
    private _enquries: BehaviorSubject<any[] | null> =
        new BehaviorSubject(null);
    private apiUrl = environment.apiBaseUrl + '/api/a/enquiries';

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for tags
     */
    get enquiries$(): Observable<any[]> {
        return this._enquries.asObservable();
    }

    /**
     * Get recent works
     */
    getEnquiries(type: string) {
        return this._httpClient.get(this.apiUrl + '/' + type).pipe(
            tap((response: any) => {
                if (response.status) {
                    this._enquries.next(response.data as any[]);
                }
            })
        );
    }

    downloadExcel(type) {
        window.open(environment.apiBaseUrl + '/api/u/enquiries/export/' + type, '_blank');
    }
}
