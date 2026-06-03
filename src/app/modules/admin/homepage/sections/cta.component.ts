import { CdkScrollable } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
    UntypedFormArray,
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
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FILE_UPLOAD } from 'app/constants/upload';
import { SnackBarService } from 'app/core/general/snackbar.service';
import { PipesModule } from 'app/pipes/pipes.module';
import { environment } from 'environments/environment';
import { QuillModule } from 'ngx-quill';
import { HomeService } from '../home.service';
import { ICtaRecord, ICtaSection, IHeroBannerCta } from '../home.types';

@Component({
    selector: 'app-home-cta',
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
        CdkScrollable,
    ],
    templateUrl: './cta.component.html',
})
export class CtaComponent implements OnInit {
    entityForm: UntypedFormGroup | undefined;
    isLoading = false;
    isSaving = false;
    isUploadingImage = false;
    ctaRecord: ICtaRecord | null = null;

    public readonly baseURL = environment.apiBaseUrl;
    public readonly maxFileSizeInKb = FILE_UPLOAD.MAX_FILE_SIZE_IN_KB;
    readonly PHOTO_TYPE = {
        CTA: 'CTA',
    };

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _snackBar: SnackBarService,
        private _homeService: HomeService
    ) {}

    // Builds the page form and loads the stored CTA JSON when the page opens.
    ngOnInit(): void {
        this.generateFormGroup();
        this.loadCta();
    }

    // Exposes the fixed CTA array to the template.
    get ctaForms(): UntypedFormArray {
        return this.entityForm?.get('cta') as UntypedFormArray;
    }

    // Saves the full CTA JSON back to the backend using the loaded row metadata.
    updateCta(): void {
        if (this.entityForm?.invalid || this.isLoading || this.isSaving || this.isUploadingImage) {
            this.entityForm?.markAllAsTouched();
            return;
        }

        const payload = this.buildCtaPayload();
        this.isSaving = true;

        this._homeService.updateCta(payload).subscribe(
            (response: any) => {
                if (response?.status) {
                    this.ctaRecord = payload;
                    this._snackBar.showSuccess('CTA section updated successfully');
                } else {
                    this._snackBar.showError('Failed to update CTA section');
                }
            },
            () => {
                this._snackBar.showError(
                    'Oh no! Server error occurred while updating the CTA section'
                );
            },
            () => {
                this.isSaving = false;
            }
        );
    }

    // Uploads the CTA image and patches the returned path into the form.
    onCtaImageSelect(event: Event): void {
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
        formData.append(`${this.PHOTO_TYPE.CTA}[0]`, selectedFile);
        formData.append('fieldType', this.PHOTO_TYPE.CTA);

        this.isUploadingImage = true;
        this.entityForm?.disable();

        this._homeService.uploadFiles(formData).subscribe(
            (response: any) => {
                this.isUploadingImage = false;
                this.enableEntityForm();

                if (response?.status && response?.data?.[0]) {
                    const normalizedPath = this.normalizeUploadedImagePath(response.data[0]);
                    this.entityForm?.get('imageSrc')?.setValue(normalizedPath);
                    this._snackBar.showSuccess('CTA image uploaded successfully');
                } else {
                    this._snackBar.showError('Failed to upload CTA image');
                }

                input.value = '';
            },
            () => {
                this.isUploadingImage = false;
                this.enableEntityForm();
                this._snackBar.showError(
                    'Oh no! Server error occurred while uploading the CTA image'
                );
                input.value = '';
            }
        );
    }

    // Deletes the CTA image from the server after confirmation and clears the form field.
    clearCtaImage(): void {
        const imagePath = this.entityForm?.get('imageSrc')?.value;
        const fileName = this.extractFileName(imagePath);

        if (!fileName) {
            this.entityForm?.get('imageSrc')?.setValue('');
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
                this.entityForm?.disable();

                this._homeService.deletePhoto(fileName, this.PHOTO_TYPE.CTA).subscribe(
                    (response) => {
                        if (response) {
                            this.entityForm?.get('imageSrc')?.setValue('');
                            this._snackBar.showSuccess('CTA image deleted successfully');
                        } else {
                            this._snackBar.showError('Failed to delete CTA image');
                        }
                    },
                    () => {
                        this._snackBar.showError(
                            'Oh no! Server error occurred while deleting the CTA image'
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

        if (
            imagePath.startsWith('data:image') ||
            imagePath.startsWith('blob:')
        ) {
            return imagePath;
        }

        if (
            imagePath.startsWith('http://') ||
            imagePath.startsWith('https://')
        ) {
            return imagePath;
        }

        const normalizedPath = imagePath.replace(/^\/+/, '');
        return `${this.baseURL}/${normalizedPath}`;
    }

    // Creates the page form for the single CTA section.
    private generateFormGroup(): void {
        this.entityForm = this._formBuilder.group({
            title: ['', [Validators.required, Validators.maxLength(200)]],
            subtitle: ['', [Validators.required, Validators.maxLength(300)]],
            imageSrc: ['', [Validators.required]],
            imageAlt: ['', [Validators.required, Validators.maxLength(200)]],
            cta: this._formBuilder.array([]),
        });
    }

    // Loads the stored CTA data from the backend and patches it into the page form.
    private loadCta(): void {
        this.isLoading = true;

        this._homeService.getCta().subscribe(
            (response: any) => {
                if (response?.status && response?.data) {
                    this.ctaRecord = this.normalizeCtaRecord(response.data);
                    this.patchFormValues(this.ctaRecord.content);
                } else {
                    this.ctaRecord = null;
                    this.patchFormValues(this.createDefaultCtaSection());
                    this._snackBar.showError('Failed to fetch CTA section.');
                }
            },
            () => {
                this.ctaRecord = null;
                this.patchFormValues(this.createDefaultCtaSection());
                this._snackBar.showError(
                    'Oh no! Server error occurred while fetching the CTA section'
                );
            },
            () => {
                this.isLoading = false;
            }
        );
    }

    // Patches the fetched CTA data into the form and rebuilds the fixed CTA form array.
    private patchFormValues(data: ICtaSection): void {
        this.entityForm?.patchValue({
            title: data.content.title,
            subtitle: data.content.subtitle,
            imageSrc: data.image.src,
            imageAlt: data.image.alt,
        });

        this.replaceFormArray(
            this.ctaForms,
            data.cta.map((cta) => this.createCtaGroup(cta))
        );
    }

    // Re-enables the page form and nested CTA controls after save or upload operations finish.
    private enableEntityForm(): void {
        if (this.isUploadingImage || this.isSaving) {
            return;
        }

        this.entityForm?.enable({ emitEvent: false });
        this.ctaForms?.controls.forEach((control) =>
            control.enable({ emitEvent: false })
        );
    }

    // Builds the PUT payload by combining persisted row metadata with the latest form values.
    private buildCtaPayload(): ICtaRecord {
        return {
            content: this.mapFormValueToCtaSection(this.entityForm?.getRawValue()),
        };
    }

    // Converts the current reactive form value into the exact JSON shape expected by the API.
    private mapFormValueToCtaSection(formValue: any): ICtaSection {
        const ctas = Array.isArray(formValue?.cta) ? formValue.cta.slice(0, 2) : [];

        return {
            content: {
                title: formValue?.title || '',
                subtitle: formValue?.subtitle || '',
            },
            image: {
                src: formValue?.imageSrc || '',
                alt: formValue?.imageAlt || '',
            },
            cta: ctas.map((cta, index) => this.normalizeCtaItem(cta, index)),
        };
    }

    // Normalizes the fetched row metadata and nested content structure from the API response.
    private normalizeCtaRecord(payload: any): ICtaRecord {
        const normalizedSection = this.extractCtaSectionPayload(payload);

        return {
            content: this.normalizeCtaData(normalizedSection),
        };
    }

    // Extracts the CTA section object from either a direct section response or a row-wrapped response.
    private extractCtaSectionPayload(payload: any): any {
        if (Array.isArray(payload?.cta) || payload?.image || payload?.content?.title) {
            return payload;
        }

        return payload?.content || {};
    }

    // Normalizes the raw CTA section data so the UI always gets exactly one primary and one secondary CTA.
    private normalizeCtaData(payload: any): ICtaSection {
        const ctas = Array.isArray(payload?.cta) ? payload.cta.slice(0, 2) : [];

        while (ctas.length < 2) {
            ctas.push(
                this.createDefaultCtaItem(ctas.length === 0 ? 'primary' : 'secondary')
            );
        }

        return {
            content: {
                title: payload?.content?.title || '',
                subtitle: payload?.content?.subtitle || '',
            },
            image: {
                src: payload?.image?.src || '',
                alt: payload?.image?.alt || '',
            },
            cta: [
                this.normalizeCtaItem(ctas[0], 0),
                this.normalizeCtaItem(ctas[1], 1),
            ],
        };
    }

    // Normalizes one CTA item into the exact structure expected by the form.
    private normalizeCtaItem(cta: any, index: number): IHeroBannerCta {
        return {
            label: cta?.label || '',
            link: cta?.link || '',
            style: index === 0 ? 'primary' : 'secondary',
            target: cta?.target === '_blank' ? '_blank' : '_self',
        };
    }

    // Returns the default empty CTA section used for fallback states.
    private createDefaultCtaSection(): ICtaSection {
        return {
            content: {
                title: '',
                subtitle: '',
            },
            image: {
                src: '',
                alt: '',
            },
            cta: [
                this.createDefaultCtaItem('primary'),
                this.createDefaultCtaItem('secondary'),
            ],
        };
    }

    // Returns a default CTA item for one of the two fixed CTA slots.
    private createDefaultCtaItem(style: 'primary' | 'secondary'): IHeroBannerCta {
        return {
            label: '',
            link: '',
            style,
            target: style === 'primary' ? '_self' : '_blank',
        };
    }

    // Builds one CTA form group inside the fixed CTA array.
    private createCtaGroup(cta: IHeroBannerCta): UntypedFormGroup {
        return this._formBuilder.group({
            label: [cta.label, [Validators.required, Validators.maxLength(120)]],
            link: [cta.link, [Validators.required, Validators.maxLength(255)]],
            style: [cta.style, [Validators.required]],
            target: [cta.target, [Validators.required]],
        });
    }

    // Replaces every item inside a form array with a fresh set of controls.
    private replaceFormArray(targetArray: UntypedFormArray, controls: UntypedFormGroup[]): void {
        while (targetArray.length) {
            targetArray.removeAt(0);
        }

        controls.forEach((control) => targetArray.push(control));
    }

    // Converts uploaded file names into the stored CTA image path format used by the UI.
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

        return `assets/images/bg/${imageNameOrPath}`;
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

    // Provides a fallback preview image while no real image is available.
    private getFallbackPreviewImage(): string {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'%3E%3Crect width='800' height='500' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2364758b' font-family='Arial, sans-serif' font-size='28'%3ECTA Preview%3C/text%3E%3C/svg%3E";
    }
}
