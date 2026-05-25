import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, switchMap, take, tap } from 'rxjs';
import { About } from './about.types';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class AboutService {

    private _content: BehaviorSubject<About[] | null> = new BehaviorSubject(
        null
    );

    private apiUrl = environment.apiBaseUrl + '/api/a/about';

    /**
     * Getter for tags
     */
    get content$(): Observable<About[]> {
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
    update(data): Observable<About> {
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


    deletePhoto(fileName: string): Observable<boolean> {
        return this._httpClient
            .post(this.apiUrl + '/deletephoto', {fileName})
            .pipe(
                map((response: any) => {
                   if (response.status) {
                    return true;
                   }
                   return false;
                })
            );
    }

    uploadFiles(formData: FormData) {
        return this.content$.pipe(
            take(1),
            switchMap((projects) =>
                this._httpClient
                    .post(this.apiUrl + '/upload', formData)
                    .pipe(
                        map((response: any) => {
                            return response;
                        })
                    )
            )
        );
    }
}
