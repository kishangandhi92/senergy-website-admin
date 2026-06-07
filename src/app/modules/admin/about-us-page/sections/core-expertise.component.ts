import { CdkScrollable } from '@angular/cdk/scrolling';
import {
    CdkDragDrop,
    CdkDragEnd,
    CdkDragEnter,
    CdkDragStart,
    DragDropModule,
    moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
    UntypedFormArray,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FILE_UPLOAD } from 'app/constants/upload';
import { SnackBarService } from 'app/core/general/snackbar.service';
import { environment } from 'environments/environment';
import { AboutUsPageService } from '../about-us-page.service';
import {
    ICoreExpertiseItem,
    ICoreExpertiseRecord,
    ICoreExpertiseSection,
} from '../about-us-page.types';

@Component({
    selector: 'app-about-us-page-core-expertise',
    standalone: true,
    imports: [
        CommonModule,
        CdkScrollable,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatTooltipModule,
        DragDropModule,
    ],
    templateUrl: './core-expertise.component.html',
    styles: [
        `
            :host ::ng-deep .core-expertise-drop-list.cdk-drop-list-dragging
                .core-expertise-card:not(.cdk-drag-placeholder) {
                transition:
                    transform 220ms cubic-bezier(0.2, 0, 0, 1),
                    box-shadow 220ms ease,
                    opacity 220ms ease;
            }

            :host ::ng-deep .core-expertise-card.cdk-drag-preview {
                border-radius: 1rem;
                box-shadow:
                    0 22px 50px -12px rgba(15, 23, 42, 0.32),
                    0 8px 18px -10px rgba(15, 23, 42, 0.2);
                opacity: 0.96;
                transform: rotate(1deg);
            }

            :host ::ng-deep .core-expertise-card.cdk-drag-placeholder {
                opacity: 0.2;
                border-style: dashed;
                border-color: rgb(14 165 233);
                background: rgb(240 249 255);
            }

            :host ::ng-deep .core-expertise-card.cdk-drag-animating {
                transition: transform 220ms cubic-bezier(0.2, 0, 0, 1);
            }
        `,
    ],
})
export class CoreExpertiseComponent implements OnInit {
    @ViewChild('pageScrollContainer') pageScrollContainer?: ElementRef<HTMLDivElement>;
    @ViewChildren('expertiseCard') expertiseCards!: QueryList<ElementRef<HTMLDivElement>>;

    entityForm: UntypedFormGroup | undefined;
    isLoading = false;
    isSaving = false;
    isUploading = false;
    coreExpertiseRecord: ICoreExpertiseRecord | null = null;
    draggedExpertiseIndex: number | null = null;
    previewExpertiseIndex: number | null = null;

