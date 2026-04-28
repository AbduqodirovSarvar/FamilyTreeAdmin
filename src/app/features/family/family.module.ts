import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { FamilyRoutingModule } from './family-routing.module';
import { FamilyListComponent } from './pages/family-list/family-list.component';
import { FamilyFormComponent } from './dialogs/family-form/family-form.component';

@NgModule({
  declarations: [
    FamilyListComponent,
    FamilyFormComponent
  ],
  imports: [
    SharedModule,
    FamilyRoutingModule
  ]
})
export class FamilyModule { }
