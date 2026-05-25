import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, switchMap, take, tap } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class PrivacyService {

    private _content: BehaviorSubject<any[] | null> = new BehaviorSubject(
        null
    );

    private apiUrl = environment.apiBaseUrl + '/api/a/privacy';

    /**
     * Getter for tags
     */
    get content$(): Observable<any[]> {
        return this._content.asObservable();
    }

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}


    getDetails(): Observable<any> {
        return this._httpClient
            .get(this.apiUrl)
            .pipe(
                map((response: any) => {
                   return response;
                })
            );
    }


    /**
     * Update About
     */
    update(data): Observable<any> {
        return this.content$.pipe(
            take(1),
            switchMap((projects) =>
                this._httpClient
                    .put(this.apiUrl, { ...data })
                    .pipe(
                        map((response: any) => {
                            return response;
                        })
                    )
            )
        );
    }
}
