import { CommonModule } from '@angular/common';
import {
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    TemplateRef,
    ViewChild,
} from '@angular/core';
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
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation/public-api';
import { FILE_UPLOAD } from 'app/constants/upload';
import { SnackBarService } from 'app/core/general/snackbar.service';
import { environment } from 'environments/environment';
import { QuillModule } from 'ngx-quill';
import { finalize, Subject, Subscription, take } from 'rxjs';
import { ProductsService } from '../products.service';

@Component({
    selector: 'app-product-details',
    standalone: true,
    imports: [
        RouterModule,
        MatIconModule,
        MatButtonModule,
        MatTabsModule,
        ReactiveFormsModule,
        QuillModule,
        MatProgressBarModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        FormsModule,
        MatRadioModule,
        MatProgressSpinnerModule,
        MatDatepickerModule,
        MatDialogModule,
        MatCheckboxModule,
        MatSelectModule,
        MatOptionModule,
        CommonModule,
        MatAutocompleteModule,
    ],
    templateUrl: './product-details.component.html',
    styleUrl: './product-details.component.scss',
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
    @ViewChild('CoverImagePreviewDialog') coverImagePreviewDialog:
        | TemplateRef<any>
        | undefined;
    @ViewChild('GalleryImagePreviewDialog') galleryImagePreviewDialog:
        | TemplateRef<any>
        | undefined;

    mode!: string; // Holds the mode ('CREATE' or 'EDIT')
    id!: string | null; // Holds the id (if present)
    entityForm: UntypedFormGroup;
    subscription: Subscription = null;
    productTitle: string = '';
    coverImagePreview = '';
    galleryImagePreview = '';
    galleryImagePreviewTitle = '';
    isUploadingImage = false;
    isDeletingImage = false;
    backLink = '';
    public readonly baseURL = environment.apiBaseUrl;
    public readonly maxFileSizeInMb = FILE_UPLOAD.MAX_FILE_SIZE_IN_MB;
    public readonly maxFileSizeInKb = FILE_UPLOAD.MAX_FILE_SIZE_IN_KB;
    public readonly maxIconFileSizeInKb = FILE_UPLOAD.MAX_ICON_FILE_SIZE_IN_KB;
    public readonly PHOTO_TYPE = {
        COVER: 'COVER',
        GALLERY: 'GALLERY',
        HOW_IT_WORKS: 'HOW_IT_WORKS',
        KEY_FEATURES: 'FEATURES',
    };
    public readonly OVERVIEW_CTA_TYPES = [
        { value: 'enquiry', label: 'Enquiry' },
        { value: 'video', label: 'Video' },
        { value: 'general-link', label: 'General Link' },
    ];

    private destroy$ = new Subject<void>(); // To clean up subscriptions

    constructor(
        private route: ActivatedRoute,
        private _formBuilder: UntypedFormBuilder,
        private _snackBar: SnackBarService,
        private _productsService: ProductsService,
        private _fuseConfirmationService: FuseConfirmationService,
        private _matDialog: MatDialog,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        // Access the static data passed through the route
        this.mode = this.route.snapshot.data['mode'];

        // Access the :id parameter
        this.id = this.route.snapshot.paramMap.get('id'); // Get 'id' as a string

        this.generateFormGroup();

        if (this.id && this.mode === 'EDIT') {
            this.getProductDetails();
        }
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
        this.destroy$?.next();
        this.destroy$?.complete();

        if (this.coverImagePreview?.startsWith('blob:')) {
            URL.revokeObjectURL(this.coverImagePreview);
        }
    }

    generateFormGroup() {
        this.entityForm = this._formBuilder.group({
            title: ['', [Validators.required, Validators.maxLength(255)]],
            slug: ['', [Validators.required, Validators.maxLength(255)]],
            short_description: [
                '',
                [Validators.required, Validators.maxLength(400)],
            ],
            image: ['', [Validators.required]],
            image_alt: ['', [Validators.required, Validators.maxLength(200)]],
            order: [0],
            status: [1],
            details: this._formBuilder.group({
                pageHeader: this._formBuilder.group({
                    title: ['', [Validators.required, Validators.maxLength(200)]],
                    subtitle: ['', [Validators.required, Validators.maxLength(300)]],
                }),
                gallery: this._formBuilder.array(
                    this.createDefaultGalleryItems().map((item) =>
                        this.createGalleryImageGroup(item)
                    )
                ),
                overview: this._formBuilder.group({
                    content: ['', [this.richTextRequiredValidator]],
                    ctas: this._formBuilder.array([
                        this.createOverviewCtaGroup({
                            type: 'enquiry',
                            label: '',
                            url: '',
                        }),
                    ]),
                }),
                howItWorks: this._formBuilder.array(
                    this.createDefaultHowItWorksItems().map((item) =>
                        this.createHowItWorksItemGroup(item)
                    )
                ),
                showHowItWorks: [true],
                keyFeatures: this._formBuilder.array(
                    this.createDefaultKeyFeatureItems().map((item) =>
                        this.createKeyFeatureGroup(item)
                    )
                ),
                showKeyFeatures: [true],
                advancedCapabilities: this._formBuilder.array(
                    this.createDefaultAdvancedCapabilityItems().map((item) =>
                        this.createAdvancedCapabilityGroup(item)
                    )
                ),
                showAdvancedCapabilities: [true],
                techSpecs: this._formBuilder.group({
                    rows: this._formBuilder.array(
                        this.createDefaultTechSpecRows().map((row) =>
                            this.createTechSpecRowGroup(row)
                        )
                    ),
                }),
                showTechSpecs: [true],
            }),
        });

        this.subscription = this.entityForm
            .get('title')
            ?.valueChanges.subscribe((title) => {
                this.entityForm
                    .get('slug')
                    ?.setValue(this.generateSlug(title), {
                        emitEvent: false,
                    });
            });
    }

    getProductDetails() {
        this.subscription = this._productsService
            .getProductDetailsById(this.id)
            .subscribe(
                (response: any) => {
                    if (response.status) {
                        this.patchFormValues(response.data);
                    } else {
                        this._snackBar.showError(
                            'Oh no! Something went wrong in fetching Product Details. Please try again later'
                        );
                    }
                },
                (error) => {
                    this._snackBar.showError(
                        'Oh no! Server error occured while fetching the list of Product Details'
                    );
                }
            );
    }

    patchFormValues(product: any) {
        const details = this.normalizeDetails(product.details);
        this.replaceGalleryForms(details.gallery);
        this.replaceOverviewCtaForms(details.overview.ctas);
        this.replaceHowItWorksForms(details.howItWorks);
        this.replaceKeyFeatureForms(details.keyFeatures);
        this.replaceAdvancedCapabilityForms(details.advancedCapabilities);
        this.replaceTechSpecRows(details.techSpecs.rows);

        this.entityForm.patchValue({
            title: product.title,
            slug: product.slug,
            short_description: product.short_description,
            image: product.image,
            image_alt: product.image_alt,
            order: product.order ?? 0,
            status: product.status ?? 1,
            details,
        });

        this.updateHowItWorksSectionState();
        this.updateKeyFeaturesSectionState();
        this.updateAdvancedCapabilitiesSectionState();
        this.updateTechSpecsSectionState();
        this.productTitle = product.title;
        this.coverImagePreview = this.resolveImageUrl(product.image);
    }

    get galleryForms(): UntypedFormArray {
        return this.entityForm.get('details.gallery') as UntypedFormArray;
    }

    get overviewCtaForms(): UntypedFormArray {
        return this.entityForm.get('details.overview.ctas') as UntypedFormArray;
    }

    get howItWorksForms(): UntypedFormArray {
        return this.entityForm.get('details.howItWorks') as UntypedFormArray;
    }

    get showHowItWorks(): boolean {
        return !!this.entityForm.get('details.showHowItWorks')?.value;
    }

    get keyFeatureForms(): UntypedFormArray {
        return this.entityForm.get('details.keyFeatures') as UntypedFormArray;
    }

    get showKeyFeatures(): boolean {
        return !!this.entityForm.get('details.showKeyFeatures')?.value;
    }

    get advancedCapabilityForms(): UntypedFormArray {
        return this.entityForm.get(
            'details.advancedCapabilities'
        ) as UntypedFormArray;
    }

    get showAdvancedCapabilities(): boolean {
        return !!this.entityForm.get('details.showAdvancedCapabilities')?.value;
    }

    get showTechSpecs(): boolean {
        return !!this.entityForm.get('details.showTechSpecs')?.value;
    }

    get techSpecRows(): UntypedFormArray {
        return this.entityForm.get('details.techSpecs.rows') as UntypedFormArray;
    }

    addEntity(): void {
        if (this.entityForm.invalid || this.entityForm.disabled) {
            this.entityForm.markAllAsTouched();
            return;
        }

        this.entityForm.disable();

        this._productsService
            .createProduct(this.buildProductPayload())
            .pipe(
                take(1),
                finalize(() => {
                    this.enableEntityForm();
                })
            )
            .subscribe({
                next: (response: any) => {
                    if (response?.status === false) {
                        this._snackBar.showError('Failed to create product');
                        return;
                    }

                    this._snackBar.showSuccess('Product created successfully');

                    const productId = response?.data?.id;
                    if (productId) {
                        this.router.navigate([
                            '/configurations/products/details',
                            productId,
                        ]);
                        return;
                    }

                    this.router.navigate(['/configurations/products']);
                },
                error: () => {
                    this._snackBar.showError(
                        'Oh no! Server error occurred while creating the product'
                    );
                },
            });
    }

    updateSelectedEntity(): void {
        if (this.entityForm.invalid || this.entityForm.disabled) {
            this.entityForm.markAllAsTouched();
            return;
        }

        const productId = Number(this.id);
        if (!Number.isFinite(productId) || productId <= 0) {
            this._snackBar.showError(
                'Product was not loaded correctly, so update cannot be completed.'
            );
            return;
        }

        this.entityForm.disable();

        this._productsService
            .updateProduct(productId, this.buildProductPayload())
            .pipe(
                take(1),
                finalize(() => {
                    this.enableEntityForm();
                })
            )
            .subscribe({
                next: (response: any) => {
                    if (response?.status === false) {
                        this._snackBar.showError('Failed to update product');
                        return;
                    }

                    const product = response?.data;
                    if (product) {
                        this.patchFormValues(product);
                    }

                    this._snackBar.showSuccess('Product updated successfully');
                },
                error: () => {
                    this._snackBar.showError(
                        'Oh no! Server error occurred while updating the product'
                    );
                },
            });
    }

    onCoverImageSelect(event: Event): void {
        const input = event.target as HTMLInputElement;

        if (!input.files?.length) {
            return;
        }

        this.uploadProductImage(input.files[0], this.PHOTO_TYPE.COVER, 'image');
        input.value = '';
    }

    clearCoverImage(): void {
        this.clearProductImage(this.PHOTO_TYPE.COVER, 'image', 'cover image');
    }

    openCoverImagePreview(): void {
        if (!this.coverImagePreviewDialog || !this.entityForm.get('image')?.value) {
            return;
        }

        this._matDialog.open(this.coverImagePreviewDialog, {
            width: '920px',
            maxWidth: '96vw',
            panelClass: 'product-image-preview-dialog',
        });
    }

    openGalleryImagePreview(index: number): void {
        const imagePath = this.galleryForms.at(index).get('image')?.value;

        if (!this.galleryImagePreviewDialog || !imagePath) {
            return;
        }

        this.galleryImagePreview = this.resolveImageUrl(imagePath);
        this.galleryImagePreviewTitle = `Gallery Image ${index + 1}`;

        this._matDialog.open(this.galleryImagePreviewDialog, {
            width: '920px',
            maxWidth: '96vw',
            panelClass: 'product-image-preview-dialog',
        });
    }

    addGalleryImage(): void {
        if (this.galleryForms.length >= 10 || this.entityForm.disabled) {
            return;
        }

        this.galleryForms.push(
            this.createGalleryImageGroup({
                image: '',
                priority: this.galleryForms.length + 1,
            })
        );
        this.syncGalleryPriorities();
    }

    removeGalleryImage(index: number): void {
        if (this.galleryForms.length <= 3 || this.entityForm.disabled) {
            return;
        }

        const imagePath = this.galleryForms.at(index).get('image')?.value;

        if (imagePath) {
            this.clearGalleryImage(index, true);
            return;
        }

        this.galleryForms.removeAt(index);
        this.syncGalleryPriorities();
    }

    onGalleryImageSelect(index: number, event: Event): void {
        const input = event.target as HTMLInputElement;

        if (!input.files?.length) {
            return;
        }

        const imageControl = this.galleryForms.at(index).get('image');
        this.uploadProductImage(
            input.files[0],
            this.PHOTO_TYPE.GALLERY,
            'image',
            imageControl
        );
        input.value = '';
    }

    clearGalleryImage(index: number, removeAfterDelete = false): void {
        const imageControl = this.galleryForms.at(index).get('image');

        this.clearProductImage(
            this.PHOTO_TYPE.GALLERY,
            'image',
            'gallery image',
            imageControl,
            () => {
                if (removeAfterDelete && this.galleryForms.length > 3) {
                    this.galleryForms.removeAt(index);
                    this.syncGalleryPriorities();
                }
            }
        );
    }

    addOverviewCta(): void {
        if (this.overviewCtaForms.length >= 3 || this.entityForm.disabled) {
            return;
        }

        this.overviewCtaForms.push(
            this.createOverviewCtaGroup({
                type: this.getNextAvailableOverviewCtaType(),
                label: '',
                url: '',
            })
        );
    }

    removeOverviewCta(index: number): void {
        if (this.overviewCtaForms.length <= 1 || this.entityForm.disabled) {
            return;
        }

        this.overviewCtaForms.removeAt(index);
    }

    onOverviewCtaTypeChange(index: number): void {
        const ctaGroup = this.overviewCtaForms.at(index) as UntypedFormGroup;
        this.updateOverviewCtaUrlValidators(ctaGroup);
    }

    isOverviewCtaTypeDisabled(type: string, currentIndex: number): boolean {
        return this.overviewCtaForms.controls.some(
            (control, index) =>
                index !== currentIndex && control.get('type')?.value === type
        );
    }

    addHowItWorksItem(): void {
        if (
            !this.showHowItWorks ||
            this.howItWorksForms.length >= 10 ||
            this.entityForm.disabled
        ) {
            return;
        }

        this.howItWorksForms.push(
            this.createHowItWorksItemGroup({
                image: '',
                title: '',
                description: '',
                priority: this.howItWorksForms.length + 1,
            })
        );
    }

    removeHowItWorksItem(index: number): void {
        if (
            !this.showHowItWorks ||
            this.howItWorksForms.length <= 3 ||
            this.entityForm.disabled
        ) {
            return;
        }

        const imagePath = this.howItWorksForms.at(index).get('image')?.value;

        if (imagePath) {
            this.clearHowItWorksImage(index, true);
            return;
        }

        this.howItWorksForms.removeAt(index);
    }

    onHowItWorksImageSelect(index: number, event: Event): void {
        const input = event.target as HTMLInputElement;

        if (!this.showHowItWorks || !input.files?.length) {
            return;
        }

        const imageControl = this.howItWorksForms.at(index).get('image');
        this.uploadProductImage(
            input.files[0],
            this.PHOTO_TYPE.HOW_IT_WORKS,
            'image',
            imageControl
        );
        input.value = '';
    }

    clearHowItWorksImage(index: number, removeAfterDelete = false): void {
        if (!this.showHowItWorks) {
            return;
        }

        const imageControl = this.howItWorksForms.at(index).get('image');

        this.clearProductImage(
            this.PHOTO_TYPE.HOW_IT_WORKS,
            'image',
            'how it works image',
            imageControl,
            () => {
                if (removeAfterDelete && this.howItWorksForms.length > 3) {
                    this.howItWorksForms.removeAt(index);
                }
            }
        );
    }

    onHowItWorksVisibilityChange(): void {
        this.updateHowItWorksSectionState();
    }

    addKeyFeature(): void {
        if (
            !this.showKeyFeatures ||
            this.keyFeatureForms.length >= 10 ||
            this.entityForm.disabled
        ) {
            return;
        }

        this.keyFeatureForms.push(
            this.createKeyFeatureGroup({
                icon: '',
                title: '',
                priority: this.keyFeatureForms.length + 1,
            })
        );
    }

    removeKeyFeature(index: number): void {
        if (
            !this.showKeyFeatures ||
            this.keyFeatureForms.length <= 3 ||
            this.entityForm.disabled
        ) {
            return;
        }

        const iconPath = this.keyFeatureForms.at(index).get('icon')?.value;

        if (iconPath) {
            this.clearKeyFeatureIcon(index, true);
            return;
        }

        this.keyFeatureForms.removeAt(index);
    }

    onKeyFeatureIconSelect(index: number, event: Event): void {
        const input = event.target as HTMLInputElement;

        if (!this.showKeyFeatures || !input.files?.length) {
            return;
        }

        const iconControl = this.keyFeatureForms.at(index).get('icon');
        this.uploadProductImage(
            input.files[0],
            this.PHOTO_TYPE.KEY_FEATURES,
            'icon',
            iconControl,
            this.maxIconFileSizeInKb
        );
        input.value = '';
    }

    clearKeyFeatureIcon(index: number, removeAfterDelete = false): void {
        if (!this.showKeyFeatures) {
            return;
        }

        const iconControl = this.keyFeatureForms.at(index).get('icon');

        this.clearProductImage(
            this.PHOTO_TYPE.KEY_FEATURES,
            'icon',
            'key feature icon',
            iconControl,
            () => {
                if (removeAfterDelete && this.keyFeatureForms.length > 3) {
                    this.keyFeatureForms.removeAt(index);
                }
            }
        );
    }

    onKeyFeaturesVisibilityChange(): void {
        this.updateKeyFeaturesSectionState();
    }

    addAdvancedCapability(): void {
        if (
            !this.showAdvancedCapabilities ||
            this.advancedCapabilityForms.length >= 6 ||
            this.entityForm.disabled
        ) {
            return;
        }

        this.advancedCapabilityForms.push(
            this.createAdvancedCapabilityGroup({
                heading: '',
                description: '',
                priority: this.advancedCapabilityForms.length + 1,
            })
        );
        this.syncAdvancedCapabilityPriorities();
    }

    removeAdvancedCapability(index: number): void {
        if (
            !this.showAdvancedCapabilities ||
            this.advancedCapabilityForms.length <= 2 ||
            this.entityForm.disabled
        ) {
            return;
        }

        this.advancedCapabilityForms.removeAt(index);
        this.syncAdvancedCapabilityPriorities();
    }

    onAdvancedCapabilitiesVisibilityChange(): void {
        this.updateAdvancedCapabilitiesSectionState();
    }

    onTechSpecsVisibilityChange(): void {
        this.updateTechSpecsSectionState();
    }

    addTechSpecRow(): void {
        if (!this.showTechSpecs || this.entityForm.disabled) {
            return;
        }

        this.techSpecRows.push(
            this.createTechSpecRowGroup({
                heading: '',
                content: '',
            })
        );
    }

    removeTechSpecRow(index: number): void {
        if (
            !this.showTechSpecs ||
            this.techSpecRows.length <= 1 ||
            this.entityForm.disabled
        ) {
            return;
        }

        this.techSpecRows.removeAt(index);
    }

    uploadProductImage(
        file: File,
        fileType: string,
        controlName: string,
        targetControl?: AbstractControl | null,
        maxFileSizeInKb = this.maxFileSizeInKb
    ): void {
        const maxFileSize = maxFileSizeInKb * 1024;

        if (file.size > maxFileSize) {
            this._snackBar.showError(
                `The selected image size exceeds the ${maxFileSizeInKb} KB limit.`
            );
            return;
        }

        const formData = new FormData();
        formData.append(`${fileType}[0]`, file);
        formData.append('fileType', fileType);

        this.isUploadingImage = true;
        this.entityForm.disable();

        this._productsService.uploadFiles(formData).subscribe(
            (response: any) => {
                if (response?.status && response?.data?.[0]) {
                    const imagePath = this.normalizeUploadedImagePath(
                        response.data[0]
                    );
                    const imageControl =
                        targetControl || this.entityForm.get(controlName);

                    imageControl?.setValue(imagePath);
                    imageControl?.markAsDirty();

                    if (!targetControl && controlName === 'image') {
                        this.coverImagePreview = this.resolveImageUrl(imagePath);
                    }

                    this._snackBar.showSuccess('Image uploaded successfully');
                } else {
                    this._snackBar.showError('Failed to upload image');
                }
            },
            () => {
                this._snackBar.showError(
                    'Oh no! Server error occurred while uploading the image'
                );
            },
            () => {
                this.isUploadingImage = false;
                this.enableEntityForm();
            }
        );
    }

    clearProductImage(
        fileType: string,
        controlName: string,
        label = 'image',
        targetControl?: AbstractControl | null,
        afterClear?: () => void
    ): void {
        const imageControl = targetControl || this.entityForm.get(controlName);
        const imagePath = imageControl?.value;
        const fileName = this.extractFileName(imagePath);

        if (!fileName) {
            this.clearImageControl(controlName, imageControl);
            afterClear?.();
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
            if (result !== 'confirmed') {
                return;
            }

            this.isDeletingImage = true;
            this.entityForm.disable();

            this._productsService.deletePhoto(fileName, fileType).subscribe(
                (response) => {
                    if (response) {
                        this.clearImageControl(controlName, imageControl);
                        afterClear?.();
                        this._snackBar.showSuccess(
                            `${this.toTitleCase(label)} deleted successfully`
                        );
                    } else {
                        this._snackBar.showError(
                            `Failed to delete ${label}`
                        );
                    }
                },
                () => {
                    this._snackBar.showError(
                        `Oh no! Server error occurred while deleting the ${label}`
                    );
                },
                () => {
                    this.isDeletingImage = false;
                    this.enableEntityForm();
                }
            );
        });
    }

    resolveImageUrl(imagePath: string): string {
        if (!imagePath) {
            return '';
        }

        if (
            imagePath.startsWith('blob:') ||
            imagePath.startsWith('data:image')
        ) {
            return imagePath;
        }

        if (
            imagePath.startsWith('http://') ||
            imagePath.startsWith('https://')
        ) {
            return imagePath;
        }

        return `${this.baseURL}/${imagePath.replace(/^\/+/, '')}`;
    }

    private clearImageControl(
        controlName: string,
        targetControl?: AbstractControl | null
    ): void {
        const imageControl = targetControl || this.entityForm.get(controlName);

        imageControl?.setValue('');
        imageControl?.markAsDirty();

        if (!targetControl && controlName === 'image') {
            this.coverImagePreview = '';
        }
    }

    private enableEntityForm(): void {
        if (this.isUploadingImage || this.isDeletingImage) {
            return;
        }

        this.entityForm.enable({ emitEvent: false });
        this.updateHowItWorksSectionState();
        this.updateKeyFeaturesSectionState();
        this.updateAdvancedCapabilitiesSectionState();
        this.updateTechSpecsSectionState();
    }

    private buildProductPayload(): any {
        const formValue = this.entityForm.getRawValue();

        return {
            title: formValue?.title || '',
            slug: formValue?.slug || '',
            short_description: formValue?.short_description || '',
            image: formValue?.image || '',
            image_alt: formValue?.image_alt || '',
            order: formValue?.order ?? 0,
            status: formValue?.status ?? 1,
            details: this.normalizeDetails(formValue?.details),
        };
    }

    private normalizeDetails(details: any): any {
        const parsedDetails = this.parseJsonField(details);

        return {
            ...parsedDetails,
            pageHeader: {
                title: parsedDetails?.pageHeader?.title || '',
                subtitle: parsedDetails?.pageHeader?.subtitle || '',
            },
            gallery: this.normalizeGalleryItems(parsedDetails?.gallery),
            overview: this.normalizeOverview(parsedDetails?.overview),
            howItWorks: this.normalizeHowItWorksItems(
                parsedDetails?.howItWorks
            ),
            showHowItWorks: parsedDetails?.showHowItWorks ?? true,
            keyFeatures: this.normalizeKeyFeatureItems(
                parsedDetails?.keyFeatures
            ),
            showKeyFeatures: parsedDetails?.showKeyFeatures ?? true,
            advancedCapabilities: this.normalizeAdvancedCapabilityItems(
                parsedDetails?.advancedCapabilities
            ),
            showAdvancedCapabilities:
                parsedDetails?.showAdvancedCapabilities ?? true,
            techSpecs: this.normalizeTechSpecs(parsedDetails?.techSpecs),
            showTechSpecs: parsedDetails?.showTechSpecs ?? true,
        };
    }

    private parseJsonField(value: any): any {
        if (!value) {
            return {};
        }

        if (typeof value === 'object') {
            return value;
        }

        try {
            return JSON.parse(value);
        } catch {
            return {};
        }
    }

    private createGalleryImageGroup(item: any): UntypedFormGroup {
        return this._formBuilder.group({
            image: [item?.image || '', [Validators.required]],
            priority: [Number(item?.priority) || 1, [Validators.required]],
        });
    }

    private createOverviewCtaGroup(item: any): UntypedFormGroup {
        const ctaGroup = this._formBuilder.group({
            type: [
                this.isValidOverviewCtaType(item?.type)
                    ? item.type
                    : this.getNextAvailableOverviewCtaType(),
                [Validators.required],
            ],
            label: [item?.label || '', [Validators.required, Validators.maxLength(120)]],
            url: [item?.url || ''],
        });

        this.updateOverviewCtaUrlValidators(ctaGroup);

        return ctaGroup;
    }

    private createHowItWorksItemGroup(item: any): UntypedFormGroup {
        return this._formBuilder.group({
            image: [item?.image || '', [Validators.required]],
            title: [
                item?.title || '',
                [Validators.required, Validators.maxLength(100)],
            ],
            description: [
                item?.description || '',
                [Validators.required, Validators.maxLength(150)],
            ],
            priority: [
                Number(item?.priority) || 1,
                [Validators.required, Validators.min(1)],
            ],
        });
    }

    private createKeyFeatureGroup(item: any): UntypedFormGroup {
        return this._formBuilder.group({
            icon: [item?.icon || item?.image || '', [Validators.required]],
            title: [
                item?.title || '',
                [Validators.required, Validators.maxLength(100)],
            ],
            priority: [Number(item?.priority) || 1, [Validators.required]],
        });
    }

    private createAdvancedCapabilityGroup(item: any): UntypedFormGroup {
        return this._formBuilder.group({
            heading: [
                item?.heading || '',
                [Validators.required, Validators.maxLength(50)],
            ],
            description: [
                this.normalizeRichTextContent(item?.description),
                [this.richTextRequiredValidator],
            ],
            priority: [Number(item?.priority) || 1, [Validators.required]],
        });
    }

    private createTechSpecRowGroup(row: any): UntypedFormGroup {
        return this._formBuilder.group({
            heading: [
                row?.heading || row?.title || '',
                [Validators.required, Validators.maxLength(100)],
            ],
            content: [row?.content || row?.description || '', [Validators.required]],
        });
    }

    private createDefaultGalleryItems(): any[] {
        return [1, 2, 3].map((priority) => ({
            image: '',
            priority,
        }));
    }

    private createDefaultHowItWorksItems(): any[] {
        return [1, 2, 3].map((priority) => ({
            image: '',
            title: '',
            description: '',
            priority,
        }));
    }

    private createDefaultKeyFeatureItems(): any[] {
        return [1, 2, 3].map((priority) => ({
            icon: '',
            title: '',
            priority,
        }));
    }

    private createDefaultAdvancedCapabilityItems(): any[] {
        return [1, 2].map((priority) => ({
            heading: '',
            description: '',
            priority,
        }));
    }

    private createDefaultTechSpecRows(): any[] {
        return [
            {
                heading: '',
                content: '',
            },
        ];
    }

    private normalizeGalleryItems(items: any): any[] {
        const galleryItems = Array.isArray(items) ? items : [];
        const normalizedItems = galleryItems
            .slice(0, 10)
            .map((item, index) => ({
                image: item?.image || item?.src || '',
                priority: Number(item?.priority) || index + 1,
            }))
            .sort((leftItem, rightItem) => leftItem.priority - rightItem.priority);

        while (normalizedItems.length < 3) {
            normalizedItems.push({
                image: '',
                priority: normalizedItems.length + 1,
            });
        }

        return normalizedItems.map((item, index) => ({
            ...item,
            priority: index + 1,
        }));
    }

    private normalizeOverview(overview: any): any {
        return {
            content: this.normalizeRichTextContent(overview?.content),
            ctas: this.normalizeOverviewCtas(overview?.ctas),
        };
    }

    private normalizeTechSpecs(techSpecs: any): any {
        return {
            rows: this.normalizeTechSpecRows(techSpecs),
        };
    }

    private normalizeTechSpecRows(techSpecs: any): any[] {
        const rows = Array.isArray(techSpecs?.rows)
            ? techSpecs.rows
            : Array.isArray(techSpecs)
              ? techSpecs
              : [];

        const normalizedRows = rows.map((row) => ({
            heading: row?.heading || row?.title || '',
            content: row?.content || row?.description || '',
        }));

        if (!normalizedRows.length && (techSpecs?.content || techSpecs?.description)) {
            normalizedRows.push({
                heading: '',
                content: this.normalizeRichTextContent(
                    techSpecs?.content || techSpecs?.description
                ),
            });
        }

        if (!normalizedRows.length) {
            normalizedRows.push({
                heading: '',
                content: '',
            });
        }

        return normalizedRows;
    }

    private normalizeOverviewCtas(items: any): any[] {
        const ctaItems = Array.isArray(items) ? items : [];
        const usedTypes = new Set<string>();
        const normalizedItems = ctaItems
            .filter((item) => this.isValidOverviewCtaType(item?.type))
            .filter((item) => {
                if (usedTypes.has(item.type)) {
                    return false;
                }

                usedTypes.add(item.type);
                return true;
            })
            .slice(0, 3)
            .map((item) => ({
                type: item.type,
                label: item?.label || '',
                url: item.type === 'enquiry' ? '' : item?.url || '',
            }));

        if (!normalizedItems.length) {
            normalizedItems.push({
                type: 'enquiry',
                label: '',
                url: '',
            });
        }

        return normalizedItems;
    }

    private normalizeHowItWorksItems(items: any): any[] {
        const howItWorksItems = Array.isArray(items) ? items : [];
        const normalizedItems = howItWorksItems
            .slice(0, 10)
            .map((item, index) => ({
                image: item?.image || item?.src || '',
                title: item?.title || '',
                description: item?.description || '',
                priority: Number(item?.priority) || index + 1,
            }))
            .sort((leftItem, rightItem) => leftItem.priority - rightItem.priority);

        while (normalizedItems.length < 3) {
            normalizedItems.push({
                image: '',
                title: '',
                description: '',
                priority: normalizedItems.length + 1,
            });
        }

        return normalizedItems;
    }

    private normalizeKeyFeatureItems(items: any): any[] {
        const keyFeatureItems = Array.isArray(items) ? items : [];
        const normalizedItems = keyFeatureItems
            .slice(0, 10)
            .map((item, index) => ({
                icon: item?.icon || item?.image || item?.src || '',
                title: item?.title || '',
                priority: Number(item?.priority) || index + 1,
            }));

        while (normalizedItems.length < 3) {
            normalizedItems.push({
                icon: '',
                title: '',
                priority: normalizedItems.length + 1,
            });
        }

        return normalizedItems.map((item, index) => ({
            ...item,
            priority: index + 1,
        }));
    }

    private normalizeAdvancedCapabilityItems(items: any): any[] {
        const advancedCapabilityItems = Array.isArray(items) ? items : [];
        const normalizedItems = advancedCapabilityItems
            .slice(0, 6)
            .map((item, index) => ({
                heading: item?.heading || item?.title || '',
                description: this.normalizeRichTextContent(
                    item?.description || item?.content
                ),
                priority: Number(item?.priority) || index + 1,
            }))
            .sort((leftItem, rightItem) => leftItem.priority - rightItem.priority);

        while (normalizedItems.length < 2) {
            normalizedItems.push({
                heading: '',
                description: '',
                priority: normalizedItems.length + 1,
            });
        }

        return normalizedItems.map((item, index) => ({
            ...item,
            priority: index + 1,
        }));
    }

    private replaceGalleryForms(items: any[]): void {
        while (this.galleryForms.length) {
            this.galleryForms.removeAt(0);
        }

        this.normalizeGalleryItems(items).forEach((item) => {
            this.galleryForms.push(this.createGalleryImageGroup(item));
        });
    }

    private replaceOverviewCtaForms(items: any[]): void {
        while (this.overviewCtaForms.length) {
            this.overviewCtaForms.removeAt(0);
        }

        this.normalizeOverviewCtas(items).forEach((item) => {
            this.overviewCtaForms.push(this.createOverviewCtaGroup(item));
        });
    }

    private replaceHowItWorksForms(items: any[]): void {
        while (this.howItWorksForms.length) {
            this.howItWorksForms.removeAt(0);
        }

        this.normalizeHowItWorksItems(items).forEach((item) => {
            this.howItWorksForms.push(this.createHowItWorksItemGroup(item));
        });
    }

    private replaceKeyFeatureForms(items: any[]): void {
        while (this.keyFeatureForms.length) {
            this.keyFeatureForms.removeAt(0);
        }

        this.normalizeKeyFeatureItems(items).forEach((item) => {
            this.keyFeatureForms.push(this.createKeyFeatureGroup(item));
        });
    }

    private replaceAdvancedCapabilityForms(items: any[]): void {
        while (this.advancedCapabilityForms.length) {
            this.advancedCapabilityForms.removeAt(0);
        }

        this.normalizeAdvancedCapabilityItems(items).forEach((item) => {
            this.advancedCapabilityForms.push(
                this.createAdvancedCapabilityGroup(item)
            );
        });
    }

    private replaceTechSpecRows(rows: any[]): void {
        while (this.techSpecRows.length) {
            this.techSpecRows.removeAt(0);
        }

        this.normalizeTechSpecRows({ rows }).forEach((row) => {
            this.techSpecRows.push(this.createTechSpecRowGroup(row));
        });
    }

    private updateHowItWorksSectionState(): void {
        const showSection = this.entityForm.get('details.showHowItWorks')?.value;

        if (showSection) {
            this.howItWorksForms.enable({ emitEvent: false });
            return;
        }

        this.howItWorksForms.disable({ emitEvent: false });
    }

    private updateKeyFeaturesSectionState(): void {
        const showSection = this.entityForm.get('details.showKeyFeatures')?.value;

        if (showSection) {
            this.keyFeatureForms.enable({ emitEvent: false });
            return;
        }

        this.keyFeatureForms.disable({ emitEvent: false });
    }

    private updateAdvancedCapabilitiesSectionState(): void {
        const showSection = this.entityForm.get(
            'details.showAdvancedCapabilities'
        )?.value;

        if (showSection) {
            this.advancedCapabilityForms.enable({ emitEvent: false });
            return;
        }

        this.advancedCapabilityForms.disable({ emitEvent: false });
    }

    private updateTechSpecsSectionState(): void {
        const techSpecsGroup = this.entityForm.get('details.techSpecs');
        const showSection = this.entityForm.get('details.showTechSpecs')?.value;

        if (showSection) {
            techSpecsGroup?.enable({ emitEvent: false });
            return;
        }

        techSpecsGroup?.disable({ emitEvent: false });
    }

    private syncAdvancedCapabilityPriorities(): void {
        this.advancedCapabilityForms.controls.forEach((control, index) => {
            control.get('priority')?.setValue(index + 1, {
                emitEvent: false,
            });
        });
    }

    private syncGalleryPriorities(): void {
        this.galleryForms.controls.forEach((control, index) => {
            control.get('priority')?.setValue(index + 1, {
                emitEvent: false,
            });
        });
    }

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

        return `assets/images/products/${imageNameOrPath}`;
    }

    private updateOverviewCtaUrlValidators(ctaGroup: UntypedFormGroup): void {
        const urlControl = ctaGroup.get('url');
        const type = ctaGroup.get('type')?.value;

        if (type === 'video' || type === 'general-link') {
            urlControl?.setValidators([
                Validators.required,
                Validators.maxLength(500),
            ]);
        } else {
            urlControl?.clearValidators();
            urlControl?.setValue('', { emitEvent: false });
        }

        urlControl?.updateValueAndValidity({ emitEvent: false });
    }

    private getNextAvailableOverviewCtaType(): string {
        const selectedTypes = this.overviewCtaForms?.controls?.map(
            (control) => control.get('type')?.value
        );

        return (
            this.OVERVIEW_CTA_TYPES.find(
                (ctaType) => !selectedTypes?.includes(ctaType.value)
            )?.value || 'enquiry'
        );
    }

    private isValidOverviewCtaType(type: string): boolean {
        return this.OVERVIEW_CTA_TYPES.some(
            (ctaType) => ctaType.value === type
        );
    }

    private richTextRequiredValidator = (
        control: AbstractControl
    ): ValidationErrors | null => {
        const value = this.normalizeRichTextContent(control.value)
            .replace(/<[^>]*>/g, '')
            .trim();

        return value ? null : { required: true };
    };

    private normalizeRichTextContent(value: string): string {
        return String(value || '')
            .replace(/&nbsp;/gi, ' ')
            .replace(/\u00a0/g, ' ');
    }

    private extractFileName(imagePath: string): string {
        if (!imagePath) {
            return '';
        }

        const sanitizedPath = imagePath.split('?')[0].split('#')[0];
        const parts = sanitizedPath.split('/');
        return parts[parts.length - 1] || '';
    }

    private toTitleCase(value: string): string {
        return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
    }

    private generateSlug(value: string): string {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}
