import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CdkScrollable } from '@angular/cdk/scrolling';

@Component({
    selector: 'app-about-us-page-mission-vision',
    standalone: true,
    imports: [CommonModule, CdkScrollable],
    templateUrl: './mission-vision.component.html',
})
export class MissionVisionComponent {}
