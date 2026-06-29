// src/app/diep/engine/subsystems/market/decor/decor.interface.ts
export interface MarketDecorProp {
  id: string;
  type: string;
  x: number;
  y: number;
  radius: number;
  
  isRectangular?: boolean;
  width?: number;
  height?: number;
  
  // FIXED: Angle is now tracked on the base definition layer
  angle?: number; 
  disableDefaultRotation?: boolean; // Optional flag if an object should NEVER rotate
  
  centerOffset?: { x: number; y: number };
  isSolid: boolean;
  baseColor: string;
  accentColor: string;
  render(ctx: CanvasRenderingContext2D): void;
}