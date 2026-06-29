// src/app/diep/engine/subsystems/market/decor/pillar.prop.ts
import { MarketDecorProp } from './decor.interface';

export class StructuralPillar implements MarketDecorProp {
  public id = 'prop-pillar';
  public type = 'PILLAR';
  public radius = 35;
  public isSolid = true;
  public baseColor = '#2c3e50';
  public accentColor = '#7f8c8d';

  constructor(public x: number, public y: number) {}

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Inner concrete pillar base ring
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.baseColor;
    ctx.fill();
    ctx.strokeStyle = this.accentColor;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Technical geometric core cross hairs
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-this.radius * 0.4, -this.radius * 0.4, this.radius * 0.8, this.radius * 0.8);
    
    ctx.restore();
  }
}