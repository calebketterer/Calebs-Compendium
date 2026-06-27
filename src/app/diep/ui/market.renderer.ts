import { Player, Bullet } from '../core/diep.interfaces';
import { DiepWorldRenderer } from './diep.arena-renderer';

export class MarketRenderer {
  /**
   * Master scene drawing call for the storefront sandbox
   */
  public static renderMarket(ctx: CanvasRenderingContext2D, g: any, player: Player, width: number, height: number): void {
    // Render the dark market space grid and background assets
    g.marketManagerService.drawMarket(ctx, player, width, height);
    
    // Leverage the shared primitive drawing calls for cosmetic visuals
    if (g.isGameStarted && player) {
      DiepWorldRenderer.drawPlayer(ctx, player, g.gameOver);
      DiepWorldRenderer.drawBullets(ctx, g.bullets);
    }
  }
}