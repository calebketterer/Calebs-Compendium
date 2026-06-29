// src/app/diep/engine/subsystems/market/decor/decor.interface.ts
export interface MarketDecorProp {
  id: string;
  type: string;
  x: number;
  y: number;
  radius: number;
  isSolid: boolean;
  baseColor: string;
  accentColor: string;
  
  /**
   * Vector-driven rendering instruction loop executed inside the active camera matrix block
   */
  render(ctx: CanvasRenderingContext2D): void;
}