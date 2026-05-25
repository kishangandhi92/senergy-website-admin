import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private _data: BehaviorSubject<any> = new BehaviorSubject(null);
    private _locumEnquries: BehaviorSubject<any> = new BehaviorSubject(null);
    private _clinicEnquries: BehaviorSubject<any> = new BehaviorSubject(null);
    private _enquiries: BehaviorSubject<any> = new BehaviorSubject(null);
    private apiUrl = environment.apiBaseUrl + '/api/a/dashboard';


    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------


    get data$(): Observable<any> {
        return this._data.asObservable();
    }

    get locumEnquiries(): Observable<any> {
        return this._locumEnquries.asObservable();
    }

    get clinicEnquiries(): Observable<any> {
        return this._clinicEnquries.asObservable();
    }

    get enquiries(): Observable<any> {
        return this._enquiries.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getStats(): Observable<any> {
        return this._httpClient.get(this.apiUrl + '/stats').pipe(
            tap((response: any) => {
                this._data.next(response);
            })
        );
    }

    getLocumEnquiries(): Observable<any> {
        return this._httpClient.get(this.apiUrl + '/locumEnquries').pipe(
            tap((response: any[]) => {
                this._locumEnquries.next(response);
            })
        );
    }

    getClinicEnquiries(): Observable<any> {
        return this._httpClient.get(this.apiUrl + '/clinicEnquries').pipe(
            tap((response: any[]) => {
                this._clinicEnquries.next(response);
            })
        );
    }

    getEnquiries(): Observable<any> {
        return this._httpClient.get(this.apiUrl + '/enquiries').pipe(
            tap((response: any[]) => {
                this._enquiries.next(response);
            })
        );
    }
}
