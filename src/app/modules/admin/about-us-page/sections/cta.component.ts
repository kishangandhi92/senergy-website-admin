import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { CdkScrollable } from '@angular/cdk/scrolling';

@Component({
    selector: 'app-about-us-page-cta',
    standalone: true,
    imports: [CommonModule, CdkScrollable],
    templateUrl: './cta.component.html',
})
export class AboutUsCtaComponent {}
