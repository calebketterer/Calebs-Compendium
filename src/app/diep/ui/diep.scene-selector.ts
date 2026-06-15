// src/app/diep/ui/diep.scene-selector.ts
import { Player } from '../core/diep.interfaces';
import { DiepWorldRenderer } from './diep.arena-renderer';
import { DiepShopRenderer } from './diep.shop-renderer';
import { DiepHudRenderer } from './hud/diep.hud-renderer';

export class DiepSceneSelector {
  /**
   * Resolves structural layout state routes, maps HUD components, 
   * and intercepts corrupted mode parameters safely.
   */
  public static renderScene(ctx: CanvasRenderingContext2D, g: any, player: Player, width: number, height: number): void {
    switch (g.currentMode) {
      case 'SHOP':
        DiepShopRenderer.renderShop(ctx, g, player, width, height);
        break;

      case 'ARENA':
        DiepWorldRenderer.renderWorld(ctx, g, player, width, height);
        // HUD layer execution is kept strictly native to active combat mode loops
        DiepHudRenderer.draw(ctx, g, player, width, height);
        break;

      case 'MENU':
        // The overlay layer manages drawing the background for menus, but we clear the canvas grid here
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        break;

      default:
        // Capture architectural state failure traces directly
        console.error(`[DiepSceneSelector] Unhandled game engine currentMode parsed: "${g.currentMode}". Dropping back safely to MENU layout views.`);
        
        // Force state safety recovery action parameters
        g.currentMode = 'MENU';
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        break;
    }
  }
}