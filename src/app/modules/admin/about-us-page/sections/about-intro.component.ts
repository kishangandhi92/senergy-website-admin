import { CdkScrollable } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    AbstractControl,
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    ValidationErrors,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SnackBarService } from 'app/core/general/snackbar.service';
import { QuillModule } from 'ngx-quill';
import { AboutUsPageService } from '../about-us-page.service';
import { IAboutIntroRecord, IAboutIntroSection } from '../about-us-page.types';

@Component({
    selector: 'app-about-us-page-intro',
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
        MatOptionModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatSnackBarModule,
        QuillModule,
    ],
    templateUrl: './about-intro.component.html',
})
export class AboutIntroComponent implements OnInit {
    entityForm: UntypedFormGroup | undefined;
    isLoading = false;
    isSaving = false;
    aboutIntroRecord: IAboutIntroRecord | null = null;

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _snackBar: SnackBarService,
        private _aboutUsPageService: AboutUsPageService
    ) {}

    // Builds the form and loads the stored About Intro JSON when the page opens.
    ngOnInit(): void {
        this.generateFormGroup();
        this.loadAboutIntro();
    }

    // Saves the full About Intro JSON back to the backend.
    updateAboutIntro(): void {
        if (this.entityForm?.invalid || this.isLoading || this.isSaving) {
            this.entityForm?.markAllAsTouched();
            return;
        }

        const payload = this.buildAboutIntroPayload();
        this.isSaving = true;

        this._aboutUsPageService.updateAboutIntro(payload).subscribe(
            (response: any) => {
                const normalizedResponse =
                    response?.status || response?.data
                        ? response?.data || payload
                        : response || payload;

                if (response?.status !== false) {
                    this.aboutIntroRecord = this.normalizeAboutIntroRecord(
                        normalizedResponse
                    );
                    this.patchFormValues(
                        this.aboutIntroRecord.content
                    );
                    this._snackBar.showSuccess(
                        'About Intro section updated successfully'
                    );
                } else {
                    this._snackBar.showError(
                        'Failed to update About Intro section'
                    );
                }
            },
            () => {
                this._snackBar.showError(
                    'Oh no! Server error occurred while updating the About Intro section'
                );
            },
            () => {
                this.isSaving = false;
            }
        );
    }

    // Creates the page form for the single About Intro section.
    private generateFormGroup(): void {
        this.entityForm = this._formBuilder.group({
            badge: ['', [Validators.required, Validators.maxLength(100)]],
            title: ['', [Validators.required, Validators.maxLength(200)]],
            description: ['', [Validators.required, this.validateRichTextRequired]],
            buttonLabel: ['', [Validators.required, Validators.maxLength(120)]],
            buttonLink: ['', [Validators.required, Validators.maxLength(255)]],
            buttonTarget: ['_self', [Validators.required]],
        });
    }

    // Loads the stored About Intro data from the backend and patches it into the page form.
    private loadAboutIntro(): void {
        this.isLoading = true;

        this._aboutUsPageService.getAboutIntro().subscribe(
            (response: any) => {
                const normalizedResponse =
                    response?.status || response?.data
                        ? response?.data
                        : response;

                if (response?.status !== false && normalizedResponse) {
                    this.aboutIntroRecord =
                        this.normalizeAboutIntroRecord(normalizedResponse);
                    this.patchFormValues(this.aboutIntroRecord.content);
                } else {
                    this.aboutIntroRecord = null;
                    this.patchFormValues(this.createDefaultAboutIntroSection());
                    this._snackBar.showError(
                        'Failed to fetch About Intro section.'
                    );
                }
            },
            () => {
                this.aboutIntroRecord = null;
                this.patchFormValues(this.createDefaultAboutIntroSection());
                this._snackBar.showError(
                    'Oh no! Server error occurred while fetching the About Intro section'
                );
            },
            () => {
                this.isLoading = false;
            }
        );
    }

    // Patches the fetched About Intro data into the page form.
    private patchFormValues(data: IAboutIntroSection): void {
        this.entityForm?.patchValue({
            badge: data.badge,
            title: data.content.title,
            description: data.content.description,
            buttonLabel: data.button.label,
            buttonLink: data.button.link,
            buttonTarget: data.button.target,
        });
    }

    // Builds the PUT payload by combining persisted row metadata with the latest form values.
    private buildAboutIntroPayload(): IAboutIntroRecord {
        return {
            id: this.aboutIntroRecord?.id,
            pageId: this.aboutIntroRecord?.pageId,
            section: this.aboutIntroRecord?.section || 'about',
            content: this.mapFormValueToAboutIntroSection(
                this.entityForm?.getRawValue()
            ),
        };
    }

    // Converts the current reactive form value into the exact JSON shape expected by the API.
    private mapFormValueToAboutIntroSection(formValue: any): IAboutIntroSection {
        return {
            badge: formValue?.badge || '',
            content: {
                title: formValue?.title || '',
                description: this.normalizeRichTextHtml(
                    formValue?.description || ''
                ),
            },
            button: {
                label: formValue?.buttonLabel || '',
                link: formValue?.buttonLink || '',
                target: formValue?.buttonTarget === '_blank' ? '_blank' : '_self',
            },
        };
    }

    // Normalizes the raw About Intro payload so the form always gets a safe complete structure.
    private normalizeAboutIntroSection(payload: any): IAboutIntroSection {
        const sectionPayload = this.extractAboutIntroSectionPayload(payload);

        return {
            badge: sectionPayload?.badge || '',
            content: {
                title: sectionPayload?.content?.title || '',
                description: this.normalizeRichTextHtml(
                    sectionPayload?.content?.description || ''
                ),
            },
            button: {
                label: sectionPayload?.button?.label || '',
                link: sectionPayload?.button?.link || '',
                target:
                    sectionPayload?.button?.target === '_blank'
                        ? '_blank'
                        : '_self',
            },
        };
    }

    // Normalizes the fetched row metadata and nested content structure from the API response.
    private normalizeAboutIntroRecord(payload: any): IAboutIntroRecord {
        return {
            id: payload?.id || '',
            pageId: payload?.pageId || '',
            section: payload?.section || 'about',
            content: this.normalizeAboutIntroSection(payload),
        };
    }

    // Extracts the actual About Intro section object from either a direct section response or a row-wrapped response.
    private extractAboutIntroSectionPayload(payload: any): any {
        if (payload?.badge || payload?.button || payload?.content?.title) {
            return payload;
        }

        return payload?.content || {};
    }

    // Returns the default empty About Intro section used for fallback states.
    private createDefaultAboutIntroSection(): IAboutIntroSection {
        return {
            badge: '',
            content: {
                title: '',
                description: '',
            },
            button: {
                label: '',
                link: '',
                target: '_self',
            },
        };
    }

    // Normalizes Quill HTML by converting non-breaking spaces into regular spaces before display or save.
    private normalizeRichTextHtml(html: string): string {
        return String(html || '')
            .replace(/&nbsp;/g, ' ')
            .replace(/\u00a0/g, ' ');
    }

    // Treats empty Quill HTML such as <p><br></p> as missing content for required validation.
    private validateRichTextRequired(control: AbstractControl): ValidationErrors | null {
        const rawValue = control.value;
        const plainText = String(rawValue || '')
            .replace(/<(.|\n)*?>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .trim();

        return plainText ? null : { required: true };
    }
}
