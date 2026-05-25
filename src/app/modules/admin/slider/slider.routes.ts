import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { SliderComponent } from './slider.component';
import { SliderService } from './slider.service';

export default [
    {
            path     : '',
            component: SliderComponent,
            resolve: {
                 sliders: () => inject(SliderService).getAll(),
            },
        },
] as Routes;
