// src/app/diep/ui/main-menu/collection/collection-header-renderer.ts
import { DiepButton } from '../../../../core/diep.interfaces';
import { EquippedSlotsRenderer } from './equipped-slots.renderer';

export class CollectionHeaderRenderer {
  public static render(ctx: CanvasRenderingContext2D, g: any, width: number, buttons: DiepButton[]): void {
    if (!g.playerService?.player) {
      g.playerService.initializePlayer();
    }
    const player = g.playerService.player;
    const inv = player.inventory;

    // Synchronize background state arrays using our newly decoupled sub-module
    EquippedSlotsRenderer.syncVisualSlots(inv.equippedIds || []);

    // 1. Title Block Labels
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '900 32px Inter, sans-serif';
    ctx.fillStyle = '#3498db';
    ctx.fillText('COLLECTION', 50, 65);

    ctx.font = '500 13px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('Manage your discovered items, body modifications, and upgrade cards', 50, 85);

    // 2. Right-Aligned Balance Box Dimensions
    const pixelAmountText = `${inv.pixels}`;
    ctx.font = 'bold 16px Inter, sans-serif';
    const textW = ctx.measureText(pixelAmountText).width;
    
    const boxGap = 10;
    const diamondSize = 12;
    const paddingX = 18;
    const boxW = textW + boxGap + diamondSize + (paddingX * 2);
    const boxH = 38; 
    const boxX = width - boxW - 50;
    const boxY = 38;
    
    ctx.strokeStyle = '#2980b9';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#3498db';
    ctx.textAlign = 'left';
    ctx.fillText(pixelAmountText, boxX + paddingX, 63);

    ctx.save();
    ctx.translate(boxX + paddingX + textW + boxGap + (diamondSize / 2), 56);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = '#3498db';
    ctx.fillRect(-6, -6, diamondSize, diamondSize);
    ctx.restore();

    // 3. Delegate Equipment Sub-Panel Layout cleanly relative to the currency bounding box
    const eqSlotSize = 38; 
    const eqGap = 10;
    const eqStartX = boxX - (eqSlotSize * 3) - (eqGap * 3); 
    const eqStartY = 38;

    EquippedSlotsRenderer.render(ctx, g, eqStartX, eqStartY, eqSlotSize, eqGap, buttons);
  }

  public static addButtons(list: DiepButton[], g: any, width: number): void {
    const player = g.playerService?.player;
    const inv = player?.inventory;
    const pixelAmountText = inv ? `${inv.pixels}` : '0';
    
    const textW = pixelAmountText.length * 7.5;
    const boxW = textW + 10 + 12 + (18 * 2);
    const boxX = width - boxW - 50;

    const eqSlotSize = 38;
    const eqGap = 10;
    const eqStartX = boxX - (eqSlotSize * 3) - (eqGap * 3);
    const eqStartY = 38;

    // Pipe layout coordinates down directly to populate standard list interaction targets
    EquippedSlotsRenderer.addButtons(list, g, eqStartX, eqStartY, eqSlotSize, eqGap);
  }
}