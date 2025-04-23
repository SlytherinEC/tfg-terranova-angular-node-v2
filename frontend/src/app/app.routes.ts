import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { publicGuard } from './guards/public.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', canActivate: [publicGuard], component: HomeComponent },
  { path: 'register', canActivate: [publicGuard], component: RegisterComponent },
  { path: 'login', canActivate: [publicGuard], component: LoginComponent },
  { path: 'dashboard', canActivate: [authGuard], component: DashboardComponent },
];
