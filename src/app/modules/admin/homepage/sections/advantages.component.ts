import { AsyncPipe, CommonModule, NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
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
import {
    IAdvantagesFeature,
    IAdvantagesRecord,
    IAdvantagesSection,
} from '../home.types';

@Component({
    selector: 'app-home-advantages',
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
        QuillModule,
        FuseAlertComponent,
    ],
    templateUrl: './advantages.component.html',
})
export class AdvantagesComponent implements OnInit {
    @ViewChildren('featureCard') featureCards!: QueryList<ElementRef<HTMLDivElement>>;

    entityForm: UntypedFormGroup;
    isLoading = false;
    isUploading = false;
    isSaving = false;
    advantagesRecord: IAdvantagesRecord | null = null;

    public readonly baseURL = environment.apiBaseUrl;
    public readonly maxFileSizeInKb = FILE_UPLOAD.MAX_ICON_FILE_SIZE_IN_KB;
    readonly PHOTO_TYPE = {
        ADVANTAGES: 'ADVANTAGES',
    };

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _snackBar: SnackBarService,
        private _homeService: HomeService
    ) {}

    // Builds the page form and loads the stored advantages JSON when the page opens.
    ngOnInit(): void {
        this.generateFormGroup();
        this.loadAdvantages();
    }

    // Exposes the feature list form array to the template.
    get featureForms(): UntypedFormArray {
        return this.entityForm.get('features') as UntypedFormArray;
    }

    // Adds another feature card while keeping the maximum of ten.
    addFeature(): void {
        if (this.featureForms.length >= 10) {
            return;
        }

        this.featureForms.push(
            this.createFeatureGroup(
                this.createEmptyFeature(this.getNextFeaturePriority())
            )
        );
        this.scrollToLatestFeature();
    }

    // Removes a feature card while keeping the required minimum of three.
    removeFeature(index: number): void {
        if (
            this.featureForms.length <= 3 ||
            this.isLoading ||
            this.isUploading ||
            this.isSaving
        ) {
            return;
        }

        if (!this.advantagesRecord?.id) {
            this._snackBar.showError(
                'Advantages record was not loaded, so remove cannot be completed.'
            );
            return;
        }

        const confirmation = this._fuseConfirmationService.open({
            title: 'Remove Feature',
            message:
                'Are you sure you want to remove this feature? The section will be saved automatically after confirmation.',
            actions: {
                confirm: {
                    label: 'Yes, Remove',
                },
            },
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result !== 'confirmed') {
                return;
            }

            this.featureForms.removeAt(index);

            if (this.entityForm.invalid) {
                this._snackBar.showError(
                    'Feature was removed locally, but the form still has validation errors so auto-save could not run.'
                );
                return;
            }

            this.persistAdvantagesUpdate(
                this.buildAdvantagesPayload(),
                'Feature removed and saved successfully'
            );
        });
    }

    // Sends the full advantages JSON back to the backend using the existing row id and section metadata.
    updateAdvantages(): void {
        if (this.entityForm.invalid || this.isUploading || this.isLoading || this.isSaving) {
            this.entityForm.markAllAsTouched();
            return;
        }

        if (!this.advantagesRecord?.id) {
            this._snackBar.showError(
                'Advantages record was not loaded, so update cannot be completed.'
            );
            return;
        }

        this.persistAdvantagesUpdate(
            this.buildAdvantagesPayload(),
            'Advantages updated successfully'
        );
    }

    // Uploads one feature icon and patches the returned file path into the matching feature group.
    onFeatureIconSelect(index: number, event: Event): void {
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
        formData.append(`${this.PHOTO_TYPE.ADVANTAGES}[0]`, selectedFile);
        formData.append('fieldType', this.PHOTO_TYPE.ADVANTAGES);

        this.isUploading = true;
        this.entityForm.disable();

        this._homeService.uploadFiles(formData).subscribe(
            (response: any) => {
                this.isUploading = false;
                this.entityForm.enable();

                if (response?.status && response?.data?.[0]) {
                    const normalizedPath = this.normalizeUploadedImagePath(response.data[0]);
                    this.featureForms.at(index).get('icon')?.setValue(normalizedPath);
                    this._snackBar.showSuccess('Feature icon uploaded successfully');
                } else {
                    this._snackBar.showError('Failed to upload feature icon');
                }

                input.value = '';
            },
            () => {
                this.isUploading = false;
                this.entityForm.enable();
                this._snackBar.showError(
                    'Oh no! Server error occurred while uploading the feature icon'
                );
                input.value = '';
            }
        );
    }

    // Deletes the current feature icon from the server after confirmation.
    clearFeatureIcon(index: number): void {
        const iconPath = this.featureForms.at(index).get('icon')?.value;
        const fileName = this.extractFileName(iconPath);

        if (!fileName) {
            this.featureForms.at(index).get('icon')?.setValue('');
            return;
        }

        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Icon',
            message:
                'Are you sure you want to delete this icon from the server? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete',
                },
            },
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this.entityForm.disable();

                this._homeService.deletePhoto(fileName, this.PHOTO_TYPE.ADVANTAGES).subscribe(
                    (response) => {
                        if (response) {
                            this.featureForms.at(index).get('icon')?.setValue('');
                            this._snackBar.showSuccess('Feature icon deleted successfully');
                        } else {
                            this._snackBar.showError('Failed to delete feature icon');
                        }
                    },
                    () => {
                        this._snackBar.showError(
                            'Oh no! Server error occurred while deleting the feature icon'
                        );
                    },
                    () => {
                        if (!this.isUploading) {
                            this.entityForm.enable();
                        }
                    }
                );
            }
        });
    }

    // Converts a stored icon path into a browser-ready preview URL.
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

    // Creates the page form with title, subtitle, and repeatable feature groups.
    private generateFormGroup(): void {
        this.entityForm = this._formBuilder.group({
            title: ['', [Validators.required]],
            subtitle: ['', [Validators.required]],
            features: this._formBuilder.array([]),
        });
    }

    // Loads the stored advantages data from the backend and patches it into the page form.
    private loadAdvantages(): void {
        this.isLoading = true;

        this._homeService.getAdvantages().subscribe(
            (response: any) => {
                if (response?.status && response?.data) {
                    this.advantagesRecord = this.normalizeAdvantagesRecord(
                        response?.data
                    );
                    this.patchFormValues(this.advantagesRecord.content);
                } else {
                    this.advantagesRecord = null;
                    this.patchFormValues(this.createEmptyAdvantagesSection());
                    this._snackBar.showError('Failed to fetch advantages section.');
                }
            },
            () => {
                this.advantagesRecord = null;
                this.patchFormValues(this.createEmptyAdvantagesSection());
                this._snackBar.showError(
                    'Oh no! Server error occurred while fetching the advantages section'
                );
            },
            () => {
                this.isLoading = false;
            }
        );
    }

    // Patches the fetched advantages data into the form and rebuilds the feature form array.
    private patchFormValues(data: IAdvantagesSection): void {
        this.entityForm.patchValue({
            title: data.title,
            subtitle: data.subtitle,
        });

        this.replaceFormArray(
            this.featureForms,
            data.features.map((feature) => this.createFeatureGroup(feature))
        );
    }

    // Re-enables the page form and all nested feature controls after save or upload operations finish.
    private enableEntityForm(): void {
        if (this.isUploading) {
            return;
        }

        this.entityForm.enable({ emitEvent: false });
        this.featureForms.controls.forEach((control) =>
            control.enable({ emitEvent: false })
        );
    }

    // Builds the PUT payload by combining the persisted row metadata with the latest form values.
    private buildAdvantagesPayload(): IAdvantagesRecord {
        return {
            id: this.advantagesRecord?.id,
            pageId: this.advantagesRecord?.pageId,
            section: this.advantagesRecord?.section || 'advantages',
            content: this.mapFormValueToAdvantagesSection(this.entityForm.getRawValue()),
        };
    }

    // Converts the current reactive form value into the exact JSON shape expected in the content object.
    private mapFormValueToAdvantagesSection(formValue: any): IAdvantagesSection {
        const features = Array.isArray(formValue?.features)
            ? formValue.features.slice(0, 10)
            : [];

        return {
            title: formValue?.title || '',
            subtitle: formValue?.subtitle || '',
            features: features.map((feature) => this.normalizeFeature(feature)),
        };
    }

    // Persists the full advantages row to the backend and refreshes the form with the saved response.
    private persistAdvantagesUpdate(
        payload: IAdvantagesRecord,
        successMessage: string
    ): void {
        this.isSaving = true;
        this.entityForm.disable();

        this._homeService.updateAdvantages(payload).subscribe(
            (response: any) => {
                if (response?.status) {
                    this.advantagesRecord = this.normalizeAdvantagesRecord(
                        response?.data || payload
                    );
                    this.enableEntityForm();
                    this.patchFormValues(this.advantagesRecord.content);
                    this.enableEntityForm();
                    this._snackBar.showSuccess(successMessage);
                } else {
                    this._snackBar.showError('Failed to update advantages section');
                }
            },
            () => {
                this._snackBar.showError(
                    'Oh no! Server error occurred while updating the advantages section'
                );
            },
            () => {
                this.isSaving = false;
                this.enableEntityForm();
            }
        );
    }

    // Normalizes the fetched row metadata and nested content structure from the API response.
    private normalizeAdvantagesRecord(payload: any): IAdvantagesRecord {
        return {
            id: payload?.id || '',
            pageId: payload?.pageId || '',
            section: payload?.section || 'advantages',
            content: this.normalizeAdvantagesData(payload?.content),
        };
    }

    // Normalizes and sorts the raw API payload so the form always gets at least three and at most ten features.
    private normalizeAdvantagesData(payload: any): IAdvantagesSection {
        const features = this.sortFeaturesByPriority(
            Array.isArray(payload?.features) ? payload.features.slice(0, 10) : []
        );

        while (features.length < 3) {
            features.push(this.createEmptyFeature());
        }

        return {
            title: payload?.title || '',
            subtitle: payload?.subtitle || '',
            features: features.map((feature) => this.normalizeFeature(feature)),
        };
    }

    // Sorts features by ascending priority while keeping empty priorities at the end.
    private sortFeaturesByPriority(features: any[]): any[] {
        return [...features].sort((leftFeature, rightFeature) => {
            const leftPriority =
                leftFeature?.priority === 0 || leftFeature?.priority
                    ? Number(leftFeature.priority)
                    : Number.MAX_SAFE_INTEGER;
            const rightPriority =
                rightFeature?.priority === 0 || rightFeature?.priority
                    ? Number(rightFeature.priority)
                    : Number.MAX_SAFE_INTEGER;

            return leftPriority - rightPriority;
        });
    }

    // Normalizes one raw feature item into the exact structure expected by the form.
    private normalizeFeature(feature: any): IAdvantagesFeature {
        return {
            priority:
                feature?.priority === 0 || feature?.priority
                    ? Number(feature.priority)
                    : null,
            alt: feature?.alt || '',
            icon: feature?.icon || '',
            title: feature?.title || '',
            description: feature?.description || '',
        };
    }

    // Returns an empty feature object used when the backend has fewer than three items.
    private createEmptyFeature(priority: number | null = null): IAdvantagesFeature {
        return {
            priority,
            alt: '',
            icon: '',
            title: '',
            description: '',
        };
    }

    // Returns the default empty section structure used for fallback states.
    private createEmptyAdvantagesSection(): IAdvantagesSection {
        return {
            title: '',
            subtitle: '',
            features: [
                this.createEmptyFeature(),
                this.createEmptyFeature(),
                this.createEmptyFeature(),
            ],
        };
    }

    // Converts one feature object into the reactive form group used on the page.
    private createFeatureGroup(feature: IAdvantagesFeature): UntypedFormGroup {
        return this._formBuilder.group({
            priority: [feature.priority, [Validators.required, Validators.min(1)]],
            alt: [feature.alt, [Validators.required]],
            icon: [feature.icon, [Validators.required]],
            title: [feature.title, [Validators.required]],
            description: [feature.description, [Validators.required]],
        });
    }

    // Replaces every feature form group with a fresh set from the latest data source.
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

    // Returns the next priority number for a newly added feature.
    private getNextFeaturePriority(): number {
        const priorities = this.featureForms.controls
            .map((control) => Number(control.get('priority')?.value))
            .filter((priority) => Number.isFinite(priority) && priority > 0);

        if (!priorities.length) {
            return 1;
        }

        return Math.max(...priorities) + 1;
    }

    // Scrolls the newest feature card into view so the added empty form is immediately visible.
    private scrollToLatestFeature(): void {
        setTimeout(() => {
            const latestCard = this.featureCards?.last?.nativeElement;
            latestCard?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
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

        return `assets/images/icons/${imageNameOrPath}`;
    }

    // Pulls the file name from a full stored icon path before calling the delete API.
    private extractFileName(imagePath: string): string {
        if (!imagePath) {
            return '';
        }

        const sanitizedPath = imagePath.split('?')[0].split('#')[0];
        const parts = sanitizedPath.split('/');
        return parts[parts.length - 1] || '';
    }

    // Provides a fallback image preview for empty icon slots.
    private getFallbackPreviewImage(): string {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='240' viewBox='0 0 320 240'%3E%3Crect width='320' height='240' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2364758b' font-family='Arial, sans-serif' font-size='18'%3EIcon Preview%3C/text%3E%3C/svg%3E";
    }
}
