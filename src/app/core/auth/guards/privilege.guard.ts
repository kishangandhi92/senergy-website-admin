import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { UserService } from 'app/core/user/user.service';
import { Observable } from 'rxjs';
import { map, switchMap, first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PrivilegeGuard implements CanActivate {
  constructor(private userService: UserService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const requiredPrivilege = route.data['privilege'];  // Optional privilege check
    const requiredUserType = route.data['userType'];    // Optional user type check

    // Get the user from the UserService (as an observable)
    return this.userService.user$.pipe(
      first(), // Take the first emitted value (complete after getting it)
      map(user => {
        // if admin then dont check, pass
        if (user?.type === "2") {
            return true;
          }

        // Case 1: If route requires a specific user type (e.g., 'administrator')
        if (requiredUserType && user?.type !== "2") {
          this.router.navigate(['/unauthorized']);
          return false;
        }

        // Case 2: If route requires a specific privilege
        if (requiredPrivilege && !user?.privilege[requiredPrivilege]) {
          this.router.navigate(['/unauthorized']);
          return false;
        }

        // If no restrictions or all checks pass
        return true;
      })
    );
  }
}
