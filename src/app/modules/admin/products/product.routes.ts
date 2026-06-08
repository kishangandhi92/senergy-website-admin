import { Routes } from '@angular/router';
import { ProductsComponent } from './products.component';
import { ProductListComponent } from './list/product-list.component';
import { ProductDetailsComponent } from './details/product-details.component';
import { ProductsService } from './products.service';
import { inject } from '@angular/core';

export default [
    {
        path: '',
        component: ProductsComponent,
        children: [
            {
                path: '',
                component: ProductListComponent,
                resolve: {
                    products: () => inject(ProductsService).getProducts()
                }
            },
            {
                path: 'details/:id',
                component: ProductDetailsComponent,
                data: { mode: 'EDIT'}
            },
            {
                path: 'create',
                component: ProductDetailsComponent,
                data: { mode: 'CREATE'}
            },
        ],
    },
] as Routes;
