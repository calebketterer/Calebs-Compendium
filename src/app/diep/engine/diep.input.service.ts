import { Injectable } from '@angular/core';
import { DiepGameEngineService } from './diep.game-engine.service';
import { DiepInteractionService } from '../ui/buttons/diep.button-interaction.service';
import { DiepQuadriviumMenu } from '../ui/main-menu/quadrivium/diep.quadrivium-menu';
import { DiepAchievementMenu } from '../ui/main-menu/achievements/diep.achievement-menu';
import { DiepDynamicTitle } from '../ui/main-menu/diep.dynamic-title';
import { DiepTipsManager } from '../ui/main-menu/diep.tips-manager';
import { DiepProjectileService } from './subsystems/diep.projectile.service';
import { DiepPlayerService } from './subsystems/diep.player.service';

@Injectable({
  providedIn: 'root'
})
export class DiepInputService {
  constructor(
    private gameEngine: DiepGameEngineService,
    private buttonHandler: DiepInteractionService,
    private projectileService: DiepProjectileService,
    private playerService: DiepPlayerService
  ) {}

  public handleKeyDown(event: KeyboardEvent, drawCallback: () => void, gameLoopCallback: () => void) {
    const key = event.key.toLowerCase();
    this.gameEngine.keys[key] = true;

    // Prevent browser scroll when navigating sub-menus
    if (this.gameEngine.showingQuadrivium || this.gameEngine.showingAchievements) {
      if (['arrowup', 'arrowdown', 'w', 's', ' '].includes(key)) {
        event.preventDefault();
      }
    }

    if (key === 'p' || key === ' ') {
      const wasPaused = this.gameEngine.togglePause();
      drawCallback();
      if (!wasPaused) gameLoopCallback();
      event.preventDefault();
      return;
    }

    if ((key === 'k') && !this.gameEngine.mouseAiming) {
      const g = this.gameEngine;
      const activePlayer = this.playerService.player;
      this.projectileService.shootBullet(activePlayer, g.mousePos, g.mouseAiming, g.lastAngle, g.bullets);
      event.preventDefault();
    }

    if (key === 'm') this.gameEngine.mouseAiming = !this.gameEngine.mouseAiming;
  }

  public handleKeyUp(event: KeyboardEvent) {
    this.gameEngine.keys[event.key.toLowerCase()] = false;
  }

  public handleMouseMove(event: MouseEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    this.gameEngine.mousePos.x = mouseX;
    this.gameEngine.mousePos.y = mouseY;

    // Scroll Hooks
    if (this.gameEngine.showingQuadrivium) {
      DiepQuadriviumMenu.handleInputMove(mouseY);
    } else if (this.gameEngine.showingAchievements) {
      DiepAchievementMenu.handleInputMove(mouseY);
    }
  }

  public handleMouseDown(
    event: MouseEvent, 
    canvas: HTMLCanvasElement, 
    gameLoopCallback: () => void, 
    drawCallback: () => void
  ) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // 1. Boundary Check
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) {
      return;
    }

    // Dynamic Title Interaction Hook
    // We check if the game hasn't started (Main Menu) and if the click is in the upper title area
    if (!this.gameEngine.isGameStarted) {
      // 1. Title check
      if (mouseY < 250) {
          DiepDynamicTitle.handleClick(event.detail === 2);
      } 
      
      // 2. ADD THIS: Simple pass-through for the tips
      DiepTipsManager.handleInteraction(mouseX, mouseY, canvas.width, canvas.height);
    }

    // Scroll Hooks
    if (this.gameEngine.showingQuadrivium) {
      DiepQuadriviumMenu.handleInputDown(mouseY);
    } else if (this.gameEngine.showingAchievements) {
      DiepAchievementMenu.handleInputDown(mouseY);
    }

    // 2. UI Interception
    const wasButtonClicked = this.buttonHandler.handleMouseEvent(
      event, 
      canvas, 
      gameLoopCallback, 
      drawCallback
    );

    // 3. Gameplay Logic
    if (wasButtonClicked) {
      canvas.focus();
    } else {
      const g = this.gameEngine;
      const activePlayer = this.playerService.player;
      if (g.mouseAiming && event.button === 0 && !g.isPaused && !g.gameOver && g.isGameStarted) {
        g.mouseDown = true;
        this.projectileService.shootBullet(activePlayer, g.mousePos, g.mouseAiming, g.lastAngle, g.bullets);
      }
    }
  }

  public handleMouseUp(event: MouseEvent) {
    // Scroll Hooks
    if (this.gameEngine.showingQuadrivium) {
      DiepQuadriviumMenu.handleInputUp();
    } else if (this.gameEngine.showingAchievements) {
      DiepAchievementMenu.handleInputUp();
    }

    if (event.button === 0) {
      this.gameEngine.mouseDown = false;
    }
  }
}