// src/app/diep/ui/shop-renderer.ts
import { Player, Bullet } from '../core/diep.interfaces';
import { DiepWorldRenderer } from './diep.arena-renderer';

export class DiepShopRenderer {
  /**
   * Master scene drawing call for the storefront sandbox
   */
  public static renderShop(ctx: CanvasRenderingContext2D, g: any, player: Player, width: number, height: number): void {
    // Render the dark shop space grid and background assets
    g.shopManagerService.drawShop(ctx, player, width, height);
    
    // Leverage the shared primitive drawing calls for cosmetic visuals
    if (g.isGameStarted && player) {
      DiepWorldRenderer.drawPlayer(ctx, player, g.gameOver);
      DiepWorldRenderer.drawBullets(ctx, g.bullets);
    }
  }
}