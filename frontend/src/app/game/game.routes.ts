// src/app/game/game.routes.ts
import { Routes } from '@angular/router';
import { GameMenuComponent } from './game-menu/game-menu.component';
import { GameBoardComponent } from './game-board/game-board.component';
import { authGuard } from '../guards/auth.guard';

export const GAME_ROUTES: Routes = [
  { path: '', component: GameMenuComponent, canActivate: [authGuard] },
  { path: 'play/:id', component: GameBoardComponent, canActivate: [authGuard] }
];