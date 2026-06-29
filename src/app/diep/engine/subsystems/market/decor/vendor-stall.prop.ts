// src/app/diep/engine/subsystems/market/decor/vendor-stall.prop.ts
import { MarketDecorProp } from './decor.interface';

export class VendorStall implements MarketDecorProp {
  public id = 'prop-stall';
  public type = 'STALL';
  public radius = 55; // Slightly larger footprint for shop boundaries
  public isSolid = true; // Player can't clip through counter structures
  
  // Default gray palette parameters as requested
  public baseColor = '#34495e';
  public accentColor = '#2c3e50';
  public counterColor = '#7f8c8d';

  // Keep track of which vendor id owns this stall down the line
  public ownerId: string | null = null;

  constructor(public x: number, public y: number, colorOverride?: { base: string, accent: string }) {
    if (colorOverride) {
      this.baseColor = colorOverride.base;
      this.accentColor = colorOverride.accent;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);

    // 1. Draw the back-awning support columns
    ctx.fillStyle = '#11161b';
    ctx.strokeStyle = this.accentColor;
    ctx.lineWidth = 2;
    ctx.fillRect(-this.radius + 10, -this.radius + 10, 12, 12);
    ctx.strokeRect(-this.radius + 10, -this.radius + 10, 12, 12);
    ctx.fillRect(this.radius - 22, -this.radius + 10, 12, 12);
    ctx.strokeRect(this.radius - 22, -this.radius + 10, 12, 12);

    // 2. Main horizontal front service counter deck
    ctx.fillStyle = this.counterColor;
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 3;
    // Positioned forward so the vendor can fit neatly inside the slot frame behind it
    ctx.fillRect(-this.radius, 5, this.radius * 2, this.radius * 0.5);
    ctx.strokeRect(-this.radius, 5, this.radius * 2, this.radius * 0.5);

    // 3. Accent vendor colored side trims
    ctx.fillStyle = this.baseColor;
    ctx.fillRect(-this.radius, -this.radius + 20, 8, this.radius * 1.2);
    ctx.fillRect(this.radius - 8, -this.radius + 20, 8, this.radius * 1.2);

    ctx.restore();
  }
}