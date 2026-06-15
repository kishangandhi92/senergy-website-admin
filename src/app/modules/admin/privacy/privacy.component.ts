import {
    AsyncPipe,
    CommonModule,
    NgClass,
    NgTemplateOutlet,
} from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
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
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { SnackBarService } from 'app/core/general/snackbar.service';
import { PipesModule } from 'app/pipes/pipes.module';
import { environment } from 'environments/environment';
import { QuillModule } from 'ngx-quill';
import { Subject, Subscription } from 'rxjs';
import { PrivacyService } from './privacy.service';

@Component({
    selector: 'app-privacy',
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
    templateUrl: './privacy.component.html',
    styleUrl: './privacy.component.scss',
})
export class PrivacyComponent implements OnInit, OnDestroy {
    entityForm: UntypedFormGroup;
    subscription: Subscription = null;
    public readonly baseURL = environment.apiBaseUrl;
    private destroy$ = new Subject<void>(); // To clean up subscriptions

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _snackBar: SnackBarService,
        private _fuseConfirmationService: FuseConfirmationService,
        private _privacyService: PrivacyService
    ) {}

    ngOnInit(): void {
        this.generateFormGroup();
        this.getDetails();
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
        this.destroy$?.next();
        this.destroy$?.complete();
    }

    generateFormGroup() {
        this.entityForm = this._formBuilder.group({
            privacy: ['', [Validators.required]],
        });
    }

    getDetails() {
        this.subscription = this._privacyService.getDetails().subscribe(
            (response: any) => {
                if (response.status) {
                    this.patchFormValues(response.data);
                } else {
                    this._snackBar.showError(
                        'Oh no! Something went wrong in fetching Details. Please try again later'
                    );
                }
            },
            (error) => {
                this._snackBar.showError(
                    'Oh no! Server error occured while fetching the Details'
                );
            }
        );
    }

    patchFormValues(data) {
        this.entityForm.patchValue({
            privacy: data?.content?.content || '',
        });
    }

    updateSelectedEntity() {
        // Return if the form is invalid
        if (this.entityForm.invalid) {
            return;
        }

        // Disable the form
        this.entityForm.disable();

        const formValues = this.entityForm.value;

        const requestObj = {
            content: {
                content: this.normalizeRichTextContent(formValues.privacy),
            },
        };

        this._privacyService.update(requestObj).subscribe(
            (response: any) => {
                if (response?.status) {
                    this._snackBar.showSuccess('Details updated successfully');
                } else {
                    this._snackBar.showError('Failed to update details.');
                }
            },
            (error) => {
                this._snackBar.showError(
                    'Oh no! Server error occured while updating Details'
                );
            }, () => {
                this.entityForm.enable();
            }
        );
    }

    private normalizeRichTextContent(value: string): string {
        return String(value || '')
            .replace(/&nbsp;/gi, ' ')
            .replace(/\u00a0/g, ' ');
    }
}
