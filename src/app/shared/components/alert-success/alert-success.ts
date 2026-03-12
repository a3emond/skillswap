import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-alert-success',
  standalone: true,
  templateUrl: './alert-success.html',
  styleUrl: './alert-success.scss'
})
export class AlertSuccess {
  @Input() message!: string;
}