import {
    AsyncPipe,
    CommonModule,
    NgClass,
    NgTemplateOutlet,
} from '@angular/common';
import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewChild,
} from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule, MatRippleModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseCardComponent } from '@fuse/components/card';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { SnackBarService } from 'app/core/general/snackbar.service';
import { PipesModule } from 'app/pipes/pipes.module';
import { Observable, Subject } from 'rxjs';
import { SubscribersService } from './subscribers.service';
import { ISubscribers } from './subscribers.types';

@Component({
    selector: 'app-subscribers',
    standalone: true,
    imports: [
    MatProgressBarModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatSortModule,
    MatPaginatorModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatOptionModule,
    MatCheckboxModule,
    MatRippleModule,
    MatProgressSpinnerModule,
    AsyncPipe,
    MatSnackBarModule,
    PipesModule,
    MatTooltipModule,
    CommonModule,
    MatTableModule
],
    templateUrl: './subscribers.component.html',
    styleUrl: './subscribers.component.scss',
})
export class SubscribersComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatSort) private _sort: MatSort = null;
    query = '';
    subscribers$: Observable<any[]>;
    isLoading: boolean = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _matDialog: MatDialog,
        private _formBuilder: UntypedFormBuilder,
        private _subscriberService: SubscribersService,
        private _snackBar: SnackBarService
    ) {}

    ngOnInit(): void {
        this.subscribers$ = this._subscriberService.subscribers$;
    }

    ngAfterViewInit(): void {
        if (this._sort) {
            // Set the initial sort
            this._sort.sort({
                id: 'emailId',
                start: 'asc',
                disableClear: true,
            });
            // Mark for check
            this._changeDetectorRef.detectChanges();
        }
    }

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

    unsubscribe(subscriber: ISubscribers): void {
            // Open the confirmation dialog
            const confirmation = this._fuseConfirmationService.open({
                title: 'Unsubscribe Confirmation',
                message:
                    'Are you sure you want to Unsubscribe this user? This action cannot be undone!',
                actions: {
                    confirm: {
                        label: 'Confirm',
                    },
                },
            });

            // Subscribe to the confirmation dialog closed action
            confirmation.afterClosed().subscribe((result) => {
                // If the confirm button pressed...
                if (result === 'confirmed') {
                    // Delete the shift on the server
                    this._subscriberService
                        .unsubscribe(subscriber.autoNo)
                        .subscribe((response: any) => {
                            if (response.status) {
                                this._snackBar.showSuccess(
                                    'User unsubscribed successfully'
                                );
                            } else {
                                this._snackBar.showError(
                                    'Failed to unsubscribe user'
                                );
                            }
                        });
                }
            });
        }
}
