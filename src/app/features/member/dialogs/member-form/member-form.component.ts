import { ChangeDetectionStrategy, Component, Inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, forkJoin, of } from 'rxjs';
import { MemberService } from '../../services/member.service';
import { MemberModel } from '../../models/member.model';
import { FamilyService } from '../../../family/services/family.service';
import { FamilyModel } from '../../../family/models/family.model';
import { Gender, GENDER_OPTIONS } from '../../../../core/enums/gender.enum';

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
        this.snackBar.open('Failed to load reference data', 'OK', { duration: 4000 });
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

  submit(): void {
    if (this.form.invalid || this.submitting()) return;

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
          this.snackBar.open(this.mode === 'create' ? 'Member created' : 'Member updated', 'OK', { duration: 2500 });
          this.dialogRef.close(true);
        } else {
          this.snackBar.open(response?.message ?? 'Operation failed', 'OK', { duration: 4000 });
        }
      },
      error: err => {
        const message = err?.error?.message ?? err?.message ?? 'Request failed';
        this.snackBar.open(message, 'OK', { duration: 4000 });
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
