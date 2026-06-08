import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { AsyncPipe, CommonModule, NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { SnackBarService } from 'app/core/general/snackbar.service';
import { PipesModule } from 'app/pipes/pipes.module';
import { environment } from 'environments/environment.prod';
import { finalize, Observable, take } from 'rxjs';
import { Product, ProductOrderUpdate } from '../product.types';
import { ProductsService } from '../products.service';

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
        MatDialogModule,
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
        DragDropModule,
    ],
    templateUrl: './product-list.component.html',
    styleUrl: './product-list.component.scss',
})
export class ProductListComponent {
    @ViewChild(MatSort) private _sort: MatSort = null;
    @ViewChild('ProductOrderDialog') productOrderDialogTemplate:
        | TemplateRef<any>
        | undefined;

    products$: Observable<Product[] | null> | undefined;
    isLoading: boolean = false;
    isReorderSaving = false;
    query = '';
    reorderProducts: Product[] = [];
    productOrderDialogRef = null;
    readonly baseURL = environment.apiBaseUrl;
    private _initialReorderIds: number[] = [];

    constructor(
        private route: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _fuseConfirmationService: FuseConfirmationService,
        private _matDialog: MatDialog,
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

    openProductOrderDialog(): void {
        if (!this.productOrderDialogTemplate || !this.products$) {
            return;
        }

        this.products$
            .pipe(take(1))
            .subscribe((products) => {
                this.reorderProducts = this.buildReorderProducts(products || []);
                this._initialReorderIds = this.reorderProducts.map(
                    (product) => product.id
                );

                this.productOrderDialogRef = this._matDialog.open(
                    this.productOrderDialogTemplate,
                    {
                        width: '720px',
                        maxWidth: '96vw',
                        disableClose: true,
                    }
                );

                this.productOrderDialogRef
                    ?.afterClosed()
                    .pipe(take(1))
                    .subscribe(() => {
                        this.reorderProducts = [];
                        this._initialReorderIds = [];
                        this.isReorderSaving = false;
                        this.productOrderDialogRef = null;
                    });
            });
    }

    closeProductOrderDialog(): void {
        if (this.isReorderSaving) {
            return;
        }

        this.productOrderDialogRef?.close();
    }

    dropReorderProduct(event: CdkDragDrop<Product[]>): void {
        if (
            event.previousIndex === event.currentIndex ||
            this.isReorderSaving
        ) {
            return;
        }

        moveItemInArray(
            this.reorderProducts,
            event.previousIndex,
            event.currentIndex
        );
        this.syncReorderProductOrder();
    }

    saveProductOrder(): void {
        if (!this.hasReorderChanges || this.isReorderSaving) {
            return;
        }

        const orderPayload: ProductOrderUpdate[] = this.reorderProducts.map(
            (product, index) => ({
                id: product.id,
                order: index + 1,
            })
        );

        this.isReorderSaving = true;

        this._productService
            .updateProductOrders(orderPayload)
            .pipe(
                take(1),
                finalize(() => {
                    this.isReorderSaving = false;
                    this._changeDetectorRef.markForCheck();
                })
            )
            .subscribe({
                next: (response: any) => {
                    if (response?.status === false) {
                        this._snackBar.showError(
                            'Failed to update product order'
                        );
                        return;
                    }

                    this._snackBar.showSuccess(
                        'Product order updated successfully'
                    );
                    this.isReorderSaving = false;
                    this.productOrderDialogRef?.close();
                },
                error: () => {
                    this._snackBar.showError(
                        'Oh no! Server error occurred while updating the product order'
                    );
                },
            });
    }

    showHideEntity(product: Product): void {
        let message: any = {
            title: 'Hide Product',
            message: 'Are you sure you want to the hide this Product?',
        };

        if (Number(product.status) === 0) {
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
                                'Product status updated successfully'
                            );
                        } else {
                            this._snackBar.showError(
                                'Failed to update Product status'
                            );
                        }
                });
            }
        });
    }

    isProductVisible(product: Product): boolean {
        return Number(product?.status) === 1;
    }

    get hasReorderChanges(): boolean {
        if (this.reorderProducts.length !== this._initialReorderIds.length) {
            return false;
        }

        return this.reorderProducts.some(
            (product, index) => product.id !== this._initialReorderIds[index]
        );
    }

    private buildReorderProducts(products: Product[]): Product[] {
        return [...products]
            .sort((leftProduct, rightProduct) => {
                const leftOrder = this.normalizeProductOrder(
                    leftProduct?.order
                );
                const rightOrder = this.normalizeProductOrder(
                    rightProduct?.order
                );

                if (leftOrder !== rightOrder) {
                    return leftOrder - rightOrder;
                }

                return (leftProduct?.title || '').localeCompare(
                    rightProduct?.title || ''
                );
            })
            .map((product, index) => ({
                ...product,
                order: index + 1,
            }));
    }

    private syncReorderProductOrder(): void {
        this.reorderProducts = this.reorderProducts.map((product, index) => ({
            ...product,
            order: index + 1,
        }));
    }

    private normalizeProductOrder(order: number | undefined): number {
        const normalizedOrder = Number(order);

        if (Number.isFinite(normalizedOrder) && normalizedOrder > 0) {
            return normalizedOrder;
        }

        return Number.MAX_SAFE_INTEGER;
    }
}
