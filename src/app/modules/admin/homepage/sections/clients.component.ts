import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FuseAlertComponent } from '@fuse/components/alert';

@Component({
    selector: 'app-home-clients',
    standalone: true,
    imports: [CommonModule, FuseAlertComponent],
    template: `
        <div class="flex min-w-0 flex-auto flex-col">
            <div class="bg-card">
                <div class="border-b px-6 py-8 md:px-8">
                    <div class="text-4xl font-extrabold tracking-tight">Home Page</div>
                    <div class="mt-1 text-secondary">Clients</div>
                </div>
            </div>

            <div class="-mt-px flex-auto border-t">
                <div class="mx-auto w-full max-w-screen-xl p-6">
                    <fuse-alert [type]="'info'" [appearance]="'outline'">
                        <span fuseAlertTitle>Clients section</span>
                        <p class="text-sm">This page is ready for the Clients form UI.</p>
                    </fuse-alert>
                </div>
            </div>
        </div>
    `,
})
export class ClientsComponent {}
