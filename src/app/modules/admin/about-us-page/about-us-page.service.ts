import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from 'environments/environment';
import {
    IAboutIntroRecord,
    ICoreExpertiseRecord,
    IMissionVisionRecord,
    ITeamGalleryRecord,
} from './about-us-page.types';
import { ICtaRecord } from '../homepage/home.types';

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

    // Fetches the stored Core Expertise section from the backend.
    getCoreExpertise(): Observable<any> {
        return this._httpClient.get(`${this.apiUrl}/core-expertise`).pipe(
            map((response: any) => {
                return response;
            })
        );
    }

    // Updates the Core Expertise section with the latest JSON payload.
    updateCoreExpertise(data: ICoreExpertiseRecord): Observable<any> {
        return this._httpClient
            .put(`${this.apiUrl}/core-expertise`, { ...data })
            .pipe(
                map((response: any) => {
                    return response;
                })
            );
    }

    // Fetches the stored Team Gallery section from the backend.
    getTeamGallery(): Observable<any> {
        return this._httpClient.get(`${this.apiUrl}/team-gallery`).pipe(
            map((response: any) => {
                return response;
            })
        );
    }

    // Updates the Team Gallery section with the latest full JSON payload.
    updateTeamGallery(data: ITeamGalleryRecord): Observable<any> {
        return this._httpClient
            .put(`${this.apiUrl}/team-gallery`, { ...data })
            .pipe(
                map((response: any) => {
                    return response;
                })
            );
    }

    // Fetches the stored CTA section from the backend.
    getCta(): Observable<any> {
        return this._httpClient.get(`${this.apiUrl}/cta`).pipe(
            map((response: any) => {
                return response;
            })
        );
    }

    // Updates the existing CTA row with the latest full JSON payload.
        updateCta(data: ICtaRecord): Observable<any> {
            return this._httpClient.put(`${this.apiUrl}/cta`, { ...data }).pipe(
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
