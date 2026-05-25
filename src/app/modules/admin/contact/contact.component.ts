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
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseAlertComponent } from '@fuse/components/alert';
import { FuseCardComponent } from '@fuse/components/card';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FILE_UPLOAD } from 'app/constants/upload';
import { SnackBarService } from 'app/core/general/snackbar.service';
import { PipesModule } from 'app/pipes/pipes.module';
import { QuillModule } from 'ngx-quill';
import { Subject, Subscription } from 'rxjs';
import { environment } from 'environments/environment';
import { ContactService } from './contact.service';


@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    MatProgressBarModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    NgTemplateOutlet,
    NgClass,
    MatOptionModule,
    MatCheckboxModule,
    MatRippleModule,
    MatProgressSpinnerModule,
    AsyncPipe,
    MatSnackBarModule,
    PipesModule,
    MatTooltipModule,
    CommonModule,
    FuseCardComponent,
    FuseAlertComponent,
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit, OnDestroy {
  entityForm: UntypedFormGroup;
  subscription: Subscription = null;
  uploadedImage: string = null;
   public readonly maxFileSizeInMb = FILE_UPLOAD.MAX_FILE_SIZE_IN_MB;
  public readonly baseURL = environment.apiBaseUrl;
  private destroy$ = new Subject<void>(); // To clean up subscriptions

  constructor(
      private _formBuilder: UntypedFormBuilder,
      private _snackBar: SnackBarService,
      private _fuseConfirmationService: FuseConfirmationService,
      private _contactService: ContactService,
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
            hours: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            address: ['', [Validators.required]],
            mapLink: ['', [Validators.required, Validators.pattern('^(https?:\\/\\/)?([\\da-z\\.-]+)\\.([a-z\\.]{2,6})([\\/\\w \\.-]*)*\\/?$')]],
            fbLink: ['', [Validators.required, Validators.pattern('^(https?:\\/\\/)?([\\da-z\\.-]+)\\.([a-z\\.]{2,6})([\\/\\w \\.-]*)*\\/?$')]],
            instaLink: ['', [Validators.required, Validators.pattern('^(https?:\\/\\/)?([\\da-z\\.-]+)\\.([a-z\\.]{2,6})([\\/\\w \\.-]*)*\\/?$')]],
            tiktokLink: ['', [Validators.required, Validators.pattern('^(https?:\\/\\/)?([\\da-z\\.-]+)\\.([a-z\\.]{2,6})([\\/\\w \\.-]*)*\\/?$')]],
        });
    }

    getDetails() {
        this.subscription = this._contactService.getDetails().subscribe(
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
            hours: data.hours,
            email: data.email,
            address: data.address,
            mapLink: data.mapLink,
            fbLink: data.fbLink,
            instaLink: data.instaLink,
            tiktokLink: data.tiktokLink,
        });
         this.uploadedImage = data.mapPhoto;
    }

    updateDetails() {
        if (this.entityForm.invalid) {
            this.entityForm.markAllAsTouched();
            return;
        }

        const formValues = this.entityForm.value;
        const requestObj = {
            hours: formValues.hours,
            email: formValues.email,
            address: formValues.address,
            mapLink: formValues.mapLink,
            fbLink: formValues.fbLink,
            instaLink: formValues.instaLink,
            tiktokLink: formValues.tiktokLink,
            photo: this.uploadedImage
        };

        this.subscription = this._contactService
            .update(requestObj)
            .subscribe(
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
            }, () => {
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
                this._contactService.uploadFiles(formData).subscribe(
                    (response) => {
                        this.entityForm.enable();
                        if (response.status) {
                            this.uploadedImage = response.data[0];
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

    deleteFile(index: number, fileName) {
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
                this._contactService.deletePhoto(fileName).subscribe(
                    (response) => {
                        if (response) {
                            this.uploadedImage = null;

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

