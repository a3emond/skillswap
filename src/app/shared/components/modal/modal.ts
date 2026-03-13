import { Component, EventEmitter, Output } from '@angular/core'

@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './modal.html',
  styleUrl: './modal.scss'
})
export class Modal {

  @Output() close = new EventEmitter<void>()

  backdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit()
    }
  }

  closeClick() {
    this.close.emit()
  }

}