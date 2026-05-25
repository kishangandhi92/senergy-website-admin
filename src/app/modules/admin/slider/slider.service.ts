
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
import { environment } from 'environments/environment';
import { Slider } from './slider.types';

@Injectable({ providedIn: 'root' })

export class SliderService {

    private _sliders: BehaviorSubject<Slider[] | null> =
        new BehaviorSubject(null);
    private _slider: BehaviorSubject<Slider | null> =
        new BehaviorSubject(null);
    private apiUrl = environment.apiBaseUrl + '/api/a/sliders';

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    /**
     * Getter for person
     */
    get slider$(): Observable<Slider> {
        return this._slider.asObservable();
    }

    /**
     * Getter for partner
     */
    get sliders$(): Observable<Slider[]> {
        return this._sliders.asObservable();
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
                        this._sliders.next(response.data as Slider[]);
                    }
                })
            );
    }

    uploadPhoto(formData: FormData) {
        return this.sliders$.pipe(
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
     * Create Slider
     */
    create(request): Observable<any> {
        return this.sliders$.pipe(
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
                                this._sliders.next([response.data[0] as Slider, ...service]);
                            }
                            return response;
                        })
                    )
            )
        );
    }


    /**
     * Update Slider
     */
    update(id, data): Observable<Slider> {
        return this.sliders$.pipe(
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
                                this._sliders.next(service);
                            }
                            return response;
                        })
                    )
            )
        );
    }

    /**
     * Delete the Slider
     *
     * @param id
     */
    delete(id: number): Observable<boolean> {
        return this.sliders$.pipe(
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
                                this._sliders.next(service);
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
