import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { SubscribersComponent } from './subscribers.component';
import { SubscribersService } from './subscribers.service';

export default [
    {
        path: '',
        component: SubscribersComponent,
        resolve: {
            subsribers: () => inject(SubscribersService).getSubscribers(),
        },
    },
] as Routes;
