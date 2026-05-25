import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { ContactComponent } from './contact.component';

export default [
    {
        path: '',
        component: ContactComponent
    },
] as Routes;
