import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ICareer, ICareerPayload } from './careers.types';

@Injectable({ providedIn: 'root' })
export class CareerService {
    private _jobs: BehaviorSubject<ICareer[]> = new BehaviorSubject<ICareer[]>([]);
    private readonly apiUrl = `${environment.apiBaseUrl}/api/a/careers`;

    constructor(private _httpClient: HttpClient) {}

    // Exposes the current careers list to list components.
    get jobs$(): Observable<ICareer[]> {
        return this._jobs.asObservable();
    }

    // Fetches all career rows and stores the normalized list in the shared subject.
    getCareers(): Observable<any> {
        return this._httpClient.get(this.apiUrl).pipe(
            tap((response: any) => {
                const rows = this.extractCareerRows(response);
                this._jobs.next(rows.map((row) => this.normalizeCareer(row)));
            })
        );
    }

    // Creates a new career row.
    createCareer(payload: ICareerPayload): Observable<any> {
        return this._httpClient.post(this.apiUrl, payload);
    }

    // Updates one existing career row.
    updateCareer(careerId: number, payload: ICareerPayload): Observable<any> {
        return this._httpClient.put(`${this.apiUrl}/${careerId}`, payload);
    }

    // Deletes one career row.
    deleteCareer(careerId: number): Observable<any> {
        return this._httpClient.delete(`${this.apiUrl}/${careerId}`);
    }

    // Marks one career row as closed.
    closeCareer(careerId: number): Observable<any> {
        return this._httpClient.patch(`${this.apiUrl}/${careerId}/close`, {
            isOpen: false,
        });
    }

    // Extracts the array of career rows from either a wrapped or direct API response.
    private extractCareerRows(response: any): any[] {
        const payload = response?.data ?? response;
        return Array.isArray(payload) ? payload : [];
    }

    // Normalizes raw API data into a consistent UI-safe career shape.
    private normalizeCareer(row: any): ICareer {
        return {
            id: Number(row?.id) || 0,
            title: row?.title || '',
            experience: row?.experience || '',
            qualification: row?.qualification || '',
            skills: row?.skills || '',
            isOpen:
                row?.isOpen === true ||
                row?.isOpen === 1 ||
                row?.isOpen === '1',
            createdAt: row?.createdAt || '',
            modifiedAt: row?.modifiedAt || '',
        };
    }
}
