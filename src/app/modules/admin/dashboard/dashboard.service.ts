import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
    private _data: BehaviorSubject<any> = new BehaviorSubject(null);
    private _productEnquries: BehaviorSubject<any> = new BehaviorSubject(null);
    private _careerEnquries: BehaviorSubject<any> = new BehaviorSubject(null);
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

    get productEnquiries(): Observable<any> {
        return this._productEnquries.asObservable();
    }

    get careerEnquiries(): Observable<any> {
        return this._careerEnquries.asObservable();
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

    getProductEnquiries(): Observable<any> {
        return this._httpClient.get(this.apiUrl + '/productEnquiries').pipe(
            tap((response: any[]) => {
                this._productEnquries.next(response);
            })
        );
    }

    getCareerEnquiries(): Observable<any> {
        return this._httpClient.get(this.apiUrl + '/careerEnquiries').pipe(
            tap((response: any[]) => {
                this._careerEnquries.next(response);
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
