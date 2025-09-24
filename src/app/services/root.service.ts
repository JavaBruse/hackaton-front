import { Component, inject } from '@angular/core';
import { LoginService } from '../services/login.service';
import { HomeComponent } from '../home/home.component';
import { WelcomeComponent } from '../welcome/welcome.component';

@Component({
    selector: 'app-root-page',
    standalone: true,
    template: `
    @if (isLogin()) {
      <app-home></app-home>
    } @else {
      <app-welcome></app-welcome>
    }
  `,
    imports: [HomeComponent, WelcomeComponent]
})
export class RootComponent {
    private loginService = inject(LoginService);
    isLogin = this.loginService.isLoginSignal;
}