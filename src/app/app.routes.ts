import { Routes } from '@angular/router';
import { DiepComponent } from './diep/diep.component';
import { GwentComponent } from './gwent/gwent.component';
import { SnakeComponent } from './snake/snake.component';
import { SudokuComponent } from './sudoku/sudoku.component';
import { TetrisComponent } from './tetris/tetris.component';
import { ConwayComponent } from './conway/conway.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', children: [] },
  { path: 'diep', component: DiepComponent },
  { path: 'gwent', component: GwentComponent },
  { path: 'snake', component: SnakeComponent },
  { path: 'sudoku', component: SudokuComponent },
  { path: 'tetris', component: TetrisComponent },
  { path: 'conways-game-of-life', component: ConwayComponent },
  { path: '**', redirectTo: 'home' }
];