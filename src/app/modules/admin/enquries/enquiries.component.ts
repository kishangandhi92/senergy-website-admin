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
import { ActivatedRoute } from '@angular/router';
import { FuseCardComponent } from '@fuse/components/card';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { SnackBarService } from 'app/core/general/snackbar.service';
import { PipesModule } from 'app/pipes/pipes.module';
import { Observable, Subject } from 'rxjs';
import { EnquiryService } from './enquiry.service';

@Component({
    selector: 'app-enquiries',
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
        NgTemplateOutlet,
        MatPaginatorModule,
        NgClass,
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
        MatTableModule,
        FuseCardComponent,
    ],
    templateUrl: './enquiries.component.html',
    styleUrl: './enquiries.component.scss',
})
export class EnquiriesComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatSort) private _sort: MatSort = null;
    query = '';
    type = '';
    pageTitle = 'Enquiries';
    enquiries$: Observable<any[]>;
    isLoading: boolean = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private route: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _matDialog: MatDialog,
        private _formBuilder: UntypedFormBuilder,
        private _enquiryService: EnquiryService,
        private _snackBar: SnackBarService
    ) {}

    ngOnInit(): void {
        this.type = this.route.snapshot.data['type']; // Get 'id' as a string
        this.enquiries$ = this._enquiryService.enquiries$;

        switch (this.type) {
            case 'general':
                this.pageTitle = 'All General Enquiries';
                break;
            case 'locum':
                this.pageTitle = 'All Locum Enquiries';
                break;
            case 'clinic':
                this.pageTitle = 'All Clinic Enquiries';
                break;
        }
    }

    ngAfterViewInit(): void {
        if (this._sort) {
            // Set the initial sort
            this._sort.sort({
                id: 'fullname',
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

    downloadExcel() {
        this._enquiryService.downloadExcel(this.type);
    }
}
