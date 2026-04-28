import { ChangeDetectionStrategy, Component, OnInit, signal, WritableSignal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { FamilyService } from '../family/services/family.service';
import { MemberService } from '../member/services/member.service';
import { UserService } from '../user/services/user.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  readonly families: WritableSignal<number> = signal(0);
  readonly members: WritableSignal<number> = signal(0);
  readonly users: WritableSignal<number> = signal(0);
  readonly loading: WritableSignal<boolean> = signal(false);

  constructor(
    private readonly familyService: FamilyService,
    private readonly memberService: MemberService,
    private readonly userService: UserService
  ) {}

  ngOnInit(): void {
    this.loading.set(true);
    forkJoin({
      f: this.familyService.list({ pageIndex: 0, pageSize: 1 }),
      m: this.memberService.list({ pageIndex: 0, pageSize: 1 }),
      u: this.userService.list({ pageIndex: 0, pageSize: 1 })
    }).subscribe({
      next: ({ f, m, u }) => {
        this.families.set(f?.totalCount ?? 0);
        this.members.set(m?.totalCount ?? 0);
        this.users.set(u?.totalCount ?? 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
