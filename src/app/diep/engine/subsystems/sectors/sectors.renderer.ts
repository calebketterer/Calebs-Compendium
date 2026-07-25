import { Player } from '../../../core/diep.interfaces';
import { FactionColor, FACTION_COLOR_HEX } from './sectors.interfaces';
import { DiepWorldRenderer } from '../../../ui/diep.arena-renderer';
import { DiepHudRenderer } from '../../../ui/hud/diep.hud-renderer';
import { SectorsDecorDirector } from './structures/sectors.decor-director';

export class SectorsRenderer {
  private static decorDirector = new SectorsDecorDirector();

  /**
   * Renders the complete Sectors game mode scene using authentic Diep visual styling.
   */
  public static renderSectors(
    ctx: CanvasRenderingContext2D,
    g: any,
    player: Player,
    width: number,
    height: number
  ): void {
    const director = g.sectorsManager?.roomDirector;
    const room = director?.currentRoom;

    const factionKey = (room?.faction ?? 'blue') as FactionColor;
    const factionHex = FACTION_COLOR_HEX[factionKey] || FACTION_COLOR_HEX.blue;

    // 1. Base Dark Grid Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines tinted by current sector faction
    ctx.beginPath();
    ctx.strokeStyle = `${factionHex}33`;
    ctx.lineWidth = 1;
    const tileSize = 50;
    for (let x = 0; x <= width; x += tileSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += tileSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // 2. Toxic Trails & Ground Layer
    if (g.isGameStarted || g.gameOver) {
      DiepWorldRenderer.drawToxicTrails(ctx, g.toxicTrails || []);

      const visibleEnemies = g.gameOverService?.getAnimationEnemies(g.enemies || []) || (g.enemies || []);
      const groundEnemies = visibleEnemies.filter((e: any) => !e.isFlying);

      // Draw Ground Enemies, Player, and Bullets with full barrels, health bars & strokes
      DiepWorldRenderer.drawEnemiesWithBars(ctx, groundEnemies, player, g.bullets || []);
      DiepWorldRenderer.drawPlayer(ctx, player, g.gameOver);
      DiepWorldRenderer.drawBullets(ctx, g.bullets || []);
    }

    // 3. Sector Outer Perimeter Walls & Doors
    ctx.strokeStyle = factionHex;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, width - 6, height - 6);

    if (room && director) {
      this.decorDirector.drawRoomStructures(
        ctx,
        room,
        director.rooms,
        director.getNeighborCoords.bind(director)
      );
    }

    // 4. Flying Layer (Enemies over walls/doors)
    if (g.isGameStarted || g.gameOver) {
      const visibleEnemies = g.gameOverService?.getAnimationEnemies(g.enemies || []) || (g.enemies || []);
      const flyingEnemies = visibleEnemies.filter((e: any) => e.isFlying);
      if (flyingEnemies.length > 0) {
        DiepWorldRenderer.drawEnemiesWithBars(ctx, flyingEnemies, player, g.bullets || []);
      }
    }

    // 5. HUD Overlay
    DiepHudRenderer.draw(ctx, g, player, width, height);

    // 6. Sector Coordinates Text Overlay
    const paddingRight = 20;
    const paddingBottom = 40;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`FACTION: ${String(factionKey).toUpperCase()}`, width - paddingRight, height - paddingBottom);
    ctx.fillText(`SECTOR: [${room?.gridX ?? 0}, ${room?.gridY ?? 0}]`, width - paddingRight, height - (paddingBottom - 18));
  }
}