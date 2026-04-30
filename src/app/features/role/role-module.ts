import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { RoleRoutingModule } from './role-routing-module';
import { RoleListComponent } from './pages/role-list/role-list.component';
import { RoleFormComponent } from './dialogs/role-form/role-form.component';

@NgModule({
  declarations: [
    RoleListComponent,
    RoleFormComponent
  ],
  imports: [
    SharedModule,
    RoleRoutingModule
  ]
})
export class RoleModule { }
