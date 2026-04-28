import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FamilyTreePreviewComponent } from './pages/family-tree-preview/family-tree-preview.component';

const routes: Routes = [
  { path: '', component: FamilyTreePreviewComponent },
  { path: ':familyId', component: FamilyTreePreviewComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FamilyPreviewRoutingModule { }
