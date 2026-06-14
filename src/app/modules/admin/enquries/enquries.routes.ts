import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { EnquiriesComponent } from './enquiries.component';
import { EnquiryService } from './enquiry.service';

const enquiryTypes = ['general', 'career', 'product'] as const;

export default enquiryTypes.map((type) => ({
    path: type,
    component: EnquiriesComponent,
    data: { type },
    resolve: {
        enquiries: () => inject(EnquiryService).getEnquiries(type),
    },
})) as Routes;
