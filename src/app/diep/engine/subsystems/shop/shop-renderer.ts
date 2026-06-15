// src/app/diep/engine/subsystems/shop/shop-renderer.ts
import { Player } from '../../../core/diep.interfaces';
import { DIEP_SHOP_NPCS, DiepShopNpc } from './shop-npc.config';

export class DiepShopRenderer {
  
  /**
   * Handles canvas backdrop visuals and dynamically renders populated NPCs
   */
  public static drawShop(ctx: CanvasRenderingContext2D, player: Player, width: number, height: number): void {
    // 1. Draw solid canvas base background layout
    ctx.fillStyle = '#11161b';
    ctx.fillRect(0, 0, width, height);

    // 2. Render blueprint grids tracking crosswise spaces
    ctx.strokeStyle = 'rgba(52, 152, 219, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3. Loop through and render all active configurated shop NPCs dynamically
    for (const npc of DIEP_SHOP_NPCS) {
      const actualX = width * npc.x;
      const actualY = height * npc.y;
      this.drawShopNpc(ctx, actualX, actualY, npc);
    }
  }

  /**
   * Visual renderer structure for shop NPCs matching tank geometric styling mechanics
   */
  private static drawShopNpc(ctx: CanvasRenderingContext2D, x: number, y: number, npc: DiepShopNpc): void {
    const radius = npc.radius;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(npc.currentAngle);
    
    // Barrel underlay
    ctx.fillStyle = '#95a5a6';
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 2;
    ctx.fillRect(0, -radius * 0.4, radius * 1.8, radius * 0.8); 
    ctx.strokeRect(0, -radius * 0.4, radius * 1.8, radius * 0.8);

    // Main geometric body core circle
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = npc.baseColor;
    ctx.fill();
    ctx.strokeStyle = npc.accentColor;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.restore();

    // Typography Information Headings
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillStyle = npc.baseColor;
    ctx.textAlign = 'center';
    ctx.fillText(npc.name, x, y - radius - 20);

    ctx.font = '500 11px Inter, sans-serif';
    ctx.fillStyle = '#7f8c8d';
    ctx.fillText(npc.subtitle, x, y - radius - 6);
  }
}