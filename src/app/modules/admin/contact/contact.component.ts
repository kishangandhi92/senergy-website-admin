import {
    AsyncPipe,
    CommonModule,
    NgClass,
    NgTemplateOutlet,
} from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
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
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FuseAlertComponent } from '@fuse/components/alert';
import { FuseCardComponent } from '@fuse/components/card';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FILE_UPLOAD } from 'app/constants/upload';
import { SnackBarService } from 'app/core/general/snackbar.service';
import { PipesModule } from 'app/pipes/pipes.module';
import { QuillModule } from 'ngx-quill';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { environment } from 'environments/environment';
import { ContactService } from './contact.service';
import { Contact } from './contact.types';


@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    MatProgressBarModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatOptionModule,
    MatCheckboxModule,
    MatRippleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    PipesModule,
    MatTooltipModule,
    CommonModule
],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements OnInit, OnDestroy {
  entityForm: UntypedFormGroup;
  subscription: Subscription = null;
  isLoading = false;
  isSaving = false;
  safeEmbedMapUrl: SafeResourceUrl | null = null;
  public readonly baseURL = environment.apiBaseUrl;
  private destroy$ = new Subject<void>(); // To clean up subscriptions

  constructor(
      private _formBuilder: UntypedFormBuilder,
      private _snackBar: SnackBarService,
      private _fuseConfirmationService: FuseConfirmationService,
      private _contactService: ContactService,
      private _sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
        this.generateFormGroup();
        this.watchEmbedMapPreview();
        this.getDetails();
    }

    ngOnDestroy(): void {
        this.subscription?.unsubscribe();
        this.destroy$?.next();
        this.destroy$?.complete();
    }

    get emailForms(): UntypedFormArray {
        return this.entityForm.get('emailIds') as UntypedFormArray;
    }

    get contactNumberForms(): UntypedFormArray {
        return this.entityForm.get('contactNumbers') as UntypedFormArray;
    }

    generateFormGroup() {
        this.entityForm = this._formBuilder.group({
            emailIds: this._formBuilder.array(
                [this.createEmailControl()],
                [this.commaSeparatedMaxLengthValidator(250)]
            ),
            contactNumbers: this._formBuilder.array(
                [this.createContactNumberControl()],
                [this.commaSeparatedMaxLengthValidator(250)]
            ),
            workTimings: ['', [Validators.required, Validators.maxLength(250)]],
            address: ['', [Validators.required]],
            googleMapsLink: ['', [Validators.required, Validators.maxLength(250)]],
            embedMapLink: ['', [Validators.required, Validators.maxLength(500)]],
        });
    }

    addEmail(): void {
        this.emailForms.push(this.createEmailControl());
    }

    removeEmail(index: number): void {
        if (this.emailForms.length <= 1) {
            return;
        }

        this.emailForms.removeAt(index);
    }

    addContactNumber(): void {
        this.contactNumberForms.push(this.createContactNumberControl());
    }

    removeContactNumber(index: number): void {
        if (this.contactNumberForms.length <= 1) {
            return;
        }

        this.contactNumberForms.removeAt(index);
    }

    getDetails() {
        this.isLoading = true;
        this.subscription = this._contactService.getDetails().subscribe(
            (response: any) => {
                const contactDetails = this.extractContactPayload(response);

                if (response?.status !== false && contactDetails) {
                    this.patchFormValues(contactDetails);
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
            },
            () => {
                this.isLoading = false;
            }
        );
    }

    patchFormValues(data: Contact) {
        this.entityForm.patchValue({
            workTimings: data.workTimings || '',
            address: data.address,
            googleMapsLink: data.googleMapsLink || '',
            embedMapLink: data.embedMapLink || '',
        });

        this.replaceFormArray(
            this.emailForms,
            this.parseMultiValue(data.emailIds).map((email) =>
                this.createEmailControl(email)
            )
        );
        this.replaceFormArray(
            this.contactNumberForms,
            this.parseMultiValue(data.contactNumbers).map((number) =>
                this.createContactNumberControl(number)
            )
        );
    }

    updateDetails() {
        if (this.entityForm.invalid) {
            this.entityForm.markAllAsTouched();
            return;
        }
        const payload = this.buildContactPayload();
        this.isSaving = true;
        this.entityForm.disable({ emitEvent: false });

        this.subscription = this._contactService
            .update(payload)
            .subscribe(
            (response: any) => {
                if (response?.status !== false) {
                    this._snackBar.showSuccess('Details updated successfully');
                    const savedDetails = this.extractContactPayload(response) || payload;
                    this.patchFormValues(savedDetails);
                } else {
                    this._snackBar.showError('Failed to update details.');
                }
            },
            (error) => {
                this._snackBar.showError(
                    'Oh no! Server error occured while updating Details'
                );
            }, () => {
                this.isSaving = false;
                this.entityForm.enable({ emitEvent: false });
            }
        );
      }

    private createEmailControl(value = '') {
        return this._formBuilder.control(value, [
            Validators.required,
            Validators.email,
            Validators.maxLength(250),
        ]);
    }

    private createContactNumberControl(value = '') {
        return this._formBuilder.control(value, [
            Validators.required,
            Validators.pattern('^[0-9+\\- ()]*$'),
            Validators.maxLength(250),
        ]);
    }

    private replaceFormArray(
        targetArray: UntypedFormArray,
        controls: ReturnType<UntypedFormBuilder['control']>[]
    ): void {
        while (targetArray.length) {
            targetArray.removeAt(0);
        }

        controls.length
            ? controls.forEach((control) => targetArray.push(control))
            : targetArray.push(
                  targetArray === this.emailForms
                      ? this.createEmailControl()
                      : this.createContactNumberControl()
              );
    }

    private buildContactPayload(): Contact {
        const formValue = this.entityForm.getRawValue();

        return {
            emailIds: this.stringifyMultiValue(formValue.emailIds),
            contactNumbers: this.stringifyMultiValue(formValue.contactNumbers),
            workTimings: formValue.workTimings || '',
            address: formValue.address || '',
            googleMapsLink: formValue.googleMapsLink || '',
            embedMapLink: formValue.embedMapLink || '',
        };
    }

    private extractContactPayload(response: any): Contact | null {
        const payload = Array.isArray(response?.data)
            ? response.data[0]
            : response?.data || response;

        if (!payload) {
            return null;
        }

        return {
            emailIds: payload.emailIds || payload.email || '',
            contactNumbers: payload.contactNumbers || payload.phone || '',
            workTimings: payload.workTimings || '',
            address: payload.address || '',
            googleMapsLink: payload.googleMapsLink || payload.mapLink || '',
            embedMapLink: payload.embedMapLink || '',
        };
    }

    private parseMultiValue(value: string): string[] {
        const values = String(value || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

        return values.length ? values : [''];
    }

    private stringifyMultiValue(values: string[]): string {
        return (values || [])
            .map((item) => String(item || '').trim())
            .filter(Boolean)
            .join(', ');
    }

    private commaSeparatedMaxLengthValidator(maxLength: number) {
        return (control: AbstractControl): ValidationErrors | null => {
            const value = Array.isArray(control.value)
                ? this.stringifyMultiValue(control.value)
                : String(control.value || '');

            return value.length <= maxLength
                ? null
                : {
                      commaSeparatedMaxLength: {
                          requiredLength: maxLength,
                          actualLength: value.length,
                      },
                  };
        };
    }

    private watchEmbedMapPreview(): void {
        this.entityForm
            .get('embedMapLink')
            ?.valueChanges.pipe(takeUntil(this.destroy$))
            .subscribe((value) => this.updateEmbedMapPreview(value));
    }

    private updateEmbedMapPreview(value: string): void {
        const embedUrl = this.extractEmbedMapUrl(value);

        this.safeEmbedMapUrl = embedUrl
            ? this._sanitizer.bypassSecurityTrustResourceUrl(embedUrl)
            : null;
    }

    private extractEmbedMapUrl(value: string): string {
        const rawValue = String(value || '').trim();
        const iframeSrc = rawValue.match(/src=["']([^"']+)["']/i)?.[1];
        const embedUrl = (iframeSrc || rawValue).replace(/&amp;/g, '&').trim();

        return /^https?:\/\//i.test(embedUrl) ? embedUrl : '';
    }

}

