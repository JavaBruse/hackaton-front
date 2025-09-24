import { inject, Injectable, signal } from '@angular/core';
import { CheckToken } from './checkToken.service';

@Injectable({
    providedIn: 'root',
})
export class LoginService {
    private isLogin = signal<boolean>(false);
    private checkToken = inject(CheckToken);

    constructor() {
        this.initializeLoginStatus();
    }

    private async initializeLoginStatus() {
        const isValid = await this.checkToken.validateToken();
        this.setIsLoginSignal(isValid);
    }

    get isLoginSignal() {
        return this.isLogin;
    }

    setIsLoginSignal(signal: boolean) {
        this.isLogin.set(signal);
    }


}

