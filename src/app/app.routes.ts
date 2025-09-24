import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard, LoginGuard } from './auth.guard';
import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';
import { RootComponent } from './services/root.service';
import { FiltersComponent } from './filter/filters/filters.component';
import { SourcesFlowComponent } from './source-flow/sources-flow/sources-flow.component';
import { PostComponent } from './post/post.component';

export const routes: Routes = [
    // { path: '', redirectTo: 'login', canActivate: [AuthGuard] },
    { path: '', component: RootComponent, pathMatch: 'full' },
    { path: 'login', component: LoginComponent, canActivate: [LoginGuard] },
    { path: 'registration', component: RegistrationComponent, canActivate: [LoginGuard] },
    { path: 'filters', component: FiltersComponent, canActivate: [AuthGuard] },
    { path: 'posts/:id', component: PostComponent, canActivate: [AuthGuard] },
    { path: 'sources', component: SourcesFlowComponent, canActivate: [AuthGuard] },
    { path: '**', redirectTo: '', pathMatch: 'full' }
];
@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule { }
