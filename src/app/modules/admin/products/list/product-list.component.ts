import {
    AsyncPipe,
    CommonModule,
    NgClass,
    NgTemplateOutlet,
} from '@angular/common';
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import {
    FormsModule,
    ReactiveFormsModule,
    UntypedFormBuilder,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatOptionModule, MatRippleModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { SnackBarService } from 'app/core/general/snackbar.service';
import { PipesModule } from 'app/pipes/pipes.module';
import { environment } from 'environments/environment.prod';
import { Observable } from 'rxjs';
import { Product } from '../product.types';
import { ProductsService } from '../products.service';
import { project } from 'app/mock-api/dashboards/project/data';

@Component({
    selector: 'app-product-list',
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
    NgClass,
    MatSlideToggleModule,
    MatSelectModule,
    MatOptionModule,
    MatCheckboxModule,
    MatRippleModule,
    MatProgressSpinnerModule,
    AsyncPipe,
    MatSnackBarModule,
    PipesModule,
    MatTooltipModule,
    MatTabsModule,
    CommonModule,
    MatTableModule,
    RouterModule,
    ReactiveFormsModule
],
    templateUrl: './product-list.component.html',
    styleUrl: './product-list.component.scss',
})
export class ProductListComponent {
    @ViewChild(MatSort) private _sort: MatSort = null;

    products$: Observable<Product[] | null> | undefined;
    isLoading: boolean = false;
    query = '';
    readonly baseURL = environment.apiBaseUrl;

    constructor(
        private route: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _matDialog: MatDialog,
        private _formBuilder: UntypedFormBuilder,
        private _productService: ProductsService,
        private _snackBar: SnackBarService
    ) {}

    ngOnInit(): void {
        this.products$ = this._productService.products$;
    }

    ngAfterViewInit(): void {
        if (this._sort) {
            // Set the initial sort
            this._sort.sort({
                id: 'title',
                start: 'asc',
                disableClear: true,
            });
            // Mark for check
            this._changeDetectorRef.detectChanges();
        }
    }

    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    showHideEntity(product: Product): void {
        let message: any = {
            title: 'Hide Product',
            message: 'Are you sure you want to the hide this Product?',
        };

        if (Number(product.disabled) === 1) {
            message.title = 'Show Product';
            message.message =
                'Are you sure you want to the make this Product visible?';
        }

        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title: message.title,
            message: message.message,
            actions: {
                confirm: {
                    label: 'Confirm',
                },
            },
        });

        // Subscribe to the confirmation dialog closed action
        confirmation.afterClosed().subscribe((result) => {
            // If the confirm button pressed...
            if (result === 'confirmed') {
                // Delete the shift on the server
                this._productService
                    .showHideProduct(product)
                    .subscribe((response: any) => {
                        if (response.status) {
                            this._snackBar.showSuccess(
                                'Product updated successfully'
                            );
                        } else {
                            this._snackBar.showError(
                                'Failed to show/hide Product'
                            );
                        }
                    });
            }
        });
    }
}
