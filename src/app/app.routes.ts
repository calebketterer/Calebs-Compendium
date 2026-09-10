import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { DiepComponent } from './diep/diep.component';
import { GwentComponent } from './gwent/gwent.component';
import { SnakeComponent } from './snake/snake.component';
import { SudokuComponent } from './sudoku/sudoku.component';
import { TetrisComponent } from './tetris/tetris.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', component: HomeComponent },
  { path: 'diep', component: DiepComponent },
  { path: 'gwent', component: GwentComponent },
  { path: 'snake', component: SnakeComponent },
  { path: 'sudoku', component: SudokuComponent },
  { path: 'tetris', component: TetrisComponent },
  { path: '**', redirectTo: '' }
];