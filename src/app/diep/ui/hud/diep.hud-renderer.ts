// src/app/diep/ui/hud/diep.hud-renderer.ts
import { Player } from '../../core/diep.interfaces';
import { DiepXpBarRenderer } from './diep.xp-bar-renderer';
import { DiepHealthBarRenderer } from './diep.health-bar-renderer';
import { DiepUpgradeMenuRenderer } from './upgrade-menu/diep.upgrade-menu-renderer';
import { DiepPauseButtonRenderer } from './diep.pause-button-renderer';
import { DiepAchievementToastRenderer } from './diep.achievement-toast';

/**
 * DiepHudRenderer handles all fixed-position UI elements.
 * This separates the "Game World" (tanks/bullets) from the "Interface" (bars/text).
 */
export class DiepHudRenderer {

  public static draw(ctx: CanvasRenderingContext2D, g: any, player: Player, width: number, height: number): void {
    // 1. Internal Visibility Check
    if (!g.isGameStarted) return;

    // Corrected to reference the newly encapsulated game over state provider check
    const isOverlayActive = g.isPaused || (g.gameOver && !g.gameOverService.isAnimationActive());
    const uiTextColor = isOverlayActive ? '#fff' : (g.isDarkMode ? '#ecf0f1' : '#333');

    // 2. Draw Sub-modules (Bars and Menus) - Now safely using the injected player object
    DiepHealthBarRenderer.draw(ctx, player);
    DiepXpBarRenderer.draw(ctx, player, width, height);
    
    // FIXED: Passed all 4 expected parameters in the correct order
    DiepUpgradeMenuRenderer.draw(ctx, g, player, height); 
    
    // 3. Draw Global Stats (Score/Balance/Notifs)
    this.drawSessionStats(ctx, g, width, uiTextColor);
    this.drawNotifications(ctx, g, width);

    // 4. Draw the Pause Button Toggle
    DiepPauseButtonRenderer.draw(ctx, g, width);
  }

  private static drawSessionStats(ctx: CanvasRenderingContext2D, g: any, width: number, textColor: string): void {
    ctx.textBaseline = 'alphabetic';
    
    // 1. Draw Score Label Normally
    ctx.font = 'bold 20px Inter, sans-serif';
    ctx.fillStyle = textColor;
    ctx.textAlign = 'right';
    ctx.fillText('SCORE: ' + g.score, width - 20, 35);

    // 2. Draw the Pixel Balance Text (Replacing old Wave line)
    const pixelAmountText = `${g.pixelsService.balance}`;
    ctx.fillText(pixelAmountText, width - 42, 60);

    // 3. Render the matching Geometric Blue Currency Diamond Icon next to the text
    const diamondSize = 12;
    ctx.save();
    // Anchor the rotation matrix exactly to the right edge of the text profile boundary
    ctx.translate(width - 26, 53); 
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#3498db';
    ctx.fillRect(-diamondSize / 2, -diamondSize / 2, diamondSize, diamondSize);
    ctx.restore();
  }

  private static drawNotifications(ctx: CanvasRenderingContext2D, g: any, width: number): void {
    DiepAchievementToastRenderer.draw(ctx, width);
  }
}