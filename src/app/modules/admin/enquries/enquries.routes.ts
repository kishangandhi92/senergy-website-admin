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
    },
    {
        path: 'locum',
        children: [
            {
                path: '',
                component: EnquiriesComponent,
                data: { type: 'locum' },
                resolve: {
                    enquiries: () => inject(EnquiryService).getEnquiries('locum'),
                }
            }
        ],
    },
    {
        path: 'clinic',
        children: [
            {
                path: '',
                component: EnquiriesComponent,
                data: { type: 'clinic' },
                resolve: {
                    enquiries: () => inject(EnquiryService).getEnquiries('clinic'),
                }
            }
        ],
    },
] as Routes;
