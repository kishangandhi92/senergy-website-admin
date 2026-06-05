import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CdkScrollable } from '@angular/cdk/scrolling';

@Component({
    selector: 'app-about-us-page-team-gallery',
    standalone: true,
    imports: [CommonModule, CdkScrollable],
    templateUrl: './team-gallery.component.html',
})
export class TeamGalleryComponent {}
