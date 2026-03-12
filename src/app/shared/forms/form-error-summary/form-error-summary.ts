import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-form-error-summary',
  standalone: true,
  templateUrl: './form-error-summary.html',
  styleUrl: './form-error-summary.scss'
})
export class FormErrorSummary {

  @Input() errors: string[] = [];

}