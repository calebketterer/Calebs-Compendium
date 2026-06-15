// src/app/diep/ui/main-menu/collection/item-preview.renderer.ts
import { InventoryItem, DiepButton, PlayerInventory } from '../../../core/diep.interfaces';

export class ItemPreviewRenderer {
  /**
   * Renders the right-hand inspection details panel for a selected inventory item.
   */
  public static render(
    ctx: CanvasRenderingContext2D,
    selectedItem: InventoryItem | null,
    panelX: number,
    panelY: number,
    panelW: number,
    panelH: number,
    inv: PlayerInventory
  ): void {
    // Render Inspection Right-Side Base Overlay Box Container
    ctx.fillStyle = '#161616';
    ctx.strokeStyle = '#2d2d2d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 12);
    ctx.fill();
    ctx.stroke();

    if (!selectedItem) {
      ctx.fillStyle = '#666666';
      ctx.font = 'italic 15px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Select an item to inspect details.', panelX + panelW / 2, panelY + panelH / 2);
      ctx.textBaseline = 'alphabetic';
      return;
    }

    ctx.textBaseline = 'alphabetic';

    // Render Item Title Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(selectedItem.name, panelX + 30, panelY + 50);

    // Render Type Badge Category Tag
    const tagText = selectedItem.type.replace('_', ' ');
    ctx.font = 'bold 11px Inter, sans-serif';
    const tagW = ctx.measureText(tagText).width;

    ctx.fillStyle = '#2980b9';
    ctx.beginPath();
    ctx.roundRect(panelX + 30, panelY + 68, tagW + 16, 22, 6);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(tagText, panelX + 38, panelY + 83);

    let abilityText = '';
    let flavorText = selectedItem.description;

    const sentences = selectedItem.description.split(/(?<=\.)\s+/);
    const abilityIndex = sentences.findIndex((s: string) => 
      s.toLowerCase().includes('%') || 
      s.toLowerCase().includes('equipped') || 
      s.toLowerCase().includes('doubles')
    );

    if (abilityIndex !== -1) {
      abilityText = sentences[abilityIndex];
      flavorText = sentences.filter((_: string, idx: number) => idx !== abilityIndex).join(' ');
    }

    let textCursorY = panelY + 130;

    // 1. Draw Ability modifier line if extracted
    if (abilityText) {
      ctx.fillStyle = '#2ecc71';
      ctx.font = 'bold 15px Inter, sans-serif';
      this.wrapText(ctx, abilityText, panelX + 30, textCursorY, panelW - 60, 22);
      
      const words = abilityText.split(' ');
      let testLine = '';
      let linesCount = 1;
      for (let n = 0; n < words.length; n++) {
        let testWidth = ctx.measureText(testLine + words[n] + ' ').width;
        if (testWidth > (panelW - 60) && n > 0) {
          linesCount++;
          testLine = words[n] + ' ';
        } else {
          testLine += words[n] + ' ';
        }
      }
      textCursorY += (linesCount * 22) + 16;
    }

    // 2. Draw Flavor lore sub-text block underneath
    if (flavorText) {
      ctx.fillStyle = 'rgba(236, 240, 241, 0.45)';
      ctx.font = 'italic 13px Inter, sans-serif';
      this.wrapText(ctx, flavorText, panelX + 30, textCursorY, panelW - 60, 20);
    }
  }

  /**
   * Adds the interactive toggle button inside the item preview sub-panel bounds.
   */
  public static addPanelButtons(
    list: DiepButton[],
    selectedItem: InventoryItem | null,
    panelX: number,
    panelY: number,
    panelW: number,
    panelH: number,
    inv: PlayerInventory,
    g: any
  ): void {
    if (!selectedItem) return;

    const isEquipped = inv.equippedIds.includes(selectedItem.id);
    const slotsFull = inv.equippedIds.length >= 3;

    let btnLabel = isEquipped ? 'UNEQUIP ITEM' : 'EQUIP ITEM';
    let btnColor = isEquipped ? '#c0392b' : '#2ecc71';
    let borderC = isEquipped ? '#a93226' : '#27ae60';
    let isClickable = true;

    if (!isEquipped && slotsFull) {
      btnLabel = 'LOADOUT FULL';
      btnColor = '#2c3e50';
      borderC = '#34495e';
      isClickable = false;
    }

    const btnW = 160;
    const btnH = 40;
    // Horizontally centered inside the preview panel bounds
    const btnX = panelX + (panelW - btnW) / 2;
    const btnY = panelY + panelH - btnH - 40;

    list.push({
      id: 'preview-equip-toggle-btn',
      label: btnLabel,
      x: btnX,
      y: btnY,
      w: btnW,
      h: btnH,
      color: btnColor,
      borderColor: borderC,
      textColor: '#ffffff',
      hoverEffect: isClickable ? 'grow' : 'none',
      fontSize: 'bold 13px Inter, sans-serif',
      action: () => {
        if (!isClickable || !g.playerService) return;

        if (isEquipped) {
          g.playerService.unequipItem(selectedItem.id);
        } else {
          g.playerService.equipItem(selectedItem.id);
        }
      }
    });
  }

  private static wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
    const words = text.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }
}