import { Routes } from '@angular/router';
import { AboutIntroComponent } from './sections/about-intro.component';
import { MissionVisionComponent } from './sections/mission-vision.component';
import { TeamGalleryComponent } from './sections/team-gallery.component';
import { CoreExpertiseComponent } from './sections/core-expertise.component';
import { AboutUsCtaComponent } from './sections/cta.component';

export default [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'about-intro',
    },
    {
        path: 'about-intro',
        component: AboutIntroComponent,
    },
    {
        path: 'mission-and-vision',
        component: MissionVisionComponent,
    },
    {
        path: 'team-gallery',
        component: TeamGalleryComponent,
    },
    {
        path: 'core-expertise',
        component: CoreExpertiseComponent,
    },
    {
        path: 'cta',
        component: AboutUsCtaComponent,
    },
] as Routes;
