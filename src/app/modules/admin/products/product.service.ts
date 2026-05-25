
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
import { Product } from './product.types';

@Injectable({ providedIn: 'root' })

export class ProductService {

    private _products: BehaviorSubject<Product[] | null> =
        new BehaviorSubject(null);
    private _product: BehaviorSubject<Product | null> =
        new BehaviorSubject(null);
    private apiUrl = environment.apiBaseUrl + '/api/a/products';

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    /**
     * Getter for person
     */
    get product$(): Observable<Product> {
        return this._product.asObservable();
    }

    /**
     * Getter for partner
     */
    get products$(): Observable<Product[]> {
        return this._products.asObservable();
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
                        this._products.next(response.data as Product[]);
                    }
                })
            );
    }

    uploadPhoto(formData: FormData) {
        return this.products$.pipe(
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
     * Create Product
     */
    create(request): Observable<any> {
        return this.products$.pipe(
            take(1),
            switchMap((product) =>
                this._httpClient
                    .post(
                        this.apiUrl,
                        { ...request}
                    )
                    .pipe(
                        map((response: any) => {
                            if (response.status) {
                                // Update the product with the new product
                                this._products.next([response.data as Product, ...product]);
                            }
                            return response;
                        })
                    )
            )
        );
    }


    /**
     * Update Product
     */
    update(id, data): Observable<Product> {
        return this.products$.pipe(
            take(1),
            switchMap((product) =>
                this._httpClient
                    .put(
                        this.apiUrl + '/'+id,
                        {...data}
                    )
                    .pipe(
                        map((response: any) => {
                            if (response.status) {

                                // Find the index of the updated product
                                const index = product.findIndex(
                                    (item) => item.autoNo === id
                                );

                                // Update the product
                                product[index] = response.data;

                                // Update the shifts
                                this._products.next(product);
                            }
                            return response;
                        })
                    )
            )
        );
    }

    /**
     * Delete the Product
     *
     * @param id
     */
    delete(id: number): Observable<boolean> {
        return this.products$.pipe(
            take(1),
            switchMap((product) =>
                this._httpClient
                    .delete(this.apiUrl + '/' + id)
                    .pipe(
                        map((isDeleted: boolean) => {

                            if (isDeleted) {
                                // Find the index of the deleted product
                                const index = product.findIndex(
                                    (item) => item.autoNo === id
                                );
                                // Delete the product
                                product.splice(index, 1);

                                // Update the products
                                this._products.next(product);
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
