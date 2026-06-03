import { CommonModule } from '@angular/common';
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
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FILE_UPLOAD } from 'app/constants/upload';
import { SnackBarService } from 'app/core/general/snackbar.service';
import { PipesModule } from 'app/pipes/pipes.module';
import { environment } from 'environments/environment';
import { QuillModule } from 'ngx-quill';
import { HomeService } from '../home.service';
import { ITestimonialItem, ITestimonialsRecord } from '../home.types';

@Component({
    selector: 'app-home-testimonials',
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
        QuillModule,
    ],
    templateUrl: './testimonials.component.html',
})
export class TestimonialsComponent implements OnInit {
    @ViewChild('TestimonialDialog') testimonialDialog: TemplateRef<any> | undefined;

    entityForm: UntypedFormGroup | undefined;
    testimonialDialogForm: UntypedFormGroup | undefined;
    testimonialDialogRef = null;
    selectedTestimonialIndex: number | null = null;
    testimonialDialogMode: 'add' | 'edit' = 'add';
    testimonialImagePreview = '';
    testimonialsRecordId = '';
    testimonialsPageId = '1';
    testimonialsSectionKey = 'testimonials';
    isLoading = false;
    isSaving = false;
    isUploadingTestimonialImage = false;

    public readonly baseURL = environment.apiBaseUrl;
    public readonly maxFileSizeInKb = FILE_UPLOAD.MAX_ICON_FILE_SIZE_IN_KB;
    public readonly placeholderImagePath = 'assets/images/home/testimonials/avatar.png';
    readonly PHOTO_TYPE = {
        TESTIMONIALS: 'TESTIMONIALS',
    };

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _matDialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService,
        private _snackBar: SnackBarService,
        private _homeService: HomeService
    ) {}

    // Builds both forms and loads the current testimonials JSON when the page opens.
    ngOnInit(): void {
        this.generateFormGroup();
        this.generateTestimonialDialogForm();
        this.loadTestimonials();
    }

    // Exposes the page-level testimonials list form array to the template.
    get testimonials(): UntypedFormArray {
        return this.entityForm?.get('testimonials') as UntypedFormArray;
    }

    // Opens the modal in add or edit mode and pre-fills values when editing.
    openTestimonialDialog(mode: 'add' | 'edit', index?: number): void {
        this.testimonialDialogMode = mode;
        this.selectedTestimonialIndex = typeof index === 'number' ? index : null;
        this.resetTestimonialDialogForm();

        if (mode === 'edit' && this.selectedTestimonialIndex !== null) {
            const testimonial = this.mapFormValueToTestimonial(
                this.testimonials.at(this.selectedTestimonialIndex).getRawValue()
            );
            this.patchTestimonialDialogForm(testimonial);
        } else if (mode === 'add') {
            this.testimonialDialogForm
                ?.get('priority')
                ?.setValue(this.getNextTestimonialPriority());
        }

        this.testimonialDialogRef = this._matDialog.open(this.testimonialDialog, {
            width: '860px',
            maxWidth: '96vw',
            disableClose: true,
        });
    }

    // Closes the modal and clears temporary dialog-only UI state.
    closeTestimonialDialog(): void {
        if (
            this.testimonialDialogForm?.disabled &&
            !this.isUploadingTestimonialImage &&
            !this.isSaving
        ) {
            this.testimonialDialogForm.enable();
        }

        this.testimonialDialogRef?.close();
        this.testimonialDialogRef = null;
        this.selectedTestimonialIndex = null;
        this.testimonialImagePreview = '';
        this.isUploadingTestimonialImage = false;
    }

    // Saves one testimonial change by rebuilding and persisting the full testimonials collection.
    saveTestimonial(): void {
        if (
            this.testimonialDialogForm?.invalid ||
            this.isUploadingTestimonialImage ||
            this.isSaving
        ) {
            this.testimonialDialogForm?.markAllAsTouched();
            return;
        }

        const testimonialData = this.mapFormValueToTestimonial(
            this.testimonialDialogForm?.getRawValue()
        );
        const nextTestimonials = this.buildNextTestimonialsState(testimonialData);

        this.persistTestimonialsCollection(
            nextTestimonials,
            this.testimonialDialogMode === 'add'
                ? 'Testimonial added successfully'
                : 'Testimonial updated successfully',
            this.testimonialDialogMode === 'add'
                ? 'Failed to add testimonial.'
                : 'Failed to update testimonial.',
            this.testimonialDialogMode === 'add'
                ? 'Oh no! Server error occurred while adding testimonial'
                : 'Oh no! Server error occurred while updating testimonial',
            () => {
                this.closeTestimonialDialog();
            }
        );
    }

    // Deletes one testimonial after confirmation and persists the remaining collection.
    deleteTestimonial(index: number): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Testimonial',
            message:
                'Are you sure you want to delete this testimonial item? This will update the stored testimonials JSON.',
            actions: {
                confirm: {
                    label: 'Delete',
                },
            },
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                const deletedTestimonial = this.getCurrentTestimonials()[index];
                const nextTestimonials = this.getCurrentTestimonials().filter(
                    (_, testimonialIndex) => testimonialIndex !== index
                );
                this.persistTestimonialsCollection(
                    nextTestimonials,
                    'Testimonial deleted successfully',
                    'Failed to delete testimonial.',
                    'Oh no! Server error occurred while deleting testimonial',
                    () => {
                        this.deleteTestimonialImageFromServer(deletedTestimonial?.image);
                    }
                );
            }
        });
    }

    // Uploads the selected image file and patches the returned path into the modal form.
    onTestimonialImageSelect(event: Event): void {
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
        formData.append(`${this.PHOTO_TYPE.TESTIMONIALS}[0]`, selectedFile);
        formData.append('fieldType', this.PHOTO_TYPE.TESTIMONIALS);

        this.isUploadingTestimonialImage = true;
        this.testimonialDialogForm?.disable();

        this._homeService.uploadFiles(formData).subscribe(
            (response: any) => {
                this.isUploadingTestimonialImage = false;
                this.testimonialDialogForm?.enable();

                if (response?.status && response?.data?.[0]) {
                    const normalizedPath = this.normalizeUploadedImagePath(
                        response.data[0]
                    );
                    this.testimonialDialogForm?.get('image')?.setValue(normalizedPath);
                    this.testimonialImagePreview = this.resolveImageUrl(normalizedPath);
                    this._snackBar.showSuccess(
                        'Testimonial image uploaded successfully'
                    );
                } else {
                    this._snackBar.showError('Failed to upload testimonial image');
                }

                input.value = '';
            },
            () => {
                this.isUploadingTestimonialImage = false;
                this.testimonialDialogForm?.enable();
                this._snackBar.showError(
                    'Oh no! Server error occurred while uploading the testimonial image'
                );
                input.value = '';
            }
        );
    }

    // Deletes the currently selected image from the server after confirmation.
    clearTestimonialImage(): void {
        const imagePath = this.testimonialDialogForm?.get('image')?.value;

        if (this.isPlaceholderImage(imagePath)) {
            this.usePlaceholderImage();
            return;
        }

        const fileName = this.extractFileName(imagePath);

        if (!fileName) {
            this.usePlaceholderImage();
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
                this.testimonialDialogForm?.disable();

                this._homeService.deletePhoto(fileName, this.PHOTO_TYPE.TESTIMONIALS).subscribe(
                    (response) => {
                        if (response) {
                            this.usePlaceholderImage();
                            this._snackBar.showSuccess(
                                'Testimonial image deleted successfully'
                            );
                        } else {
                            this._snackBar.showError('Failed to delete testimonial image');
                        }
                    },
                    () => {
                        this._snackBar.showError(
                            'Oh no! Server error occurred while deleting the testimonial image'
                        );
                    },
                    () => {
                        if (!this.isUploadingTestimonialImage && !this.isSaving) {
                            this.testimonialDialogForm?.enable();
                        }
                    }
                );
            }
        });
    }

    // Switches the testimonial to the shared default placeholder image.
    usePlaceholderImage(): void {
        this.testimonialDialogForm?.get('image')?.setValue(this.placeholderImagePath);
        this.testimonialImagePreview = this.resolveImageUrl(this.placeholderImagePath);
    }

    // Converts a stored image path into a browser-ready preview URL.
    resolveImageUrl(imagePath: string): string {
        if (!imagePath) {
            return `${this.baseURL}/${this.placeholderImagePath}`;
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

    // Creates the page-level form that stores the list of testimonials shown on screen.
    private generateFormGroup(): void {
        this.entityForm = this._formBuilder.group({
            testimonials: this._formBuilder.array([]),
        });
    }

    // Creates the modal form used to add or edit one testimonial item at a time.
    private generateTestimonialDialogForm(): void {
        this.testimonialDialogForm = this._formBuilder.group({
            priority: [1, [Validators.required, Validators.min(1)]],
            name: ['', [Validators.required, Validators.maxLength(150)]],
            role: ['', [Validators.required, Validators.maxLength(150)]],
            image: [''],
            message: ['', [Validators.required, Validators.maxLength(320)]],
        });

        this.resetTestimonialDialogForm();
    }

    // Resets the modal form back to a clean default testimonial structure.
    private resetTestimonialDialogForm(): void {
        const emptyTestimonial = this.createEmptyTestimonial();
        this.testimonialDialogForm?.reset(emptyTestimonial);
        this.testimonialImagePreview = this.resolveImageUrl('');
    }

    // Prefills the modal form with the values from an existing testimonial item.
    private patchTestimonialDialogForm(testimonial: ITestimonialItem): void {
        this.testimonialDialogForm?.patchValue(testimonial);
        this.testimonialImagePreview = this.resolveImageUrl(testimonial.image);
    }

    // Returns the default testimonial object used for a brand-new modal state.
    private createEmptyTestimonial(): ITestimonialItem {
        return {
            priority: 1,
            name: '',
            role: '',
            image: this.placeholderImagePath,
            message: '',
        };
    }

    // Converts one testimonial object into the reactive form shape used on the page.
    private createTestimonialGroup(testimonial: ITestimonialItem): UntypedFormGroup {
        return this._formBuilder.group({
            priority: [testimonial.priority, [Validators.required, Validators.min(1)]],
            name: [testimonial.name, [Validators.required]],
            role: [testimonial.role, [Validators.required]],
            image: [testimonial.image],
            message: [testimonial.message, [Validators.required]],
        });
    }

    // Rebuilds the API testimonial structure from the flat form values.
    private mapFormValueToTestimonial(formValue: any): ITestimonialItem {
        return {
            priority:
                formValue?.priority === 0 || formValue?.priority
                    ? Number(formValue.priority)
                    : null,
            name: formValue?.name || '',
            role: formValue?.role || '',
            image: formValue?.image || '',
            message: formValue?.message || '',
        };
    }

    // Replaces all items inside a form array with a fresh set of controls.
    private replaceFormArray(
        targetArray: UntypedFormArray,
        controls: UntypedFormGroup[]
    ): void {
        while (targetArray.length) {
            targetArray.removeAt(0);
        }

        controls.forEach((control) => targetArray.push(control));
    }

    // Loads the stored testimonials row and maps its JSON content into the page form.
    private loadTestimonials(): void {
        this.isLoading = true;

        this._homeService.getTestimonials().subscribe(
            (response: any) => {
                if (response?.status) {
                    const record = this.extractTestimonialsRecord(response);
                    this.testimonialsRecordId = record.id || '';
                    this.testimonialsPageId = record.pageId || '1';
                    this.testimonialsSectionKey = record.section || 'testimonials';
                    this.replaceFormArray(
                        this.testimonials,
                        record.content.map((testimonial) =>
                            this.createTestimonialGroup(testimonial)
                        )
                    );
                } else {
                    this.replaceFormArray(this.testimonials, []);
                    this._snackBar.showError('Failed to fetch testimonials.');
                }
            },
            () => {
                this.replaceFormArray(this.testimonials, []);
                this._snackBar.showError(
                    'Oh no! Server error occurred while fetching testimonials'
                );
            },
            () => {
                this.isLoading = false;
            }
        );
    }

    // Extracts the row metadata and testimonials content array from the API response.
    private extractTestimonialsRecord(response: any): ITestimonialsRecord {
        const data = response?.data || {};
        const content = Array.isArray(data?.content) ? data.content : [];

        return {
            id: data?.id ? String(data.id) : '',
            pageId: data?.pageId ? String(data.pageId) : '1',
            section: data?.section || 'testimonials',
            content: this.sortTestimonialsByPriority(content)
                .map((item) => this.normalizeTestimonialItem(item))
                .filter(Boolean),
        };
    }

    // Normalizes one raw testimonial item so the UI always works with a complete safe structure.
    private normalizeTestimonialItem(item: any): ITestimonialItem {
        return {
            priority:
                item?.priority === 0 || item?.priority
                    ? Number(item.priority)
                    : null,
            name: item?.name || '',
            role: item?.role || '',
            image: item?.image || '',
            message: item?.message || '',
        };
    }

    // Converts the uploaded file name into the stored testimonial image path format.
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

        return `assets/images/testimonial/${imageNameOrPath}`;
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

    // Reads the current testimonials list from the page form and converts it back to API shape.
    private getCurrentTestimonials(): ITestimonialItem[] {
        return this.testimonials.controls.map((control) =>
            this.mapFormValueToTestimonial(control.getRawValue())
        );
    }

    // Inserts the new or updated testimonial into the requested priority position and shifts others accordingly.
    private buildNextTestimonialsState(testimonial: ITestimonialItem): ITestimonialItem[] {
        const testimonials = this.getCurrentTestimonials();

        if (
            this.testimonialDialogMode === 'edit' &&
            this.selectedTestimonialIndex !== null
        ) {
            testimonials.splice(this.selectedTestimonialIndex, 1);
        }

        const targetPriority = Math.min(
            Math.max(Number(testimonial.priority) || 1, 1),
            testimonials.length + 1
        );

        testimonials.splice(targetPriority - 1, 0, {
            ...testimonial,
            priority: targetPriority,
        });

        return testimonials.map((item, index) => ({
            ...item,
            priority: index + 1,
        }));
    }

    // Wraps the full testimonials array with record metadata before sending it to the backend.
    private buildTestimonialsPayload(content: ITestimonialItem[]): ITestimonialsRecord {
        return {
            id: this.testimonialsRecordId || undefined,
            pageId: this.testimonialsPageId || '1',
            section: this.testimonialsSectionKey || 'testimonials',
            content: content.map((item, index) => ({
                ...item,
                priority: index + 1,
            })),
        };
    }

    // Persists the full testimonials collection for add, update, and delete flows.
    private persistTestimonialsCollection(
        testimonials: ITestimonialItem[],
        successMessage: string,
        failureMessage: string,
        serverErrorMessage: string,
        onSuccess?: () => void
    ): void {
        if (!this.testimonialsRecordId) {
            this._snackBar.showError(
                'Testimonials record was not loaded, so update cannot be completed.'
            );
            return;
        }

        const payload = this.buildTestimonialsPayload(testimonials);
        this.isSaving = true;

        if (this.testimonialDialogRef) {
            this.testimonialDialogForm?.disable();
        }

        this._homeService.updateTestimonials(payload).subscribe(
            (response: any) => {
                if (response?.status) {
                    this._snackBar.showSuccess(successMessage);
                    onSuccess?.();
                    this.loadTestimonials();
                } else {
                    this._snackBar.showError(failureMessage);
                }
            },
            () => {
                this._snackBar.showError(serverErrorMessage);
            },
            () => {
                this.isSaving = false;
                if (this.testimonialDialogForm?.disabled) {
                    this.testimonialDialogForm.enable();
                }
            }
        );
    }

    // Deletes the removed testimonial image from the server after the testimonials JSON update succeeds.
    private deleteTestimonialImageFromServer(imagePath: string): void {
        if (this.isPlaceholderImage(imagePath)) {
            return;
        }

        const fileName = this.extractFileName(imagePath);

        if (!fileName) {
            return;
        }

        this._homeService.deletePhoto(fileName, this.PHOTO_TYPE.TESTIMONIALS).subscribe(
            (response) => {
                if (!response) {
                    this._snackBar.showError(
                        'Testimonial was deleted, but the image could not be removed from the server.'
                    );
                }
            },
            () => {
                this._snackBar.showError(
                    'Testimonial was deleted, but a server error occurred while deleting the image.'
                );
            }
        );
    }

    // Sorts testimonials by ascending priority while keeping empty priorities at the end.
    private sortTestimonialsByPriority(testimonials: any[]): any[] {
        return [...testimonials].sort((leftTestimonial, rightTestimonial) => {
            const leftPriority =
                leftTestimonial?.priority === 0 || leftTestimonial?.priority
                    ? Number(leftTestimonial.priority)
                    : Number.MAX_SAFE_INTEGER;
            const rightPriority =
                rightTestimonial?.priority === 0 || rightTestimonial?.priority
                    ? Number(rightTestimonial.priority)
                    : Number.MAX_SAFE_INTEGER;

            return leftPriority - rightPriority;
        });
    }

    // Returns the next priority number for a newly added testimonial.
    private getNextTestimonialPriority(): number {
        const priorities = this.testimonials.controls
            .map((control) => Number(control.get('priority')?.value))
            .filter((priority) => Number.isFinite(priority) && priority > 0);

        if (!priorities.length) {
            return 1;
        }

        return Math.max(...priorities) + 1;
    }

    // Checks whether the current testimonial image is the shared default placeholder.
    private isPlaceholderImage(imagePath: string): boolean {
        if (!imagePath) {
            return false;
        }

        const normalizedPath = imagePath.replace(/^\/+/, '');
        return normalizedPath === this.placeholderImagePath;
    }
}
