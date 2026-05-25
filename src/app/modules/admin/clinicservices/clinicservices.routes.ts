import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { ClinicServicesComponent } from './clinicservices.component';
import { ClinicService } from './clinicservices.service';

export default [
    {
        path: '',
        component: ClinicServicesComponent,
        resolve: {
            clinicservices: () => inject(ClinicService).getClinicServices(),
        },
    },
] as Routes;
