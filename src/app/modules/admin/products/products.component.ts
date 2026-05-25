import {
    AsyncPipe,
    CommonModule,
    NgClass,
    NgTemplateOutlet,
} from '@angular/common';
import {
    ChangeDetectorRef,
    Component,
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
import { FILE_UPLOAD } from 'app/constants/upload';
import { SnackBarService } from 'app/core/general/snackbar.service';
import { PipesModule } from 'app/pipes/pipes.module';
import { environment } from 'environments/environment';
import { Observable, Subject } from 'rxjs';
import { ProductService } from './product.service';
import { Product } from './product.types';

@Component({
    selector: 'app-products',
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
    templateUrl: './products.component.html',
    styleUrl: './products.component.scss',
})
export class ProductsComponent {
    @ViewChild(MatSort) private _sort: MatSort = null;
    products$: Observable<any[]>;
    isLoading: boolean = false;
    addEntityForm: UntypedFormGroup;
    flashMessage: 'success' | 'error' | null = null;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    @ViewChild('AddEntityDialog') AddEntityDialog: TemplateRef<any>;
    matDialogRef = null;
    query = '';
    controlsArray = [];
    mode = null;
    files: { [key: string]: File } = {}; // Store files separately
    public readonly baseURL = environment.apiBaseUrl;
    public readonly maxFileSizeInMb = FILE_UPLOAD.MAX_FILE_SIZE_IN_MB;
    photoPath: string = '';

    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _matDialog: MatDialog,
        private _formBuilder: UntypedFormBuilder,
        private _service: ProductService,
        private _snackBar: SnackBarService
    ) {}

    ngOnInit(): void {
        this.addEntityForm = this._formBuilder.group({
            autoNo: [''],
            name: ['', [Validators.required]],
            photo: ['', [Validators.required]],
            localeTitle: ['', [Validators.required]],
            description: ['', [Validators.required]]
        });
        this.products$ = this._service.products$;
    }

    ngAfterViewInit(): void {
        if (this._sort) {
            // Set the initial sort
            this._sort.sort({
                id: 'title',
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
        return item.autoNo || index;
    }

    openDialog(mode, selectedTag = null) {
        this.mode = mode;

        if (this.mode === 2) {
            this.patchFormValues(selectedTag);
        }
        this.matDialogRef = this._matDialog.open(this.AddEntityDialog, {
            width: '500px',
        });

        this.matDialogRef.afterClosed().subscribe((result) => {
            this.addEntityForm.enable();
            this.addEntityForm.reset();

            if (result) {
                this._service.getAll();
            }
        });
    }

    patchFormValues(data: Product) {
        this.addEntityForm.patchValue({
            autoNo: data.autoNo,
            name: data.name,
            localeTitle: data.localeTitle,
            photo: data.photo,
            description: data.description,
        });
        if (data.photo) {
            this.photoPath =
                this.baseURL + '/assets/img/products/icecream/' + data.photo;
        }
    }

    onFileSelect(event: Event, fieldName: string): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const selectedFile = input.files[0];

            const maxFileSize = this.maxFileSizeInMb * 1024 * 1024;
            if (selectedFile.size > maxFileSize) {
                this._snackBar.showError(
                    'The selected file size exceeds the ' +
                        this.maxFileSizeInMb +
                        ' MB limit.'
                );
                return;
            }

            this.files[fieldName] = selectedFile;
            const formData = new FormData();
            if (this.files[fieldName])
                formData.append(fieldName, this.files[fieldName]);

            this.addEntityForm.disable();
            this._service.uploadPhoto(formData).subscribe(
                (response) => {
                    this.addEntityForm.enable();
                    if (response.status) {
                        this.addEntityForm
                            .get(fieldName)
                            ?.setValue(response.data); // Display file name
                        this.photoPath =
                            this.baseURL +
                            '/assets/img/products/icecream/' +
                            response.data;
                    } else {
                        this._snackBar.showError(
                            'Failed to upload Product Photo'
                        );
                    }
                },
                (error) => {
                    this.addEntityForm.enable();
                    this._snackBar.showError(
                        'Oh no! Server error occured while upload Product Photo'
                    );
                }
            );
        }
    }

    deleteFile() {
        const fileName = this.addEntityForm.get('photo').value;
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Photo',
            message:
                'Are you sure you want to delete this Photo? This action cannot be undone!',
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
                this._service.deletePhoto(fileName).subscribe(
                    (response) => {
                        if (response) {
                            this.addEntityForm.get('photo')?.setValue('');
                            this.photoPath = '';
                            this._snackBar.showSuccess(
                                'Photo deleted successfully!'
                            );
                        } else {
                            this._snackBar.showError(
                                'Failed to delete the Photo.'
                            );
                        }
                    },
                    (error) => {
                        this._snackBar.showError(
                            'Server error occurred while deleting the Photo.'
                        );
                    }
                );
            }
        });
    }

    deleteSelectedEntity(product: Product): void {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Product',
            message:
                'Are you sure you want to remove this Product? This action cannot be undone!',
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
                this._service.delete(product.autoNo).subscribe((response: any) => {
                    if (response.status) {
                        this._snackBar.showSuccess(
                            'Prodcut deleted successfully'
                        );
                    } else {
                        this._snackBar.showError('Failed to delete Prodcut');
                    }
                });
            }
        });
    }

    addEntity() {
        // Return if the form is invalid
        if (this.addEntityForm.invalid) {
            return;
        }

        // Disable the form
        this.addEntityForm.disable();
        const formValues = this.addEntityForm.value;
        const requestObj = {
            name: formValues.name,
            localeTitle: formValues.localeTitle,
            description: formValues.description,
            photo: formValues.photo,
        };

        this._service.create(requestObj).subscribe(
            (response) => {
                if (response.status) {
                    this._snackBar.showSuccess('Product added successfully');
                    this.matDialogRef.close(true);
                } else {
                    this._snackBar.showError('Failed to add Product.');
                }
            },
            (error) => {
                this._snackBar.showError(
                    'Oh no! Server error occured while adding Product'
                );
            }
        );
    }

    updateSelectedEntity(): void {
        // Disable the form
        this.addEntityForm.disable();

        const formValues = this.addEntityForm.value;
        const requestObj = {
            autoNo: formValues.autoNo,
            name: formValues.name,
            localeTitle: formValues.localeTitle,
            description: formValues.description,
            photo: formValues.photo,
        };

        // Update the shift on the server
        this._service.update(requestObj.autoNo, requestObj).subscribe(
            (response: any) => {
                if (response.status) {
                    this._snackBar.showSuccess('Product updated successfully');
                    this.matDialogRef.close(true);
                } else {
                    this._snackBar.showError('Failed to update Product');
                }
            },
            (error) => {
                this._snackBar.showError(
                    'Oh no! Server error occured while updating Product'
                );
            }
        );
    }
}
