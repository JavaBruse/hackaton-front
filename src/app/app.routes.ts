import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, LoginGuard } from './auth.guard';
import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';
import { RootComponent } from './services/root.service';
import { HomeComponent } from './home/home.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { FaqComponent } from './faq/faq.component';
import { UploadComponent } from './upload/upload.component';
import { ApiDocsComponent } from './api-docs/api-docs.component';

export const routes: Routes = [
    // { path: '', redirectTo: 'login', canActivate: [AuthGuard] },
    { path: '', component: RootComponent, pathMatch: 'full' },
    { path: 'FAQ', component: FaqComponent },
    { path: 'login', component: LoginComponent, canActivate: [LoginGuard] },
    { path: 'registration', component: RegistrationComponent, canActivate: [LoginGuard] },
    { path: 'welome', component: WelcomeComponent, canActivate: [LoginGuard] },
    { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
    { path: 'upload', component: UploadComponent, canActivate: [AuthGuard] },
    { path: 'OpenAPI', component: ApiDocsComponent, canActivate: [AuthGuard] },
    { path: '**', redirectTo: '', pathMatch: 'full' }
];
@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule { }
