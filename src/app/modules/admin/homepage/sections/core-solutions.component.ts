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
import {
    ICoreSolutionItem,
    ICoreSolutionsRecord,
    ICoreSolutionsSection,
} from '../home.types';

@Component({
    selector: 'app-home-core-solutions',
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
    templateUrl: './core-solutions.component.html',
})
export class CoreSolutionsComponent implements OnInit {
    @ViewChild('CoreSolutionDialog') coreSolutionDialog:
        | TemplateRef<any>
        | undefined;

    entityForm: UntypedFormGroup | undefined;
    coreSolutionDialogForm: UntypedFormGroup | undefined;
    coreSolutionDialogRef = null;
    selectedSolutionIndex: number | null = null;
    solutionDialogMode: 'add' | 'edit' = 'add';
    coreSolutionImagePreview = '';
    coreSolutionsRecordId = '';
    coreSolutionsPageId = '1';
    coreSolutionsSectionKey = 'core-solutions';
    isLoading = false;
    isSaving = false;
    isUploadingSolutionImage = false;

    public readonly baseURL = environment.apiBaseUrl;
    public readonly maxFileSizeInKb = FILE_UPLOAD.MAX_FILE_SIZE_IN_KB;
    readonly PHOTO_TYPE = {
        CORE_SOLUTIONS: 'CORE_SOLUTIONS',
    };

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _matDialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService,
        private _snackBar: SnackBarService,
        private _homeService: HomeService
    ) {}

    // Builds both forms and loads the current core-solutions JSON when the page opens.
    ngOnInit(): void {
        this.generateFormGroup();
        this.generateCoreSolutionDialogForm();
        this.loadCoreSolutions();
    }

    // Exposes the page-level core solutions list form array to the template.
    get coreSolutions(): UntypedFormArray {
        return this.entityForm.get('coreSolutions') as UntypedFormArray;
    }

    // Saves the common section heading content while keeping the current solutions list unchanged.
    updateCoreSolutionsSection(): void {
        if (
            this.entityForm.invalid ||
            this.isLoading ||
            this.isSaving ||
            this.isUploadingSolutionImage
        ) {
            this.entityForm.markAllAsTouched();
            return;
        }

        this.persistCoreSolutionsCollection(
            this.getCurrentSolutions(),
            'Core solutions section updated successfully',
            'Failed to update core solutions section.',
            'Oh no! Server error occurred while updating core solutions section'
        );
    }

    // Opens the modal in add or edit mode and pre-fills values when editing.
    openCoreSolutionDialog(mode: 'add' | 'edit', index?: number): void {
        this.solutionDialogMode = mode;
        this.selectedSolutionIndex = typeof index === 'number' ? index : null;
        this.resetCoreSolutionDialogForm();

        if (mode === 'edit' && this.selectedSolutionIndex !== null) {
            const solution = this.mapFormValueToCoreSolution(
                this.coreSolutions.at(this.selectedSolutionIndex).getRawValue()
            );
            this.patchCoreSolutionDialogForm(solution);
        } else if (mode === 'add') {
            this.coreSolutionDialogForm
                ?.get('priority')
                ?.setValue(this.getNextSolutionPriority());
        }

        this.coreSolutionDialogRef = this._matDialog.open(
            this.coreSolutionDialog,
            {
                width: '960px',
                maxWidth: '96vw',
                disableClose: true,
            }
        );
    }

    // Closes the modal and clears temporary dialog-only UI state.
    closeCoreSolutionDialog(): void {
        if (
            this.coreSolutionDialogForm?.disabled &&
            !this.isUploadingSolutionImage &&
            !this.isSaving
        ) {
            this.coreSolutionDialogForm.enable();
        }

        this.coreSolutionDialogRef?.close();
        this.coreSolutionDialogRef = null;
        this.selectedSolutionIndex = null;
        this.coreSolutionImagePreview = '';
        this.isUploadingSolutionImage = false;
    }

    // Saves one solution change by rebuilding and persisting the full solutions collection.
    saveCoreSolution(): void {
        if (
            this.coreSolutionDialogForm?.invalid ||
            this.isUploadingSolutionImage ||
            this.isSaving
        ) {
            this.coreSolutionDialogForm?.markAllAsTouched();
            return;
        }

        const solutionData = this.mapFormValueToCoreSolution(
            this.coreSolutionDialogForm?.getRawValue()
        );
        const nextSolutions = this.buildNextSolutionsState(solutionData);

        this.persistCoreSolutionsCollection(
            nextSolutions,
            this.solutionDialogMode === 'add'
                ? 'Core solution added successfully'
                : 'Core solution updated successfully',
            this.solutionDialogMode === 'add'
                ? 'Failed to add core solution.'
                : 'Failed to update core solution.',
            this.solutionDialogMode === 'add'
                ? 'Oh no! Server error occurred while adding core solution'
                : 'Oh no! Server error occurred while updating core solution',
            () => {
                this.closeCoreSolutionDialog();
            }
        );
    }

    // Deletes one solution after confirmation and persists the remaining collection.
    deleteCoreSolution(index: number): void {
        if (this.coreSolutions.length <= 3) {
            this._snackBar.showError('At least 3 core solutions are required.');
            return;
        }

        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Core Solution',
            message:
                'Are you sure you want to delete this core solution item? This will update the stored solutions JSON.',
            actions: {
                confirm: {
                    label: 'Delete',
                },
            },
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                const nextSolutions = this.getCurrentSolutions().filter(
                    (_, solutionIndex) => solutionIndex !== index
                );
                this.persistCoreSolutionsCollection(
                    nextSolutions,
                    'Core solution deleted successfully',
                    'Failed to delete core solution.',
                    'Oh no! Server error occurred while deleting core solution'
                );
            }
        });
    }

    // Uploads the selected image file and patches the returned path into the modal form.
    onCoreSolutionImageSelect(event: Event): void {
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
        formData.append(`${this.PHOTO_TYPE.CORE_SOLUTIONS}[0]`, selectedFile);
        formData.append('fieldType', this.PHOTO_TYPE.CORE_SOLUTIONS);

        this.isUploadingSolutionImage = true;
        this.coreSolutionDialogForm?.disable();

        this._homeService.uploadFiles(formData).subscribe(
            (response: any) => {
                this.isUploadingSolutionImage = false;
                this.coreSolutionDialogForm?.enable();

                if (response?.status && response?.data?.[0]) {
                    const normalizedPath = this.normalizeUploadedImagePath(
                        response.data[0]
                    );
                    this.coreSolutionDialogForm
                        .get('image')
                        ?.setValue(normalizedPath);
                    this.coreSolutionImagePreview =
                        this.resolveImageUrl(normalizedPath);
                    this._snackBar.showSuccess(
                        'Core solution image uploaded successfully'
                    );
                } else {
                    this._snackBar.showError(
                        'Failed to upload core solution image'
                    );
                }

                input.value = '';
            },
            () => {
                this.isUploadingSolutionImage = false;
                this.coreSolutionDialogForm?.enable();
                this._snackBar.showError(
                    'Oh no! Server error occurred while uploading the core solution image'
                );
                input.value = '';
            }
        );
    }

    // Deletes the currently selected image from the server after confirmation.
    clearCoreSolutionImage(): void {
        const imagePath = this.coreSolutionDialogForm?.get('image')?.value;
        const fileName = this.extractFileName(imagePath);

        if (!fileName) {
            this.coreSolutionDialogForm?.get('image')?.setValue('');
            this.coreSolutionImagePreview = '';
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
                this.coreSolutionDialogForm?.disable();

                this._homeService
                    .deletePhoto(fileName, this.PHOTO_TYPE.CORE_SOLUTIONS)
                    .subscribe(
                        (response) => {
                            if (response) {
                                this.coreSolutionDialogForm
                                    .get('image')
                                    ?.setValue('');
                                this.coreSolutionImagePreview = '';
                                this._snackBar.showSuccess(
                                    'Core solution image deleted successfully'
                                );
                            } else {
                                this._snackBar.showError(
                                    'Failed to delete core solution image'
                                );
                            }
                        },
                        () => {
                            this._snackBar.showError(
                                'Oh no! Server error occurred while deleting the core solution image'
                            );
                        },
                        () => {
                            if (
                                !this.isUploadingSolutionImage &&
                                !this.isSaving
                            ) {
                                this.coreSolutionDialogForm?.enable();
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

    // Creates the page-level form that stores the list of solutions shown on screen.
    private generateFormGroup(): void {
        this.entityForm = this._formBuilder.group({
            title: ['', [Validators.required, Validators.maxLength(100)]],
            subtitle: ['', [Validators.required, Validators.maxLength(200)]],
            coreSolutions: this._formBuilder.array([]),
        });
    }

    // Creates the modal form used to add or edit one solution item at a time.
    private generateCoreSolutionDialogForm(): void {
        this.coreSolutionDialogForm = this._formBuilder.group({
            priority: [1, [Validators.required, Validators.min(1)]],
            title: ['', [Validators.required, Validators.maxLength(100)]],
            description: ['', [Validators.required, Validators.maxLength(200)]],
            image: ['', [Validators.required]],
            altText: ['', [Validators.required, Validators.maxLength(150)]],
            link: ['', [Validators.required, Validators.maxLength(255)]],
        });

        this.resetCoreSolutionDialogForm();
    }

    // Resets the modal form back to a clean default solution structure.
    private resetCoreSolutionDialogForm(): void {
        const emptySolution = this.createEmptyCoreSolution();
        this.coreSolutionDialogForm?.reset(emptySolution);
        this.coreSolutionImagePreview = '';
    }

    // Prefills the modal form with the values from an existing solution item.
    private patchCoreSolutionDialogForm(solution: ICoreSolutionItem): void {
        this.coreSolutionDialogForm?.patchValue(solution);
        this.coreSolutionImagePreview = this.resolveImageUrl(solution.image);
    }

    // Returns the default solution object used for a brand-new modal state.
    private createEmptyCoreSolution(): ICoreSolutionItem {
        return {
            priority: 1,
            link: '',
            image: '',
            title: '',
            altText: '',
            description: '',
        };
    }

    // Converts one solution object into the reactive form shape used on the page.
    private createCoreSolutionGroup(
        solution: ICoreSolutionItem
    ): UntypedFormGroup {
        return this._formBuilder.group({
            priority: [
                solution.priority,
                [Validators.required, Validators.min(1)],
            ],
            link: [solution.link, [Validators.required]],
            image: [solution.image, [Validators.required]],
            title: [solution.title, [Validators.required]],
            altText: [solution.altText, [Validators.required]],
            description: [solution.description, [Validators.required]],
        });
    }

    // Rebuilds the API solution structure from the flat form values.
    private mapFormValueToCoreSolution(formValue: any): ICoreSolutionItem {
        return {
            priority:
                formValue?.priority === 0 || formValue?.priority
                    ? Number(formValue.priority)
                    : null,
            link: formValue.link || '',
            image: formValue.image || '',
            title: formValue.title || '',
            altText: formValue.altText || '',
            description: formValue.description || '',
        };
    }

    // Patches the page-level title/subtitle and rebuilds the visible solutions list.
    private patchCoreSolutionsForm(data: ICoreSolutionsSection): void {
        this.entityForm.patchValue({
            title: data.title,
            subtitle: data.subtitle,
        });

        this.replaceFormArray(
            this.coreSolutions,
            data.solutions.map((solution) =>
                this.createCoreSolutionGroup(solution)
            )
        );
    }

    // Replaces all items inside a form array with a fresh set of controls.
    private replaceFormArray(
        targetArray: UntypedFormArray,
        controls: any[]
    ): void {
        while (targetArray.length) {
            targetArray.removeAt(0);
        }

        controls.forEach((control) => targetArray.push(control));
    }

    // Loads the stored solutions row and maps its JSON content into the page form.
    private loadCoreSolutions(): void {
        this.isLoading = true;

        this._homeService.getCoreSolutions().subscribe(
            (response: any) => {
                if (response?.status) {
                    const record = this.extractCoreSolutionsRecord(response);
                    this.coreSolutionsRecordId = record.id || '';
                    this.coreSolutionsPageId = record.pageId || '1';
                    this.coreSolutionsSectionKey =
                        record.section || 'core-solutions';
                    this.patchCoreSolutionsForm(record.content);
                } else {
                    this.patchCoreSolutionsForm(
                        this.createDefaultCoreSolutionsSection()
                    );
                    this._snackBar.showError('Failed to fetch core solutions.');
                }
            },
            () => {
                this.patchCoreSolutionsForm(
                    this.createDefaultCoreSolutionsSection()
                );
                this._snackBar.showError(
                    'Oh no! Server error occurred while fetching core solutions'
                );
            },
            () => {
                this.isLoading = false;
            }
        );
    }

    // Extracts the row metadata and solutions content array from the API response.
    private extractCoreSolutionsRecord(response: any): ICoreSolutionsRecord {
        const data = response?.data || {};
        const rawContent = data?.content;
        const content = Array.isArray(rawContent)
            ? rawContent
            : rawContent?.solutions;

        return {
            id: data?.id ? String(data.id) : '',
            pageId: data?.pageId ? String(data.pageId) : '1',
            section: data?.section || 'core-solutions',
            content: {
                title: rawContent?.title || '',
                subtitle: rawContent?.subtitle || '',
                solutions: this.sortSolutionsByPriority(
                    Array.isArray(content) ? content : []
                )
                    .map((item) => this.normalizeCoreSolutionItem(item))
                    .filter(Boolean),
            },
        };
    }

    // Returns the default empty section structure used for fallback states.
    private createDefaultCoreSolutionsSection(): ICoreSolutionsSection {
        return {
            title: '',
            subtitle: '',
            solutions: [],
        };
    }

    // Normalizes one raw solution item so the UI always works with a complete safe structure.
    private normalizeCoreSolutionItem(item: any): ICoreSolutionItem {
        return {
            priority:
                item?.priority === 0 || item?.priority
                    ? Number(item.priority)
                    : null,
            link: item?.link || '',
            image: item?.image || '',
            title: item?.title || '',
            altText: item?.altText || '',
            description: item?.description || '',
        };
    }

    // Converts the uploaded file name into the stored solution image path format.
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
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'%3E%3Crect width='800' height='500' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2364758b' font-family='Arial, sans-serif' font-size='28'%3ECore Solution Preview%3C/text%3E%3C/svg%3E";
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

    // Reads the current solutions list from the page form and converts it back to API shape.
    private getCurrentSolutions(): ICoreSolutionItem[] {
        return this.coreSolutions.controls.map((control) =>
            this.mapFormValueToCoreSolution(control.getRawValue())
        );
    }

    // Inserts the new or updated solution into the requested priority position and shifts others accordingly.
    private buildNextSolutionsState(
        solution: ICoreSolutionItem
    ): ICoreSolutionItem[] {
        const solutions = this.getCurrentSolutions();

        if (
            this.solutionDialogMode === 'edit' &&
            this.selectedSolutionIndex !== null
        ) {
            solutions.splice(this.selectedSolutionIndex, 1);
        }

        const targetPriority = Math.min(
            Math.max(Number(solution.priority) || 1, 1),
            solutions.length + 1
        );

        solutions.splice(targetPriority - 1, 0, {
            ...solution,
            priority: targetPriority,
        });

        return solutions.slice(0, 6).map((item, index) => ({
            ...item,
            priority: index + 1,
        }));
    }

    // Wraps the full solutions array with record metadata before sending it to the backend.
    private buildCoreSolutionsPayload(
        content: ICoreSolutionItem[]
    ): ICoreSolutionsRecord {
        return {
            id: this.coreSolutionsRecordId || undefined,
            pageId: this.coreSolutionsPageId || '1',
            section: this.coreSolutionsSectionKey || 'core-solutions',
            content: {
                title: this.entityForm.get('title')?.value || '',
                subtitle: this.entityForm.get('subtitle')?.value || '',
                solutions: content.map((item, index) => ({
                    ...item,
                    priority: index + 1,
                })),
            },
        };
    }

    // Persists the full solutions collection for add, update, and delete flows.
    private persistCoreSolutionsCollection(
        solutions: ICoreSolutionItem[],
        successMessage: string,
        failureMessage: string,
        serverErrorMessage: string,
        onSuccess?: () => void
    ): void {
        if (!this.coreSolutionsRecordId) {
            this._snackBar.showError(
                'Core solutions record was not loaded, so update cannot be completed.'
            );
            return;
        }

        if (this.entityForm.invalid) {
            this.entityForm.markAllAsTouched();
            this._snackBar.showError(
                'Please complete the section title and subtitle before saving core solutions.'
            );
            return;
        }

        if (solutions.length < 3) {
            this._snackBar.showError('At least 3 core solutions are required.');
            return;
        }

        const payload = this.buildCoreSolutionsPayload(solutions);
        this.isSaving = true;

        if (this.coreSolutionDialogRef) {
            this.coreSolutionDialogForm?.disable();
        }

        this._homeService.updateCoreSolutions(payload).subscribe(
            (response: any) => {
                if (response?.status) {
                    this._snackBar.showSuccess(successMessage);
                    onSuccess?.();
                    this.loadCoreSolutions();
                } else {
                    this._snackBar.showError(failureMessage);
                }
            },
            () => {
                this._snackBar.showError(serverErrorMessage);
            },
            () => {
                this.isSaving = false;
                if (this.coreSolutionDialogForm?.disabled) {
                    this.coreSolutionDialogForm.enable();
                }
            }
        );
    }

    // Sorts solutions by ascending priority while keeping empty priorities at the end.
    private sortSolutionsByPriority(solutions: any[]): any[] {
        return [...solutions].sort((leftSolution, rightSolution) => {
            const leftPriority =
                leftSolution?.priority === 0 || leftSolution?.priority
                    ? Number(leftSolution.priority)
                    : Number.MAX_SAFE_INTEGER;
            const rightPriority =
                rightSolution?.priority === 0 || rightSolution?.priority
                    ? Number(rightSolution.priority)
                    : Number.MAX_SAFE_INTEGER;

            return leftPriority - rightPriority;
        });
    }

    // Returns the next priority number for a newly added core solution.
    private getNextSolutionPriority(): number {
        const priorities = this.coreSolutions.controls
            .map((control) => Number(control.get('priority')?.value))
            .filter((priority) => Number.isFinite(priority) && priority > 0);

        if (!priorities.length) {
            return 1;
        }

        return Math.max(...priorities) + 1;
    }
}
