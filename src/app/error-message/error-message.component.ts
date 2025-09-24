import { Component, inject, signal, effect, OnDestroy } from '@angular/core';
import { ErrorMessageService } from '../services/error-message.service';

@Component({
  selector: 'app-error-message',
  standalone: true,
  templateUrl: './error-message.component.html',
  styleUrl: './error-message.component.css',
})
export class ErrorMessageComponent implements OnDestroy {
  private svc = inject(ErrorMessageService);
  visibleMessage = signal<string | null>(null);
  // флаг для класса .leave (анимация скрытия)
  leaving = signal(false);

  private hideTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const msg = this.svc.message$();
      if (msg) {
        // показать новое сообщение, сбросить «уход»
        if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
        this.leaving.set(false);
        this.visibleMessage.set(msg);
      } else {
        // сообщение стало пустым — запускаем анимацию ухода, а DOM уберём через 2s
        if (this.visibleMessage()) {
          this.leaving.set(true);
          if (this.hideTimer) clearTimeout(this.hideTimer);
          this.hideTimer = setTimeout(() => {
            this.visibleMessage.set(null);
            this.leaving.set(false);
            this.hideTimer = null;
          }, 1000);
        }
      }
    });
  }

  ngOnDestroy() {
    if (this.hideTimer) clearTimeout(this.hideTimer);
  }
}
