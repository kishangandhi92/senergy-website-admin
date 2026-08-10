import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/user/user.service';
import * as CryptoJS from 'crypto-js';
import {
    catchError,
    finalize,
    Observable,
    of,
    shareReplay,
    switchMap,
    throwError,
} from 'rxjs';
import { User } from '../user/user.types';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private _authenticated: boolean = false;
    private _httpClient = inject(HttpClient);
    private _userService = inject(UserService);
    private _refreshAccessToken$?: Observable<any>;

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for access token
     */
    set accessToken(token: string) {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string {
        return localStorage.getItem('accessToken') ?? '';
    }

    // Refresh token
    set refreshToken(token: string) {
        localStorage.setItem('refreshToken', token);
    }

    get refreshToken(): string {
        return localStorage.getItem('refreshToken') ?? '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Forgot password
     *
     * @param empId
     */
    forgotPassword(emailId: string): Observable<any> {
        return this._httpClient.post(`${environment.apiBaseUrl}/api/u/forgot-password`, {
            emailId,
        });
    }

    /**
     * Reset password
     *
     * @param password
     */
    resetPassword(password: string): Observable<any> {
        return this._userService.user$.pipe(
            switchMap((user) => {
                return this._httpClient.post(
                    `${environment.apiBaseUrl}/api/a/operators/reset-password`,
                    {
                        id: user.id,
                        password: CryptoJS.MD5(password).toString(
                            CryptoJS.enc.Hex
                        ),
                        name: user.name
                    }
                );
            })
        );
    }

    /**
     * Sign in
     *
     * @param credentials
     */
    signIn(credentials: {
        email: string;
        password: string;
        captcha: string;
    }): Observable<any> {
        // Throw error, if the user is already logged in
        if (this._authenticated) {
            return throwError('User is already logged in.');
        }

        credentials.password = CryptoJS.MD5(credentials.password).toString(
            CryptoJS.enc.Hex
        );

        return this._httpClient
            .post(`${environment.apiBaseUrl}/api/u/login`, credentials)
            .pipe(
                switchMap((response: any) => {
                    if (response.status) {
                        // Store the access token in the local storage
                        this.accessToken = response.data.accessToken;

                        if (response.data.refreshToken) {
                            this.refreshToken = response.data.refreshToken;
                        }

                        // Set the authenticated flag to true
                        this._authenticated = true;

                        // Store the user on the user service
                        this._userService.user = {
                            id: response.data.user.emailId,
                            name: response.data.user.name,
                            //privilege: response.data.user.privilege,
                            type: response.data.user.type,
                        } as User;

                        sessionStorage.setItem(
                            'user',
                            JSON.stringify({
                                id: response.data.user.emailId,
                                name: response.data.user.name,
                                // privilege: response.data.user.privilege,
                                type: response.data.user.type,
                            })
                        );
                    }

                    // Return a new observable with the response
                    return of(response);
                })
            );
    }

    refreshAccessToken(): Observable<any> {

        if (!this.refreshToken) {
            return throwError(() => new Error('No refresh token available'));
        }

        // Concurrent 401 responses must wait for the same refresh request.
        if (this._refreshAccessToken$) {
            return this._refreshAccessToken$;
        }

        this._refreshAccessToken$ = this._httpClient
            .post(
                `${environment.apiBaseUrl}/api/a/refresh-token`,
                {
                    refreshToken: this.refreshToken
                }
            )
            .pipe(
                switchMap((response: any) => {

                    if (!response.status || !response.accessToken) {
                        return throwError(
                            () => new Error('Unable to refresh token')
                        );
                    }

                    this.accessToken = response.accessToken;

                    return of(response);
                }),
                // Allow a later token expiry to start a new refresh request.
                finalize(() => (this._refreshAccessToken$ = undefined)),
                shareReplay({ bufferSize: 1, refCount: false })
            );

        return this._refreshAccessToken$;
    }

    /**
     * Sign in using the access token
     */
    signInUsingToken(): Observable<any> {
        // Sign in using the token
        return this._httpClient
            .post(`${environment.apiBaseUrl}/api/a/sign-in-with-token`, {
                accessToken: this.accessToken,
            })
            .pipe(
                catchError(() =>
                    // Return false
                    of(false)
                ),
                switchMap((response: any) => {
                    // Replace the access token with the new one if it's available on
                    // the response object.
                    //
                    // This is an added optional step for better security. Once you sign
                    // in using the token, you should generate a new one on the server
                    // side and attach it to the response object. Then the following
                    // piece of code can replace the token with the refreshed one.
                    if (response.accessToken) {
                        this.accessToken = response.accessToken;
                    }

                    // Set the authenticated flag to true
                    this._authenticated = true;

                    // Store the user on the user service
                    this._userService.user = {
                            id: response.data.user.emailId,
                            name: response.data.user.name,
                            //privilege: response.data.user.privilege,
                            type: response.data.user.type,
                        } as User;

                    sessionStorage.setItem(
                        'user',
                        JSON.stringify({
                            id: response.data.user.emailId,
                            name: response.data.user.name,
                            type: response.data.user.type,
                        })
                    );

                    // Return true
                    return of(true);
                })
            );
    }

    /**
     * Sign out
     */
    signOut(): Observable<any> {
        // Remove the access token from the local storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('user');
        
        // Set the authenticated flag to false
        this._authenticated = false;

        // Return the observable
        return of(true);
    }

    /**
     * Sign up
     *
     * @param user
     */
    signUp(user: {
        name: string;
        email: string;
        password: string;
        company: string;
    }): Observable<any> {
        return this._httpClient.post('api/auth/sign-up', user);
    }

    /**
     * Unlock session
     *
     * @param credentials
     */
    unlockSession(credentials: {
        email: string;
        password: string;
    }): Observable<any> {
        return this._httpClient.post('api/auth/unlock-session', credentials);
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean> {
        // Check if the user is logged in
        if (this._authenticated) {
            return of(true);
        }

        // Check the access token availability
        if (!this.accessToken && !this.refreshToken) {
            return of(false);
        }

        // Check the access token expire date
        if (this.accessToken && AuthUtils.isTokenExpired(this.accessToken)) {
            if (!this.refreshToken) {
                return of(false);
            }

            return this.refreshAccessToken().pipe(
                switchMap(() => this.signInUsingToken()),
                catchError(() => of(false))
            );
        }

        let user = JSON.parse(sessionStorage.getItem('user'));
        if (user) {
            this._userService.user = user;
        }

        // If the access token exists, and it didn't expire, sign in using it
        return this.signInUsingToken();
    }
}
