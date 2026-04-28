import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { FamilyPreviewRoutingModule } from './family-preview-routing.module';
import { FamilyTreePreviewComponent } from './pages/family-tree-preview/family-tree-preview.component';
import { TreeNodeComponent } from './components/tree-node/tree-node.component';

@NgModule({
  declarations: [
    FamilyTreePreviewComponent,
    TreeNodeComponent
  ],
  imports: [
    SharedModule,
    FamilyPreviewRoutingModule
  ]
})
export class FamilyPreviewModule { }
