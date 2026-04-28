import { ChangeDetectionStrategy, Component, OnInit, signal, WritableSignal, computed, Signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { FamilyService } from '../../../family/services/family.service';
import { FamilyModel } from '../../../family/models/family.model';
import { FamilyTreeModel, TreeNodeModel } from '../../models/family-tree.model';

@Component({
  selector: 'app-family-tree-preview',
  standalone: false,
  templateUrl: './family-tree-preview.component.html',
  styleUrls: ['./family-tree-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FamilyTreePreviewComponent implements OnInit {
  readonly families: WritableSignal<FamilyModel[]> = signal([]);
  readonly selectedFamilyId: WritableSignal<string | null> = signal(null);
  readonly tree: WritableSignal<FamilyTreeModel | null> = signal(null);

  readonly loadingFamilies: WritableSignal<boolean> = signal(false);
  readonly loadingTree: WritableSignal<boolean> = signal(false);

  readonly zoom: WritableSignal<number> = signal(1);

  zoomIn(): void { this.zoom.update(z => Math.min(z + 0.1, 2)); }
  zoomOut(): void { this.zoom.update(z => Math.max(z - 0.1, 0.5)); }

  readonly forest: Signal<TreeNodeModel[]> = computed(() => this.tree()?.roots ?? []);
  readonly totalMembers: Signal<number> = computed(() => this.tree()?.totalMembers ?? 0);

  readonly selectedFamily: Signal<FamilyModel | null> = computed(() => {
    const id = this.selectedFamilyId();
    return id ? this.families().find(f => f.id === id) ?? null : null;
  });

  constructor(
    private readonly familyService: FamilyService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadFamilies();

    const initial = this.route.snapshot.paramMap.get('familyId');
    if (initial) {
      this.selectedFamilyId.set(initial);
      this.loadTree(initial);
    }
  }

  loadFamilies(): void {
    this.loadingFamilies.set(true);
    this.familyService.list({ pageIndex: 0, pageSize: 200 })
      .pipe(finalize(() => this.loadingFamilies.set(false)))
      .subscribe({
        next: response => this.families.set(response?.data ?? []),
        error: err => {
          const message = err?.error?.message ?? err?.message ?? 'Failed to load families';
          this.snackBar.open(message, 'OK', { duration: 4000 });
        }
      });
  }

  onFamilyChange(id: string | null): void {
    this.selectedFamilyId.set(id);
    if (!id) {
      this.tree.set(null);
      this.router.navigate(['/preview']);
      return;
    }
    this.router.navigate(['/preview', id]);
    this.loadTree(id);
  }

  loadTree(familyId: string): void {
    this.loadingTree.set(true);
    this.familyService.getTree(familyId)
      .pipe(finalize(() => this.loadingTree.set(false)))
      .subscribe({
        next: response => this.tree.set(response?.data ?? null),
        error: err => {
          const message = err?.error?.message ?? err?.message ?? 'Failed to load tree';
          this.snackBar.open(message, 'OK', { duration: 4000 });
        }
      });
  }

  refresh(): void {
    const id = this.selectedFamilyId();
    if (id) this.loadTree(id);
  }
}
