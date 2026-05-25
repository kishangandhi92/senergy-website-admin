
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
    BehaviorSubject,
    Observable,
    filter,
    map,
    of,
    switchMap,
    take,
    tap,
    throwError,
} from 'rxjs';
import { IClinicService } from './clinicservices.types';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })

export class ClinicService {

    private _services: BehaviorSubject<IClinicService[] | null> =
        new BehaviorSubject(null);
    private _service: BehaviorSubject<IClinicService | null> =
        new BehaviorSubject(null);
    private apiUrl = environment.apiBaseUrl + '/api/a/clinicservice';

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    /**
     * Getter for person
     */
    get service$(): Observable<IClinicService> {
        return this._service.asObservable();
    }

    /**
     * Getter for people
     */
    get services$(): Observable<IClinicService[]> {
        return this._services.asObservable();
    }

    /**
     * Get people
     */
    getClinicServices() {
        return this._httpClient
            .get(this.apiUrl)
            .pipe(
                tap((response: any) => {
                    if (response.status) {
                        this._services.next(response.data as IClinicService[]);
                    }
                })
            );
    }

    uploadClinicServicePhoto(formData: FormData) {
        return this.services$.pipe(
            take(1),
            switchMap((people) =>
                this._httpClient
                    .post(
                        this.apiUrl + '/upload',
                        formData
                    )
                    .pipe(
                        map((response: any) => {
                            return response;
                        })
                    )
            )
        );
    }

    /**
     * Create People
     */
    createClinicService(request): Observable<any> {
        return this.services$.pipe(
            take(1),
            switchMap((services) =>
                this._httpClient
                    .post(
                        this.apiUrl,
                        { ...request}
                    )
                    .pipe(
                        map((response: any) => {
                            if (response.status) {
                                // Update the people with the new instrument
                                this._services.next([response.data[0] as IClinicService, ...services]);
                            }
                            return response;
                        })
                    )
            )
        );
    }


    /**
     * Update People
     */
    updateClinicService(id, data): Observable<IClinicService> {
        return this.services$.pipe(
            take(1),
            switchMap((services) =>
                this._httpClient
                    .put(
                        this.apiUrl+'/'+id,
                        {...data}
                    )
                    .pipe(
                        map((response: any) => {
                            if (response.status) {

                                // Find the index of the updated product
                                const index = services.findIndex(
                                    (item) => item.id === id
                                );

                                // Update the product
                                services[index] = response.data[0];

                                // Update the shifts
                                this._services.next(services);
                            }
                            return response;
                        })
                    )
            )
        );
    }

    /**
     * Delete the People
     *
     * @param id
     */
    deleteClinicService(id: number): Observable<boolean> {
        return this.services$.pipe(
            take(1),
            switchMap((services) =>
                this._httpClient
                    .delete(this.apiUrl + '/' + id)
                    .pipe(
                        map((isDeleted: boolean) => {

                            if (isDeleted) {
                                // Find the index of the deleted product
                                const index = services.findIndex(
                                    (item) => item.id === id
                                );
                                // Delete the product
                                services.splice(index, 1);

                                // Update the products
                                this._services.next(services);
                            }
                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }

}
