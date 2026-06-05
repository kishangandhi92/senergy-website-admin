import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from 'environments/environment';
import { IAboutIntroRecord, IMissionVisionRecord } from './about-us-page.types';

@Injectable({ providedIn: 'root' })
export class AboutUsPageService {
    private apiUrl = environment.apiBaseUrl + '/api/a/about';

    constructor(private _httpClient: HttpClient) {}

    // Fetches the stored About Intro section from the backend.
    getAboutIntro(): Observable<any> {
        return this._httpClient.get(`${this.apiUrl}/intro`).pipe(
            map((response: any) => {
                return response;
            })
        );
    }

    // Updates the About Intro section with the latest JSON payload.
    updateAboutIntro(data: IAboutIntroRecord): Observable<any> {
        return this._httpClient.put(`${this.apiUrl}/intro`, { ...data }).pipe(
            map((response: any) => {
                return response;
            })
        );
    }

    // Fetches the stored Mission and Vision section from the backend.
    getMissionVision(): Observable<any> {
        return this._httpClient.get(`${this.apiUrl}/mission-vision`).pipe(
            map((response: any) => {
                return response;
            })
        );
    }

    // Updates the Mission and Vision section with the latest JSON payload.
    updateMissionVision(data: IMissionVisionRecord): Observable<any> {
        return this._httpClient
            .put(`${this.apiUrl}/mission-vision`, { ...data })
            .pipe(
                map((response: any) => {
                    return response;
                })
            );
    }
}
