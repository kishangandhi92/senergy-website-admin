import { Routes } from '@angular/router';
import { AboutSectionComponent } from './sections/about-section.component';
import { AdvantagesComponent } from './sections/advantages.component';
import { ClientsComponent } from './sections/clients.component';
import { CoreSolutionsComponent } from './sections/core-solutions.component';
import { CtaComponent } from './sections/cta.component';
import { HeroBannerComponent } from './sections/herobanner.component';
import { StatsComponent } from './sections/stats.component';
import { TestimonialsComponent } from './sections/testimonials.component';

export default [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'hero-banner',
    },
    {
        path: 'hero-banner',
        component: HeroBannerComponent,
    },
    {
        path: 'advantages',
        component: AdvantagesComponent,
    },
    {
        path: 'about',
        component: AboutSectionComponent,
    },
    {
        path: 'stats',
        component: StatsComponent,
    },
    {
        path: 'core-solutions',
        component: CoreSolutionsComponent,
    },
    {
        path: 'clients',
        component: ClientsComponent,
    },
    {
        path: 'testimonials',
        component: TestimonialsComponent,
    },
    {
        path: 'cta',
        component: CtaComponent,
    },
] as Routes;
