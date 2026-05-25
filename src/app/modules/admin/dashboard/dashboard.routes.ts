import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from './dashboard.service';
import { inject } from '@angular/core';

export default [
    {
        path     : '',
        component: DashboardComponent,
        resolve: {
            //  stats: () => inject(DashboardService).getStats(),
            //  enquiries: () => inject(DashboardService).getEnquiries(),
            //  clinicEnquiries: () => inject(DashboardService).getClinicEnquiries(),
            //  locumEnquiries: () => inject(DashboardService).getLocumEnquiries(),
        },
    },
] as Routes;
