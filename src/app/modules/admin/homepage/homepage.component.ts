import {
    AsyncPipe,
    CommonModule,
    NgClass,
    NgTemplateOutlet,
} from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseAlertComponent } from '@fuse/components/alert';
import { FuseCardComponent } from '@fuse/components/card';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FILE_UPLOAD } from 'app/constants/upload';
import { SnackBarService } from 'app/core/general/snackbar.service';
import { PipesModule } from 'app/pipes/pipes.module';
import { environment } from 'environments/environment';
import { QuillModule } from 'ngx-quill';
import { Subject, Subscription } from 'rxjs';
import { HomeService } from './home.service';

@Component({
    selector: 'app-homepage',
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
        QuillModule,
        FuseAlertComponent,
        MatTabsModule,
    ],
    templateUrl: './homepage.component.html',
    styleUrl: './homepage.component.scss',
})
export class HomepageComponent implements OnInit, OnDestroy {
    entityForm: UntypedFormGroup;
    subscription: Subscription = null;
    uploadedBannerImage = null;
    public readonly baseURL = environment.apiBaseUrl;
    public readonly PHOTO_TYPE = {
        BANNER: 'banner',
    };
    public readonly maxFileSizeInMb = FILE_UPLOAD.MAX_FILE_SIZE_IN_MB;
    private destroy$ = new Subject<void>(); // To clean up subscriptions

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _snackBar: SnackBarService,
        private _fuseConfirmationService: FuseConfirmationService,
        private _homeService: HomeService
    ) {}

    ngOnInit(): void {
        this.generateFormGroup();
        this.getDetails();
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
        this.destroy$?.next();
        this.destroy$?.complete();
    }

    generateFormGroup() {
        this.entityForm = this._formBuilder.group({
            bannerTitle: ['', [Validators.required]],
            bannerSubtitle: ['', [Validators.required]],
            bannerDescription: ['', [Validators.required]],
        });
    }

    getDetails() {
        this.subscription = this._homeService.getDetails().subscribe(
            (response: any) => {
                if (response.status) {
                    this.patchFormValues(response.data);
                } else {
                    this._snackBar.showError(
                        'Oh no! Something went wrong in fetching Details. Please try again later'
                    );
                }
            },
            (error) => {
                this._snackBar.showError(
                    'Oh no! Server error occured while fetching the Details'
                );
            }
        );
    }

    patchFormValues(data) {
        this.entityForm.patchValue({
            bannerTitle: data.bannerTitle,
            bannerSubtitle: data.bannerSubtitle,
            bannerDescription: data.bannerDescription,
        });

        this.uploadedBannerImage = data.bannerImage;
    }

    updateSelectedEntity() {
        // Return if the form is invalid
        if (this.entityForm.invalid) {
            return;
        }

        if (!this.uploadedBannerImage) {
            this._snackBar.showError('Please upload a photo for Banner');
            return;
        }

        // Disable the form
        this.entityForm.disable();

        const formValues = this.entityForm.value;

        const requestObj = {
            bannerTitle: formValues.bannerTitle,
            bannerSubtitle: formValues.bannerSubtitle,
            bannerDescription: formValues.bannerDescription,
            uploadedBannerImage: this.uploadedBannerImage,
        };

        this._homeService.update(requestObj).subscribe(
            (response: any) => {
                if (response?.status) {
                    this._snackBar.showSuccess('Details updated successfully');
                } else {
                    this._snackBar.showError('Failed to update details.');
                }
            },
            (error) => {
                this._snackBar.showError(
                    'Oh no! Server error occured while updating Details'
                );
            },
            () => {
                this.entityForm.enable();
            }
        );
    }

    onFileSelect(event: Event, fieldName): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const selectedFiles = Array.from(input.files); // Convert FileList to Array
            const maxFileSize = this.maxFileSizeInMb * 1024 * 1024;

            const formData = new FormData();
            selectedFiles.forEach((file, index) => {
                if (file.size > maxFileSize) {
                    this._snackBar.showError(
                        `The file "${file.name}" exceeds the ${this.maxFileSizeInMb} MB limit.`
                    );
                    return; // Skip this file
                }
                formData.append(`${fieldName}[${index}]`, file); // Append files with indexed keys
            });

            formData.append('fieldType', fieldName);

            if (formData.has(`${fieldName}[0]`)) {
                this.entityForm.disable();
                this._homeService.uploadFiles(formData).subscribe(
                    (response) => {
                        this.entityForm.enable();
                        if (response.status) {
                            this.uploadedBannerImage = response.data[0];
                        } else {
                            this._snackBar.showError('Failed to upload Photo');
                        }
                    },
                    (error) => {
                        this.entityForm.enable();
                        this._snackBar.showError(
                            'Oh no! Server error occurred while uploading Photos'
                        );
                    }
                );
            }
        }
    }

    deleteFile(index: number, type, fileName) {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete File',
            message:
                'Are you sure you want to delete this file? This action cannot be undone!',
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
                this._homeService.deletePhoto(fileName, type).subscribe(
                    (response) => {
                        if (response) {
                            this.uploadedBannerImage = null;

                            this._snackBar.showSuccess(
                                'File deleted successfully!'
                            );
                        } else {
                            this._snackBar.showError(
                                'Failed to delete the file.'
                            );
                        }
                    },
                    (error) => {
                        this._snackBar.showError(
                            'Server error occurred while deleting the file.'
                        );
                    }
                );
            }
        });
    }
}
