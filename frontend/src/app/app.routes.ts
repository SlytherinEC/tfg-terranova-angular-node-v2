import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';
import { publicGuard } from './guards/public.guard';
import { adminGuard } from './guards/admin.guard';
import { NoAutorizadoComponent } from './no-autorizado/no-autorizado.component';
import { PerfilComponent } from './perfil/perfil.component';
import { ListaUsuariosComponent } from './lista-usuarios/lista-usuarios.component';
import { GAME_ROUTES } from './game/game.routes';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', canActivate: [publicGuard], component: HomeComponent },
  { path: 'register', canActivate: [publicGuard], component: RegisterComponent },
  { path: 'login', canActivate: [publicGuard], component: LoginComponent },
  { path: 'dashboard', canActivate: [authGuard], component: DashboardComponent },
  { path: 'admin', canActivate: [adminGuard], component: ListaUsuariosComponent },
  { path: 'no-autorizado', canActivate: [authGuard], component: NoAutorizadoComponent },
  { path: 'perfil', canActivate: [authGuard], component: PerfilComponent },
  { path: 'game', children: GAME_ROUTES },
];
