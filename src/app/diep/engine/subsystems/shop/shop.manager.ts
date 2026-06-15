// src/app/diep/engine/subsystems/shop/shop.manager.ts
import { Injectable } from '@angular/core';
import { Player } from '../../../core/diep.interfaces';
import { DiepShopRenderer } from './shop-renderer';
import { DiepShopPhysicsProcessor } from './shop-physics.processor';
import { DiepShopNpcInitializer } from './shop-npc.initializer';

@Injectable({
  providedIn: 'root'
})
export class DiepShopManagerService {

  /**
   * Performs data setup and entry mechanics for the store module
   */
  public transitionToShop(g: any): void {
    g.arenaReset.transition.fadeOut(() => {
      g.currentMode = 'SHOP';
      g.isGameStarted = true;
      g.gameOver = false;
      g.isPaused = false;
      
      g.bullets = [];
      g.playerService.initializePlayer(g.currentDifficulty, g.persistentXp);
      
      const p = g.playerService.player;
      if (p) {
        p.x = g.width / 2;
        p.y = g.height * 0.85;
      }

      // FIXED: Point to the isolated lifecycle initializer class
      DiepShopNpcInitializer.initializeDynamicNpcs();
      
      g.arenaReset.transition.fadeIn();
    });
  }

  /**
   * New exit sequence method to back out cleanly into the master main menu
   */
  public transitionToMenu(g: any): void {
    g.arenaReset.transition.fadeOut(() => {
      g.currentMode = 'MENU';
      g.isGameStarted = false;
      g.arenaReset.transition.fadeIn();
    });
  }

  /**
   * Encapsulates running logic for position updates, map constraints, and cosmetic weapon loops
   */
  public updateShop(g: any, tick: number, ms: number): void {
    const p = g.playerService.player;

    // 1. Delegate player tracking kinematics
    g.playerService.update(g, tick, ms);
    
    // 2. Coordinate weapons and projectile translation loops
    if (g.weaponController) {
      g.weaponController.update(g, tick, ms);
    }
    g.projectileService.update(g, tick, ms);

    // 3. Delegate specialized shop collisions
    if (p) {
      DiepShopPhysicsProcessor.process(g, p, g.bullets, tick, ms);
    }
    
    // 4. Run boundary containment loops
    if (p) {
      if (p.x < p.radius) p.x = p.radius;
      if (p.x > g.width - p.radius) p.x = g.width - p.radius;
      if (p.y < p.radius) p.y = p.radius;
      if (p.y > g.height - p.radius) p.y = g.height - p.radius;
    }
  }

  /**
   * Delegates rendering operations directly to the isolated graphics layer
   */
  public drawShop(ctx: CanvasRenderingContext2D, player: Player, width: number, height: number): void {
    DiepShopRenderer.drawShop(ctx, player, width, height);
  }
}