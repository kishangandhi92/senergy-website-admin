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
    TemplateRef,
    ViewChild,
} from '@angular/core';
import {
    FormControl,
    FormGroup,
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
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
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { SnackBarService } from 'app/core/general/snackbar.service';
import { PipesModule } from 'app/pipes/pipes.module';
import { Observable, Subject, takeUntil } from 'rxjs';
import { OperatorService } from './operators.service';
import { Operator } from './operators.types';
import { CustomValidators } from '../dataentry/custom-validators';
import { UserService } from 'app/core/user/user.service';
import { RolesService } from '../roles/roles.service';

@Component({
    selector: 'app-operators',
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
        MatRadioModule,
        CommonModule,
        MatTableModule,
        MatTabsModule,
    ],
    templateUrl: './operators.component.html',
    styleUrl: './operators.component.scss',
})
export class OperatorsComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatSort) private _sort: MatSort = null;

    operators$: Observable<any[]>;
    roles$: Observable<any[]>;
    selectedOperator: Operator | null = null;
    isLoading: boolean = false;
    operatorForm: UntypedFormGroup;
    flashMessage: 'success' | 'error' | null = null;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    @ViewChild('AddOperatorDialog') AddOperatorDialog: TemplateRef<any>;
    matDialogRef = null;
    query = '';
    selectAllPrivileges = false;
    mode: number = 1;
    private user;

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _matDialog: MatDialog,
        private _formBuilder: UntypedFormBuilder,
        private _operatorService: OperatorService,
        private _roleService: RolesService,
        private _snackBar: SnackBarService,
        private _userService: UserService
    ) {}

    ngOnInit(): void {
        // Prepare the card form
        this.operatorForm = this._formBuilder.group({
            empId: ['', [Validators.required], []],
            name: ['', [Validators.required]],
            type: ['1', [Validators.required]],
            role: ['', [Validators.required]],
        });


        this.operators$ = this._operatorService.operators$;
        this.roles$ = this._roleService.roles$;

        this.handleOpTypeChange();

        // Get Logged In User
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user) => {
            this.user = user;
    });


    }

    handleOpTypeChange() {
        this.operatorForm.get('type').valueChanges.subscribe((data) => {
            const roleControl = this.operatorForm.get(
                'role'
            ) as FormControl;
            if (data === '2') {
                roleControl.setValue('1');
                roleControl.disable();
            } else {
                roleControl.setValue('');
                roleControl.enable();
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

    ngAfterViewInit(): void {
        if (this._sort) {
            // Set the initial sort
            this._sort.sort({
                id: 'name',
                start: 'asc',
                disableClear: true,
            });
            // Mark for check
            this._changeDetectorRef.detectChanges();
        }
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

    openDialog(mode, selectedOperator = null) {
        this.mode = mode;
        this.toggleEmployeeIdValidator();

        if (this.mode === 2) {
            this.patchFormValues(selectedOperator);
        }

        this.matDialogRef = this._matDialog.open(this.AddOperatorDialog);
        this.matDialogRef.afterClosed().subscribe((result) => {
            this.operatorForm.reset({ type: '1', role: '' });
            this.operatorForm.enable();

            if (result) {
                this._operatorService.getOperators();
            }
        });
    }

    toggleEmployeeIdValidator() {
        const empIdControl = this.operatorForm.get('empId');
        if (this.mode === 2) {
            empIdControl.clearAsyncValidators();
        } else {
            empIdControl.setAsyncValidators(CustomValidators.employeeIdValidator(this._operatorService));
        }
    }

    patchFormValues(data) {
        console.log(data);
        this.operatorForm.patchValue({
            empId: data.empId,
            name: data.name,
            type: data.type,
            role: data.roleId
        });
    }

    addOperator() {
        // Return if the form is invalid
        if (this.operatorForm.invalid) {
            return;
        }

        const requestObj = {
            name: this.operatorForm.get('name').value,
            empId: this.operatorForm.get('empId').value,
            type: this.operatorForm.get('type').value,
            roleId: this.operatorForm.get('role').value
        };

         // Disable the form
         this.operatorForm.disable();

        this._operatorService
            .createOperator(requestObj)
            .subscribe((response) => {
                if (response.status) {
                    this._snackBar.showSuccess('Operator added successfully');
                    this.matDialogRef.close(true);
                } else {
                    this._snackBar.showError('Failed to add operator');
                }
            }, (error) => {
                this._snackBar.showError('Oh no! Server error occured while adding Operator');
            });
    }

    updateSelectedOperator() {
        // Return if the form is invalid
        if (this.operatorForm.invalid) {
            return;
        }

        const requestObj = {
            name: this.operatorForm.get('name').value,
            empId: this.operatorForm.get('empId').value,
            type: this.operatorForm.get('type').value,
            roleId: this.operatorForm.get('role').value
        };

        // Disable the form
        this.operatorForm.disable();

        this._operatorService
            .updateOperator(this.operatorForm.get('empId').value, requestObj)
            .subscribe((response) => {
                if (response.status) {
                    this._snackBar.showSuccess('Operator updated successfully');
                    this.matDialogRef.close(true);
                } else {
                    this._snackBar.showError('Failed to update operator');
                }
            }, (error) => {
                this._snackBar.showError('Oh no! Server error occured while updating Operator');
            });
    }

    deleteSelectedOperator(operator: Operator): void {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete operator',
            message:
                'Are you sure you want to remove this operator? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete',
                },
            },
        });

        // Subscribe to the confirmation dialog closed action
        confirmation.afterClosed().subscribe((result) => {
            // If the confirm button pressed...
            if (result === 'confirmed') {
                // Delete the shift on the server
                this._operatorService
                    .deleteOperator(operator.empId)
                    .subscribe((response: any) => {
                        if (response.status) {
                            this._snackBar.showSuccess(
                                'Operator deleted successfully'
                            );
                        } else {
                            this._snackBar.showError(
                                'Oh No! Failed to delete Operator. Please try again after sometime'
                            );
                        }
                    });
            }
        });
    }
}
