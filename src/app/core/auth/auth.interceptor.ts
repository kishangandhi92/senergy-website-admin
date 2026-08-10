import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandlerFn,
    HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { Observable, catchError, switchMap, throwError } from 'rxjs';

/**
 * Intercept
 *
 * @param req
 * @param next
 */
export const authInterceptor = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);

    // Clone the request object
    let newReq = req.clone();

    // Request
    //
    // If the access token didn't expire, add the Authorization header.
    // We won't add the Authorization header if the access token expired.
    // This will force the server to return a "401 Unauthorized" response
    // for the protected API routes which our response interceptor will
    // catch and delete the access token from the local storage while logging
    // the user out from the app.
    if (
        authService.accessToken &&
        !AuthUtils.isTokenExpired(authService.accessToken)
    ) {
        newReq = req.clone({
            headers: req.headers.set(
                'Authorization',
                'Bearer ' + authService.accessToken
            ),
        });
    }

    // Response
    return next(newReq).pipe(
        catchError((error) => {

            // Only handle 401
            if (error.status !== 401) {
                return throwError(() => error);
            }

             // Don't try to refresh the refresh-token request itself
            if (req.url.includes('/refresh-token')) {
                authService.signOut();
                location.reload();

                return throwError(() => error);
            }


            // If we don't have a refresh token,
            // there is nothing we can do.
            if (!authService.refreshToken) {
                authService.signOut();
                location.reload();

                return throwError(() => error);
            }

            // Try to get a new access token
            return authService.refreshAccessToken().pipe(

                switchMap(() => {

                    // Get the newly refreshed token
                    const newAccessToken =
                        authService.accessToken;

                    // Retry the ORIGINAL request
                    const retryRequest = req.clone({
                        headers: req.headers.set(
                            'Authorization',
                            'Bearer ' + newAccessToken
                        ),
                    });

                    return next(retryRequest);
                }),

                catchError((refreshError) => {

                    // Refresh token itself has expired
                    // or is invalid.
                    authService.signOut();
                    location.reload();

                    return throwError(() => refreshError);
                })
            );

        })
    );
};
