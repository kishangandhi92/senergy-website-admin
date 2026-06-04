import { AsyncPipe, CommonModule, NgClass, NgTemplateOutlet } from '@angular/common';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { Component, OnInit } from '@angular/core';
import {
    AbstractControl,
    FormsModule,
    ReactiveFormsModule,
    UntypedFormArray,
    UntypedFormBuilder,
    UntypedFormGroup,
    ValidationErrors,
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
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FILE_UPLOAD } from 'app/constants/upload';
import { SnackBarService } from 'app/core/general/snackbar.service';
import { PipesModule } from 'app/pipes/pipes.module';
import { environment } from 'environments/environment';
import { QuillModule } from 'ngx-quill';
import { HomeService } from '../home.service';
import { IAboutImage, IAboutRecord, IAboutSection } from '../home.types';

@Component({
    selector: 'app-home-about-section',
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
    MatSnackBarModule,
    PipesModule,
    MatTooltipModule,
    CommonModule,
    MatTableModule,
    QuillModule,
    CdkScrollable
],
    templateUrl: './about-section.component.html',
})
export class AboutSectionComponent implements OnInit {
    entityForm: UntypedFormGroup | undefined;
    isLoading = false;
    isUploading = false;
    isSaving = false;
    aboutRecord: IAboutRecord | null = null;

