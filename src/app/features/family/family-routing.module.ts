import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FamilyListComponent } from './pages/family-list/family-list.component';

const routes: Routes = [
  { path: '', component: FamilyListComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FamilyRoutingModule { }
