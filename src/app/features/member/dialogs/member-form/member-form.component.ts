import { ChangeDetectionStrategy, Component, Inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, forkJoin, of } from 'rxjs';
import { MemberService } from '../../services/member.service';
import { MemberModel } from '../../models/member.model';
import { FamilyService } from '../../../family/services/family.service';
import { FamilyModel } from '../../../family/models/family.model';
import { Gender, GENDER_OPTIONS } from '../../../../core/enums/gender.enum';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

export interface MemberFormDialogData {
  mode: 'create' | 'edit';
  member?: MemberModel | null;
  defaultFamilyId?: string | null;
}

@Component({
  selector: 'app-member-form',
  standalone: false,
  templateUrl: './member-form.component.html',
  styleUrls: ['./member-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MemberFormComponent implements OnInit {
  readonly form: FormGroup;
  readonly genderOptions = GENDER_OPTIONS;
  readonly mode: 'create' | 'edit';

  readonly submitting: WritableSignal<boolean> = signal(false);
  readonly selectedFile: WritableSignal<File | null> = signal(null);

  readonly families: WritableSignal<FamilyModel[]> = signal([]);
  readonly relatives: WritableSignal<MemberModel[]> = signal([]);
  readonly loadingRefs: WritableSignal<boolean> = signal(false);

  constructor(
    private readonly fb: FormBuilder,
    private readonly memberService: MemberService,
    private readonly familyService: FamilyService,
    private readonly snackBar: MatSnackBar,
    private readonly dialog: MatDialog,
    private readonly i18n: I18nService,
    public dialogRef: MatDialogRef<MemberFormComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: MemberFormDialogData
  ) {
    this.mode = data.mode;
    const m = data.member;
    this.form = this.fb.group({
      firstName: [m?.firstName ?? ''],
      lastName: [m?.lastName ?? ''],
      description: [m?.description ?? ''],
      birthDay: [this.parseDate(m?.birthDay), Validators.required],
      deathDay: [this.parseDate(m?.deathDay)],
      gender: [m?.gender ?? Gender.MALE, Validators.required],
      familyId: [m?.familyId ?? data.defaultFamilyId ?? '', Validators.required],
      fatherId: [m?.fatherId ?? null],
      motherId: [m?.motherId ?? null],
      spouseId: [m?.spouseId ?? null]
    });
  }

  ngOnInit(): void {
    this.loadRefs();
    this.form.controls['familyId'].valueChanges.subscribe(familyId => {
      if (familyId) this.loadRelatives(familyId);
    });
  }

  private loadRefs(): void {
    this.loadingRefs.set(true);
    forkJoin({
      families: this.familyService.list({ pageIndex: 0, pageSize: 200 }),
      relatives: this.form.controls['familyId'].value
        ? this.memberService.list({ pageIndex: 0, pageSize: 500, familyId: this.form.controls['familyId'].value })
        : of(null)
    }).pipe(finalize(() => this.loadingRefs.set(false))).subscribe({
      next: ({ families, relatives }) => {
        this.families.set(families?.data ?? []);
        this.relatives.set(relatives?.data ?? []);
      },
      error: () => {
        this.snackBar.open(this.i18n.translate('member.loadRefsFailed'), this.i18n.translate('common.ok'), { duration: 4000 });
      }
    });
  }

  private loadRelatives(familyId: string): void {
    this.memberService.list({ pageIndex: 0, pageSize: 500, familyId }).subscribe({
      next: response => this.relatives.set(response?.data ?? []),
      error: () => this.relatives.set([])
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  /**
   * Spouse picker should only show opposite-gender candidates — same-sex
   * marriages aren't part of this domain, and filtering keeps the dropdown
   * short and unambiguous.
   */
  oppositeGender(m: MemberModel): boolean {
    const current = this.form.get('gender')?.value;
    return m.gender !== current;
  }

  /**
   * No-relations check: blocks the silent "stray member" path that used to
   * leave a wife floating in a separate corner of the tree. We still allow
   * the user to confirm and proceed (e.g. they really do want a standalone
   * head-of-family entry), but the warning surfaces the missing link before
   * it bites them on the tree-preview.
   */
  private hasNoRelations(): boolean {
    const v = this.form.value;
    return !v.fatherId && !v.motherId && !v.spouseId;
  }

  private confirmNoRelations(): Promise<boolean> {
    return new Promise(resolve => {
      const ref = this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: this.i18n.translate('member.noRelationsTitle'),
          message: this.i18n.translate('member.noRelationsMessage'),
          confirmText: this.i18n.translate('member.continueAnyway'),
          cancelText: this.i18n.translate('common.cancel'),
          confirmColor: 'warn'
        },
        width: '420px'
      });
      ref.afterClosed().subscribe(ok => resolve(!!ok));
    });
  }

  /** Generic save-time confirmation — same UX in every form dialog. */
  private confirmSave(): Promise<boolean> {
    return new Promise(resolve => {
      const ref = this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: this.i18n.translate('common.saveConfirmTitle'),
          message: this.i18n.translate('common.saveConfirmMessage'),
          confirmText: this.i18n.translate('common.save'),
          cancelText: this.i18n.translate('common.cancel'),
          confirmColor: 'primary'
        }
      });
      ref.afterClosed().subscribe(ok => resolve(!!ok));
    });
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) return;

    if (this.hasNoRelations()) {
      const confirmed = await this.confirmNoRelations();
      if (!confirmed) return;
    } else {
      // Two confirmations would be overkill — only ask the generic save
      // question when the no-relations warning didn't already gate the flow.
      const confirmed = await this.confirmSave();
      if (!confirmed) return;
    }

    this.submitting.set(true);
    const v = this.form.value;
    const file = this.selectedFile();

    const request$ = this.mode === 'create'
      ? this.memberService.createMember({
          firstName: v.firstName || null,
          lastName: v.lastName || null,
          description: v.description || null,
          birthDay: this.formatDate(v.birthDay)!,
          deathDay: this.formatDate(v.deathDay),
          gender: v.gender,
          familyId: v.familyId,
          fatherId: v.fatherId || null,
          motherId: v.motherId || null,
          spouseId: v.spouseId || null,
          image: file
        })
      : this.memberService.updateMember({
          id: this.data.member!.id,
          firstName: v.firstName || null,
          lastName: v.lastName || null,
          description: v.description || null,
          birthDay: this.formatDate(v.birthDay),
          deathDay: this.formatDate(v.deathDay),
          gender: v.gender,
          familyId: v.familyId,
          fatherId: v.fatherId || null,
          motherId: v.motherId || null,
          spouseId: v.spouseId || null,
          image: file
        });

    request$.pipe(finalize(() => this.submitting.set(false))).subscribe({
      next: response => {
        if (response?.success) {
          const toastKey = this.mode === 'create' ? 'member.createdToast' : 'member.updatedToast';
          this.snackBar.open(this.i18n.translate(toastKey), this.i18n.translate('common.ok'), { duration: 2500 });
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(response?.message ?? this.i18n.translate('member.operationFailed'), this.i18n.translate('common.ok'), { duration: 4000 });
        }
      },
      error: err => {
        const message = err?.error?.message ?? err?.message ?? this.i18n.translate('member.requestFailed');
        this.snackBar.open(message, this.i18n.translate('common.ok'), { duration: 4000 });
      }
    });
  }

  excludeSelf(member: MemberModel): boolean {
    return this.mode !== 'edit' || member.id !== this.data.member?.id;
  }

  private parseDate(value?: string | null): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  private formatDate(value: Date | null | undefined): string | null {
    if (!value) return null;
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
