import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { ServicesComponent } from './services.component';
import { ServicesService } from './services.service';

export default [
    {
            path     : '',
            component: ServicesComponent,
            resolve: {
                 services: () => inject(ServicesService).getAll(),
            },
        },
] as Routes;
