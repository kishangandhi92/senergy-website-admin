import { CommonModule, CurrencyPipe, NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { Router, RouterModule } from '@angular/router';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';
import { Observable, Subject, takeUntil } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { FuseCardComponent } from '@fuse/components/card';
import { DateTime } from 'luxon';
import { FuseAlertComponent } from '@fuse/components/alert';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatRippleModule,
    MatMenuModule,
    MatTabsModule,
    MatButtonToggleModule,
    NgApexchartsModule,
    MatTableModule,
    NgClass,
    CurrencyPipe,
    CommonModule,
    FuseCardComponent,
    FuseAlertComponent,
    RouterModule
 ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})


export class DashboardComponent implements OnInit, OnDestroy {

    data: any;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    user: Observable<User>;
    /**
     * Constructor
     */
    constructor(
        private _dashboardService: DashboardService,
        private _router: Router,
        private _userService: UserService
    ) {}

    /**
     * On init
     */
    ngOnInit(): void {
        this.user = this._userService.user$;

        // Get the data
        this._dashboardService.data$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((response) => {
                // Store the data
                if (response.status) {
                    this.data = response.data;
                }

            });

    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

     /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
     trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    /**
     * Returns whether the given dates are different days
     *
     * @param current
     * @param compare
     */
    isSameDay(current: string, compare: string): boolean {
        return DateTime.fromISO(current).hasSame(
            DateTime.fromISO(compare),
            'day'
        );
    }

    /**
     * Get the relative format of the given date
     *
     * @param date
     */
    getRelativeFormat(date: string): string {
        return DateTime.fromISO(date).toRelativeCalendar();
    }

}
