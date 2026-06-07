import { AsyncPipe, CommonModule, NgClass } from '@angular/common';
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
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { SnackBarService } from 'app/core/general/snackbar.service';
import { PipesModule } from 'app/pipes/pipes.module';
import { QuillModule } from 'ngx-quill';
import { finalize, Observable, Subject, take, takeUntil } from 'rxjs';
import { CareerService } from './careers.service';
import { ICareer, ICareerPayload } from './careers.types';

@Component({
    selector: 'app-careers',
    standalone: true,
    imports: [
        MatProgressBarModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatMenuModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogModule,
        MatSortModule,
        NgClass,
        MatSlideToggleModule,
        MatProgressSpinnerModule,
        AsyncPipe,
        MatSnackBarModule,
        PipesModule,
        MatTooltipModule,
        CommonModule,
        MatTableModule,
        QuillModule,
    ],
    templateUrl: './careers.component.html',
    styleUrl: './careers.component.scss',
})
export class CareersComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(MatSort) private _sort: MatSort = null;
    @ViewChild('CareerDialog') careerDialogTemplate: TemplateRef<any> | undefined;

    query = '';
    jobs$: Observable<ICareer[]>;
    isLoading = false;
    isSubmitting = false;
    statusUpdatingCareerId: number | null = null;
    deletingCareerId: number | null = null;
    careerDialogForm: UntypedFormGroup;
    careerDialogMode: 'add' | 'edit' = 'add';
    selectedCareer: ICareer | null = null;
    careerDialogRef = null;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: UntypedFormBuilder,
        private _matDialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService,
        private _careerService: CareerService,
        private _snackBar: SnackBarService
    ) {}

    ngOnInit(): void {
        this.generateCareerDialogForm();
        this.jobs$ = this._careerService.jobs$;
        this.loadCareers();
    }

    ngAfterViewInit(): void {
        if (this._sort) {
            this._sort.sort({
                id: 'modifiedAt',
                start: 'desc',
                disableClear: true,
            });
            this._changeDetectorRef.detectChanges();
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // Opens the add or edit dialog and pre-fills the form for edit mode.
    openCareerDialog(mode: 'add' | 'edit', career?: ICareer): void {
        this.careerDialogMode = mode;
        this.selectedCareer = career || null;
        this.resetCareerDialogForm();

        if (mode === 'edit' && career) {
            this.patchCareerDialogForm(career);
        }

        this.careerDialogRef = this._matDialog.open(this.careerDialogTemplate, {
            width: '760px',
            maxWidth: '96vw',
            disableClose: true,
        });

        this.careerDialogRef
            .afterClosed()
            .pipe(take(1))
            .subscribe(() => {
                this.selectedCareer = null;
                this.resetCareerDialogForm();
                this.careerDialogRef = null;
            });
    }

    // Closes the add/edit dialog.
    closeCareerDialog(): void {
        this.careerDialogRef?.close();
    }

    // Routes the dialog save action to create or update based on the current mode.
    submitCareerDialog(): void {
        this.careerDialogForm.markAllAsTouched();

        if (this.careerDialogForm.invalid || this.isSubmitting) {
            return;
        }

        if (this.careerDialogMode === 'edit') {
            this.updateSelectedCareer();
            return;
        }

        this.createCareer();
    }

    // Shows delete confirmation for the selected career row.
    confirmDelete(career: ICareer): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Job Opening',
            message:
                'Are you sure you want to delete this job opening? This action cannot be undone.',
            actions: {
                confirm: {
                    label: 'Delete',
                },
            },
        });

        confirmation
            .afterClosed()
            .pipe(take(1))
            .subscribe((result) => {
                if (result === 'confirmed') {
                    this.deleteCareer(career);
                }
            });
    }

    // Shows close confirmation for an open career row.
    confirmMarkClosed(career: ICareer): void {
        if (!career.isOpen) {
            return;
        }

        const confirmation = this._fuseConfirmationService.open({
            title: 'Mark Job As Closed',
            message:
                'Are you sure you want to mark this job opening as closed? Applicants will no longer see it as open.',
            actions: {
                confirm: {
                    label: 'Mark Closed',
                },
            },
        });

        confirmation
            .afterClosed()
            .pipe(take(1))
            .subscribe((result) => {
                if (result === 'confirmed') {
                    this.updateCareerStatus(career, false);
                }
            });
    }

    // Shows reopen confirmation for a closed career row.
    confirmReopen(career: ICareer): void {
        if (career.isOpen) {
            return;
        }

        const confirmation = this._fuseConfirmationService.open({
            title: 'Reopen Job Opening',
            message:
                'Are you sure you want to reopen this job opening? Applicants will see it as open again.',
            actions: {
                confirm: {
                    label: 'Reopen',
                },
            },
        });

        confirmation
            .afterClosed()
            .pipe(take(1))
            .subscribe((result) => {
                if (result === 'confirmed') {
                    this.updateCareerStatus(career, true);
                }
            });
    }

    // Track-by for the visible career rows.
    trackByFn(index: number, item: ICareer): any {
        return item.id || index;
    }

    // Creates the reusable add/edit dialog form for one career row.
    private generateCareerDialogForm(): void {
        this.careerDialogForm = this._formBuilder.group({
            title: ['', [Validators.required, Validators.maxLength(500)]],
            experience: ['', [Validators.required, Validators.maxLength(100)]],
            qualification: ['', [Validators.required, Validators.maxLength(100)]],
            skills: ['', [Validators.required, this.quillRequiredValidator]],
            isOpen: [true],
        });
    }

    // Loads the careers list from the backend and exposes it through the service subject.
    private loadCareers(): void {
        this.isLoading = true;

        this._careerService
            .getCareers()
            .pipe(
                takeUntil(this._unsubscribeAll),
                finalize(() => {
                    this.isLoading = false;
                })
            )
            .subscribe({
                error: () => {
                    this._snackBar.showError(
                        'Oh no! Server error occurred while fetching job openings.'
                    );
                },
            });
    }

    // Resets the dialog back to a clean add-new state.
    private resetCareerDialogForm(): void {
        this.careerDialogForm.reset(this.getDefaultCareerFormValue());
    }

    // Prefills the dialog form from an existing career row for edit mode.
    private patchCareerDialogForm(career: ICareer): void {
        this.careerDialogForm.patchValue(this.mapCareerToPayload(career));
    }

    // Updates the selected career row and refreshes the table after the backend confirms the save.
    private updateSelectedCareer(): void {
        if (!this.selectedCareer?.id) {
            this._snackBar.showError(
                'Selected job was not loaded correctly, so update cannot be completed.'
            );
            return;
        }

        const payload = this.mapCareerFormToPayload();
        this.isSubmitting = true;
        this.careerDialogForm.disable({ emitEvent: false });

        this._careerService
            .updateCareer(this.selectedCareer.id, payload)
            .pipe(
                take(1),
                finalize(() => {
                    this.isSubmitting = false;
                    this.careerDialogForm.enable({ emitEvent: false });
                })
            )
            .subscribe({
                next: (response: any) => {
                    if (response?.status === false) {
                        this._snackBar.showError('Failed to update job opening.');
                        return;
                    }

                    this._snackBar.showSuccess('Job opening updated successfully');
                    this.closeCareerDialog();
                    this.loadCareers();
                },
                error: () => {
                    this._snackBar.showError(
                        'Oh no! Server error occurred while updating the job opening.'
                    );
                },
            });
    }

    // Creates a new career row and refreshes the table after the backend confirms the save.
    private createCareer(): void {
        const payload = this.mapCareerFormToPayload();
        this.isSubmitting = true;
        this.careerDialogForm.disable({ emitEvent: false });

        this._careerService
            .createCareer(payload)
            .pipe(
                take(1),
                finalize(() => {
                    this.isSubmitting = false;
                    this.careerDialogForm.enable({ emitEvent: false });
                })
            )
            .subscribe({
                next: (response: any) => {
                    if (response?.status === false) {
                        this._snackBar.showError('Failed to create job opening.');
                        return;
                    }

                    this._snackBar.showSuccess('Job opening created successfully');
                    this.closeCareerDialog();
                    this.loadCareers();
                },
                error: () => {
                    this._snackBar.showError(
                        'Oh no! Server error occurred while creating the job opening.'
                    );
                },
            });
    }

    // Deletes a career row and refreshes the table after the backend confirms the deletion.
    private deleteCareer(career: ICareer): void {
        if (!career?.id || this.deletingCareerId) {
            return;
        }

        this.deletingCareerId = career.id;

        this._careerService
            .deleteCareer(career.id)
            .pipe(
                take(1),
                finalize(() => {
                    this.deletingCareerId = null;
                })
            )
            .subscribe({
                next: (response: any) => {
                    if (response?.status === false) {
                        this._snackBar.showError('Failed to delete job opening.');
                        return;
                    }

                    this._snackBar.showSuccess('Job opening deleted successfully');
                    this.loadCareers();
                },
                error: () => {
                    this._snackBar.showError(
                        'Oh no! Server error occurred while deleting the job opening.'
                    );
                },
            });
    }

    // Updates only the open/closed flag through the regular update API while preserving the rest of the row data.
    private updateCareerStatus(career: ICareer, isOpen: boolean): void {
        if (!career?.id || this.statusUpdatingCareerId) {
            return;
        }

        const payload: ICareerPayload = {
            ...this.mapCareerToPayload(career),
            isOpen,
        };

        this.statusUpdatingCareerId = career.id;

        this._careerService
            .updateCareer(career.id, payload)
            .pipe(
                take(1),
                finalize(() => {
                    this.statusUpdatingCareerId = null;
                })
            )
            .subscribe({
                next: (response: any) => {
                    if (response?.status === false) {
                        this._snackBar.showError(
                            isOpen
                                ? 'Failed to reopen job opening.'
                                : 'Failed to mark job as closed.'
                        );
                        return;
                    }

                    this._snackBar.showSuccess(
                        isOpen
                            ? 'Job opening reopened successfully'
                            : 'Job marked as closed successfully'
                    );
                    this.loadCareers();
                },
                error: () => {
                    this._snackBar.showError(
                        isOpen
                            ? 'Oh no! Server error occurred while reopening the job opening.'
                            : 'Oh no! Server error occurred while marking the job as closed.'
                    );
                },
            });
    }

    // Returns the default empty career payload used by the dialog.
    private getDefaultCareerFormValue(): ICareerPayload {
        return {
            title: '',
            experience: '',
            qualification: '',
            skills: '',
            isOpen: true,
        };
    }

    // Converts the dialog form value into the exact career payload shape.
    private mapCareerFormToPayload(): ICareerPayload {
        const formValue = this.careerDialogForm.getRawValue();

        return {
            title: formValue?.title || '',
            experience: formValue?.experience || '',
            qualification: formValue?.qualification || '',
            skills: formValue?.skills || '',
            isOpen: Boolean(formValue?.isOpen),
        };
    }

    // Maps a loaded career row into the dialog payload shape.
    private mapCareerToPayload(career: ICareer): ICareerPayload {
        return {
            title: career.title,
            experience: career.experience,
            qualification: career.qualification,
            skills: career.skills,
            isOpen: career.isOpen,
        };
    }

    // Treats empty Quill HTML like `<p><br></p>` as invalid for required validation.
    private quillRequiredValidator(control: any): { required: true } | null {
        const rawValue = String(control?.value || '');
        const normalizedText = rawValue
            .replace(/<(.|\n)*?>/g, ' ')
            .replace(/&nbsp;/gi, ' ')
            .trim();

        return normalizedText ? null : { required: true };
    }
}
