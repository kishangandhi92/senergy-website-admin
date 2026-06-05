import { CdkScrollable } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
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
import { SnackBarService } from 'app/core/general/snackbar.service';
import { AboutUsPageService } from '../about-us-page.service';
import {
    IMissionVisionRecord,
    IMissionVisionSection,
} from '../about-us-page.types';

@Component({
    selector: 'app-about-us-page-mission-vision',
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
    ],
    templateUrl: './mission-vision.component.html',
})
export class MissionVisionComponent implements OnInit {
    entityForm: UntypedFormGroup | undefined;
    isLoading = false;
    isSaving = false;
    missionVisionRecord: IMissionVisionRecord | null = null;

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _snackBar: SnackBarService,
        private _aboutUsPageService: AboutUsPageService
    ) {}

    // Builds the form and loads the stored Mission and Vision JSON when the page opens.
    ngOnInit(): void {
        this.generateFormGroup();
        this.loadMissionVision();
    }

    // Saves the full Mission and Vision JSON back to the backend.
    updateMissionVision(): void {
        if (this.entityForm?.invalid || this.isLoading || this.isSaving) {
            this.entityForm?.markAllAsTouched();
            return;
        }

        const payload = this.buildMissionVisionPayload();
        this.isSaving = true;

        this._aboutUsPageService.updateMissionVision(payload).subscribe(
            (response: any) => {
                const normalizedResponse =
                    response?.status || response?.data
                        ? response?.data || payload
                        : response || payload;

                if (response?.status !== false) {
                    this.missionVisionRecord =
                        this.normalizeMissionVisionRecord(normalizedResponse);
                    this.patchFormValues(this.missionVisionRecord.content);
                    this._snackBar.showSuccess(
                        'Mission and Vision section updated successfully'
                    );
                } else {
                    this._snackBar.showError(
                        'Failed to update Mission and Vision section'
                    );
                }
            },
            () => {
                this._snackBar.showError(
                    'Oh no! Server error occurred while updating the Mission and Vision section'
                );
            },
            () => {
                this.isSaving = false;
            }
        );
    }

    // Creates the page form for the Mission and Vision section.
    private generateFormGroup(): void {
        this.entityForm = this._formBuilder.group({
            missionTitle: ['', [Validators.required, Validators.maxLength(150)]],
            missionDescription: [
                '',
                [Validators.required, Validators.maxLength(500)],
            ],
            visionTitle: ['', [Validators.required, Validators.maxLength(150)]],
            visionDescription: [
                '',
                [Validators.required, Validators.maxLength(500)],
            ],
        });
    }

    // Loads the stored Mission and Vision data from the backend and patches it into the page form.
    private loadMissionVision(): void {
        this.isLoading = true;

        this._aboutUsPageService.getMissionVision().subscribe(
            (response: any) => {
                const normalizedResponse =
                    response?.status || response?.data
                        ? response?.data
                        : response;

                if (response?.status !== false && normalizedResponse) {
                    this.missionVisionRecord =
                        this.normalizeMissionVisionRecord(normalizedResponse);
                    this.patchFormValues(this.missionVisionRecord.content);
                } else {
                    this.missionVisionRecord = null;
                    this.patchFormValues(
                        this.createDefaultMissionVisionSection()
                    );
                    this._snackBar.showError(
                        'Failed to fetch Mission and Vision section.'
                    );
                }
            },
            () => {
                this.missionVisionRecord = null;
                this.patchFormValues(this.createDefaultMissionVisionSection());
                this._snackBar.showError(
                    'Oh no! Server error occurred while fetching the Mission and Vision section'
                );
            },
            () => {
                this.isLoading = false;
            }
        );
    }

    // Patches the fetched Mission and Vision data into the page form.
    private patchFormValues(data: IMissionVisionSection): void {
        this.entityForm?.patchValue({
            missionTitle: data.mission.title,
            missionDescription: data.mission.description,
            visionTitle: data.vision.title,
            visionDescription: data.vision.description,
        });
    }

    // Builds the PUT payload by combining persisted row metadata with the latest form values.
    private buildMissionVisionPayload(): IMissionVisionRecord {
        return {
            id: this.missionVisionRecord?.id,
            pageId: this.missionVisionRecord?.pageId,
            section: this.missionVisionRecord?.section || 'mission-vision',
            content: this.mapFormValueToMissionVisionSection(
                this.entityForm?.getRawValue()
            ),
        };
    }

    // Converts the current reactive form value into the exact JSON shape expected by the API.
    private mapFormValueToMissionVisionSection(
        formValue: any
    ): IMissionVisionSection {
        return {
            mission: {
                title: formValue?.missionTitle || '',
                description: formValue?.missionDescription || '',
            },
            vision: {
                title: formValue?.visionTitle || '',
                description: formValue?.visionDescription || '',
            },
        };
    }

    // Normalizes the fetched row metadata and nested content structure from the API response.
    private normalizeMissionVisionRecord(payload: any): IMissionVisionRecord {
        return {
            id: payload?.id || '',
            pageId: payload?.pageId || '',
            section: payload?.section || 'mission-vision',
            content: this.normalizeMissionVisionSection(payload),
        };
    }

    // Normalizes the raw Mission and Vision payload so the form always gets a safe complete structure.
    private normalizeMissionVisionSection(payload: any): IMissionVisionSection {
        const sectionPayload = this.extractMissionVisionSectionPayload(payload);

        return {
            mission: this.normalizeMissionVisionItem(
                sectionPayload?.mission,
                'Mission'
            ),
            vision: this.normalizeMissionVisionItem(
                sectionPayload?.vision,
                'Vision'
            ),
        };
    }

    // Extracts the actual Mission and Vision section object from either a direct section response or a row-wrapped response.
    private extractMissionVisionSectionPayload(payload: any): any {
        if (payload?.mission || payload?.vision) {
            return payload;
        }

        return payload?.content || {};
    }

    // Normalizes one Mission/Vision item and supports the older string-only description payload.
    private normalizeMissionVisionItem(
        item: any,
        fallbackTitle: string
    ): { title: string; description: string } {
        if (typeof item === 'string') {
            return {
                title: fallbackTitle,
                description: item,
            };
        }

        return {
            title: item?.title || fallbackTitle,
            description: item?.description || '',
        };
    }

    // Returns the default empty Mission and Vision section used for fallback states.
    private createDefaultMissionVisionSection(): IMissionVisionSection {
        return {
            mission: {
                title: 'Mission',
                description: '',
            },
            vision: {
                title: 'Vision',
                description: '',
            },
        };
    }
}
