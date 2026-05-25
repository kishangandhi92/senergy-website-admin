import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from './dashboard.service';
import { inject } from '@angular/core';

export default [
    {
        path     : '',
        component: DashboardComponent,
        resolve: {
             enquiries: () => inject(DashboardService).getEnquiries(),
        },
    },
] as Routes;
