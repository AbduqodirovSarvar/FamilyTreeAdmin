import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { MemberRoutingModule } from './member-routing.module';
import { MemberListComponent } from './pages/member-list/member-list.component';
import { MemberFormComponent } from './dialogs/member-form/member-form.component';

@NgModule({
  declarations: [
    MemberListComponent,
    MemberFormComponent
  ],
  imports: [
    SharedModule,
    MemberRoutingModule
  ]
})
export class MemberModule { }
