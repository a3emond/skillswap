import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-alert-error',
  standalone: true,
  templateUrl: './alert-error.html',
  styleUrl: './alert-error.scss'
})
export class AlertError {
  @Input() message!: string;
}