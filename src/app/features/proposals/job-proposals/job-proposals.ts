import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { I18nService } from '../../../core/i18n/i18n.service';
import { Proposal } from '../../../core/models/proposal.model';
import { Modal } from '../../../shared/components/modal/modal';
import { PublicProfile } from '../../users/public-profile/public-profile';

@Component({
  selector: 'app-job-proposals',
  standalone: true,
  imports: [TranslatePipe, DatePipe, Modal, PublicProfile],
  templateUrl: './job-proposals.html',
  styleUrl: './job-proposals.scss',
})
export class JobProposals {
  private readonly i18n = inject(I18nService);

  @Input({ required: true }) proposals: Proposal[] = [];
  @Input() currentUserId: string | number | null = null;
  @Input() currentUsername = '';
  @Input() showJobButton = true;
  @Input() allowProfileModal = true;

  @Input() actionLabel: string | null = null;
  @Input() actionClass = 'btn btn-primary';
  @Input() actionLoading = false;
  @Input() actionLabelResolver: ((proposal: Proposal) => string | null) | null = null;
  @Input() actionClassResolver: ((proposal: Proposal) => string) | null = null;
  @Input() actionDisabledResolver: ((proposal: Proposal) => boolean) | null = null;

  @Output() action = new EventEmitter<number>();
  @Output() jobClick = new EventEmitter<number>();

  readonly selectedProfileUsername = signal<string | null>(null);

  readonly hasModalProfile = computed(() => this.selectedProfileUsername() !== null);

  triggerAction(id: number): void {
    this.action.emit(id);
  }

  triggerJobClick(jobId: number): void {
    this.jobClick.emit(jobId);
  }

  openProfile(proposal: Proposal): void {
    const username = this.profileUsername(proposal);

    if (!username) {
      return;
    }

    this.selectedProfileUsername.set(username);
  }

  closeProfileModal(): void {
    this.selectedProfileUsername.set(null);
  }

  proposalJobTitle(proposal: Proposal): string {
    return proposal.job?.title?.trim() || `#${proposal.job_id}`;
  }

  proposalActionLabel(proposal: Proposal): string | null {
    if (this.actionLabelResolver) {
      return this.actionLabelResolver(proposal);
    }

    return this.actionLabel;
  }

  proposalActionClass(proposal: Proposal): string {
    if (this.actionClassResolver) {
      return this.actionClassResolver(proposal);
    }

    return this.actionClass;
  }

  isActionDisabled(proposal: Proposal): boolean {
    if (this.actionLoading) {
      return true;
    }

    if (this.actionDisabledResolver) {
      return this.actionDisabledResolver(proposal);
    }

    return false;
  }

  hasSameIdentity(left?: number | string, right?: number | string | null): boolean {
    if (left === undefined || left === null || right === undefined || right === null) {
      return false;
    }

    return String(left) === String(right);
  }

  proposalUserLabel(proposal: Proposal): string {
    if (proposal.freelancer?.username) {
      return proposal.freelancer.username;
    }

    if (proposal.freelancer?.name) {
      return proposal.freelancer.name;
    }

    if (
      !!this.currentUserId &&
      (this.hasSameIdentity(proposal.freelancer_id, this.currentUserId) ||
        this.hasSameIdentity(proposal.user_id, this.currentUserId))
    ) {
      return this.i18n.t('proposals.labels.you');
    }

    return this.i18n.t('proposals.labels.unknown_user');
  }

  profileUsername(proposal: Proposal): string | null {
    if (proposal.freelancer?.username) {
      return proposal.freelancer.username;
    }

    if (
      !!this.currentUserId &&
      (this.hasSameIdentity(proposal.freelancer_id, this.currentUserId) ||
        this.hasSameIdentity(proposal.user_id, this.currentUserId))
    ) {
      return this.currentUsername || null;
    }

    return null;
  }
}
