import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { Proposal } from '../../../core/models/proposal.model';

@Component({
  selector: 'app-job-proposals',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './job-proposals.html',
})
export class JobProposals {
  @Input({ required: true }) proposals: Proposal[] = [];

  @Input() actionLabel: string | null = null;
  @Input() actionClass = 'btn btn-primary';
  @Input() actionLoading = false;

  @Output() action = new EventEmitter<number>();
  @Output() jobClick = new EventEmitter<number>();

  triggerAction(id: number): void {
    this.action.emit(id);
  }

  triggerJobClick(jobId: number): void {
    this.jobClick.emit(jobId);
  }
}
