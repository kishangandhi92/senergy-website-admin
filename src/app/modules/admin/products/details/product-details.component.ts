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
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
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

    mode!: string; // Holds the mode ('CREATE' or 'EDIT')
    id!: string | null; // Holds the id (if present)
    entityForm: UntypedFormGroup;
    subscription: Subscription = null;
    productTitle: string = '';
    coverImagePreview = '';
    isUploadingImage = false;
    isDeletingImage = false;
    backLink = '';
    public readonly baseURL = environment.apiBaseUrl;
    public readonly maxFileSizeInMb = FILE_UPLOAD.MAX_FILE_SIZE_IN_MB;
    public readonly maxFileSizeInKb = FILE_UPLOAD.MAX_FILE_SIZE_IN_KB;
    public readonly PHOTO_TYPE = {
        COVER: 'COVER',
        GALLERY: 'gallery',
        HOW_IT_WORKS: 'how-it-works',
        KEY_FEATURES: 'key-features',
    };

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
        this.entityForm.patchValue({
            title: product.title,
            slug: product.slug,
            short_description: product.short_description,
            image: product.image,
            image_alt: product.image_alt,
            order: product.order ?? 0,
            status: product.status ?? 1,
            details: this.normalizeDetails(product.details),
        });

        this.productTitle = product.title;
        this.coverImagePreview = this.resolveImageUrl(product.image);
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

    uploadProductImage(
        file: File,
        fieldType: string,
        controlName: string
    ): void {
        const maxFileSize = this.maxFileSizeInKb * 1024;

        if (file.size > maxFileSize) {
            this._snackBar.showError(
                `The selected image size exceeds the ${this.maxFileSizeInKb} KB limit.`
            );
            return;
        }

        const formData = new FormData();
        formData.append(`${fieldType}[0]`, file);
        formData.append('fieldType', fieldType);

        this.isUploadingImage = true;
        this.entityForm.disable();

        this._productsService.uploadFiles(formData).subscribe(
            (response: any) => {
                if (response?.status && response?.data?.[0]) {
                    const imagePath = this.normalizeUploadedImagePath(
                        response.data[0]
                    );
                    this.entityForm.get(controlName)?.setValue(imagePath);
                    this.entityForm.get(controlName)?.markAsDirty();

                    if (controlName === 'image') {
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
        fieldType: string,
        controlName: string,
        label = 'image'
    ): void {
        const imagePath = this.entityForm.get(controlName)?.value;
        const fileName = this.extractFileName(imagePath);

        if (!fileName) {
            this.clearImageControl(controlName);
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

            this._productsService.deletePhoto(fileName, fieldType).subscribe(
                (response) => {
                    if (response) {
                        this.clearImageControl(controlName);
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

    private clearImageControl(controlName: string): void {
        this.entityForm.get(controlName)?.setValue('');
        this.entityForm.get(controlName)?.markAsDirty();

        if (controlName === 'image') {
            this.coverImagePreview = '';
        }
    }

    private enableEntityForm(): void {
        if (this.isUploadingImage || this.isDeletingImage) {
            return;
        }

        this.entityForm.enable({ emitEvent: false });
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
