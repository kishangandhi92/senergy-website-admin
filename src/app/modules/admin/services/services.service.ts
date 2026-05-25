
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
import { Service } from './service.types';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })

export class ServicesService {

    private _services: BehaviorSubject<Service[] | null> =
        new BehaviorSubject(null);
    private _service: BehaviorSubject<Service | null> =
        new BehaviorSubject(null);
    private apiUrl = environment.apiBaseUrl + '/api/a/services';

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    /**
     * Getter for person
     */
    get service$(): Observable<Service> {
        return this._service.asObservable();
    }

    /**
     * Getter for partner
     */
    get services$(): Observable<Service[]> {
        return this._services.asObservable();
    }

    /**
     * Get partner
     */
    getAll() {
        return this._httpClient
            .get(this.apiUrl)
            .pipe(
                tap((response: any) => {
                    if (response.status) {
                        this._services.next(response.data as Service[]);
                    }
                })
            );
    }

    uploadPhoto(formData: FormData) {
        return this.services$.pipe(
            take(1),
            switchMap((partner) =>
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
     * Create Service
     */
    create(request): Observable<any> {
        return this.services$.pipe(
            take(1),
            switchMap((service) =>
                this._httpClient
                    .post(
                        this.apiUrl,
                        { ...request}
                    )
                    .pipe(
                        map((response: any) => {
                            if (response.status) {
                                // Update the service with the new instrument
                                this._services.next([response.data[0] as Service, ...service]);
                            }
                            return response;
                        })
                    )
            )
        );
    }


    /**
     * Update Service
     */
    update(id, data): Observable<Service> {
        return this.services$.pipe(
            take(1),
            switchMap((service) =>
                this._httpClient
                    .put(
                        this.apiUrl + '/'+id,
                        {...data}
                    )
                    .pipe(
                        map((response: any) => {
                            if (response.status) {

                                // Find the index of the updated product
                                const index = service.findIndex(
                                    (item) => item.id === id
                                );

                                // Update the product
                                service[index] = response.data[0];

                                // Update the shifts
                                this._services.next(service);
                            }
                            return response;
                        })
                    )
            )
        );
    }

    /**
     * Delete the Service
     *
     * @param id
     */
    delete(id: number): Observable<boolean> {
        return this.services$.pipe(
            take(1),
            switchMap((service) =>
                this._httpClient
                    .delete(this.apiUrl + '/' + id)
                    .pipe(
                        map((isDeleted: boolean) => {

                            if (isDeleted) {
                                // Find the index of the deleted product
                                const index = service.findIndex(
                                    (item) => item.id === id
                                );
                                // Delete the product
                                service.splice(index, 1);

                                // Update the products
                                this._services.next(service);
                            }
                            // Return the deleted status
                            return isDeleted;
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

}