    public readonly baseURL = environment.apiBaseUrl;
    public readonly maxFileSizeInKb = FILE_UPLOAD.MAX_FILE_SIZE_IN_KB;
    readonly PHOTO_TYPE = {
        ABOUT: 'about',
    };

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _snackBar: SnackBarService,
        private _homeService: HomeService
    ) {}

    // Builds the page form and loads the stored about JSON when the page opens.
    ngOnInit(): void {
        this.generateFormGroup();
        this.loadAbout();
    }

    // Exposes the fixed image list form array to the template.
    get imageForms(): UntypedFormArray {
        return this.entityForm.get('images') as UntypedFormArray;
    }

    // Saves the full about JSON back to the backend using the loaded row metadata.
    updateAbout(): void {
        if (this.entityForm.invalid || this.isLoading || this.isUploading || this.isSaving) {
            this.entityForm.markAllAsTouched();
            return;
        }

        if (!this.aboutRecord?.id) {
            this._snackBar.showError('About record was not loaded, so update cannot be completed.');
            return;
        }

        this.persistAboutUpdate(this.buildAboutPayload(), 'About section updated successfully');
    }

    // Uploads a selected image and patches the returned file path into the matching image group.
    onAboutImageSelect(index: number, event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) {
            return;
        }

        const selectedFile = input.files[0];
        const maxFileSize = this.maxFileSizeInKb * 1024;

        if (selectedFile.size > maxFileSize) {
            this._snackBar.showError(
                `The selected file size exceeds the ${this.maxFileSizeInKb} KB limit.`
            );
            input.value = '';
            return;
        }

        const formData = new FormData();
        formData.append(`${this.PHOTO_TYPE.ABOUT}[0]`, selectedFile);
        formData.append('fieldType', this.PHOTO_TYPE.ABOUT);

        this.isUploading = true;
        this.entityForm.disable();

        this._homeService.uploadFiles(formData).subscribe(
            (response: any) => {
                this.isUploading = false;
                this.enableEntityForm();

                if (response?.status && response?.data?.[0]) {
                    const normalizedPath = this.normalizeUploadedImagePath(response.data[0]);
                    this.imageForms.at(index).get('src')?.setValue(normalizedPath);
                    this._snackBar.showSuccess('Image uploaded successfully');
                } else {
                    this._snackBar.showError('Failed to upload image');
                }

                input.value = '';
            },
            () => {
                this.isUploading = false;
                this.enableEntityForm();
                this._snackBar.showError(
                    'Oh no! Server error occurred while uploading the image'
                );
                input.value = '';
            }
        );
    }

    // Deletes the current image from the server after confirmation and clears the matching form field.
    clearAboutImage(index: number): void {
        const imagePath = this.imageForms.at(index).get('src')?.value;
        const fileName = this.extractFileName(imagePath);

        if (!fileName) {
            this.imageForms.at(index).get('src')?.setValue('');
            return;
        }

        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Image',
            message:
                'Are you sure you want to delete this image from the server? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete',
                },
            },
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this.entityForm.disable();

                this._homeService.deletePhoto(fileName, this.PHOTO_TYPE.ABOUT).subscribe(
                    (response) => {
                        if (response) {
                            this.imageForms.at(index).get('src')?.setValue('');
                            this._snackBar.showSuccess('Image deleted successfully');
                        } else {
                            this._snackBar.showError('Failed to delete image');
                        }
                    },
                    () => {
                        this._snackBar.showError(
                            'Oh no! Server error occurred while deleting the image'
                        );
                    },
                    () => {
                        this.enableEntityForm();
                    }
                );
            }
        });
    }

    // Converts a stored image path into a browser-ready preview URL.
    resolveImageUrl(imagePath: string): string {
        if (!imagePath) {
            return this.getFallbackPreviewImage();
        }

        if (imagePath.startsWith('data:image') || imagePath.startsWith('blob:')) {
            return imagePath;
        }

        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }

        const normalizedPath = imagePath.replace(/^\/+/, '');
        return `${this.baseURL}/${normalizedPath}`;
    }

    // Returns the display label for one fixed image slot.
    getImageSlotLabel(index: number): string {
        if (index === 0) {
            return 'Primary Image';
        }

        if (index === 1) {
            return 'Secondary Image 1';
        }

        return 'Secondary Image 2';
    }

    // Returns helper text describing the expected image role for the current slot.
    getImageSlotHint(index: number): string {
        if (index === 0) {
            return 'This is the main image displayed most prominently.';
        }

        return 'This image supports the main visual and will be stored as secondary.';
    }

    // Creates the page form with the fixed fields and a three-slot image array.
    private generateFormGroup(): void {
        this.entityForm = this._formBuilder.group({
            roundelText: ['', [Validators.required, Validators.maxLength(100)]],
            title: ['', [Validators.required, Validators.maxLength(200)]],
            description: ['', [Validators.required, this.validateRichTextRequired]],
            knowMoreLabel: ['', [Validators.required, Validators.maxLength(150)]],
            knowMoreLink: ['', [Validators.required, Validators.maxLength(255)]],
            knowMoreTarget: ['_self', [Validators.required]],
            images: this._formBuilder.array([]),
        });
    }

    // Loads the stored about data from the backend and patches it into the page form.
    private loadAbout(): void {
        this.isLoading = true;

        this._homeService.getAbout().subscribe(
            (response: any) => {
                if (response?.status && response?.data) {
                    this.aboutRecord = this.normalizeAboutRecord(response.data);
                    this.patchFormValues(this.aboutRecord.content);
                } else {
                    this.aboutRecord = null;
                    this.patchFormValues(this.createDefaultAboutSection());
                    this._snackBar.showError('Failed to fetch about section.');
                }
            },
            () => {
                this.aboutRecord = null;
                this.patchFormValues(this.createDefaultAboutSection());
                this._snackBar.showError(
                    'Oh no! Server error occurred while fetching the about section'
                );
            },
            () => {
                this.isLoading = false;
            }
        );
    }

    // Patches the fetched about data into the form and rebuilds the fixed image form array.
    private patchFormValues(data: IAboutSection): void {
        this.entityForm.patchValue({
            roundelText: data.roundelText,
            title: data.title,
            description: data.description,
            knowMoreLabel: data.knowMore.label,
            knowMoreLink: data.knowMore.link,
            knowMoreTarget: data.knowMore.target,
        });

        this.replaceFormArray(
            this.imageForms,
            data.images.map((image) => this.createImageGroup(image))
        );
    }

    // Re-enables the page form and all nested image controls after save or upload operations finish.
    private enableEntityForm(): void {
        if (this.isUploading || this.isSaving) {
            return;
        }

        this.entityForm.enable({ emitEvent: false });
        this.imageForms.controls.forEach((control) => control.enable({ emitEvent: false }));
    }

    // Builds the PUT payload by combining the persisted row metadata with the latest form values.
    private buildAboutPayload(): IAboutRecord {
        return {
            id: this.aboutRecord?.id,
            pageId: this.aboutRecord?.pageId,
            section: this.aboutRecord?.section || 'about',
            content: this.mapFormValueToAboutSection(this.entityForm.getRawValue()),
        };
    }

    // Converts the current reactive form value into the exact JSON shape expected in the content object.
    private mapFormValueToAboutSection(formValue: any): IAboutSection {
        const images = Array.isArray(formValue?.images) ? formValue.images.slice(0, 3) : [];

        return {
            roundelText: formValue?.roundelText || '',
            title: formValue?.title || '',
            description: this.normalizeRichTextHtml(formValue?.description || ''),
            knowMore: {
                label: formValue?.knowMoreLabel || '',
                link: formValue?.knowMoreLink || '',
                target: formValue?.knowMoreTarget || '_self',
            },
            images: this.sortAboutImages(images).map((image) => this.normalizeImage(image)),
        };
    }

    // Persists the full about row to the backend and refreshes the form with the saved response.
    private persistAboutUpdate(payload: IAboutRecord, successMessage: string): void {
        this.isSaving = true;
        this.entityForm.disable();

        this._homeService.updateAbout(payload).subscribe(
            (response: any) => {
                if (response?.status) {
                    this.aboutRecord = this.normalizeAboutRecord(response?.data || payload);
                    this.isSaving = false;
                    this.enableEntityForm();
                    this.patchFormValues(this.aboutRecord.content);
                    this.enableEntityForm();
                    this._snackBar.showSuccess(successMessage);
                } else {
                    this._snackBar.showError('Failed to update about section');
                }
            },
            () => {
                this._snackBar.showError(
                    'Oh no! Server error occurred while updating the about section'
                );
            },
            () => {
                this.isSaving = false;
                this.enableEntityForm();
            }
        );
    }

    // Normalizes the fetched row metadata and nested content structure from the API response.
    private normalizeAboutRecord(payload: any): IAboutRecord {
        return {
            id: payload?.id || '',
            pageId: payload?.pageId || '',
            section: payload?.section || 'about',
            content: this.normalizeAboutData(payload?.content),
        };
    }

    // Normalizes the raw API payload so the form always gets one main image and two secondary images.
    private normalizeAboutData(payload: any): IAboutSection {
        const normalizedImages = this.sortAboutImages(
            Array.isArray(payload?.images) ? payload.images.slice(0, 3) : []
        );

        const mainImage =
            normalizedImages.find((image) => image?.type === 'main') ||
            this.createDefaultImage('main');
        const secondaryImages = normalizedImages
            .filter((image) => image?.type === 'secondary')
            .slice(0, 2);

        while (secondaryImages.length < 2) {
            secondaryImages.push(this.createDefaultImage('secondary'));
        }

        return {
            roundelText: payload?.roundelText || '',
            title: payload?.title || '',
            description: this.normalizeRichTextHtml(payload?.description || ''),
            knowMore: {
                label: payload?.knowMore?.label || '',
                link: payload?.knowMore?.link || '',
                target: payload?.knowMore?.target || '_self',
            },
            images: [
                this.normalizeImage(mainImage, 'main'),
                this.normalizeImage(secondaryImages[0], 'secondary'),
                this.normalizeImage(secondaryImages[1], 'secondary'),
            ],
        };
    }

    // Normalizes one raw image item into the exact structure expected by the form.
    private normalizeImage(
        image: any,
        fallbackType: 'main' | 'secondary' = 'secondary'
    ): IAboutImage {
        return {
            alt: image?.alt || '',
            src: image?.src || '',
            type: image?.type === 'main' || image?.type === 'secondary' ? image.type : fallbackType,
        };
    }

    // Returns the default empty section structure used for fallback states.
    private createDefaultAboutSection(): IAboutSection {
        return {
            roundelText: '',
            title: '',
            description: '',
            knowMore: {
                label: '',
                link: '',
                target: '_self',
            },
            images: [
                this.createDefaultImage('main'),
                this.createDefaultImage('secondary'),
                this.createDefaultImage('secondary'),
            ],
        };
    }

    // Returns a default empty image object for one of the required fixed image slots.
    private createDefaultImage(type: 'main' | 'secondary'): IAboutImage {
        return {
            alt: '',
            src: '',
            type,
        };
    }

    // Converts one image object into the reactive form group used on the page.
    private createImageGroup(image: IAboutImage): UntypedFormGroup {
        return this._formBuilder.group({
            alt: [image.alt, [Validators.required, Validators.maxLength(150)]],
            src: [image.src, [Validators.required]],
            type: [image.type, [Validators.required]],
        });
    }

    // Replaces every image form group with a fresh set from the latest data source.
    private replaceFormArray(targetArray: UntypedFormArray, controls: UntypedFormGroup[]): void {
        const shouldKeepDisabled = targetArray.disabled;

        while (targetArray.length) {
            targetArray.removeAt(0);
        }

        controls.forEach((control) => {
            if (shouldKeepDisabled) {
                control.disable({ emitEvent: false });
            } else {
                control.enable({ emitEvent: false });
            }

            targetArray.push(control);
        });
    }

    // Sorts the incoming images so the main image always comes first and secondary images follow.
    private sortAboutImages(images: any[]): any[] {
        return [...images].sort((leftImage, rightImage) => {
            const leftOrder = leftImage?.type === 'main' ? 0 : 1;
            const rightOrder = rightImage?.type === 'main' ? 0 : 1;
            return leftOrder - rightOrder;
        });
    }

    // Converts uploaded file names into the stored image path format used by the UI.
    private normalizeUploadedImagePath(imageNameOrPath: string): string {
        if (!imageNameOrPath) {
            return '';
        }

        if (
            imageNameOrPath.startsWith('assets/') ||
            imageNameOrPath.startsWith('http://') ||
            imageNameOrPath.startsWith('https://')
        ) {
            return imageNameOrPath;
        }

        return `assets/images/about/${imageNameOrPath}`;
    }

    // Pulls the file name from a full stored image path before calling the delete API.
    private extractFileName(imagePath: string): string {
        if (!imagePath) {
            return '';
        }

        const sanitizedPath = imagePath.split('?')[0].split('#')[0];
        const parts = sanitizedPath.split('/');
        return parts[parts.length - 1] || '';
    }

    // Provides a fallback image preview for empty about image slots.
    private getFallbackPreviewImage(): string {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='640' height='420' viewBox='0 0 640 420'%3E%3Crect width='640' height='420' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2364758b' font-family='Arial, sans-serif' font-size='28'%3EAbout Image Preview%3C/text%3E%3C/svg%3E";
    }

    // Normalizes Quill HTML by converting non-breaking spaces into regular spaces before display or save.
    private normalizeRichTextHtml(html: string): string {
        return String(html || '')
            .replace(/&nbsp;/g, ' ')
            .replace(/\u00a0/g, ' ');
    }

    // Treats empty Quill HTML such as <p><br></p> as missing content for required validation.
    private validateRichTextRequired(control: AbstractControl): ValidationErrors | null {
        const rawValue = control.value;
        const plainText = String(rawValue || '')
            .replace(/<(.|\n)*?>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .trim();

        return plainText ? null : { required: true };
    }
}
