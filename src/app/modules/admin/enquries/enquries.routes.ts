import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { EnquiryService } from './enquiry.service';
import { EnquiriesComponent } from './enquiries.component';

export default [
    {
        path: 'general',
        children: [
            {
                path: '',
                component: EnquiriesComponent,
                data: { type: 'general' },
                resolve: {
                    enquiries: () => inject(EnquiryService).getEnquiries('general'),
                }
            }
        ],
    }
] as Routes;
