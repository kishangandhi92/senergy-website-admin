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
import { IClientItem, IClientsRecord } from '../home.types';

@Component({
    selector: 'app-home-clients',
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
    templateUrl: './clients.component.html',
})
export class ClientsComponent implements OnInit {
    @ViewChild('ClientDialog') clientDialog: TemplateRef<any> | undefined;

    entityForm: UntypedFormGroup | undefined;
    clientDialogForm: UntypedFormGroup | undefined;
    clientDialogRef = null;
    selectedClientIndex: number | null = null;
    clientDialogMode: 'add' | 'edit' = 'add';
    clientImagePreview = '';
    clientsRecordId = '';
    clientsPageId = '1';
    clientsSectionKey = 'clients';
    isLoading = false;
    isSaving = false;
    isUploadingClientImage = false;

    public readonly baseURL = environment.apiBaseUrl;
    public readonly maxFileSizeInKb = FILE_UPLOAD.MAX_ICON_FILE_SIZE_IN_KB;
    readonly PHOTO_TYPE = {
        CLIENTS: 'CLIENTS',
    };

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _matDialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService,
        private _snackBar: SnackBarService,
        private _homeService: HomeService
    ) {}

    // Builds both forms and loads the current clients JSON when the page opens.
    ngOnInit(): void {
        this.generateFormGroup();
        this.generateClientDialogForm();
        this.loadClients();
    }

    // Exposes the page-level clients list form array to the template.
    get clients(): UntypedFormArray {
        return this.entityForm?.get('clients') as UntypedFormArray;
    }

    // Opens the modal in add or edit mode and pre-fills values when editing.
    openClientDialog(mode: 'add' | 'edit', index?: number): void {
        this.clientDialogMode = mode;
        this.selectedClientIndex = typeof index === 'number' ? index : null;
        this.resetClientDialogForm();

        if (mode === 'edit' && this.selectedClientIndex !== null) {
            const client = this.mapFormValueToClient(
                this.clients.at(this.selectedClientIndex).getRawValue()
            );
            this.patchClientDialogForm(client);
        } else if (mode === 'add') {
            this.clientDialogForm?.get('priority')?.setValue(this.getNextClientPriority());
        }

        this.clientDialogRef = this._matDialog.open(this.clientDialog, {
            width: '760px',
            maxWidth: '96vw',
            disableClose: true,
        });
    }

    // Closes the modal and clears temporary dialog-only UI state.
    closeClientDialog(): void {
        if (
            this.clientDialogForm?.disabled &&
            !this.isUploadingClientImage &&
            !this.isSaving
        ) {
            this.clientDialogForm.enable();
        }

        this.clientDialogRef?.close();
        this.clientDialogRef = null;
        this.selectedClientIndex = null;
        this.clientImagePreview = '';
        this.isUploadingClientImage = false;
    }

    // Saves one client change by rebuilding and persisting the full clients collection.
    saveClient(): void {
        if (
            this.clientDialogForm?.invalid ||
            this.isUploadingClientImage ||
            this.isSaving
        ) {
            this.clientDialogForm?.markAllAsTouched();
            return;
        }

        const clientData = this.mapFormValueToClient(
            this.clientDialogForm?.getRawValue()
        );
        const nextClients = this.buildNextClientsState(clientData);

        this.persistClientsCollection(
            nextClients,
            this.clientDialogMode === 'add'
                ? 'Client added successfully'
                : 'Client updated successfully',
            this.clientDialogMode === 'add'
                ? 'Failed to add client.'
                : 'Failed to update client.',
            this.clientDialogMode === 'add'
                ? 'Oh no! Server error occurred while adding client'
                : 'Oh no! Server error occurred while updating client',
            () => {
                this.closeClientDialog();
            }
        );
    }

    // Deletes one client after confirmation and persists the remaining collection.
    deleteClient(index: number): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Client',
            message:
                'Are you sure you want to delete this client item? This will update the stored clients JSON.',
            actions: {
                confirm: {
                    label: 'Delete',
                },
            },
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                const deletedClient = this.getCurrentClients()[index];
                const nextClients = this.getCurrentClients().filter(
                    (_, clientIndex) => clientIndex !== index
                );
                this.persistClientsCollection(
                    nextClients,
                    'Client deleted successfully',
                    'Failed to delete client.',
                    'Oh no! Server error occurred while deleting client',
                    () => {
                        this.deleteClientLogoFromServer(deletedClient?.image);
                    }
                );
            }
        });
    }

    // Uploads the selected logo file and patches the returned path into the modal form.
    onClientImageSelect(event: Event): void {
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
        formData.append(`${this.PHOTO_TYPE.CLIENTS}[0]`, selectedFile);
        formData.append('fieldType', this.PHOTO_TYPE.CLIENTS);

        this.isUploadingClientImage = true;
        this.clientDialogForm?.disable();

        this._homeService.uploadFiles(formData).subscribe(
            (response: any) => {
                this.isUploadingClientImage = false;
                this.clientDialogForm?.enable();

                if (response?.status && response?.data?.[0]) {
                    const normalizedPath = this.normalizeUploadedImagePath(
                        response.data[0]
                    );
                    this.clientDialogForm?.get('image')?.setValue(normalizedPath);
                    this.clientImagePreview = this.resolveImageUrl(normalizedPath);
                    this._snackBar.showSuccess('Client logo uploaded successfully');
                } else {
                    this._snackBar.showError('Failed to upload client logo');
                }

                input.value = '';
            },
            () => {
                this.isUploadingClientImage = false;
                this.clientDialogForm?.enable();
                this._snackBar.showError(
                    'Oh no! Server error occurred while uploading the client logo'
                );
                input.value = '';
            }
        );
    }

    // Deletes the currently selected logo from the server after confirmation.
    clearClientImage(): void {
        const imagePath = this.clientDialogForm?.get('image')?.value;
        const fileName = this.extractFileName(imagePath);

        if (!fileName) {
            this.clientDialogForm?.get('image')?.setValue('');
            this.clientImagePreview = '';
            return;
        }

        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Logo',
            message:
                'Are you sure you want to delete this logo from the server? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete',
                },
            },
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this.clientDialogForm?.disable();

                this._homeService.deletePhoto(fileName, this.PHOTO_TYPE.CLIENTS).subscribe(
                    (response) => {
                        if (response) {
                            this.clientDialogForm?.get('image')?.setValue('');
                            this.clientImagePreview = '';
                            this._snackBar.showSuccess(
                                'Client logo deleted successfully'
                            );
                        } else {
                            this._snackBar.showError('Failed to delete client logo');
                        }
                    },
                    () => {
                        this._snackBar.showError(
                            'Oh no! Server error occurred while deleting the client logo'
                        );
                    },
                    () => {
                        if (!this.isUploadingClientImage && !this.isSaving) {
                            this.clientDialogForm?.enable();
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

    // Creates the page-level form that stores the list of clients shown on screen.
    private generateFormGroup(): void {
        this.entityForm = this._formBuilder.group({
            clients: this._formBuilder.array([]),
        });
    }

    // Creates the modal form used to add or edit one client item at a time.
    private generateClientDialogForm(): void {
        this.clientDialogForm = this._formBuilder.group({
            priority: [1, [Validators.required, Validators.min(1)]],
            name: ['', [Validators.required, Validators.maxLength(150)]],
            image: ['', [Validators.required]],
        });

        this.resetClientDialogForm();
    }

    // Resets the modal form back to a clean default client structure.
    private resetClientDialogForm(): void {
        const emptyClient = this.createEmptyClient();
        this.clientDialogForm?.reset(emptyClient);
        this.clientImagePreview = '';
    }

    // Prefills the modal form with the values from an existing client item.
    private patchClientDialogForm(client: IClientItem): void {
        this.clientDialogForm?.patchValue(client);
        this.clientImagePreview = this.resolveImageUrl(client.image);
    }

    // Returns the default client object used for a brand-new modal state.
    private createEmptyClient(): IClientItem {
        return {
            priority: 1,
            name: '',
            image: '',
        };
    }

    // Converts one client object into the reactive form shape used on the page.
    private createClientGroup(client: IClientItem): UntypedFormGroup {
        return this._formBuilder.group({
            priority: [client.priority, [Validators.required, Validators.min(1)]],
            name: [client.name, [Validators.required]],
            image: [client.image, [Validators.required]],
        });
    }

    // Rebuilds the API client structure from the flat form values.
    private mapFormValueToClient(formValue: any): IClientItem {
        return {
            priority:
                formValue?.priority === 0 || formValue?.priority
                    ? Number(formValue.priority)
                    : null,
            name: formValue?.name || '',
            image: formValue?.image || '',
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

    // Loads the stored clients row and maps its JSON content into the page form.
    private loadClients(): void {
        this.isLoading = true;

        this._homeService.getClients().subscribe(
            (response: any) => {
                if (response?.status) {
                    const record = this.extractClientsRecord(response);
                    this.clientsRecordId = record.id || '';
                    this.clientsPageId = record.pageId || '1';
                    this.clientsSectionKey = record.section || 'clients';
                    this.replaceFormArray(
                        this.clients,
                        record.content.map((client) => this.createClientGroup(client))
                    );
                } else {
                    this.replaceFormArray(this.clients, []);
                    this._snackBar.showError('Failed to fetch clients.');
                }
            },
            () => {
                this.replaceFormArray(this.clients, []);
                this._snackBar.showError(
                    'Oh no! Server error occurred while fetching clients'
                );
            },
            () => {
                this.isLoading = false;
            }
        );
    }

    // Extracts the row metadata and clients content array from the API response.
    private extractClientsRecord(response: any): IClientsRecord {
        const data = response?.data || {};
        const content = Array.isArray(data?.content) ? data.content : [];

        return {
            id: data?.id ? String(data.id) : '',
            pageId: data?.pageId ? String(data.pageId) : '1',
            section: data?.section || 'clients',
            content: this.sortClientsByPriority(content)
                .map((item) => this.normalizeClientItem(item))
                .filter(Boolean),
        };
    }

    // Normalizes one raw client item so the UI always works with a complete safe structure.
    private normalizeClientItem(item: any): IClientItem {
        return {
            priority:
                item?.priority === 0 || item?.priority
                    ? Number(item.priority)
                    : null,
            name: item?.name || '',
            image: item?.image || '',
        };
    }

    // Converts the uploaded file name into the stored client image path format.
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

        return `assets/images/client/${imageNameOrPath}`;
    }

    // Provides a fallback preview image while no real logo is available.
    private getFallbackPreviewImage(): string {
        return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='220' viewBox='0 0 320 220'%3E%3Crect width='320' height='220' fill='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2364758b' font-family='Arial, sans-serif' font-size='18'%3EClient Logo Preview%3C/text%3E%3C/svg%3E";
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

    // Reads the current clients list from the page form and converts it back to API shape.
    private getCurrentClients(): IClientItem[] {
        return this.clients.controls.map((control) =>
            this.mapFormValueToClient(control.getRawValue())
        );
    }

    // Inserts the new or updated client into the requested priority position and shifts others accordingly.
    private buildNextClientsState(client: IClientItem): IClientItem[] {
        const clients = this.getCurrentClients();

        if (
            this.clientDialogMode === 'edit' &&
            this.selectedClientIndex !== null
        ) {
            clients.splice(this.selectedClientIndex, 1);
        }

        const targetPriority = Math.min(
            Math.max(Number(client.priority) || 1, 1),
            clients.length + 1
        );

        clients.splice(targetPriority - 1, 0, {
            ...client,
            priority: targetPriority,
        });

        return clients.map((item, index) => ({
            ...item,
            priority: index + 1,
        }));
    }

    // Wraps the full clients array with record metadata before sending it to the backend.
    private buildClientsPayload(content: IClientItem[]): IClientsRecord {
        return {
            id: this.clientsRecordId || undefined,
            pageId: this.clientsPageId || '1',
            section: this.clientsSectionKey || 'clients',
            content: content.map((item, index) => ({
                ...item,
                priority: index + 1,
            })),
        };
    }

    // Persists the full clients collection for add, update, and delete flows.
    private persistClientsCollection(
        clients: IClientItem[],
        successMessage: string,
        failureMessage: string,
        serverErrorMessage: string,
        onSuccess?: () => void
    ): void {
        if (!this.clientsRecordId) {
            this._snackBar.showError(
                'Clients record was not loaded, so update cannot be completed.'
            );
            return;
        }

        const payload = this.buildClientsPayload(clients);
        this.isSaving = true;

        if (this.clientDialogRef) {
            this.clientDialogForm?.disable();
        }

        this._homeService.updateClients(payload).subscribe(
            (response: any) => {
                if (response?.status) {
                    this._snackBar.showSuccess(successMessage);
                    onSuccess?.();
                    this.loadClients();
                } else {
                    this._snackBar.showError(failureMessage);
                }
            },
            () => {
                this._snackBar.showError(serverErrorMessage);
            },
            () => {
                this.isSaving = false;
                if (this.clientDialogForm?.disabled) {
                    this.clientDialogForm.enable();
                }
            }
        );
    }

    // Sorts clients by ascending priority while keeping empty priorities at the end.
    private sortClientsByPriority(clients: any[]): any[] {
        return [...clients].sort((leftClient, rightClient) => {
            const leftPriority =
                leftClient?.priority === 0 || leftClient?.priority
                    ? Number(leftClient.priority)
                    : Number.MAX_SAFE_INTEGER;
            const rightPriority =
                rightClient?.priority === 0 || rightClient?.priority
                    ? Number(rightClient.priority)
                    : Number.MAX_SAFE_INTEGER;

            return leftPriority - rightPriority;
        });
    }

    // Returns the next priority number for a newly added client.
    private getNextClientPriority(): number {
        const priorities = this.clients.controls
            .map((control) => Number(control.get('priority')?.value))
            .filter((priority) => Number.isFinite(priority) && priority > 0);

        if (!priorities.length) {
            return 1;
        }

        return Math.max(...priorities) + 1;
    }

    // Deletes the removed client logo from the server after the client JSON update succeeds.
    private deleteClientLogoFromServer(imagePath: string): void {
        const fileName = this.extractFileName(imagePath);

        if (!fileName) {
            return;
        }

        this._homeService.deletePhoto(fileName, this.PHOTO_TYPE.CLIENTS).subscribe(
            (response) => {
                if (!response) {
                    this._snackBar.showError(
                        'Client was deleted, but the logo could not be removed from the server.'
                    );
                }
            },
            () => {
                this._snackBar.showError(
                    'Client was deleted, but a server error occurred while deleting the logo.'
                );
            }
        );
    }
}