    public readonly baseURL = environment.apiBaseUrl;
    public readonly maxFileSizeInKb = FILE_UPLOAD.MAX_ICON_FILE_SIZE_IN_KB;
    readonly PHOTO_TYPE = {
        CORE_EXPERTISE: 'CORE_EXPERTISE',
    };

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _snackBar: SnackBarService,
        private _aboutUsPageService: AboutUsPageService
    ) {}

    // Builds the form and loads the stored Core Expertise JSON when the page opens.
    ngOnInit(): void {
        this.generateFormGroup();
        this.loadCoreExpertise();
    }

    // Exposes the expertise list form array to the template.
    get expertiseForms(): UntypedFormArray {
        return this.entityForm?.get('expertise') as UntypedFormArray;
    }

    // Adds another expertise card while keeping the maximum of nine.
    addExpertise(): void {
        if (this.expertiseForms.length >= 9 || this.isLoading || this.isSaving || this.isUploading) {
            return;
        }

        this.expertiseForms.push(
            this.createExpertiseGroup(
                this.createEmptyCoreExpertiseItem(this.getNextExpertisePriority())
            )
        );
        this.reorderExpertiseSequentially();
        this.entityForm?.markAsDirty();

        this.scrollToLatestExpertise();
    }

    // Reorders expertise cards from drag-and-drop and keeps saved priorities aligned with the visual order.
    dropExpertise(event: CdkDragDrop<UntypedFormGroup[]>): void {
        this.clearDragPreview();

        if (
            event.previousIndex === event.currentIndex ||
            this.isLoading ||
            this.isSaving ||
            this.isUploading
        ) {
            return;
        }

        const reorderedControls = [...this.expertiseForms.controls] as UntypedFormGroup[];
        moveItemInArray(reorderedControls, event.previousIndex, event.currentIndex);
        this.syncExpertisePriorities(reorderedControls);
        this.replaceFormArray(this.expertiseForms, reorderedControls);
        this.entityForm?.markAsDirty();
    }

    // Marks which expertise card is being dragged so the template can show live drop guidance.
    startExpertiseDrag(index: number, _event: CdkDragStart): void {
        if (this.entityForm?.disabled) {
            return;
        }

        this.draggedExpertiseIndex = index;
        this.previewExpertiseIndex = index;
    }

    // Updates the current drop target while the dragged card moves through the list.
    previewExpertiseDrop(index: number, _event: CdkDragEnter): void {
        if (this.draggedExpertiseIndex === null) {
            return;
        }

        this.previewExpertiseIndex = index;
    }

    // Clears the temporary drag preview state once the interaction ends.
    endExpertiseDrag(_event: CdkDragEnd): void {
        this.clearDragPreview();
    }

    // Removes one expertise card while keeping the required minimum of three.
    removeExpertise(index: number): void {
        if (
            this.expertiseForms.length <= 3 ||
            this.isLoading ||
            this.isSaving ||
            this.isUploading
        ) {
            return;
        }

        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Expertise Card',
            message:
                'Are you sure you want to remove this expertise card? This will auto-save the section and delete the card icon from the server.',
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

            const previousState = this.mapFormValueToCoreExpertiseSection(
                this.entityForm?.getRawValue()
            );
            const deletedIconPath =
                this.expertiseForms.at(index).get('icon')?.value || '';

            this.expertiseForms.removeAt(index);
            this.reorderExpertiseSequentially();

            if (this.entityForm?.invalid) {
                this.patchFormValues(previousState);
                this.entityForm?.markAllAsTouched();
                this._snackBar.showError(
                    'Please fix the remaining validation errors before deleting a card because this action auto-saves the section.'
                );
                return;
            }

            this.persistCoreExpertise({
                successMessage: 'Expertise card deleted successfully',
                errorMessage: 'Failed to delete the expertise card',
                serverErrorMessage:
                    'Oh no! Server error occurred while deleting the expertise card',
                rollbackSection: previousState,
                deletedIconPath,
            });
        });
    }

    // Saves the full Core Expertise JSON back to the backend.
    updateCoreExpertise(): void {
        if (this.entityForm?.invalid || this.isLoading || this.isSaving || this.isUploading) {
            this.entityForm?.markAllAsTouched();
            return;
        }

        this.persistCoreExpertise();
    }

    // Uploads one expertise icon and patches the returned file path into the matching item.
    onExpertiseIconSelect(index: number, event: Event): void {
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
        formData.append(`${this.PHOTO_TYPE.CORE_EXPERTISE}[0]`, selectedFile);
        formData.append('fieldType', this.PHOTO_TYPE.CORE_EXPERTISE);

        this.isUploading = true;
        this.entityForm?.disable();

        this._aboutUsPageService.uploadFiles(formData).subscribe(
            (response: any) => {
                this.isUploading = false;
                this.enableEntityForm();

                if (response?.status && response?.data?.[0]) {
                    const normalizedPath = this.normalizeUploadedImagePath(
                        response.data[0]
                    );
                    this.expertiseForms.at(index).get('icon')?.setValue(normalizedPath);
                    this._snackBar.showSuccess(
                        'Core Expertise icon uploaded successfully'
                    );
                } else {
                    this._snackBar.showError(
                        'Failed to upload Core Expertise icon'
                    );
                }

                input.value = '';
            },
            () => {
                this.isUploading = false;
                this.enableEntityForm();
                this._snackBar.showError(
                    'Oh no! Server error occurred while uploading the Core Expertise icon'
                );
                input.value = '';
            }
        );
    }

    // Deletes the current expertise icon from the server after confirmation and clears the form field.
    clearExpertiseIcon(index: number): void {
        const imagePath = this.expertiseForms.at(index).get('icon')?.value;
        const fileName = this.extractFileName(imagePath);

        if (!fileName) {
            this.expertiseForms.at(index).get('icon')?.setValue('');
            return;
        }

        this.entityForm?.disable();

        this._aboutUsPageService
            .deletePhoto(fileName, this.PHOTO_TYPE.CORE_EXPERTISE)
            .subscribe(
                (response) => {
                    if (response) {
                        this.expertiseForms.at(index).get('icon')?.setValue('');
                        this._snackBar.showSuccess(
                            'Core Expertise icon deleted successfully'
                        );
                    } else {
                        this._snackBar.showError(
                            'Failed to delete Core Expertise icon'
                        );
                    }
                },
                () => {
                    this._snackBar.showError(
                        'Oh no! Server error occurred while deleting the Core Expertise icon'
                    );
                },
                () => {
                    this.enableEntityForm();
                }
            );
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

    // Creates the page form for the Core Expertise section.
    private generateFormGroup(): void {
        this.entityForm = this._formBuilder.group({
            title: ['', [Validators.required, Validators.maxLength(100)]],
            expertise: this._formBuilder.array([]),
        });
    }

    // Loads the stored Core Expertise data from the backend and patches it into the page form.
    private loadCoreExpertise(): void {
        this.isLoading = true;

        this._aboutUsPageService.getCoreExpertise().subscribe(
            (response: any) => {
                const normalizedResponse =
                    response?.status || response?.data
                        ? response?.data
                        : response;

                if (response?.status !== false && normalizedResponse) {
                    this.coreExpertiseRecord =
                        this.normalizeCoreExpertiseRecord(normalizedResponse);
                    this.patchFormValues(this.coreExpertiseRecord.content);
                } else {
                    this.coreExpertiseRecord = null;
                    this.patchFormValues(this.createDefaultCoreExpertiseSection());
                    this._snackBar.showError(
                        'Failed to fetch Core Expertise section.'
                    );
                }
            },
            () => {
                this.coreExpertiseRecord = null;
                this.patchFormValues(this.createDefaultCoreExpertiseSection());
                this._snackBar.showError(
                    'Oh no! Server error occurred while fetching the Core Expertise section'
                );
            },
            () => {
                this.isLoading = false;
            }
        );
    }

    // Patches the fetched Core Expertise data into the page form and rebuilds the expertise array.
    private patchFormValues(data: ICoreExpertiseSection): void {
        this.entityForm?.patchValue({
            title: data.title,
        });

        this.replaceFormArray(
            this.expertiseForms,
            data.expertise.map((item) => this.createExpertiseGroup(item))
        );
        this.reorderExpertiseSequentially();
    }

    // Re-enables the page form after save or upload operations finish.
    private enableEntityForm(): void {
        if (this.isUploading || this.isSaving) {
            return;
        }

        this.entityForm?.enable({ emitEvent: false });
        this.expertiseForms?.controls.forEach((control) =>
            control.enable({ emitEvent: false })
        );
    }

    // Builds the PUT payload by combining persisted row metadata with the latest form values.
    private buildCoreExpertisePayload(): ICoreExpertiseRecord {
        return {
            id: this.coreExpertiseRecord?.id,
            pageId: this.coreExpertiseRecord?.pageId,
            section: this.coreExpertiseRecord?.section || 'core-expertise',
            content: this.mapFormValueToCoreExpertiseSection(
                this.entityForm?.getRawValue()
            ),
        };
    }

    // Saves the current Core Expertise JSON and optionally cleans up a deleted icon file afterwards.
    private persistCoreExpertise(options?: {
        successMessage?: string;
        errorMessage?: string;
        serverErrorMessage?: string;
        rollbackSection?: ICoreExpertiseSection;
        deletedIconPath?: string;
    }): void {
        const payload = this.buildCoreExpertisePayload();
        const deletedFileName = this.extractFileName(options?.deletedIconPath || '');

        this.isSaving = true;

        this._aboutUsPageService.updateCoreExpertise(payload).subscribe(
            (response: any) => {
                const normalizedResponse =
                    response?.status || response?.data
                        ? response?.data || payload
                        : response || payload;

                if (response?.status === false) {
                    this.restoreAfterSaveFailure(
                        options?.rollbackSection,
                        options?.errorMessage || 'Failed to update Core Expertise section'
                    );
                    return;
                }

                this.coreExpertiseRecord = this.mergeSavedCoreExpertiseRecord(
                    normalizedResponse,
                    payload
                );

                if (deletedFileName) {
                    this.deleteRemovedExpertiseIcon(
                        deletedFileName,
                        options?.successMessage || 'Core Expertise section updated successfully'
                    );
                    return;
                }

                this._snackBar.showSuccess(
                    options?.successMessage || 'Core Expertise section updated successfully'
                );
                this.finishSaving();
            },
            () => {
                this.restoreAfterSaveFailure(
                    options?.rollbackSection,
                    options?.serverErrorMessage ||
                        'Oh no! Server error occurred while updating the Core Expertise section'
                );
            }
        );
    }

    // Preserves the latest submitted content after save while still refreshing persisted row metadata from the API response.
    private mergeSavedCoreExpertiseRecord(
        responsePayload: any,
        submittedPayload: ICoreExpertiseRecord
    ): ICoreExpertiseRecord {
        const normalizedResponse =
            this.normalizeCoreExpertiseRecord(responsePayload);

        return {
            id: normalizedResponse.id || submittedPayload.id || '',
            pageId: normalizedResponse.pageId || submittedPayload.pageId || '',
            section:
                normalizedResponse.section || submittedPayload.section || 'core-expertise',
            content: submittedPayload.content,
        };
    }

    // Converts the current reactive form value into the exact JSON shape expected by the API.
    private mapFormValueToCoreExpertiseSection(
        formValue: any
    ): ICoreExpertiseSection {
        const expertise = Array.isArray(formValue?.expertise)
            ? formValue.expertise
            : [];

        return {
            title: formValue?.title || '',
            expertise: this.sortExpertiseByPriority(expertise).map((item) =>
                this.normalizeCoreExpertiseItem(item)
            ),
        };
    }

    // Normalizes the fetched row metadata and nested content structure from the API response.
    private normalizeCoreExpertiseRecord(payload: any): ICoreExpertiseRecord {
        return {
            id: payload?.id || '',
            pageId: payload?.pageId || '',
            section: payload?.section || 'core-expertise',
            content: this.normalizeCoreExpertiseSection(payload),
        };
    }

    // Normalizes the raw Core Expertise payload and supports the older array-only format.
    private normalizeCoreExpertiseSection(payload: any): ICoreExpertiseSection {
        const sectionPayload = this.extractCoreExpertiseSectionPayload(payload);
        const rawExpertise = Array.isArray(sectionPayload)
            ? sectionPayload
            : sectionPayload?.expertise;

        const expertise = this.sortExpertiseByPriority(
            Array.isArray(rawExpertise) ? rawExpertise : []
        ).map((item) => this.normalizeCoreExpertiseItem(item));

        while (expertise.length < 3) {
            expertise.push(this.createEmptyCoreExpertiseItem(expertise.length + 1));
        }

        return {
            title: Array.isArray(sectionPayload) ? '' : sectionPayload?.title || '',
            expertise: expertise.slice(0, 9),
        };
    }

    // Extracts the actual Core Expertise section object from either a direct section response or a row-wrapped response.
    private extractCoreExpertiseSectionPayload(payload: any): any {
        if (Array.isArray(payload) || payload?.expertise || payload?.title) {
            return payload;
        }

        return payload?.content || {};
    }

    // Normalizes one raw expertise item so the UI always works with a complete safe structure.
    private normalizeCoreExpertiseItem(item: any): ICoreExpertiseItem {
        return {
            priority:
                item?.priority === 0 || item?.priority
                    ? Number(item.priority)
                    : null,
            icon: item?.icon || '',
            title: item?.title || '',
        };
    }

    // Returns the default empty Core Expertise section used for fallback states.
    private createDefaultCoreExpertiseSection(): ICoreExpertiseSection {
        return {
            title: '',
            expertise: [
                this.createEmptyCoreExpertiseItem(1),
                this.createEmptyCoreExpertiseItem(2),
                this.createEmptyCoreExpertiseItem(3),
            ],
        };
    }

    // Returns the default empty expertise item used for new and fallback cards.
    private createEmptyCoreExpertiseItem(priority: number | null = null): ICoreExpertiseItem {
        return {
            priority,
            icon: '',
            title: '',
        };
    }

    // Converts one expertise item into the reactive form group used on the page.
    private createExpertiseGroup(item: ICoreExpertiseItem): UntypedFormGroup {
        return this._formBuilder.group({
            priority: [item.priority, [Validators.required, Validators.min(1)]],
            icon: [item.icon, [Validators.required]],
            title: [item.title, [Validators.required, Validators.maxLength(200)]],
        });
    }

    // Restores the previous section state when an auto-save operation fails and closes the saving state.
    private restoreAfterSaveFailure(
        rollbackSection: ICoreExpertiseSection | undefined,
        message: string
    ): void {
        if (rollbackSection) {
            this.patchFormValues(rollbackSection);
        }

        this._snackBar.showError(message);
        this.finishSaving();
    }

    // Deletes the removed card icon from the server after the updated JSON has been saved successfully.
    private deleteRemovedExpertiseIcon(
        fileName: string,
        successMessage: string
    ): void {
        this._aboutUsPageService
            .deletePhoto(fileName, this.PHOTO_TYPE.CORE_EXPERTISE)
            .subscribe(
                (response) => {
                    if (response) {
                        this._snackBar.showSuccess(successMessage);
                    } else {
                        this._snackBar.showError(
                            'Expertise card deleted and section saved, but the icon could not be deleted from the server.'
                        );
                    }

                    this.finishSaving();
                },
                () => {
                    this._snackBar.showError(
                        'Expertise card deleted and section saved, but a server error occurred while deleting the icon.'
                    );
                    this.finishSaving();
                }
            );
    }

    // Replaces every expertise form group with a fresh set from the latest data source.
    private replaceFormArray(targetArray: UntypedFormArray, controls: UntypedFormGroup[]): void {
        while (targetArray.length) {
            targetArray.removeAt(0);
        }

        controls.forEach((control) => targetArray.push(control));
    }

    // Renumbers the current expertise controls sequentially from top to bottom.
    private reorderExpertiseSequentially(): void {
        this.syncExpertisePriorities(
            this.expertiseForms.controls as UntypedFormGroup[]
        );
    }

    // Sorts expertise items by ascending priority while keeping empty priorities at the end.
    private sortExpertiseByPriority(items: any[]): any[] {
        return [...items].sort((leftItem, rightItem) => {
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

    // Returns the next priority number for a newly added expertise card.
    private getNextExpertisePriority(): number {
        return this.expertiseForms.length + 1;
    }

    // Mirrors the visible card order into sequential priorities used by the saved JSON.
    private syncExpertisePriorities(controls: UntypedFormGroup[]): void {
        controls.forEach((control, reorderedIndex) => {
            control.get('priority')?.setValue(reorderedIndex + 1, {
                emitEvent: false,
            });
        });
    }

    // Scrolls the newest expertise card into view so the added empty form is immediately visible.
    private scrollToLatestExpertise(): void {
        setTimeout(() => {
            const scrollContainer = this.pageScrollContainer?.nativeElement;
            const latestCard = this.expertiseCards?.last?.nativeElement;

            if (!scrollContainer || !latestCard) {
                return;
            }

            const containerRect = scrollContainer.getBoundingClientRect();
            const cardRect = latestCard.getBoundingClientRect();
            const scrollTop =
                scrollContainer.scrollTop +
                (cardRect.top - containerRect.top) -
                24;

            scrollContainer.scrollTo({
                top: Math.max(scrollTop, 0),
                behavior: 'smooth',
            });
        });
    }

    // Ends the active save state and re-enables the form controls.
    private finishSaving(): void {
        this.isSaving = false;
        this.enableEntityForm();
    }

    // Resets the transient drag state used only for UI feedback while reordering.
    private clearDragPreview(): void {
        this.draggedExpertiseIndex = null;
        this.previewExpertiseIndex = null;
    }

    // Converts uploaded file names into the stored icon path format used by the UI.
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

    // Pulls the file name from a full stored image path before calling the delete API.
    private extractFileName(imagePath: string): string {
        if (!imagePath) {
            return '';
        }

        const sanitizedPath = imagePath.split('?')[0].split('#')[0];
        const parts = sanitizedPath.split('/');
        return parts[parts.length - 1] || '';
    }

    // Provides a fallback image preview for empty expertise icon slots.
    private getFallbackPreviewImage(): string {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='180' viewBox='0 0 240 180'%3E%3Crect width='240' height='180' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2364758b' font-family='Arial, sans-serif' font-size='18'%3EIcon Preview%3C/text%3E%3C/svg%3E";
    }
}
