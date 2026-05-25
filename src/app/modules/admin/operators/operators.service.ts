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
import { Operator } from './operators.types';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })

export class OperatorService {

    private _operators: BehaviorSubject<Operator[] | null> =
        new BehaviorSubject(null);
    private _operator: BehaviorSubject<Operator | null> =
        new BehaviorSubject(null);
    private apiUrl = environment.apiBaseUrl + '/api/a/operators';

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    /**
     * Getter for product
     */
    get operator$(): Observable<Operator> {
        return this._operator.asObservable();
    }

    /**
     * Getter for products
     */
    get operators$(): Observable<Operator[]> {
        return this._operators.asObservable();
    }

    /**
     * Get operators
     */
    getOperators(
    ) {
        return this._httpClient
            .get(this.apiUrl)
            .pipe(
                tap((response: any) => {
                    if (response.status) {
                        this._operators.next(response.data as Operator[]);
                    }
                })
            );
    }


    /**
     * Get product by id
     */
    getOperatorById(id: string): Observable<Operator> {
        return this._operators.pipe(
            take(1),
            map((operators) => {
                // Find the shift
                const operator = operators.find((item) => item.empId === id) || null;

                // Update the shift
                this._operator.next(operator);

                // Return the shift
                return operator;
            }),
            switchMap((operator) => {
                if (!operator) {
                    return throwError(
                        'Could not found operator with id of ' + id + '!'
                    );
                }

                return of(operator);
            })
        );
    }

    /**
     * Create Operator
     */
    createOperator(requestObj): Observable<any> {
        return this.operators$.pipe(
            take(1),
            switchMap((operators) =>
                this._httpClient
                    .post(
                        this.apiUrl,
                        {...requestObj}
                    )
                    .pipe(
                        map((response: any) => {
                            if (response.status) {
                                this._operators.next([response.data as Operator, ...operators]);
                            }
                            return response;
                        })
                    )
            )
        );
    }

    updateOperator(empId, requestObj): Observable<any> {
        return this.operators$.pipe(
            take(1),
            switchMap((operators) =>
                this._httpClient
                    .put(
                        this.apiUrl+ '/' + empId,
                        {...requestObj}
                    )
                    .pipe(
                        map((response: any) => {
                            if (response.status) {

                                // Find the index of the updated product
                                const index = operators.findIndex(
                                    (item) => item.empId === empId
                                );

                                // Update the product
                                operators[index] = response.data;

                                // Update the shifts
                                this._operators.next(operators);
                            }
                            return response;
                        })
                    )
            )
        );
    }

    /**
     * Delete the shift
     *
     * @param id
     */
    deleteOperator(id: string): Observable<boolean> {
        return this.operators$.pipe(
            take(1),
            switchMap((operators) =>
                this._httpClient
                    .delete(this.apiUrl+ '/' + id)
                    .pipe(
                        map((isDeleted: boolean) => {

                            if (isDeleted) {
                                // Find the index of the deleted product
                                const index = operators.findIndex(
                                    (item) => item.empId === id
                                );
                                // Delete the product
                                operators.splice(index, 1);

                                // Update the products
                                this._operators.next(operators);
                            }
                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }

    checkEmployeeId(empId: string): Observable<boolean> {
        const url = `${this.apiUrl}/check-id/${empId}`;
        return this._httpClient.get<boolean>(url); // API should return true/false
      }
}
