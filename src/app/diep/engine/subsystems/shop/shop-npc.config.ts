// src/app/diep/engine/subsystems/shop/shop-npc.config.ts
import { REGISTERED_SHOP_VENDORS, DiepVendorProfile } from './vendors';

export interface DiepShopNpc {
  id: string;
  name: string;
  subtitle: string;
  type: DiepVendorProfile['type'];
  
  // Real-time grid vector scalars
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  
  // Structural Look Angle Interpolations
  currentAngle: number;
  targetAngle: number;
  lastHeadingAngle: number;
  
  // Runtime AI State parameters
  behaviorType: 'WANDER' | 'STAND';
  wanderState: 'IDLE' | 'MOVING_AIMLESS' | 'MOVING_TO_STALL';
  wanderTimer: number;
  wanderTargetX?: number;
  wanderTargetY?: number;
  
  // Conversational focus constraints
  focusedNpcId: string | null;
  interactionTimer: number;
  
  // Cosmetic Style rendering cache pairs
  baseColor: string;
  accentColor: string;
}

export class DiepShopNpcConfigRegistry {
  // --- AI Tuning & Weight Adjustments ---
  public static readonly WANDER_SPEED = 1.2;
  public static readonly STEERING_EASE = 0.05; 
  public static readonly SEPARATION_BUFFER = 25;
  public static readonly SEPARATION_FORCE_WEIGHT = 0.5;
  
  public static readonly ENGAGE_PROXIMITY = 220;    
  public static readonly SOCIAL_PROXIMITY = 140;    
  public static readonly TARGET_ARRIVE_RADIUS = 12; 

  public static readonly MIN_CHAT_DURATION = 1500;
  public static readonly MAX_CHAT_DURATION = 4000;
  public static readonly MIN_IDLE_DURATION = 2000;
  public static readonly MAX_IDLE_DURATION = 4500;

  public static readonly MAP_BOUNDS = {
    minX: 0.2, maxX: 0.8,
    minY: 0.4, maxY: 0.8
  };

  // --- Type-Specific Size Configuration Bounds ---
  public static readonly TYPE_SIZE_CONFIGS: Record<string, { MIN_RADIUS: number; MAX_RADIUS: number }> = {
    GENERAL:   { MIN_RADIUS: 20, MAX_RADIUS: 25 }, 
    COSMETICS: { MIN_RADIUS: 18, MAX_RADIUS: 23 }, 
    WEAPONS:   { MIN_RADIUS: 28, MAX_RADIUS: 34 }, 
    ABILITIES: { MIN_RADIUS: 22, MAX_RADIUS: 28 }  
  };

  // Session-based persistence caches
  public static readonly sessionColorCache = new Map<string, { base: string; accent: string }>();
  public static readonly sessionSizeCache = new Map<string, number>();
  public static readonly sessionPositionCache = new Map<string, { x: number; y: number }>();

  public static readonly COLOR_PALETTES = [
    { base: '#3498db', accent: '#2980b9' }, 
    { base: '#e74c3c', accent: '#c0392b' }, 
    { base: '#9b59b6', accent: '#8e44ad' }, 
    { base: '#2ecc71', accent: '#27ae60' }, 
    { base: '#f1c40f', accent: '#f39c12' }, 
    { base: '#e67e22', accent: '#d35400' }, 
    { base: '#1abc9c', accent: '#16a085' }  
  ];
}

// Automatically transform drop-in records into live runtime array objects
export const DIEP_SHOP_NPCS: DiepShopNpc[] = REGISTERED_SHOP_VENDORS.map(v => {
  const fallbackX = Math.random() * 0.6 + 0.2;
  const fallbackY = Math.random() * 0.4 + 0.4;

  return {
    id: v.id,
    name: v.name,
    subtitle: v.subtitle,
    type: v.type,
    x: v.initialX !== undefined ? v.initialX : fallbackX,
    y: v.initialY !== undefined ? v.initialY : fallbackY,
    vx: 0,
    vy: 0,
    radius: 20, 
    currentAngle: 0,
    targetAngle: 0,
    lastHeadingAngle: 0,
    behaviorType: 'STAND',
    wanderState: 'IDLE',
    wanderTimer: 0,
    focusedNpcId: null,
    interactionTimer: 0,
    baseColor: '#95a5a6',
    accentColor: '#7f8c8d'
  };
});