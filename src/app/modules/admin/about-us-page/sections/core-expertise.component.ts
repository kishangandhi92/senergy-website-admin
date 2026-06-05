import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CdkScrollable } from '@angular/cdk/scrolling';

@Component({
    selector: 'app-about-us-page-core-expertise',
    standalone: true,
    imports: [CommonModule, CdkScrollable],
    templateUrl: './core-expertise.component.html',
})
export class CoreExpertiseComponent {}
