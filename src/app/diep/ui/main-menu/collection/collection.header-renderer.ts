// src/app/diep/ui/main-menu/collection/collection-header-renderer.ts
import { DiepButton } from '../../../core/diep.interfaces';
import { InventoryRenderer } from './inventory-renderer';

export class CollectionHeaderRenderer {
  private static lastClickedId: string | null = null;
  private static lastClickTime: number = 0;
  
  // Persistent tracking array to lock visual positions (0, 1, 2)
  private static visualSlots: (string | null)[] = [null, null, null];

  /**
   * Synchronizes our stable visual slots with the backend service state without collapsing positions.
   */
  private static syncVisualSlots(equippedIds: string[]): void {
    // 1. Remove any item from visual slots that is no longer in the backend state
    for (let i = 0; i < this.visualSlots.length; i++) {
      const id = this.visualSlots[i];
      if (id && !equippedIds.includes(id)) {
        this.visualSlots[i] = null;
      }
    }

    // 2. Place newly equipped items into the leftmost available visual slot box
    for (const id of equippedIds) {
      if (!this.visualSlots.includes(id)) {
        const emptyIndex = this.visualSlots.indexOf(null);
        if (emptyIndex !== -1) {
          this.visualSlots[emptyIndex] = id;
        }
      }
    }
  }

  public static render(ctx: CanvasRenderingContext2D, g: any, width: number, buttons: DiepButton[]): void {
    if (!g.playerService?.player) {
      g.playerService.initializePlayer();
    }
    const player = g.playerService.player;
    const inv = player.inventory;
    const frame = g.frameCounter || 0;

    // Synchronize layout tracking with backend state before rendering
    this.syncVisualSlots(inv.equippedIds || []);

    // 1. Header Block - Left Aligned Styling
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = '900 32px Inter, sans-serif';
    ctx.fillStyle = '#3498db';
    ctx.fillText('COLLECTION', 50, 65);

    ctx.font = '500 13px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('Manage your discovered items, body modifications, and upgrade cards', 50, 85);

    // 2. Right-Aligned Balance Currency Balance Indicator
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

    // 3. Render Three Fixed "Equipped" Slots
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

      // Draw item from fixed tracking slot index
      const itemId = this.visualSlots[e];
      if (itemId) {
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
      const currentButtonId = `equipped-slot-${e}`;

      list.push({
        id: currentButtonId,
        label: '',
        x: eqStartX + e * (eqSlotSize + eqGap),
        y: eqStartY,
        w: eqSlotSize,
        h: eqSlotSize,
        color: 'transparent',
        borderColor: 'transparent',
        action: () => {
          if (!inv) return;
          
          const itemId = this.visualSlots[e];
          if (!itemId) return;
          
          const now = Date.now();
          const isDoubleClick = (this.lastClickedId === currentButtonId) && (now - this.lastClickTime < 300);
          
          this.lastClickedId = currentButtonId;
          this.lastClickTime = now;

          if (isDoubleClick) {
            g.playerService.unequipItem(itemId);
            this.visualSlots[e] = null; // Clear this specific box position immediately
          } else {
            const inventoryIndex = inv.slots.findIndex((s: any) => s.id === itemId);
            if (inventoryIndex !== -1) {
              InventoryRenderer.selectedIndex = inventoryIndex;
            }
          }
        }
      });
    }
  }
}