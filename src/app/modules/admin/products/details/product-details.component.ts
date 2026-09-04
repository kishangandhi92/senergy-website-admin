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
import { MatTooltipModule } from '@angular/material/tooltip';
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
        MatTooltipModule,
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
    @ViewChild('CustomerStoryDialog') customerStoryDialog:
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
    customerStoryDialogForm: UntypedFormGroup | undefined;
    customerStoryDialogRef = null;
    selectedCustomerStoryIndex: number | null = null;
    activeTabIndex = 0;
    customerStoryDialogMode: 'add' | 'edit' = 'add';
    customerStoryImagePreview = '';
    isUploadingImage = false;
    isDeletingImage = false;
    backLink = '';
    public readonly baseURL = environment.apiBaseUrl;
    public readonly maxFileSizeInMb = FILE_UPLOAD.MAX_FILE_SIZE_IN_MB;
    public readonly maxFileSizeInKb = FILE_UPLOAD.MAX_FILE_SIZE_IN_KB;
    public readonly maxIconFileSizeInKb = FILE_UPLOAD.MAX_ICON_FILE_SIZE_IN_KB;
    public readonly placeholderCustomerStoryImagePath =
        'assets/images/home/testimonials/avatar.png';
    public readonly PHOTO_TYPE = {
        COVER: 'COVER',
        GALLERY: 'GALLERY',
        HOW_IT_WORKS: 'HOW_IT_WORKS',
        KEY_FEATURES: 'FEATURES',
        TESTIMONIALS: 'TESTIMONIALS',
        CTA: 'CTA',
    };
    public readonly OVERVIEW_CTA_TYPES = [
        { value: 'enquiry', label: 'Enquiry' },
        { value: 'video', label: 'Video' },
        { value: 'general-link', label: 'General Link' },
    ];
    private readonly tabControlPaths: string[][] = [
        ['title', 'slug', 'short_description', 'image', 'image_alt'],
        ['details.pageHeader'],
        ['details.gallery'],
        ['details.overview'],
        [
            'details.howItWorksTitle',
            'details.showHowItWorks',
            'details.howItWorks',
        ],
        [
            'details.keyFeaturesTitle',
            'details.showKeyFeatures',
            'details.keyFeatures',
        ],
        [
            'details.advancedCapabilitiesTitle',
            'details.showAdvancedCapabilities',
            'details.advancedCapabilities',
        ],
        ['details.techSpecsTitle', 'details.showTechSpecs', 'details.techSpecs'],
        [
            'details.customerStoriesTitle',
            'details.showCustomerStories',
            'details.customerStories',
        ],
        ['ctaData'],
        ['seoData'],
    ];
    private readonly tabSaveLabels = [
        'Product Details',
        'Page Header',
        'Gallery',
        'Overview',
        'How it Works',
        'Key Features',
        'Advanced Capabilities',
        'Tech Specs',
        'Customer Stories',
        'CTA',
        'SEO',
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
        this.generateCustomerStoryDialogForm();

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
            seoData: this._formBuilder.group({
                pageTitle: ['', [Validators.required, Validators.maxLength(70)]],
                metaDescription: [
                    '',
                    [Validators.required, Validators.maxLength(160)],
                ],
                metaKeywords: ['', [Validators.maxLength(300)]],
            }),
            ctaData: this._formBuilder.group({
                title: ['', [Validators.required, Validators.maxLength(100)]],
                subtitle: ['', [Validators.required, Validators.maxLength(200)]],
                imageSrc: ['', [Validators.required]],
                imageAlt: ['', [Validators.required, Validators.maxLength(200)]],
                cta: this._formBuilder.array(
                    this.createDefaultProductCtaItems().map((cta) =>
                        this.createProductCtaGroup(cta)
                    )
                ),
            }),
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
                howItWorksTitle: [
                    '',
                    [Validators.required, Validators.maxLength(100)],
                ],
                showHowItWorks: [true],
                keyFeatures: this._formBuilder.array(
                    this.createDefaultKeyFeatureItems().map((item) =>
                        this.createKeyFeatureGroup(item)
                    )
                ),
                keyFeaturesTitle: [
                    '',
                    [Validators.required, Validators.maxLength(100)],
                ],
                showKeyFeatures: [true],
                advancedCapabilities: this._formBuilder.array(
                    this.createDefaultAdvancedCapabilityItems().map((item) =>
                        this.createAdvancedCapabilityGroup(item)
                    )
                ),
                advancedCapabilitiesTitle: [
                    '',
                    [Validators.required, Validators.maxLength(100)],
                ],
                showAdvancedCapabilities: [true],
                techSpecs: this._formBuilder.group({
                    rows: this._formBuilder.array(
                        this.createDefaultTechSpecRows().map((row) =>
                            this.createTechSpecRowGroup(row)
                        )
                    ),
                }),
                techSpecsTitle: [
                    '',
                    [Validators.required, Validators.maxLength(100)],
                ],
                showTechSpecs: [true],
                customerStories: this._formBuilder.array([]),
                customerStoriesTitle: [
                    '',
                    [Validators.required, Validators.maxLength(100)],
                ],
                showCustomerStories: [true],
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
        this.replaceCustomerStoryForms(details.customerStories);
        const ctaData = this.normalizeProductCtaData(product.ctaData);
        const seoData = this.normalizeSeoData(product.seoData);
        this.replaceProductCtaForms(ctaData.cta);

        this.entityForm.patchValue({
            title: product.title,
            slug: product.slug,
            short_description: product.short_description,
            image: product.image,
            image_alt: product.image_alt,
            order: product.order ?? 0,
            status: product.status ?? 1,
            seoData,
            ctaData,
            details,
        });

        this.updateHowItWorksSectionState();
        this.updateKeyFeaturesSectionState();
        this.updateAdvancedCapabilitiesSectionState();
        this.updateTechSpecsSectionState();
        this.updateCustomerStoriesSectionState();
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

    get customerStoryForms(): UntypedFormArray {
        return this.entityForm.get('details.customerStories') as UntypedFormArray;
    }

    get productCtaForms(): UntypedFormArray {
        return this.entityForm.get('ctaData.cta') as UntypedFormArray;
    }

    get showCustomerStories(): boolean {
        return !!this.entityForm.get('details.showCustomerStories')?.value;
    }

    onTabChange(index: number): void {
        this.activeTabIndex = index;
    }

    isCurrentTabValid(): boolean {
        return this.isTabValid(this.activeTabIndex);
    }

    isTabValid(tabIndex: number): boolean {
        return this.getTabControls(tabIndex).every(
            (control) => control.disabled || control.valid
        );
    }

    shouldDisableTabInCreateMode(tabIndex: number): boolean {
        return (
            this.mode === 'CREATE' &&
            tabIndex > 0 &&
            !this.isTabValid(0)
        );
    }

    markCurrentTabAsTouched(): void {
        this.getTabControls(this.activeTabIndex).forEach((control) => {
            control.markAllAsTouched();
            control.updateValueAndValidity({ emitEvent: false });
        });
    }

    getCurrentTabSaveButtonLabel(): string {
        if (this.mode === 'CREATE' && this.activeTabIndex === 0) {
            return 'Create Product Details';
        }

        if (this.mode === 'CREATE') {
            return 'Create Product Details First';
        }

        return `Save ${this.tabSaveLabels[this.activeTabIndex] || 'Current'} Tab`;
    }

    saveCurrentTab(): void {
        if (this.entityForm.disabled) {
            return;
        }

        if (this.mode === 'CREATE' && this.activeTabIndex !== 0) {
            this._snackBar.showError(
                'Please create Product Details first before saving other tabs.'
            );
            return;
        }

        if (!this.isCurrentTabValid()) {
            this.markCurrentTabAsTouched();
            this._snackBar.showError(
                'Please complete the required fields in the current tab.'
            );
            return;
        }

        if (this.mode === 'CREATE') {
            this.createProduct();
            return;
        }

        this.updateProduct('Current tab saved successfully');
    }

    addEntity(): void {
        if (this.entityForm.invalid || this.entityForm.disabled) {
            this.entityForm.markAllAsTouched();
            return;
        }

        this.createProduct();
    }

    updateSelectedEntity(): void {
        if (this.entityForm.invalid || this.entityForm.disabled) {
            this.entityForm.markAllAsTouched();
            return;
        }

        this.updateProduct('Product updated successfully');
    }

    private createProduct(): void {
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

    private updateProduct(successMessage: string): void {
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

                    this._snackBar.showSuccess(successMessage);
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
        if (this.galleryForms.length <= 1 || this.entityForm.disabled) {
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
                if (removeAfterDelete && this.galleryForms.length > 1) {
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
                priority: this.techSpecRows.length + 1,
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

    openCustomerStoryDialog(mode: 'add' | 'edit', index?: number): void {
        if (!this.showCustomerStories || this.entityForm.disabled) {
            return;
        }

        this.customerStoryDialogMode = mode;
        this.selectedCustomerStoryIndex = typeof index === 'number' ? index : null;
        this.resetCustomerStoryDialogForm();

        if (mode === 'edit' && this.selectedCustomerStoryIndex !== null) {
            const customerStory = this.mapFormValueToCustomerStory(
                this.customerStoryForms
                    .at(this.selectedCustomerStoryIndex)
                    .getRawValue()
            );
            this.patchCustomerStoryDialogForm(customerStory);
        } else {
            this.customerStoryDialogForm
                ?.get('priority')
                ?.setValue(this.getNextCustomerStoryPriority());
        }

        this.customerStoryDialogRef = this._matDialog.open(
            this.customerStoryDialog,
            {
                width: '860px',
                maxWidth: '96vw',
                disableClose: true,
            }
        );
    }

    closeCustomerStoryDialog(): void {
        if (this.customerStoryDialogForm?.disabled && !this.isUploadingImage) {
            this.customerStoryDialogForm.enable();
        }

        this.customerStoryDialogRef?.close();
        this.customerStoryDialogRef = null;
        this.selectedCustomerStoryIndex = null;
        this.customerStoryImagePreview = '';
    }

    saveCustomerStory(): void {
        if (this.customerStoryDialogForm?.invalid || this.isUploadingImage) {
            this.customerStoryDialogForm?.markAllAsTouched();
            return;
        }

        const customerStoryData = this.mapFormValueToCustomerStory(
            this.customerStoryDialogForm?.getRawValue()
        );
        const nextCustomerStories =
            this.buildNextCustomerStoriesState(customerStoryData);

        this.replaceCustomerStoryForms(nextCustomerStories);
        this.entityForm.get('details.customerStories')?.markAsDirty();
        this.closeCustomerStoryDialog();
    }

    deleteCustomerStory(index: number): void {
        if (!this.showCustomerStories || this.entityForm.disabled) {
            return;
        }

        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Testimonial',
            message:
                'Are you sure you want to delete this testimonial item? This will update the product details when you save.',
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

            const deletedCustomerStory = this.getCurrentCustomerStories()[index];
            const nextCustomerStories = this.getCurrentCustomerStories()
                .filter((_, storyIndex) => storyIndex !== index)
                .map((item, storyIndex) => ({
                    ...item,
                    priority: storyIndex + 1,
                }));

            this.replaceCustomerStoryForms(nextCustomerStories);
            this.entityForm.get('details.customerStories')?.markAsDirty();
            this.deleteCustomerStoryImageFromServer(deletedCustomerStory?.image);
        });
    }

    onCustomerStoryImageSelect(event: Event): void {
        const input = event.target as HTMLInputElement;

        if (!input.files?.length) {
            return;
        }

        this.uploadProductImage(
            input.files[0],
            this.PHOTO_TYPE.TESTIMONIALS,
            'image',
            this.customerStoryDialogForm?.get('image'),
            this.maxIconFileSizeInKb,
            (imagePath) => {
                this.customerStoryImagePreview = this.resolveImageUrl(imagePath);
            }
        );
        input.value = '';
    }

    clearCustomerStoryImage(): void {
        const imagePath = this.customerStoryDialogForm?.get('image')?.value;

        if (this.isPlaceholderCustomerStoryImage(imagePath)) {
            this.usePlaceholderCustomerStoryImage();
            return;
        }

        this.clearProductImage(
            this.PHOTO_TYPE.TESTIMONIALS,
            'image',
            'testimonial image',
            this.customerStoryDialogForm?.get('image'),
            () => {
                this.usePlaceholderCustomerStoryImage();
            }
        );
    }

    usePlaceholderCustomerStoryImage(): void {
        this.customerStoryDialogForm
            ?.get('image')
            ?.setValue(this.placeholderCustomerStoryImagePath);
        this.customerStoryImagePreview = this.resolveImageUrl(
            this.placeholderCustomerStoryImagePath
        );
    }

    onCustomerStoriesVisibilityChange(): void {
        this.updateCustomerStoriesSectionState();
    }

    onProductCtaImageSelect(event: Event): void {
        const input = event.target as HTMLInputElement;

        if (!input.files?.length) {
            return;
        }

        this.uploadProductImage(
            input.files[0],
            this.PHOTO_TYPE.CTA,
            'imageSrc',
            this.entityForm.get('ctaData.imageSrc')
        );
        input.value = '';
    }

    clearProductCtaImage(): void {
        this.clearProductImage(
            this.PHOTO_TYPE.CTA,
            'imageSrc',
            'CTA image',
            this.entityForm.get('ctaData.imageSrc')
        );
    }

    uploadProductImage(
        file: File,
        fileType: string,
        controlName: string,
        targetControl?: AbstractControl | null,
        maxFileSizeInKb = this.maxFileSizeInKb,
        afterUpload?: (imagePath: string) => void
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
                        response.data[0],
                        fileType
                    );
                    const imageControl =
                        targetControl || this.entityForm.get(controlName);

                    imageControl?.setValue(imagePath);
                    imageControl?.markAsDirty();

                    if (!targetControl && controlName === 'image') {
                        this.coverImagePreview = this.resolveImageUrl(imagePath);
                    }

                    afterUpload?.(imagePath);
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

    private getTabControls(tabIndex: number): AbstractControl[] {
        return (this.tabControlPaths[tabIndex] || [])
            .map((controlPath) => this.entityForm.get(controlPath))
            .filter((control): control is AbstractControl => !!control);
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
        this.updateCustomerStoriesSectionState();
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
            ctaData: this.mapProductCtaFormValueToPayload(formValue?.ctaData),
            seoData: JSON.stringify(this.normalizeSeoData(formValue?.seoData)),
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
            howItWorksTitle: parsedDetails?.howItWorksTitle || '',
            showHowItWorks: parsedDetails?.showHowItWorks ?? true,
            keyFeatures: this.normalizeKeyFeatureItems(
                parsedDetails?.keyFeatures
            ),
            keyFeaturesTitle: parsedDetails?.keyFeaturesTitle || '',
            showKeyFeatures: parsedDetails?.showKeyFeatures ?? true,
            advancedCapabilities: this.normalizeAdvancedCapabilityItems(
                parsedDetails?.advancedCapabilities
            ),
            advancedCapabilitiesTitle:
                parsedDetails?.advancedCapabilitiesTitle || '',
            showAdvancedCapabilities:
                parsedDetails?.showAdvancedCapabilities ?? true,
            techSpecs: this.normalizeTechSpecs(parsedDetails?.techSpecs),
            techSpecsTitle: parsedDetails?.techSpecsTitle || '',
            showTechSpecs: parsedDetails?.showTechSpecs ?? true,
            customerStories: this.normalizeCustomerStories(
                parsedDetails?.customerStories
            ),
            customerStoriesTitle: parsedDetails?.customerStoriesTitle || '',
            showCustomerStories: parsedDetails?.showCustomerStories ?? true,
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
            priority: [
                Number(item?.priority) || 1,
                [Validators.required, Validators.min(1)],
            ],
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
            priority: [
                Number(row?.priority) || 1,
                [Validators.required, Validators.min(1)],
            ],
        });
    }

    private createProductCtaGroup(cta: any): UntypedFormGroup {
        const style = cta?.style === 'secondary' ? 'secondary' : 'primary';
        const isPrimary = style === 'primary';

        return this._formBuilder.group(
            {
                label: [
                    cta?.label || '',
                    [
                        ...(isPrimary ? [Validators.required] : []),
                        Validators.maxLength(120),
                    ],
                ],
                link: [
                    cta?.link || '',
                    [
                        ...(isPrimary ? [Validators.required] : []),
                        Validators.maxLength(255),
                    ],
                ],
                style: [style, [Validators.required]],
                target: [
                    cta?.target === '_blank' ? '_blank' : '_self',
                    [Validators.required],
                ],
            },
            {
                validators: isPrimary ? [] : [this.optionalProductCtaValidator],
            }
        );
    }

    private createCustomerStoryGroup(customerStory: any): UntypedFormGroup {
        return this._formBuilder.group({
            priority: [
                Number(customerStory?.priority) || 1,
                [Validators.required, Validators.min(1)],
            ],
            name: [customerStory?.name || '', [Validators.required]],
            role: [customerStory?.role || '', [Validators.required]],
            image: [
                customerStory?.image || this.placeholderCustomerStoryImagePath,
            ],
            message: [customerStory?.message || '', [Validators.required]],
        });
    }

    private createDefaultGalleryItems(): any[] {
        return [1].map((priority) => ({
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
                priority: 1,
            },
        ];
    }

    private createDefaultProductCtaItems(): any[] {
        return [
            this.createDefaultProductCtaItem('primary'),
            this.createDefaultProductCtaItem('secondary'),
        ];
    }

    private createDefaultProductCtaItem(style: 'primary' | 'secondary'): any {
        return {
            label: '',
            link: '',
            style,
            target: style === 'primary' ? '_self' : '_blank',
        };
    }

    private generateCustomerStoryDialogForm(): void {
        this.customerStoryDialogForm = this._formBuilder.group({
            priority: [1, [Validators.required, Validators.min(1)]],
            name: ['', [Validators.required, Validators.maxLength(150)]],
            role: ['', [Validators.required, Validators.maxLength(150)]],
            image: [this.placeholderCustomerStoryImagePath],
            message: ['', [Validators.required, Validators.maxLength(320)]],
        });

        this.resetCustomerStoryDialogForm();
    }

    private resetCustomerStoryDialogForm(): void {
        const emptyCustomerStory = this.createEmptyCustomerStory();
        this.customerStoryDialogForm?.reset(emptyCustomerStory);
        this.customerStoryImagePreview = this.resolveImageUrl(
            emptyCustomerStory.image
        );
    }

    private patchCustomerStoryDialogForm(customerStory: any): void {
        this.customerStoryDialogForm?.patchValue(customerStory);
        this.customerStoryImagePreview = this.resolveImageUrl(
            customerStory.image
        );
    }

    private createEmptyCustomerStory(): any {
        return {
            priority: 1,
            name: '',
            role: '',
            image: this.placeholderCustomerStoryImagePath,
            message: '',
        };
    }

    private mapFormValueToCustomerStory(formValue: any): any {
        return {
            priority:
                formValue?.priority === 0 || formValue?.priority
                    ? Number(formValue.priority)
                    : null,
            name: formValue?.name || '',
            role: formValue?.role || '',
            image: formValue?.image || this.placeholderCustomerStoryImagePath,
            message: formValue?.message || '',
        };
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

        while (normalizedItems.length < 1) {
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

    private normalizeProductCtaData(payload: any): any {
        const parsedPayload = this.parseJsonField(payload);
        const ctaSection =
            parsedPayload?.content?.title || parsedPayload?.image || parsedPayload?.cta
                ? parsedPayload
                : parsedPayload?.content || {};
        const ctas = Array.isArray(ctaSection?.cta)
            ? ctaSection.cta.slice(0, 2)
            : [];

        while (ctas.length < 2) {
            ctas.push(
                this.createDefaultProductCtaItem(
                    ctas.length === 0 ? 'primary' : 'secondary'
                )
            );
        }

        return {
            title: ctaSection?.content?.title || ctaSection?.title || '',
            subtitle: ctaSection?.content?.subtitle || ctaSection?.subtitle || '',
            imageSrc: ctaSection?.image?.src || ctaSection?.imageSrc || '',
            imageAlt: ctaSection?.image?.alt || ctaSection?.imageAlt || '',
            cta: [
                this.normalizeProductCtaItem(ctas[0], 0),
                this.normalizeProductCtaItem(ctas[1], 1),
            ],
        };
    }

    private normalizeSeoData(seoData: any): any {
        const parsedSeoData = this.parseJsonField(seoData);

        return {
            pageTitle:
                parsedSeoData?.pageTitle ||
                parsedSeoData?.title ||
                parsedSeoData?.metaTitle ||
                '',
            metaDescription:
                parsedSeoData?.metaDescription ||
                parsedSeoData?.description ||
                '',
            metaKeywords:
                parsedSeoData?.metaKeywords || parsedSeoData?.keywords || '',
        };
    }

    private normalizeProductCtaItem(cta: any, index: number): any {
        return {
            label: String(cta?.label || '').trim(),
            link: String(cta?.link || '').trim(),
            style: index === 0 ? 'primary' : 'secondary',
            target: cta?.target === '_blank' ? '_blank' : '_self',
        };
    }

    private mapProductCtaFormValueToPayload(formValue: any): any {
        const ctas = Array.isArray(formValue?.cta)
            ? formValue.cta.slice(0, 2)
            : [];

        while (ctas.length < 2) {
            ctas.push(
                this.createDefaultProductCtaItem(
                    ctas.length === 0 ? 'primary' : 'secondary'
                )
            );
        }

        const primaryCta = this.normalizeProductCtaItem(ctas[0], 0);
        const secondaryCta = this.normalizeProductCtaItem(ctas[1], 1);
        const normalizedCtas = [primaryCta];

        if (this.hasProductCtaContent(secondaryCta)) {
            normalizedCtas.push(secondaryCta);
        }

        return {
            content: {
                title: formValue?.title || '',
                subtitle: formValue?.subtitle || '',
            },
            image: {
                src: formValue?.imageSrc || '',
                alt: formValue?.imageAlt || '',
            },
            cta: normalizedCtas,
        };
    }

    private optionalProductCtaValidator = (
        control: AbstractControl
    ): ValidationErrors | null => {
        const label = String(control.get('label')?.value || '').trim();
        const link = String(control.get('link')?.value || '').trim();

        if ((label && !link) || (!label && link)) {
            return { ctaIncomplete: true };
        }

        return null;
    };

    private hasProductCtaContent(cta: any): boolean {
        return !!String(cta?.label || '').trim() && !!String(cta?.link || '').trim();
    }

    private normalizeTechSpecRows(techSpecs: any): any[] {
        const rows = Array.isArray(techSpecs?.rows)
            ? techSpecs.rows
            : Array.isArray(techSpecs)
              ? techSpecs
              : [];

        const normalizedRows = rows
            .map((row, index) => ({
                heading: row?.heading || row?.title || '',
                content: row?.content || row?.description || '',
                priority: Number(row?.priority) || index + 1,
            }))
            .sort((leftRow, rightRow) => leftRow.priority - rightRow.priority);

        if (!normalizedRows.length && (techSpecs?.content || techSpecs?.description)) {
            normalizedRows.push({
                heading: '',
                content: this.normalizeRichTextContent(
                    techSpecs?.content || techSpecs?.description
                ),
                priority: 1,
            });
        }

        if (!normalizedRows.length) {
            normalizedRows.push({
                heading: '',
                content: '',
                priority: 1,
            });
        }

        return normalizedRows.map((row, index) => ({
            ...row,
            priority: index + 1,
        }));
    }

    private normalizeCustomerStories(customerStories: any): any[] {
        const storyItems = Array.isArray(customerStories?.testimonials)
            ? customerStories.testimonials
            : Array.isArray(customerStories)
              ? customerStories
              : [];

        return this.sortCustomerStoriesByPriority(storyItems)
            .map((item, index) => ({
                priority: Number(item?.priority) || index + 1,
                name: item?.name || '',
                role: item?.role || '',
                image: item?.image || this.placeholderCustomerStoryImagePath,
                message: item?.message || '',
            }))
            .map((item, index) => ({
                ...item,
                priority: index + 1,
            }));
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
            }))
            .sort((leftItem, rightItem) => leftItem.priority - rightItem.priority);

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

    private replaceCustomerStoryForms(customerStories: any[]): void {
        while (this.customerStoryForms.length) {
            this.customerStoryForms.removeAt(0);
        }

        this.normalizeCustomerStories(customerStories).forEach((customerStory) => {
            this.customerStoryForms.push(
                this.createCustomerStoryGroup(customerStory)
            );
        });
    }

    private replaceProductCtaForms(ctas: any[]): void {
        while (this.productCtaForms.length) {
            this.productCtaForms.removeAt(0);
        }

        const normalizedCtaData = this.normalizeProductCtaData({ cta: ctas });
        normalizedCtaData.cta.forEach((cta) => {
            this.productCtaForms.push(this.createProductCtaGroup(cta));
        });
    }

    private getCurrentCustomerStories(): any[] {
        return this.customerStoryForms.controls.map((control) =>
            this.mapFormValueToCustomerStory(control.getRawValue())
        );
    }

    private buildNextCustomerStoriesState(customerStory: any): any[] {
        const customerStories = this.getCurrentCustomerStories();

        if (
            this.customerStoryDialogMode === 'edit' &&
            this.selectedCustomerStoryIndex !== null
        ) {
            customerStories.splice(this.selectedCustomerStoryIndex, 1);
        }

        const targetPriority = Math.min(
            Math.max(Number(customerStory.priority) || 1, 1),
            customerStories.length + 1
        );

        customerStories.splice(targetPriority - 1, 0, {
            ...customerStory,
            priority: targetPriority,
        });

        return customerStories.map((item, index) => ({
            ...item,
            priority: index + 1,
        }));
    }

    private updateHowItWorksSectionState(): void {
        const showSection = this.entityForm.get('details.showHowItWorks')?.value;
        const titleControl = this.entityForm.get('details.howItWorksTitle');

        if (showSection) {
            titleControl?.enable({ emitEvent: false });
            this.howItWorksForms.enable({ emitEvent: false });
            return;
        }

        titleControl?.disable({ emitEvent: false });
        this.howItWorksForms.disable({ emitEvent: false });
    }

    private updateKeyFeaturesSectionState(): void {
        const showSection = this.entityForm.get('details.showKeyFeatures')?.value;
        const titleControl = this.entityForm.get('details.keyFeaturesTitle');

        if (showSection) {
            titleControl?.enable({ emitEvent: false });
            this.keyFeatureForms.enable({ emitEvent: false });
            return;
        }

        titleControl?.disable({ emitEvent: false });
        this.keyFeatureForms.disable({ emitEvent: false });
    }

    private updateAdvancedCapabilitiesSectionState(): void {
        const showSection = this.entityForm.get(
            'details.showAdvancedCapabilities'
        )?.value;
        const titleControl = this.entityForm.get(
            'details.advancedCapabilitiesTitle'
        );

        if (showSection) {
            titleControl?.enable({ emitEvent: false });
            this.advancedCapabilityForms.enable({ emitEvent: false });
            return;
        }

        titleControl?.disable({ emitEvent: false });
        this.advancedCapabilityForms.disable({ emitEvent: false });
    }

    private updateTechSpecsSectionState(): void {
        const techSpecsGroup = this.entityForm.get('details.techSpecs');
        const showSection = this.entityForm.get('details.showTechSpecs')?.value;
        const titleControl = this.entityForm.get('details.techSpecsTitle');

        if (showSection) {
            titleControl?.enable({ emitEvent: false });
            techSpecsGroup?.enable({ emitEvent: false });
            return;
        }

        titleControl?.disable({ emitEvent: false });
        techSpecsGroup?.disable({ emitEvent: false });
    }

    private updateCustomerStoriesSectionState(): void {
        const showSection = this.entityForm.get(
            'details.showCustomerStories'
        )?.value;
        const titleControl = this.entityForm.get('details.customerStoriesTitle');

        if (showSection) {
            titleControl?.enable({ emitEvent: false });
            this.customerStoryForms.enable({ emitEvent: false });
            return;
        }

        titleControl?.disable({ emitEvent: false });
        this.customerStoryForms.disable({ emitEvent: false });
    }

    private syncAdvancedCapabilityPriorities(): void {
        this.advancedCapabilityForms.controls.forEach((control, index) => {
            control.get('priority')?.setValue(index + 1, {
                emitEvent: false,
            });
        });
    }

    private sortCustomerStoriesByPriority(customerStories: any[]): any[] {
        return [...customerStories].sort((leftStory, rightStory) => {
            const leftPriority =
                leftStory?.priority === 0 || leftStory?.priority
                    ? Number(leftStory.priority)
                    : Number.MAX_SAFE_INTEGER;
            const rightPriority =
                rightStory?.priority === 0 || rightStory?.priority
                    ? Number(rightStory.priority)
                    : Number.MAX_SAFE_INTEGER;

            return leftPriority - rightPriority;
        });
    }

    private getNextCustomerStoryPriority(): number {
        const priorities = this.customerStoryForms.controls
            .map((control) => Number(control.get('priority')?.value))
            .filter((priority) => Number.isFinite(priority) && priority > 0);

        if (!priorities.length) {
            return 1;
        }

        return Math.max(...priorities) + 1;
    }

    private isPlaceholderCustomerStoryImage(imagePath: string): boolean {
        if (!imagePath) {
            return false;
        }

        return (
            imagePath.replace(/^\/+/, '') === this.placeholderCustomerStoryImagePath
        );
    }

    private deleteCustomerStoryImageFromServer(imagePath: string): void {
        if (this.isPlaceholderCustomerStoryImage(imagePath)) {
            return;
        }

        const fileName = this.extractFileName(imagePath);

        if (!fileName) {
            return;
        }

        this._productsService
            .deletePhoto(fileName, this.PHOTO_TYPE.TESTIMONIALS)
            .subscribe(
                (response) => {
                    if (!response) {
                        this._snackBar.showError(
                            'Testimonial was removed, but the image could not be deleted from the server.'
                        );
                    }
                },
                () => {
                    this._snackBar.showError(
                        'Testimonial was removed, but a server error occurred while deleting the image.'
                    );
                }
            );
    }

    private syncGalleryPriorities(): void {
        this.galleryForms.controls.forEach((control, index) => {
            control.get('priority')?.setValue(index + 1, {
                emitEvent: false,
            });
        });
    }

    private normalizeUploadedImagePath(
        imageNameOrPath: string,
        fileType = this.PHOTO_TYPE.COVER
    ): string {
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

        if (fileType === this.PHOTO_TYPE.TESTIMONIALS) {
            return `assets/images/testimonial/${imageNameOrPath}`;
        }

        if (fileType === this.PHOTO_TYPE.CTA) {
            return `assets/images/bg/${imageNameOrPath}`;
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
