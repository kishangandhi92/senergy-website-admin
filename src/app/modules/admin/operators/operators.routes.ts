import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { OperatorsComponent } from './operators.component';
import { OperatorService } from './operators.service';
import { RolesService } from '../roles/roles.service';

export default [
    {
        path     : '',
        component: OperatorsComponent,
        resolve: {
            operators: () => inject(OperatorService).getOperators(),
            roles: () => inject(RolesService).getRoles()
        }
    },
] as Routes;
