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
import { PhotosComponent } from './photo/photos/photos.component';
import { MasterMapComponent } from './master-map/master-map.component';

export const routes: Routes = [
    { path: '', component: RootComponent, pathMatch: 'full' },
    { path: 'FAQ', component: FaqComponent },
    { path: 'OpenAPI', component: ApiDocsComponent },
    { path: 'login', component: LoginComponent, canActivate: [LoginGuard] },
    { path: 'registration', component: RegistrationComponent, canActivate: [LoginGuard] },
    { path: 'welome', component: WelcomeComponent, canActivate: [LoginGuard] },
    { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
    { path: 'upload/:id', component: UploadComponent, canActivate: [AuthGuard] },
    { path: 'all-photo/:id', component: PhotosComponent, canActivate: [AuthGuard] },
    { path: 'all-photo', component: PhotosComponent, canActivate: [AuthGuard] },
    { path: 'OpenAPI', component: ApiDocsComponent, canActivate: [AuthGuard] },
    { path: 'VRP-map', component: MasterMapComponent },
    { path: '**', redirectTo: '', pathMatch: 'full' }
];
@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule { }
