import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-field-error',
  standalone: true,
  templateUrl: './field-error.html',
  styleUrl: './field-error.scss'
})
export class FieldError {
  @Input() message!: string;
}