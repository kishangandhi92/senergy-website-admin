import { CdkScrollable } from '@angular/cdk/scrolling';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FILE_UPLOAD } from 'app/constants/upload';
import { SnackBarService } from 'app/core/general/snackbar.service';
import { environment } from 'environments/environment';
import { AboutUsPageService } from '../about-us-page.service';
import {
    ITeamGalleryItem,
    ITeamGalleryRecord,
    ITeamGallerySection,
} from '../about-us-page.types';

@Component({
    selector: 'app-about-us-page-team-gallery',
    standalone: true,
    imports: [
        CommonModule,
        CdkScrollable,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
    ],
    templateUrl: './team-gallery.component.html',
})
export class TeamGalleryComponent implements OnInit {
    @ViewChild('GalleryItemDialog') galleryItemDialog: TemplateRef<any> | undefined;

    entityForm: UntypedFormGroup | undefined;
    galleryItemDialogForm: UntypedFormGroup | undefined;
    galleryItemDialogRef = null;
    selectedGalleryIndex: number | null = null;
    galleryDialogMode: 'add' | 'edit' = 'add';
    teamGalleryRecord: ITeamGalleryRecord | null = null;
    isLoading = false;
    isSaving = false;
    isUploadingPhoto = false;

    public readonly baseURL = environment.apiBaseUrl;
    public readonly maxFileSizeInMb = FILE_UPLOAD.MAX_FILE_SIZE_IN_MB;
    public readonly maxGalleryItems = 20;
    readonly PHOTO_TYPE = {
        TEAM_GALLERY: 'TEAM_GALLERY',
        TEAM_GALLERY_THUMB: 'TEAM_GALLERY_THUMB',
    };

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _matDialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService,
        private _snackBar: SnackBarService,
        private _aboutUsPageService: AboutUsPageService
    ) {}

    // Builds the section forms and loads the stored Team Gallery JSON when the page opens.
    ngOnInit(): void {
        this.generateFormGroup();
        this.generateGalleryItemDialogForm();
        this.loadTeamGallery();
    }

    // Exposes the page-level gallery list form array to the template.
    get galleryItems(): UntypedFormArray {
        return this.entityForm?.get('gallery') as UntypedFormArray;
    }

    // Returns whether either image upload control is currently busy.
    get isUploadingGalleryAsset(): boolean {
        return this.isUploadingPhoto;
    }

    // Saves the section-level title and badge while keeping the current gallery list unchanged.
    updateTeamGallerySection(): void {
        if (
            !this.areSectionFieldsValid() ||
            this.isLoading ||
            this.isSaving ||
            this.isUploadingGalleryAsset
        ) {
            this.markSectionFieldsAsTouched();
            return;
        }

        this.persistTeamGalleryCollection(
            this.getCurrentGalleryItems(),
            'Team Gallery section updated successfully',
            'Failed to update Team Gallery section.',
            'Oh no! Server error occurred while updating the Team Gallery section'
        );
    }

    // Opens the dialog in add or edit mode and pre-fills values when editing.
    openGalleryItemDialog(mode: 'add' | 'edit', index?: number): void {
        this.galleryDialogMode = mode;
        this.selectedGalleryIndex = typeof index === 'number' ? index : null;
        this.resetGalleryItemDialogForm();

        if (mode === 'edit' && this.selectedGalleryIndex !== null) {
            const galleryItem = this.mapFormValueToGalleryItem(
                this.galleryItems.at(this.selectedGalleryIndex).getRawValue()
            );
            this.patchGalleryItemDialogForm(galleryItem);
        } else if (mode === 'add') {
            this.galleryItemDialogForm
                ?.get('priority')
                ?.setValue(this.getNextGalleryPriority());
        }

        this.galleryItemDialogRef = this._matDialog.open(this.galleryItemDialog, {
            width: '980px',
            maxWidth: '96vw',
            disableClose: true,
        });
    }

    // Closes the dialog and resets the temporary selection state.
    closeGalleryItemDialog(): void {
        if (
            this.galleryItemDialogForm?.disabled &&
            !this.isUploadingGalleryAsset &&
            !this.isSaving
        ) {
            this.galleryItemDialogForm.enable();
        }

        this.galleryItemDialogRef?.close();
        this.galleryItemDialogRef = null;
        this.selectedGalleryIndex = null;
        this.isUploadingPhoto = false;
    }

    // Saves one gallery item by rebuilding and persisting the full Team Gallery collection.
    saveGalleryItem(): void {
        if (
            this.galleryItemDialogForm?.invalid ||
            this.isUploadingGalleryAsset ||
            this.isSaving
        ) {
            this.galleryItemDialogForm?.markAllAsTouched();
            return;
        }

        const galleryItem = this.mapFormValueToGalleryItem(
            this.galleryItemDialogForm?.getRawValue()
        );
        const nextGallery = this.buildNextGalleryState(galleryItem);

        this.persistTeamGalleryCollection(
            nextGallery,
            this.galleryDialogMode === 'add'
                ? 'Gallery image added successfully'
                : 'Gallery image updated successfully',
            this.galleryDialogMode === 'add'
                ? 'Failed to add gallery image.'
                : 'Failed to update gallery image.',
            this.galleryDialogMode === 'add'
                ? 'Oh no! Server error occurred while adding the gallery image'
                : 'Oh no! Server error occurred while updating the gallery image',
            () => {
                this.closeGalleryItemDialog();
            }
        );
    }

    // Deletes one gallery item after confirmation and persists the remaining collection.
    deleteGalleryItem(index: number): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Gallery Image',
            message:
                'Are you sure you want to delete this gallery image? This will update the stored Team Gallery JSON.',
            actions: {
                confirm: {
                    label: 'Delete',
                },
            },
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                const deletedGalleryItem = this.getCurrentGalleryItems()[index];
                const nextGallery = this.getCurrentGalleryItems().filter(
                    (_, galleryIndex) => galleryIndex !== index
                );

                this.persistTeamGalleryCollection(
                    nextGallery,
                    'Gallery image deleted successfully',
                    'Failed to delete gallery image.',
                    'Oh no! Server error occurred while deleting the gallery image',
                    () => {
                        this.deleteGalleryAssetFromServer(deletedGalleryItem?.photo);
                    }
                );
            }
        });
    }

    // Uploads the gallery photo and mirrors it into the thumbnail field for now.
    onGalleryImageSelect(event: Event): void {
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

        const fieldType = this.getGalleryFieldType();
        const formData = new FormData();
        formData.append(`${fieldType}[0]`, selectedFile);
        formData.append('fieldType', fieldType);

        this.isUploadingPhoto = true;
        this.galleryItemDialogForm?.disable();

        this._aboutUsPageService.uploadFiles(formData).subscribe(
            (response: any) => {
                this.isUploadingPhoto = false;
                this.enableGalleryItemDialogForm();

                if (response?.status && response?.data?.[0]) {
                    const normalizedPath = this.normalizeUploadedImagePath(
                        response.data[0]
                    );
                    this.galleryItemDialogForm?.patchValue({
                        photo: normalizedPath,
                        thumb: normalizedPath,
                    });
                    this._snackBar.showSuccess('Gallery photo uploaded successfully');
                } else {
                    this._snackBar.showError('Failed to upload gallery photo');
                }

                input.value = '';
            },
            () => {
                this.isUploadingPhoto = false;
                this.enableGalleryItemDialogForm();
                this._snackBar.showError(
                    'Oh no! Server error occurred while uploading the gallery photo'
                );
                input.value = '';
            }
        );
    }

    // Deletes the gallery photo from the server after confirmation and clears both stored paths.
    clearGalleryImage(): void {
        const imagePath = this.galleryItemDialogForm?.get('photo')?.value;
        const fileName = this.extractFileName(imagePath);

        if (!fileName) {
            this.galleryItemDialogForm?.patchValue({
                photo: '',
                thumb: '',
            });
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
                this.galleryItemDialogForm?.disable();

                this._aboutUsPageService
                    .deletePhoto(fileName, this.getGalleryFieldType())
                    .subscribe(
                        (response) => {
                            if (response) {
                                this.galleryItemDialogForm?.patchValue({
                                    photo: '',
                                    thumb: '',
                                });
                                this._snackBar.showSuccess(
                                    'Gallery photo deleted successfully'
                                );
                            } else {
                                this._snackBar.showError('Failed to delete gallery photo');
                            }
                        },
                        () => {
                            this._snackBar.showError(
                                'Oh no! Server error occurred while deleting the gallery photo'
                            );
                        },
                        () => {
                            this.enableGalleryItemDialogForm();
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

    // Creates the page-level Team Gallery form.
    private generateFormGroup(): void {
        this.entityForm = this._formBuilder.group({
            title: ['', [Validators.required, Validators.maxLength(100)]],
            badge: ['', [Validators.required, Validators.maxLength(50)]],
            gallery: this._formBuilder.array([]),
        });
    }

    // Creates the dialog form used to add or edit one gallery item at a time.
    private generateGalleryItemDialogForm(): void {
        this.galleryItemDialogForm = this._formBuilder.group({
            priority: [1, [Validators.required, Validators.min(1)]],
            title: ['', [Validators.required, Validators.maxLength(150)]],
            photo: ['', [Validators.required]],
            thumb: ['', [Validators.required]],
        });

        this.resetGalleryItemDialogForm();
    }

    // Resets the dialog form to a clean default gallery item.
    private resetGalleryItemDialogForm(): void {
        this.galleryItemDialogForm?.reset(this.createEmptyGalleryItem());
    }

    // Prefills the dialog form with the values from an existing gallery item.
    private patchGalleryItemDialogForm(item: ITeamGalleryItem): void {
        this.galleryItemDialogForm?.patchValue(item);
    }

    // Loads the stored Team Gallery data from the backend and patches it into the page form.
    private loadTeamGallery(): void {
        this.isLoading = true;

        this._aboutUsPageService.getTeamGallery().subscribe(
            (response: any) => {
                const normalizedResponse =
                    response?.status || response?.data ? response?.data : response;

                if (response?.status !== false && normalizedResponse) {
                    this.teamGalleryRecord =
                        this.normalizeTeamGalleryRecord(normalizedResponse);
                    this.patchTeamGalleryForm(this.teamGalleryRecord.content);
                } else {
                    this.teamGalleryRecord = null;
                    this.patchTeamGalleryForm(this.createDefaultTeamGallerySection());
                    this._snackBar.showError('Failed to fetch Team Gallery section.');
                }
            },
            () => {
                this.teamGalleryRecord = null;
                this.patchTeamGalleryForm(this.createDefaultTeamGallerySection());
                this._snackBar.showError(
                    'Oh no! Server error occurred while fetching the Team Gallery section'
                );
            },
            () => {
                this.isLoading = false;
            }
        );
    }

    // Patches the page-level title/badge and rebuilds the visible gallery list.
    private patchTeamGalleryForm(data: ITeamGallerySection): void {
        this.entityForm?.patchValue({
            title: data.title,
            badge: data.badge,
        });

        this.replaceFormArray(
            this.galleryItems,
            data.gallery.map((item) => this.createGalleryItemGroup(item))
        );
    }

    // Builds one gallery item form group inside the page-level form array.
    private createGalleryItemGroup(item: ITeamGalleryItem): UntypedFormGroup {
        return this._formBuilder.group({
            priority: [item.priority, [Validators.required, Validators.min(1)]],
            photo: [item.photo, [Validators.required]],
            thumb: [item.thumb, [Validators.required]],
            title: [item.title, [Validators.required, Validators.maxLength(150)]],
        });
    }

    // Converts the current dialog or page form item into the API gallery item shape.
    private mapFormValueToGalleryItem(formValue: any): ITeamGalleryItem {
        const photoPath = formValue?.photo || '';

        return {
            priority:
                formValue?.priority === 0 || formValue?.priority
                    ? Number(formValue.priority)
                    : null,
            photo: photoPath,
            thumb: this.buildThumbPath(photoPath),
            title: formValue?.title || '',
        };
    }

    // Wraps the full gallery array with row metadata before sending it to the backend.
    private buildTeamGalleryPayload(gallery: ITeamGalleryItem[]): ITeamGalleryRecord {
        return {
            id: this.teamGalleryRecord?.id,
            pageId: this.teamGalleryRecord?.pageId,
            section: this.teamGalleryRecord?.section || 'team-gallery',
            content: {
                title: this.entityForm?.get('title')?.value || '',
                badge: this.entityForm?.get('badge')?.value || '',
                gallery: gallery.map((item, index) => ({
                    ...item,
                    priority: index + 1,
                })),
            },
        };
    }

    // Persists the full Team Gallery collection for section saves and list add/update/delete flows.
    private persistTeamGalleryCollection(
        gallery: ITeamGalleryItem[],
        successMessage: string,
        failureMessage: string,
        serverErrorMessage: string,
        onSuccess?: () => void
    ): void {
        if (!this.areSectionFieldsValid()) {
            this.markSectionFieldsAsTouched();
            this._snackBar.showError(
                'Please complete the Team Gallery title and badge before saving.'
            );
            return;
        }

        const payload = this.buildTeamGalleryPayload(gallery);
        this.isSaving = true;

        if (this.galleryItemDialogRef) {
            this.galleryItemDialogForm?.disable();
        }

        this._aboutUsPageService.updateTeamGallery(payload).subscribe(
            (response: any) => {
                const normalizedResponse =
                    response?.status || response?.data
                        ? response?.data || payload
                        : response || payload;

                if (response?.status === false) {
                    this._snackBar.showError(failureMessage);
                    return;
                }

                this.teamGalleryRecord = this.mergeSavedTeamGalleryRecord(
                    normalizedResponse,
                    payload
                );
                this.patchTeamGalleryForm(this.teamGalleryRecord.content);
                this._snackBar.showSuccess(successMessage);
                onSuccess?.();
            },
            () => {
                this._snackBar.showError(serverErrorMessage);
            },
            () => {
                this.isSaving = false;
                this.enableGalleryItemDialogForm();
            }
        );
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

    // Reads the current gallery list from the page form and converts it back to API shape.
    private getCurrentGalleryItems(): ITeamGalleryItem[] {
        return this.galleryItems.controls.map((control) =>
            this.mapFormValueToGalleryItem(control.getRawValue())
        );
    }

    // Inserts the new or updated gallery item into the requested priority slot and shifts others accordingly.
    private buildNextGalleryState(item: ITeamGalleryItem): ITeamGalleryItem[] {
        const gallery = this.getCurrentGalleryItems();

        if (this.galleryDialogMode === 'edit' && this.selectedGalleryIndex !== null) {
            gallery.splice(this.selectedGalleryIndex, 1);
        }

        const targetPriority = Math.min(
            Math.max(Number(item.priority) || 1, 1),
            gallery.length + 1
        );

        gallery.splice(targetPriority - 1, 0, {
            ...item,
            priority: targetPriority,
        });

        return gallery.slice(0, this.maxGalleryItems).map((galleryItem, index) => ({
            ...galleryItem,
            priority: index + 1,
        }));
    }

    // Normalizes the fetched row metadata and nested Team Gallery content structure from the API response.
    private normalizeTeamGalleryRecord(payload: any): ITeamGalleryRecord {
        return {
            id: payload?.id || '',
            pageId: payload?.pageId || '',
            section: payload?.section || 'team-gallery',
            content: this.normalizeTeamGallerySection(payload),
        };
    }

    // Preserves the latest submitted content after save while still refreshing row metadata from the API response.
    private mergeSavedTeamGalleryRecord(
        responsePayload: any,
        submittedPayload: ITeamGalleryRecord
    ): ITeamGalleryRecord {
        const normalizedResponse = this.normalizeTeamGalleryRecord(responsePayload);

        return {
            id: normalizedResponse.id || submittedPayload.id || '',
            pageId: normalizedResponse.pageId || submittedPayload.pageId || '',
            section:
                normalizedResponse.section || submittedPayload.section || 'team-gallery',
            content: submittedPayload.content,
        };
    }

    // Normalizes the raw Team Gallery payload and supports the older array-only format stored in the DB.
    private normalizeTeamGallerySection(payload: any): ITeamGallerySection {
        const sectionPayload = this.extractTeamGallerySectionPayload(payload);
        const rawGallery = Array.isArray(sectionPayload)
            ? sectionPayload
            : sectionPayload?.gallery;
        const normalizedGallery = this.sortGalleryByPriority(
            Array.isArray(rawGallery) ? rawGallery : []
        )
            .map((item) => this.normalizeTeamGalleryItem(item))
            .slice(0, this.maxGalleryItems)
            .map((item, index) => ({
                ...item,
                priority: index + 1,
            }));

        return {
            title: Array.isArray(sectionPayload) ? '' : sectionPayload?.title || '',
            badge: Array.isArray(sectionPayload) ? '' : sectionPayload?.badge || '',
            gallery: normalizedGallery,
        };
    }

    // Extracts the actual Team Gallery section object from either a direct section response or a row-wrapped response.
    private extractTeamGallerySectionPayload(payload: any): any {
        if (
            Array.isArray(payload) ||
            payload?.gallery ||
            payload?.title ||
            payload?.badge
        ) {
            return payload;
        }

        return payload?.content || {};
    }

    // Returns the default empty Team Gallery section used for fallback states.
    private createDefaultTeamGallerySection(): ITeamGallerySection {
        return {
            title: '',
            badge: '',
            gallery: [],
        };
    }

    // Returns the default empty gallery item used for a brand-new dialog state.
    private createEmptyGalleryItem(): ITeamGalleryItem {
        return {
            priority: 1,
            photo: '',
            thumb: '',
            title: '',
        };
    }

    // Normalizes one raw gallery item so the UI always works with a safe complete structure.
    private normalizeTeamGalleryItem(item: any): ITeamGalleryItem {
        const photoPath = item?.photo || '';

        return {
            priority:
                item?.priority === 0 || item?.priority
                    ? Number(item.priority)
                    : null,
            photo: photoPath,
            thumb: item?.thumb || this.buildThumbPath(photoPath),
            title: item?.title || '',
        };
    }

    // Sorts gallery items by ascending priority while keeping empty priorities at the end.
    private sortGalleryByPriority(gallery: any[]): any[] {
        return [...gallery].sort((leftItem, rightItem) => {
            const leftPriority =
                leftItem?.priority === 0 || leftItem?.priority
                    ? Number(leftItem.priority)
                    : Number.MAX_SAFE_INTEGER;
            const rightPriority =
                rightItem?.priority === 0 || rightItem?.priority
                    ? Number(rightItem.priority)
                    : Number.MAX_SAFE_INTEGER;

            return leftPriority - rightPriority;
        });
    }

    // Returns the next priority number for a newly added gallery item.
    private getNextGalleryPriority(): number {
        const priorities = this.galleryItems.controls
            .map((control) => Number(control.get('priority')?.value))
            .filter((priority) => Number.isFinite(priority) && priority > 0);

        if (!priorities.length) {
            return 1;
        }

        return Math.max(...priorities) + 1;
    }

    // Validates only the section-level fields that are edited outside the gallery item dialog.
    private areSectionFieldsValid(): boolean {
        return Boolean(
            this.entityForm?.get('title')?.valid && this.entityForm?.get('badge')?.valid
        );
    }

    // Marks only the section-level fields as touched so the correct errors are shown.
    private markSectionFieldsAsTouched(): void {
        this.entityForm?.get('title')?.markAsTouched();
        this.entityForm?.get('badge')?.markAsTouched();
    }

    // Converts uploaded file names into the stored Team Gallery path format used by the UI.
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

        return `assets/images/gallery/${imageNameOrPath}`;
    }

    // Returns the upload/delete field type used by the backend for the main gallery photo.
    private getGalleryFieldType(): string {
        return this.PHOTO_TYPE.TEAM_GALLERY;
    }

    // Builds the stored thumbnail path by inserting `/thumb/` before the uploaded file name.
    private buildThumbPath(photoPath: string): string {
        if (!photoPath) {
            return '';
        }

        const normalizedPath = photoPath.replace(/\\/g, '/');
        const lastSlashIndex = normalizedPath.lastIndexOf('/');

        if (lastSlashIndex === -1) {
            return normalizedPath;
        }

        const directoryPath = normalizedPath.slice(0, lastSlashIndex);
        const fileName = normalizedPath.slice(lastSlashIndex + 1);

        if (!fileName) {
            return normalizedPath;
        }

        if (directoryPath.endsWith('/thumb')) {
            return normalizedPath;
        }

        return `${directoryPath}/thumb/${fileName}`;
    }

    // Re-enables the gallery item dialog form after upload or save operations finish.
    private enableGalleryItemDialogForm(): void {
        if (this.isUploadingGalleryAsset || this.isSaving) {
            return;
        }

        this.galleryItemDialogForm?.enable({ emitEvent: false });
    }

    // Deletes one stored gallery asset from the server after the Team Gallery JSON update succeeds.
    private deleteGalleryAssetFromServer(imagePath: string): void {
        const fileName = this.extractFileName(imagePath);

        if (!fileName) {
            return;
        }

        this._aboutUsPageService
            .deletePhoto(fileName, this.getGalleryFieldType())
            .subscribe(
                (response) => {
                    if (!response) {
                        this._snackBar.showError(
                            'Gallery item was deleted, but the photo could not be removed from the server.'
                        );
                    }
                },
                () => {
                    this._snackBar.showError(
                        'Gallery item was deleted, but a server error occurred while deleting the photo.'
                    );
                }
            );
    }

    // Pulls the file name from a stored asset path before calling the delete API.
    private extractFileName(imagePath: string): string {
        if (!imagePath) {
            return '';
        }

        const sanitizedPath = imagePath.split('?')[0].split('#')[0];
        const parts = sanitizedPath.split('/');
        return parts[parts.length - 1] || '';
    }

    // Provides a fallback preview image while no real gallery asset is available.
    private getFallbackPreviewImage(): string {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='280' viewBox='0 0 400 280'%3E%3Crect width='400' height='280' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2364758b' font-family='Arial, sans-serif' font-size='22'%3EPreview%3C/text%3E%3C/svg%3E";
    }
}
