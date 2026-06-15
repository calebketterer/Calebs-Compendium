// src/app/diep/ui/main-menu/collection/collection-header-renderer.ts
import { DiepButton } from '../../../core/diep.interfaces';

export class CollectionHeaderRenderer {
  public static render(ctx: CanvasRenderingContext2D, g: any, width: number, buttons: DiepButton[]): void {
    if (!g.playerService?.player) {
      g.playerService.initializePlayer();
    }
    const player = g.playerService.player;
    const inv = player.inventory;
    const frame = g.frameCounter || 0;

    // 1. Header Block - High-Boldness Left Aligned Styling
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '900 32px Inter, sans-serif';
    ctx.fillStyle = '#3498db';
    ctx.fillText('COLLECTION', 50, 65);

    ctx.font = '500 13px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('Manage your discovered items, body modifications, and upgrade cards', 50, 85);

    // 2. Right-Aligned Balance Currency Balance Indicator (Symbol only)
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

    // 3. Render Three Empty "Equipped" Slots - Aligned perfectly with Currency Box
    const eqSlotSize = 38; 
    const eqGap = 10;
    const eqStartX = boxX - (eqSlotSize * 3) - (eqGap * 3) - 0; 
    const eqStartY = 38;

    ctx.font = '900 11px Inter, sans-serif';
    ctx.fillStyle = '#3498db';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    ctx.fillText('EQUIPPED', eqStartX - 12, eqStartY + eqSlotSize / 2);

    ctx.textBaseline = 'alphabetic'; 

    for (let e = 0; e < 3; e++) {
      const sx = eqStartX + e * (eqSlotSize + eqGap);
      
      const slotButton = buttons.find(b => b.id === `equipped-slot-${e}`);
      const isEqHovered = slotButton && g.mouseX >= sx && g.mouseX <= sx + eqSlotSize && g.mouseY >= eqStartY && g.mouseY <= eqStartY + eqSlotSize;

      ctx.fillStyle = isEqHovered ? '#1c2833' : '#141419';
      ctx.strokeStyle = isEqHovered ? '#3498db' : '#2c3e50';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.roundRect(sx, eqStartY, eqSlotSize, eqSlotSize, 6);
      ctx.fill();
      ctx.stroke();

      // Render the item illustration if an item is equipped in this slot index
      if (e < inv.equippedIds.length) {
        const itemId = inv.equippedIds[e];
        const item = inv.slots.find((s: any) => s.id === itemId);
        if (item) {
          ctx.save();
          item.drawIllustration(ctx, sx, eqStartY, eqSlotSize, frame);
          ctx.restore();
        }
      }
    }
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
    const eqStartX = boxX - (eqSlotSize * 3) - (eqGap * 3) - 0;
    const eqStartY = 38;

    for (let e = 0; e < 3; e++) {
      list.push({
        id: `equipped-slot-${e}`,
        label: '',
        x: eqStartX + e * (eqSlotSize + eqGap),
        y: eqStartY,
        w: eqSlotSize,
        h: eqSlotSize,
        color: 'transparent',
        borderColor: 'transparent',
        action: () => {
          if (!inv || e >= inv.equippedIds.length) return;
          const itemId = inv.equippedIds[e];
          g.playerService.unequipItem(itemId);
        }
      });
    }
  }
}