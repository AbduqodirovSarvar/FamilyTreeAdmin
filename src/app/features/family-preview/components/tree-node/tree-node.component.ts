import { ChangeDetectionStrategy, Component, computed, inject, Input, Signal, signal, WritableSignal } from '@angular/core';
import { Gender } from '../../../../core/enums/gender.enum';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ImageUrlService } from '../../../../core/services/image-url.service';
import { SpouseGroupModel, TreeMemberModel, TreeNodeModel } from '../../models/family-tree.model';

@Component({
  selector: 'app-tree-node',
  standalone: false,
  templateUrl: './tree-node.component.html',
  styleUrls: ['./tree-node.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreeNodeComponent {
  private readonly _node: WritableSignal<TreeNodeModel | null> = signal<TreeNodeModel | null>(null);

  @Input({ required: true }) set node(v: TreeNodeModel) {
    this._node.set(v);
  }
  get node(): TreeNodeModel { return this._node()!; }

  @Input() isRoot = false;
  /** Family surname (e.g. "Karimov") — passed down for fallback labelling. */
  @Input() familyName?: string | null = null;

  readonly Gender = Gender;
  private readonly i18n = inject(I18nService);
  private readonly imageUrl = inject(ImageUrlService);

  avatarUrl(m: TreeMemberModel): string | null {
    return this.imageUrl.resolvePath(m.imageUrl);
  }

  /** Spouse-groups that actually have children — empty groups are filtered out. */
  readonly visibleSpouseGroups: Signal<SpouseGroupModel[]> = computed(() =>
    (this._node()?.spouses ?? []).filter(g => g.children.length > 0)
  );

  /** True when the hub has any descendants worth rendering below it. */
  readonly hasAnyChildren: Signal<boolean> = computed(() => {
    const n = this._node();
    if (!n) return false;
    return n.commonChildren.length > 0 || this.visibleSpouseGroups().length > 0;
  });

  /**
   * Polygamous when the primary has 2+ spouses. We render each marriage as its
   * own hub (primary + that spouse) so the parentage of every child is read
   * directly from which hub it hangs under, instead of a wide bar of spouses
   * with children grouped by label only.
   */
  readonly isPolygamous: Signal<boolean> = computed(() =>
    (this._node()?.spouses ?? []).length > 1
  );

  shortName(m: TreeMemberModel): string {
    const parts = [m.firstName, m.lastName].filter(Boolean);
    return parts.slice(0, 2).join(' ').trim() || '—';
  }

  birthYear(m: TreeMemberModel): string {
    if (!m.birthDay) return '';
    const d = new Date(m.birthDay);
    return isNaN(d.getTime()) ? '' : d.getFullYear().toString();
  }

  /** Status dot color: alive (green), pending/unknown (amber), deceased (gray). */
  statusClass(m: TreeMemberModel): 'alive' | 'pending' | 'deceased' {
    if (m.deathDay) return 'deceased';
    if (!m.birthDay) return 'pending';
    return 'alive';
  }

  primaryRelation(): string {
    this.i18n.lang();
    if (this.isRoot) return this.i18n.translate('preview.head');
    return this.i18n.translate(this.node.primary.gender === Gender.MALE ? 'preview.son' : 'preview.daughter');
  }

  /**
   * Per-spouse relation shown under each spouse circle.
   * Multi-spouse hubs get suffixed numbering ("Turmush o'rtog'i (2)") so it's
   * visually clear that the primary has more than one partner.
   */
  spouseLabel(index: number): string {
    this.i18n.lang();
    const base = this.i18n.translate('preview.spouse');
    return index === 0 ? base : `${base} (${index + 1})`;
  }

  /** "[SPOUSE LASTNAME] FARZANDLARI" — pink badge above each spouse-group's children block. */
  spouseGroupLabel(group: SpouseGroupModel): string {
    this.i18n.lang();
    const last = (group.spouse.lastName ?? '').trim();
    const first = (group.spouse.firstName ?? '').trim();
    const tag = (last || first || this.familyName || '').toUpperCase();
    const suffix = this.i18n.translate('preview.childrenSuffix');
    return tag ? `${tag} ${suffix}` : suffix;
  }

  /** "UMUMIY FARZANDLAR" — gray badge above the common-children block. */
  commonChildrenLabel(): string {
    this.i18n.lang();
    return this.i18n.translate('preview.commonChildren');
  }
}
