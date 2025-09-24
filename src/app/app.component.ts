import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { StyleSwitcherService } from './services/style-switcher.service';
import { RouterOutlet, RouterModule, Router } from '@angular/router';
import { LoadingComponent } from './loading/loading.component';
import { LoginService } from './services/login.service';
import { ErrorMessageComponent } from './error-message/error-message.component';
import { FilterService } from './filter/services/filter.service';
import { SourceService } from './source-flow/services/sources.service';
import { CheckToken } from './services/checkToken.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MatIconModule,
    RouterOutlet,
    RouterModule,
    LoadingComponent,
    ErrorMessageComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  menuVisible = false;
  isLightTheme = false;
  router = inject(Router);
  loginService = inject(LoginService);
  styleSwither = inject(StyleSwitcherService);
  filterService = inject(FilterService);
  sourceService = inject(SourceService);
  checkTokenService = inject(CheckToken);

  constructor() {
    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    this.styleSwither.switchTheme(savedTheme);
  }

  ngOnInit() {
    this.isLightTheme = this.styleSwither.themeSignal;
  }

  closeMenu() {
    this.menuVisible = false;
  }

  toggleMenu(event?: Event) {
    if (event) event.stopPropagation();
    if (this.styleSwither.isMobileViewSignal()) this.menuVisible = !this.menuVisible;
  }

  onThemeSwitchChange() {
    const newTheme = this.styleSwither.themeSignal ? 'dark' : 'light';
    this.styleSwither.switchTheme(newTheme);
    this.isLightTheme = this.styleSwither.themeSignal;
  }

  logout() {
    localStorage.removeItem('Authorization');
    this.loginService.setIsLoginSignal(false);
    this.filterService.clear();
    this.sourceService.clear();
    this.closeMenu();
  }

  isRouteActive(route: string): boolean {
    return this.router.url.includes(route);
  }
}
