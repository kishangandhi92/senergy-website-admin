import { CdkScrollable } from '@angular/cdk/scrolling';
import { AsyncPipe, CommonModule, NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, OnInit, QueryList, ViewChildren } from '@angular/core';
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
import { FuseAlertComponent } from '@fuse/components/alert';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { PipesModule } from 'app/pipes/pipes.module';
import { QuillModule } from 'ngx-quill';
import { HomeService } from '../home.service';
import { IStatItem, IStatsRecord } from '../home.types';
import { SnackBarService } from 'app/core/general/snackbar.service';

@Component({
    selector: 'app-home-stats',
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
    QuillModule,
    FuseAlertComponent,
    CdkScrollable
],
    templateUrl: './stats.component.html',
})
export class StatsComponent implements OnInit {
    @ViewChildren('counterCard') counterCards!: QueryList<ElementRef<HTMLDivElement>>;

    entityForm: UntypedFormGroup;
    isLoading = false;
    isSaving = false;
    statsRecord: IStatsRecord | null = null;

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _snackBar: SnackBarService,
        private _homeService: HomeService
    ) {}

    // Builds the page form and loads the stored stats JSON when the page opens.
    ngOnInit(): void {
        this.generateFormGroup();
        this.loadStats();
    }

    // Exposes the counter list form array to the template.
    get counterForms(): UntypedFormArray {
        return this.entityForm.get('counters') as UntypedFormArray;
    }

    // Adds another counter card while keeping the maximum of eight.
    addCounter(): void {
        if (this.counterForms.length >= 8 || this.isLoading || this.isSaving) {
            return;
        }

        this.counterForms.push(this.createCounterGroup(this.createEmptyCounter()));
        this.scrollToLatestCounter();
    }

    // Removes a counter card while keeping the required minimum of three and auto-saves after confirmation.
    removeCounter(index: number): void {
        if (this.counterForms.length <= 3 || this.isLoading || this.isSaving) {
            return;
        }

        if (!this.statsRecord?.id) {
            this._snackBar.showError('Stats record was not loaded, so remove cannot be completed.');
            return;
        }

        const confirmation = this._fuseConfirmationService.open({
            title: 'Remove Counter',
            message:
                'Are you sure you want to remove this counter? The section will be saved automatically after confirmation.',
            actions: {
                confirm: {
                    label: 'Yes, Remove',
                },
            },
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result !== 'confirmed') {
                return;
            }

            this.counterForms.removeAt(index);

            if (this.entityForm.invalid) {
                this._snackBar.showError(
                    'Counter was removed locally, but the form still has validation errors so auto-save could not run.'
                );
                return;
            }

            this.persistStatsUpdate(
                this.buildStatsPayload(),
                'Counter removed and saved successfully'
            );
        });
    }

    // Sends the full stats JSON back to the backend using the existing row id and section metadata.
    updateStats(): void {
        this.commitActiveFieldValue();

        setTimeout(() => {
            if (this.entityForm.invalid || this.isLoading || this.isSaving) {
                this.entityForm.markAllAsTouched();
                return;
            }

            if (!this.statsRecord?.id) {
                this._snackBar.showError(
                    'Stats record was not loaded, so update cannot be completed.'
                );
                return;
            }

            const currentCounters = this.getCurrentCounters();
            this.persistStatsUpdate(
                this.buildStatsPayload(currentCounters),
                'Stats updated successfully'
            );
        });
    }

    // Creates the page form with the repeatable counter array.
    private generateFormGroup(): void {
        this.entityForm = this._formBuilder.group({
            counters: this._formBuilder.array([]),
        });
    }

    // Loads the stored stats data from the backend and patches it into the page form.
    private loadStats(): void {
        this.isLoading = true;

        this._homeService.getStats().subscribe(
            (response: any) => {
                if (response?.status && response?.data) {
                    this.statsRecord = this.normalizeStatsRecord(response.data);
                    this.patchFormValues(this.statsRecord.content);
                } else {
                    this.statsRecord = null;
                    this.patchFormValues(this.createDefaultStatsContent());
                    this._snackBar.showError('Failed to fetch stats section.');
                }
            },
            () => {
                this.statsRecord = null;
                this.patchFormValues(this.createDefaultStatsContent());
                this._snackBar.showError(
                    'Oh no! Server error occurred while fetching the stats section'
                );
            },
            () => {
                this.isLoading = false;
            }
        );
    }

    // Patches the fetched stats data into the form and rebuilds the counter form array.
    private patchFormValues(data: IStatItem[]): void {
        this.replaceFormArray(
            this.counterForms,
            data.map((counter) => this.createCounterGroup(counter))
        );
    }

    // Builds the PUT payload by combining the persisted row metadata with the latest form values.
    private buildStatsPayload(countersSnapshot?: IStatItem[]): IStatsRecord {
        const counters = countersSnapshot || this.getCurrentCounters();

        return {
            id: this.statsRecord?.id,
            pageId: this.statsRecord?.pageId,
            section: this.statsRecord?.section || 'stats',
            content: counters,
        };
    }

    // Persists the full stats row to the backend and refreshes the form with the saved response.
    private persistStatsUpdate(payload: IStatsRecord, successMessage: string): void {
        const requestPayload: IStatsRecord = {
            ...payload,
            content: payload.content.map((counter) => ({ ...counter })),
        };

        this.isSaving = true;

        this._homeService.updateStats(requestPayload).subscribe(
            (response: any) => {
                if (response?.status) {
                    this.statsRecord = {
                        id: requestPayload.id,
                        pageId: requestPayload.pageId,
                        section: requestPayload.section,
                        content: requestPayload.content.map((counter) => ({ ...counter })),
                    };
                    this._snackBar.showSuccess(successMessage);
                } else {
                    this._snackBar.showError('Failed to update stats section');
                }
            },
            () => {
                this._snackBar.showError(
                    'Oh no! Server error occurred while updating the stats section'
                );
            },
            () => {
                this.isSaving = false;
            }
        );
    }

    // Normalizes the fetched row metadata and nested content structure from the API response.
    private normalizeStatsRecord(payload: any): IStatsRecord {
        return {
            id: payload?.id || '',
            pageId: payload?.pageId || '',
            section: payload?.section || 'stats',
            content: this.normalizeStatsContent(payload?.content),
        };
    }

    // Normalizes the raw API payload so the form always gets at least three and at most eight counters.
    private normalizeStatsContent(payload: any): IStatItem[] {
        const counters = Array.isArray(payload) ? payload.slice(0, 8) : [];

        while (counters.length < 3) {
            counters.push(this.createEmptyCounter());
        }

        return counters.map((counter) => this.normalizeCounter(counter));
    }

    // Normalizes one raw counter item into the exact structure expected by the form.
    private normalizeCounter(counter: any): IStatItem {
        return {
            count: counter?.count ? String(counter.count) : '',
            title: counter?.title || '',
            description: counter?.description || '',
        };
    }

    // Returns an empty counter object used when the backend has fewer than three items.
    private createEmptyCounter(): IStatItem {
        return {
            count: '',
            title: '',
            description: '',
        };
    }

    // Returns the default empty stats content used for fallback states.
    private createDefaultStatsContent(): IStatItem[] {
        return [
            this.createEmptyCounter(),
            this.createEmptyCounter(),
            this.createEmptyCounter(),
        ];
    }

    // Converts one counter object into the reactive form group used on the page.
    private createCounterGroup(counter: IStatItem): UntypedFormGroup {
        return this._formBuilder.group({
            count: [
                counter.count,
                [Validators.required, Validators.pattern(/^\d+$/), Validators.maxLength(10)],
            ],
            title: [counter.title, [Validators.required, Validators.maxLength(120)]],
            description: [
                counter.description,
                [Validators.required, Validators.maxLength(220)],
            ],
        });
    }

    // Replaces every counter form group with a fresh set from the latest data source.
    private replaceFormArray(targetArray: UntypedFormArray, controls: UntypedFormGroup[]): void {
        const shouldKeepDisabled = targetArray.disabled;

        while (targetArray.length) {
            targetArray.removeAt(0);
        }

        controls.forEach((control) => {
            if (shouldKeepDisabled) {
                control.disable({ emitEvent: false });
            } else {
                control.enable({ emitEvent: false });
            }

            targetArray.push(control);
        });
    }

    // Scrolls the newest counter card into view so the added empty form is immediately visible.
    private scrollToLatestCounter(): void {
        setTimeout(() => {
            const latestCard = this.counterCards?.last?.nativeElement;
            latestCard?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        });
    }

    // Forces the latest control values to settle before building the save payload.
    private syncCounterFormValues(): void {
        this.counterForms.controls.forEach((control) =>
            control.updateValueAndValidity({ onlySelf: false, emitEvent: false })
        );
        this.entityForm.updateValueAndValidity({ onlySelf: false, emitEvent: false });
    }

    // Captures the complete latest stats array from all counter controls before save.
    private getCurrentCounters(): IStatItem[] {
        this.syncCounterFormValues();

        return this.counterForms.controls.slice(0, 8).map((control) => {
            const counterGroup = control as UntypedFormGroup;

            return {
                count: String(counterGroup.get('count')?.value ?? '').trim(),
                title: String(counterGroup.get('title')?.value ?? '').trim(),
                description: String(counterGroup.get('description')?.value ?? '').trim(),
            };
        });
    }

    // Forces the currently focused input to commit its latest value before the payload is built.
    private commitActiveFieldValue(): void {
        const activeElement = document.activeElement as HTMLElement | null;
        activeElement?.blur();
    }
}
