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
import { FuseAlertComponent } from '@fuse/components/alert';
import { FuseCardComponent } from '@fuse/components/card';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FILE_UPLOAD } from 'app/constants/upload';
import { SnackBarService } from 'app/core/general/snackbar.service';
import { PipesModule } from 'app/pipes/pipes.module';
import { QuillModule } from 'ngx-quill';
import { Subject, Subscription } from 'rxjs';
import { environment } from 'environments/environment';
import { ContactService } from './contact.service';


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
  public readonly baseURL = environment.apiBaseUrl;
  private destroy$ = new Subject<void>(); // To clean up subscriptions

  constructor(
      private _formBuilder: UntypedFormBuilder,
      private _snackBar: SnackBarService,
      private _fuseConfirmationService: FuseConfirmationService,
      private _contactService: ContactService,
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
            phone: ['', [Validators.required, Validators.pattern('^[0-9+\\- ]*$')]],
            email: ['', [Validators.required, Validators.email]],
            address: ['', [Validators.required]],
            mapLink: ['', [Validators.required, Validators.pattern('^(https?:\\/\\/)?([\\da-z\\.-]+)\\.([a-z\\.]{2,6})([\\/\\w \\.-]*)*\\/?$')]],
        });
    }

    getDetails() {
        this.subscription = this._contactService.getDetails().subscribe(
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
            phone: data.phone,
            email: data.email,
            address: data.address,
            mapLink: data.mapLink,
        });
    }

    updateDetails() {
        if (this.entityForm.invalid) {
            this.entityForm.markAllAsTouched();
            return;
        }
        this.subscription = this._contactService
            .update(this.entityForm.value)
            .subscribe(
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

}

