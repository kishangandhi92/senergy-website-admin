import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, switchMap, take, tap } from 'rxjs';
import { Contact } from './contact.types';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class ContactService {

    private _content: BehaviorSubject<Contact[] | null> = new BehaviorSubject(
        null
    );

    private apiUrl = environment.apiBaseUrl + '/api/a/contact';

    /**
     * Getter for tags
     */
    get content$(): Observable<Contact[]> {
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
    update(data): Observable<Contact> {
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
