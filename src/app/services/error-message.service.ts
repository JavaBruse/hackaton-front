import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ErrorMessageService {
    private messageSignal = signal<string>('');

    get message$() {
        return this.messageSignal;
    }

    showError(message: string) {
        this.messageSignal.set(message);
        setTimeout(() => {
            this.messageSignal.set('');
        }, 3000);
    }
}
