
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
import { ISubscribers } from './subscribers.types';

@Injectable({ providedIn: 'root' })

export class SubscribersService {

    private _subscribers: BehaviorSubject<ISubscribers[] | null> =
        new BehaviorSubject(null);
    private _subscriber: BehaviorSubject<ISubscribers | null> =
        new BehaviorSubject(null);
    private apiUrl = environment.apiBaseUrl + '/api/a/subscribers';

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    /**
     * Getter for person
     */
    get subscriber$(): Observable<ISubscribers> {
        return this._subscriber.asObservable();
    }

    /**
     * Getter for people
     */
    get subscribers$(): Observable<ISubscribers[]> {
        return this._subscribers.asObservable();
    }

    /**
     * Get people
     */
    getSubscribers() {
        return this._httpClient
            .get(this.apiUrl)
            .pipe(
                tap((response: any) => {
                    if (response.status) {
                        this._subscribers.next(response.data as ISubscribers[]);
                    }
                })
            );
    }

    /**
     * Delete the People
     *
     * @param emailId
     */
    unsubscribe(autoNo: number): Observable<boolean> {
        return this.subscribers$.pipe(
            take(1),
            switchMap((list) =>
                this._httpClient
                    .delete(this.apiUrl + '/' + autoNo)
                    .pipe(
                        map((isDeleted: boolean) => {

                            if (isDeleted) {
                                // Find the index of the deleted product
                                const index = list.findIndex(
                                    (item) => item.autoNo === autoNo
                                );
                                // Delete the product
                                list.splice(index, 1);

                                // Update the products
                                this._subscribers.next(list);
                            }
                            // Return the deleted status
                            return isDeleted;
                        })
                    )
            )
        );
    }

}
