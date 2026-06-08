import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, switchMap, take, tap } from 'rxjs';
import { environment } from 'environments/environment';
import { Product } from './product.types';

@Injectable({ providedIn: 'root' })
export class ProductsService {
    private _products: BehaviorSubject<Product[] | null> = new BehaviorSubject<Product[] | null>(
        null
    );
    private _product: BehaviorSubject<Product | null> = new BehaviorSubject<Product | null>(
        null
    );
    private apiUrl = environment.apiBaseUrl + '/api/a/products';

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    /**
     * Getter for tag
     */
    get product$(): Observable<Product | null> {
        return this._product.asObservable();
    }

    /**
     * Getter for tags
     */
    get products$(): Observable<Product[] | null> {
        return this._products.asObservable();
    }

    /**
     * Get products
     */
    getProducts() {
        return this._httpClient
            .get(this.apiUrl)
            .pipe(
                tap((response: any) => {
                    this._products.next(response.data as Product[]);
                })
            );
    }

    getProductDetailsById(productId: number): Observable<any> {
        return this._httpClient
            .get(this.apiUrl + '/'+ productId)
            .pipe(
                map((response: any) => {
                   return response;
                })
            );
    }

    /**
     * Create Product
     */
    createProduct(request: any): Observable<any> {
        return this.products$.pipe(
            take(1),
            switchMap((products) =>
                this._httpClient
                    .post(this.apiUrl, { ...request })
                    .pipe(
                        map((response: any) => {
                            return response;
                        })
                    )
            )
        );
    }

    /**
     * Update Product
     */
    updateProduct(id: number, data: any): Observable<Product> {
        return this.products$.pipe(
            take(1),
            switchMap((products) =>
                this._httpClient
                    .put(this.apiUrl + '/' + id, { ...data })
                    .pipe(
                        map((response: any) => {
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
    showHideProduct(product: Product): Observable<boolean> {
        let flag = Number(product.status) === 0 ? 'enable' : 'disable';

        return this.products$.pipe(
            take(1),
            switchMap((products) =>
                this._httpClient
                    .post(
                        this.apiUrl + '/' +
                            flag +
                            '/' +
                            product.id,
                        {}
                    )
                    .pipe(
                        map((response: any) => {
                            if (response.status && products) {
                                // Find the index of the updated product
                                const index = products.findIndex(
                                    (item) => item.id === product.id
                                );

                                if (index !== -1) {
                                    // Update the product
                                    products[index] = response.data;

                                    // Update the shifts
                                    this._products.next(products);
                                }
                            }
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

    uploadGalleryFiles(formData: FormData) {
        return this.products$.pipe(
            take(1),
            switchMap((products) =>
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
