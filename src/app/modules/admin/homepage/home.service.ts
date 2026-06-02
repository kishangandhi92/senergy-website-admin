import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { IAboutRecord, IAdvantagesRecord, IHeroBannerRecord } from './home.types';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class HomeService {
    private apiUrl = environment.apiBaseUrl + '/api/a/home';

    constructor(private _httpClient: HttpClient) {}

    // Fetches the stored hero-banner row from the backend.
    getBanner(): Observable<any> {
        return this._httpClient.get(`${this.apiUrl}/banner`).pipe(
            map((response: any) => {
                return response;
            })
        );
    }

    // Creates the initial hero-banner row when it does not exist yet.
    createBanner(data: IHeroBannerRecord): Observable<any> {
        return this._httpClient.post(`${this.apiUrl}/banner`, { ...data }).pipe(
            map((response: any) => {
                return response;
            })
        );
    }

    // Fetches the stored advantages section from the backend.
    getAdvantages(): Observable<any> {
        return this._httpClient.get(`${this.apiUrl}/advantages`).pipe(
            map((response: any) => {
                return response;
            })
        );
    }

    // Fetches the stored about section from the backend.
    getAbout(): Observable<any> {
        return this._httpClient.get(`${this.apiUrl}/about`).pipe(
            map((response: any) => {
                return response;
            })
        );
    }

    // Updates the existing advantages row with the latest full JSON payload.
    updateAdvantages(data: IAdvantagesRecord): Observable<any> {
        return this._httpClient.put(`${this.apiUrl}/advantages`, { ...data }).pipe(
            map((response: any) => {
                return response;
            })
        );
    }

    // Updates the existing about row with the latest full JSON payload.
    updateAbout(data: IAboutRecord): Observable<any> {
        return this._httpClient.put(`${this.apiUrl}/about`, { ...data }).pipe(
            map((response: any) => {
                return response;
            })
        );
    }

    // Updates the existing hero-banner row with the latest full JSON payload.
    updateBanner(data: IHeroBannerRecord): Observable<any> {
        return this._httpClient.put(`${this.apiUrl}/banner`, { ...data }).pipe(
            map((response: any) => {
                return response;
            })
        );
    }

    // Deletes an uploaded file from the server using its file name and field type.
    deletePhoto(fileName: string, fieldType: string): Observable<boolean> {
        return this._httpClient
            .post(`${this.apiUrl}/delete`, { fileName, fieldType })
            .pipe(
                map((response: any) => {
                    if (response.status) {
                        return true;
                    }
                    return false;
                })
            );
    }

    // Uploads an image file and returns the backend response containing the stored path/name.
    uploadFiles(formData: FormData): Observable<any> {
        return this._httpClient.post(`${this.apiUrl}/upload`, formData).pipe(
            map((response: any) => {
                return response;
            })
        );
    }
}
