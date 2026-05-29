import { Injectable } from '@angular/core';
import { Enemy, GameSystem } from '../../core/diep.interfaces';
import { HighScoresService } from '../../core/diep.high-scores.service';
import { DiepPlayerService } from './diep.player.service';

@Injectable({ providedIn: 'root' })
export class DiepDeathAnimationService implements GameSystem {
  public deathAnimationTimeStart: number | null = null;
  public enemiesRemainingForAnimation: Enemy[] = [];

  constructor(
    private highScoresService: HighScoresService,
    private playerService: DiepPlayerService
  ) {}

  /**
   * Implementation of GameSystem interface.
   * Runs sequentially in the execution pipeline to check death states post-subsystem mutations.
   */
  public update(engine: any, F: number, ms: number): void {
    if (!engine.isGameStarted || engine.isPaused) return;

    if (engine.gameOver) {
      if (this.deathAnimationTimeStart) {
        this.handleDeathAnimation(Date.now());
      }
      return;
    }

    if (this.playerService.isPlayerDead) {
      this.handleGameOver(engine);
    }
  }

  public handleGameOver(engine: any): void {
    const player = this.playerService.player;
    if (!player) return;

    this.highScoresService.addHighScore(engine.score);
    engine.topScores = this.highScoresService.getHighScores();
    player.health = 0;
    engine.gameOver = true;
    
    this.deathAnimationTimeStart = Date.now();
    this.enemiesRemainingForAnimation = [...engine.enemies];
    engine.enemies = [];
  }

  public handleDeathAnimation(now: number): void {
    if (!this.deathAnimationTimeStart) return;
    if (now - this.deathAnimationTimeStart >= 1000) {
      this.enemiesRemainingForAnimation = [];
      this.deathAnimationTimeStart = null;
    }
  }

  public getVisibleEnemies(currentEnemies: Enemy[]): Enemy[] {
    if (this.deathAnimationTimeStart !== null) {
      const timeElapsed = Date.now() - this.deathAnimationTimeStart;
      const enemiesToDisappear = Math.floor(
        (timeElapsed / 1000) * this.enemiesRemainingForAnimation.length
      );
      return this.enemiesRemainingForAnimation.slice(enemiesToDisappear);
    }
    return currentEnemies;
  }

  public reset(): void {
    this.deathAnimationTimeStart = null;
    this.enemiesRemainingForAnimation = [];
  }
}