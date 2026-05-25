import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { ProductsComponent } from './products.component';
import { ProductService } from './product.service';

export default [
    {
        path: '',
        component: ProductsComponent,
         resolve: {
                 products: () => inject(ProductService).getAll(),
            },
    },
] as Routes;
