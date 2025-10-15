import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {MemberModule} from './member/member.module';
import {AuthModule} from './auth/auth.module';
import {FamilyModule} from './family/family.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MemberModule,
    AuthModule,
    FamilyModule
  ]
})
export class FeaturesModule { }
