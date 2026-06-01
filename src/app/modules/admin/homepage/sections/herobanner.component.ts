import { AsyncPipe, CommonModule, NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
import { environment } from 'environments/environment';
import { QuillModule } from 'ngx-quill';
import { HomeService } from '../home.service';
import {
    IHeroBannerCta,
    IHeroBannerRecord,
    IHeroBannerSection,
} from '../home.types';

@Component({
    selector: 'app-herobanner',
    standalone: true,
    imports: [
    MatProgressBarModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
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
    QuillModule
],
    templateUrl: './herobanner.component.html',
    styleUrl: './herobanner.component.scss',
})
export class HeroBannerComponent implements OnInit {
    @ViewChild('HeroBannerDialog') heroBannerDialog: TemplateRef<any>;

    entityForm: UntypedFormGroup;
    heroBannerDialogForm: UntypedFormGroup;
    heroBannerDialogRef = null;
    selectedBannerIndex: number | null = null;
    bannerDialogMode: 'add' | 'edit' = 'add';
    heroBannerImagePreview = '';
    heroBannerRecordId = '';
    heroBannerPageId = '1';
    heroBannerSectionKey = 'hero-banner';
    isLoading = false;
    isSaving = false;
    isUploadingHeroImage = false;

    public readonly baseURL = environment.apiBaseUrl;
    public readonly maxFileSizeInMb = FILE_UPLOAD.MAX_FILE_SIZE_IN_MB;
    readonly PHOTO_TYPE = {
        HERO_BANNER: 'HERO_BANNER',
    };

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _matDialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService,
        private _snackBar: SnackBarService,
        private _homeService: HomeService
    ) {}

    // Builds both forms and loads the current hero-banner JSON when the page opens.
    ngOnInit(): void {
        this.generateFormGroup();
        this.generateHeroBannerDialogForm();
        this.loadHeroBanners();
    }

    // Exposes the page-level banner list form array to the template.
    get heroBannerSections(): UntypedFormArray {
        return this.entityForm.get('heroBanners') as UntypedFormArray;
    }

    // Exposes the feature form array inside the add/edit modal.
    get heroBannerDialogFeatures(): UntypedFormArray {
        return this.heroBannerDialogForm.get('features') as UntypedFormArray;
    }

    // Exposes the CTA form array inside the add/edit modal.
    get heroBannerDialogCtas(): UntypedFormArray {
        return this.heroBannerDialogForm.get('cta') as UntypedFormArray;
    }

    // Returns the feature values for one banner card on the main page.
    getBannerFeatures(index: number): string[] {
        return (this.heroBannerSections.at(index)?.get('features')?.value as string[]) || [];
    }

    // Returns the CTA values for one banner card on the main page.
    getBannerCtas(index: number): IHeroBannerCta[] {
        return (this.heroBannerSections.at(index)?.get('cta')?.value as IHeroBannerCta[]) || [];
    }

    // Opens the modal in add or edit mode and pre-fills values when editing.
    openHeroBannerDialog(mode: 'add' | 'edit', index?: number): void {
        this.bannerDialogMode = mode;
        this.selectedBannerIndex = typeof index === 'number' ? index : null;
        this.resetHeroBannerDialogForm();

        if (mode === 'edit' && this.selectedBannerIndex !== null) {
            const banner = this.mapFormValueToHeroBanner(
                this.heroBannerSections.at(this.selectedBannerIndex).getRawValue()
            );
            this.patchHeroBannerDialogForm(banner);
        }

        this.heroBannerDialogRef = this._matDialog.open(this.heroBannerDialog, {
            width: '960px',
            maxWidth: '96vw',
            disableClose: true,
        });
    }

    // Closes the modal and clears temporary dialog-only UI state.
    closeHeroBannerDialog(): void {
        if (this.heroBannerDialogForm?.disabled && !this.isUploadingHeroImage && !this.isSaving) {
            this.heroBannerDialogForm.enable();
        }
        this.heroBannerDialogRef?.close();
        this.heroBannerDialogRef = null;
        this.selectedBannerIndex = null;
        this.heroBannerImagePreview = '';
        this.isUploadingHeroImage = false;
    }

    // Saves one banner change by rebuilding and persisting the full banner collection.
    saveHeroBanner(): void {
        if (
            this.heroBannerDialogForm.invalid ||
            this.isUploadingHeroImage ||
            this.isSaving
        ) {
            this.heroBannerDialogForm.markAllAsTouched();
            return;
        }

        const bannerData = this.mapFormValueToHeroBanner(this.heroBannerDialogForm.getRawValue());
        const nextBanners = this.buildNextBannersState(bannerData);

        this.persistBannerCollection(
            nextBanners,
            this.bannerDialogMode === 'add'
                ? 'Hero banner item added successfully'
                : 'Hero banner item updated successfully',
            this.bannerDialogMode === 'add'
                ? 'Failed to add hero banner item.'
                : 'Failed to update hero banner item.',
            this.bannerDialogMode === 'add'
                ? 'Oh no! Server error occurred while adding hero banner item'
                : 'Oh no! Server error occurred while updating hero banner item',
            () => {
                this.closeHeroBannerDialog();
            }
        );
    }

    // Deletes one banner after confirmation and persists the remaining collection.
    deleteHeroBanner(index: number): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Hero Banner',
            message:
                'Are you sure you want to delete this hero banner item? This will update the stored banner JSON.',
            actions: {
                confirm: {
                    label: 'Delete',
                },
            },
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                const nextBanners = this.getCurrentBanners().filter(
                    (_, bannerIndex) => bannerIndex !== index
                );
                this.persistBannerCollection(
                    nextBanners,
                    'Hero banner item deleted successfully',
                    'Failed to delete hero banner item.',
                    'Oh no! Server error occurred while deleting hero banner item'
                );
            }
        });
    }

    // Adds another feature input in the modal until the max of five is reached.
    addFeature(): void {
        if (this.heroBannerDialogFeatures.length >= 5) {
            return;
        }

        this.heroBannerDialogFeatures.push(this._formBuilder.control('', Validators.required));
    }

    // Removes a feature input while keeping the required minimum of three.
    removeFeature(index: number): void {
        if (this.heroBannerDialogFeatures.length <= 3) {
            return;
        }

        this.heroBannerDialogFeatures.removeAt(index);
    }

    // Adds another CTA block in the modal until the maximum of three is reached.
    addCta(): void {
        if (this.heroBannerDialogCtas.length >= 3) {
            return;
        }

        this.heroBannerDialogCtas.push(
            this.createCtaGroup({
                label: '',
                link: '',
                style: this.heroBannerDialogCtas.length === 0 ? 'primary' : 'secondary',
                target: this.heroBannerDialogCtas.length === 0 ? '_self' : '_blank',
            })
        );
    }

    // Removes a CTA block while keeping at least one CTA in the modal.
    removeCta(index: number): void {
        if (this.heroBannerDialogCtas.length <= 1) {
            return;
        }

        this.heroBannerDialogCtas.removeAt(index);
    }

    // Uploads the selected image file and patches the returned path into the modal form.
    onHeroBannerImageSelect(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) {
            return;
        }

        const selectedFile = input.files[0];
        const maxFileSize = this.maxFileSizeInMb * 1024 * 1024;

        if (selectedFile.size > maxFileSize) {
            this._snackBar.showError(
                `The selected file size exceeds the ${this.maxFileSizeInMb} MB limit.`
            );
            input.value = '';
            return;
        }

        const formData = new FormData();
        formData.append(`${this.PHOTO_TYPE.HERO_BANNER}[0]`, selectedFile);
        formData.append('fieldType', this.PHOTO_TYPE.HERO_BANNER);

        this.isUploadingHeroImage = true;
        this.heroBannerDialogForm.disable();

        this._homeService.uploadFiles(formData).subscribe(
            (response: any) => {
                this.isUploadingHeroImage = false;
                this.heroBannerDialogForm.enable();

                if (response?.status && response?.data?.[0]) {
                    const normalizedPath = this.normalizeUploadedImagePath(response.data[0]);
                    this.heroBannerDialogForm.get('imageSrc')?.setValue(normalizedPath);
                    this.heroBannerImagePreview = this.resolveImageUrl(normalizedPath);
                    this._snackBar.showSuccess('Hero banner image uploaded successfully');
                } else {
                    this._snackBar.showError('Failed to upload hero banner image');
                }

                input.value = '';
            },
            () => {
                this.isUploadingHeroImage = false;
                this.heroBannerDialogForm.enable();
                this._snackBar.showError(
                    'Oh no! Server error occurred while uploading the hero banner image'
                );
                input.value = '';
            }
        );
    }

    // Deletes the currently selected image from the server after confirmation.
    clearHeroBannerImage(): void {
        const imagePath = this.heroBannerDialogForm.get('imageSrc')?.value;
        const fileName = this.extractFileName(imagePath);

        if (!fileName) {
            this.heroBannerDialogForm.get('imageSrc')?.setValue('');
            this.heroBannerImagePreview = '';
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
                this.heroBannerDialogForm.disable();

                this._homeService
                    .deletePhoto(fileName, this.PHOTO_TYPE.HERO_BANNER)
                    .subscribe(
                        (response) => {
                            if (response) {
                                this.heroBannerDialogForm.get('imageSrc')?.setValue('');
                                this.heroBannerImagePreview = '';
                                this._snackBar.showSuccess(
                                    'Hero banner image deleted successfully'
                                );
                            } else {
                                this._snackBar.showError(
                                    'Failed to delete hero banner image'
                                );
                            }
                        },
                        () => {
                            this._snackBar.showError(
                                'Oh no! Server error occurred while deleting the hero banner image'
                            );
                        },
                        () => {
                            if (!this.isUploadingHeroImage && !this.isSaving) {
                                this.heroBannerDialogForm.enable();
                            }
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

    // Creates the page-level form that stores the list of banners shown on screen.
    private generateFormGroup(): void {
        this.entityForm = this._formBuilder.group({
            heroBanners: this._formBuilder.array([]),
        });
    }

    // Creates the modal form used to add or edit one banner item at a time.
    private generateHeroBannerDialogForm(): void {
        this.heroBannerDialogForm = this._formBuilder.group({
            priority: [1, [Validators.required]],
            title: ['', [Validators.required]],
            subtitle: ['', [Validators.required]],
            imageSrc: ['', [Validators.required]],
            imageAlt: ['', [Validators.required]],
            features: this._formBuilder.array([]),
            cta: this._formBuilder.array([]),
        });

        this.resetHeroBannerDialogForm();
    }

    // Resets the modal form back to a clean default banner structure.
    private resetHeroBannerDialogForm(): void {
        const emptyBanner = this.createEmptyHeroBanner();
        this.heroBannerDialogForm.reset(this.createHeroBannerGroupValue(emptyBanner));
        this.replaceFormArray(
            this.heroBannerDialogFeatures,
            emptyBanner.features.map((feature) =>
                this._formBuilder.control(feature, Validators.required)
            )
        );
        this.replaceFormArray(
            this.heroBannerDialogCtas,
            emptyBanner.cta.map((cta) => this.createCtaGroup(cta))
        );
        this.heroBannerDialogForm.get('priority')?.setValue(1);
        this.heroBannerImagePreview = '';
    }

    // Prefills the modal form with the values from an existing banner item.
    private patchHeroBannerDialogForm(banner: IHeroBannerSection): void {
        this.heroBannerDialogForm.patchValue(this.createHeroBannerGroupValue(banner));
        this.replaceFormArray(
            this.heroBannerDialogFeatures,
            banner.features.map((feature) =>
                this._formBuilder.control(feature, Validators.required)
            )
        );
        this.replaceFormArray(
            this.heroBannerDialogCtas,
            banner.cta.map((cta) => this.createCtaGroup(cta))
        );
        this.heroBannerImagePreview = this.resolveImageUrl(banner.image.src);
    }

    // Returns the default banner object used for a brand-new modal state.
    private createEmptyHeroBanner(): IHeroBannerSection {
        return {
            priority: 1,
            content: {
                title: '',
                subtitle: '',
            },
            image: {
                src: '',
                alt: '',
            },
            features: ['', '', ''],
            cta: [
                {
                    label: '',
                    link: '',
                    style: 'primary',
                    target: '_self',
                },
            ],
        };
    }

    // Converts one banner object into the reactive form shape used on the page.
    private createHeroBannerGroup(banner: IHeroBannerSection): UntypedFormGroup {
        return this._formBuilder.group({
            priority: [banner.priority, [Validators.required]],
            title: [banner.content.title, [Validators.required]],
            subtitle: [banner.content.subtitle, [Validators.required]],
            imageSrc: [banner.image.src, [Validators.required]],
            imageAlt: [banner.image.alt, [Validators.required]],
            features: this._formBuilder.array(
                banner.features.map((feature) => this._formBuilder.control(feature, Validators.required))
            ),
            cta: this._formBuilder.array(banner.cta.map((cta) => this.createCtaGroup(cta))),
        });
    }

    // Builds one CTA form group inside a banner.
    private createCtaGroup(cta: IHeroBannerCta): UntypedFormGroup {
        return this._formBuilder.group({
            label: [cta.label, [Validators.required]],
            link: [cta.link, [Validators.required]],
            style: [cta.style, [Validators.required]],
            target: [cta.target, [Validators.required]],
        });
    }

    // Flattens a banner object into the field layout expected by the modal form.
    private createHeroBannerGroupValue(banner: IHeroBannerSection): Record<string, any> {
        return {
            priority: banner.priority,
            title: banner.content.title,
            subtitle: banner.content.subtitle,
            imageSrc: banner.image.src,
            imageAlt: banner.image.alt,
        };
    }

    // Rebuilds the nested API banner structure from the flat form values.
    private mapFormValueToHeroBanner(formValue: any): IHeroBannerSection {
        return {
            priority: Number(formValue.priority) || 1,
            content: {
                title: formValue.title,
                subtitle: formValue.subtitle,
            },
            image: {
                src: formValue.imageSrc,
                alt: formValue.imageAlt,
            },
            features: [...formValue.features],
            cta: [...formValue.cta],
        };
    }

    // Replaces all items inside a form array with a fresh set of controls.
    private replaceFormArray(targetArray: UntypedFormArray, controls: any[]): void {
        while (targetArray.length) {
            targetArray.removeAt(0);
        }

        controls.forEach((control) => targetArray.push(control));
    }

    // Keeps banner priorities sequential after add or delete operations.
    private reorderBannerPriorities(): void {
        this.heroBannerSections.controls.forEach((control, index) => {
            control.get('priority')?.setValue(index + 1);
        });
    }

    // Loads the stored banner row and maps its JSON content into the page form.
    private loadHeroBanners(): void {
        this.isLoading = true;

        this._homeService.getBanner().subscribe(
            (response: any) => {
                if (response?.status) {
                    const record = this.extractBannerRecord(response);
                    const banners = record.content;
                    this.heroBannerRecordId = record.id || '';
                    this.heroBannerPageId = record.pageId || '1';
                    this.heroBannerSectionKey = record.section || 'hero-banner';
                    this.replaceFormArray(
                        this.heroBannerSections,
                        banners.map((banner) => this.createHeroBannerGroup(banner))
                    );
                    this.reorderBannerPriorities();
                } else {
                    this.replaceFormArray(this.heroBannerSections, []);
                    this._snackBar.showError('Failed to fetch hero banner items.');
                }
            },
            () => {
                this.replaceFormArray(this.heroBannerSections, []);
                this._snackBar.showError(
                    'Oh no! Server error occurred while fetching hero banner items'
                );
            },
            () => {
                this.isLoading = false;
            }
        );
    }

    // Extracts the row metadata and banner content array from the API response.
    private extractBannerRecord(response: any): IHeroBannerRecord {
        const data = response?.data || {};
        const content = Array.isArray(data?.content) ? data.content : [];

        return {
            id: data?.id ? String(data.id) : '',
            pageId: data?.pageId ? String(data.pageId) : '1',
            section: data?.section || 'hero-banner',
            content: content
                .map((item, index) => this.normalizeBannerItem(item, index))
                .filter(Boolean),
        };
    }

    // Normalizes one raw banner item so the UI always works with a complete safe structure.
    private normalizeBannerItem(item: any, index: number): IHeroBannerSection {
        const features = Array.isArray(item?.features) ? item.features.slice(0, 5) : [];
        while (features.length < 3) {
            features.push('');
        }

        const ctas = Array.isArray(item?.cta)
            ? item.cta.slice(0, 3).map((cta) => ({
                  label: cta?.label || '',
                  link: cta?.link || '',
                  style: cta?.style === 'secondary' ? 'secondary' : 'primary',
                  target: cta?.target === '_blank' ? '_blank' : '_self',
              }))
            : [];

        while (ctas.length < 1) {
            ctas.push({
                label: '',
                link: '',
                style: 'primary',
                target: '_self',
            });
        }

        return {
            priority: Number(item?.priority) || index + 1,
            content: {
                title: item?.content?.title || '',
                subtitle: item?.content?.subtitle || '',
            },
            image: {
                src: item?.image?.src || '',
                alt: item?.image?.alt || '',
            },
            features,
            cta: ctas,
        };
    }

    // Converts the uploaded file name into the stored banner image path format.
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

    // Provides a fallback preview image while no real image is available.
    private getFallbackPreviewImage(): string {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'%3E%3Crect width='800' height='500' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2364758b' font-family='Arial, sans-serif' font-size='28'%3EHero Preview%3C/text%3E%3C/svg%3E";
    }

    // Pulls the file name out of a stored image path before calling delete API.
    private extractFileName(imagePath: string): string {
        if (!imagePath) {
            return '';
        }

        const sanitizedPath = imagePath.split('?')[0].split('#')[0];
        const parts = sanitizedPath.split('/');
        return parts[parts.length - 1] || '';
    }

    // Reads the current banner list from the page form and converts it back to API shape.
    private getCurrentBanners(): IHeroBannerSection[] {
        return this.heroBannerSections.controls.map((control) =>
            this.mapFormValueToHeroBanner(control.getRawValue())
        );
    }

    // Inserts the new/updated banner into the requested priority position and shifts others accordingly.
    private buildNextBannersState(banner: IHeroBannerSection): IHeroBannerSection[] {
        const banners = this.getCurrentBanners();

        if (this.bannerDialogMode === 'edit' && this.selectedBannerIndex !== null) {
            banners.splice(this.selectedBannerIndex, 1);
        }

        const targetPriority = Math.min(
            Math.max(Number(banner.priority) || 1, 1),
            banners.length + 1
        );

        banners.splice(targetPriority - 1, 0, {
            ...banner,
            priority: targetPriority,
        });

        return banners.map((item, index) => ({
            ...item,
            priority: index + 1,
        }));
    }

    // Wraps the full banner array with record metadata before sending it to the backend.
    private buildBannerPayload(content: IHeroBannerSection[]): IHeroBannerRecord {
        const normalizedContent = content.map((item, index) => ({
            ...item,
            priority: index + 1,
        }));

        return {
            id: this.heroBannerRecordId || undefined,
            pageId: this.heroBannerPageId || '1',
            section: this.heroBannerSectionKey || 'hero-banner',
            content: normalizedContent,
        };
    }

    // Persists the full banner collection for add, update, and delete flows.
    private persistBannerCollection(
        banners: IHeroBannerSection[],
        successMessage: string,
        failureMessage: string,
        serverErrorMessage: string,
        onSuccess?: () => void
    ): void {
        const payload = this.buildBannerPayload(banners);
        this.isSaving = true;

        if (this.heroBannerDialogRef) {
            this.heroBannerDialogForm.disable();
        }

        const request$ = this.heroBannerRecordId
            ? this._homeService.updateBanner(payload)
            : this._homeService.createBanner(payload);

        request$.subscribe(
            (response: any) => {
                if (response?.status) {
                    this._snackBar.showSuccess(successMessage);
                    onSuccess?.();
                    this.loadHeroBanners();
                } else {
                    this._snackBar.showError(failureMessage);
                }
            },
            () => {
                this._snackBar.showError(serverErrorMessage);
            },
            () => {
                this.isSaving = false;
                if (this.heroBannerDialogForm?.disabled) {
                    this.heroBannerDialogForm.enable();
                }
            }
        );
    }
}
