import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, switchMap, take, tap } from 'rxjs';
import { IHome } from './home.types';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class HomeService {

    private _content: BehaviorSubject<IHome[] | null> = new BehaviorSubject(
        null
    );

    private apiUrl = environment.apiBaseUrl + '/api/a/home';

    /**
     * Getter for tags
     */
    get content$(): Observable<IHome[]> {
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
     * Update Home
     */
    update(data): Observable<IHome> {
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


    deletePhoto(fileName: string, fileType: string): Observable<boolean> {
        return this._httpClient
            .post(this.apiUrl + '/deletephoto', {fileName, fileType})
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
