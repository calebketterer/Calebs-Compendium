// src/app/diep/engine/subsystems/shop/shop-npc.behavior.ts
import { DIEP_SHOP_NPCS, DiepShopNpc, DiepShopNpcConfigRegistry as Cfg } from './shop-npc.config';

export class DiepShopNpcBehaviorEngine {

  /**
   * Processes all custom AI kinematics, objective path selections, and steering rotations
   */
  public static updateBehavior(npc: DiepShopNpc, g: any, playerX: number, playerY: number, tick: number, ms: number): void {
    const npcX = g.width * npc.x;
    const npcY = g.height * npc.y;

    if (!npc.interactionTimer) npc.interactionTimer = 0;
    if (npc.interactionTimer > 0) npc.interactionTimer -= ms;

    if (npc.behaviorType === 'WANDER') {
      this.processWanderAi(npc, g, npcX, npcY, playerX, playerY, ms);
      this.applySeparationAndSocializing(npc, g, npcX, npcY);
    } else {
      npc.vx = 0;
      npc.vy = 0;
    }

    npc.x += (npc.vx / g.width) * tick;
    npc.y += (npc.vy / g.height) * tick;

    Cfg.sessionPositionCache.set(npc.id, { x: npc.x, y: npc.y });

    this.processLookingOrientation(npc, g, g.width * npc.x, g.height * npc.y, playerX, playerY, tick);
  }

  private static processWanderAi(npc: DiepShopNpc, g: any, currentX: number, currentY: number, playerX: number, playerY: number, ms: number): void {
    if (!npc.wanderTimer) npc.wanderTimer = 0;
    npc.wanderTimer -= ms;

    const pDx = playerX - currentX;
    const pDy = playerY - currentY;
    const distToPlayer = Math.sqrt(pDx * pDx + pDy * pDy);

    if (distToPlayer < Cfg.ENGAGE_PROXIMITY) {
      npc.vx = 0;
      npc.vy = 0;
      return; 
    }

    if (npc.wanderState === 'IDLE' && npc.wanderTimer <= 0) {
      npc.focusedNpcId = null; 

      if (Math.random() > 0.5) {
        npc.wanderState = 'MOVING_AIMLESS';
        npc.wanderTargetX = (Math.random() * (Cfg.MAP_BOUNDS.maxX - Cfg.MAP_BOUNDS.minX) + Cfg.MAP_BOUNDS.minX) * g.width;
        npc.wanderTargetY = (Math.random() * (Cfg.MAP_BOUNDS.maxY - Cfg.MAP_BOUNDS.minY) + Cfg.MAP_BOUNDS.minY) * g.height;
      } else {
        npc.wanderState = 'MOVING_TO_STALL';
        npc.wanderTargetX = g.width * 0.5; 
        npc.wanderTargetY = g.height * 0.5;
      }
      npc.wanderTimer = 0; 
    }

    if ((npc.wanderState === 'MOVING_AIMLESS' || npc.wanderState === 'MOVING_TO_STALL') && npc.wanderTargetX !== undefined && npc.wanderTargetY !== undefined) {
      const tDx = npc.wanderTargetX - currentX;
      const tDy = npc.wanderTargetY - currentY;
      const tDist = Math.sqrt(tDx * tDx + tDy * tDy);

      if (tDist > Cfg.TARGET_ARRIVE_RADIUS) {
        const desiredVx = (tDx / tDist) * Cfg.WANDER_SPEED;
        const desiredVy = (tDy / tDist) * Cfg.WANDER_SPEED;

        npc.vx += (desiredVx - npc.vx) * Cfg.STEERING_EASE;
        npc.vy += (desiredVy - npc.vy) * Cfg.STEERING_EASE;

        npc.lastHeadingAngle = Math.atan2(npc.vy, npc.vx);
      } else {
        npc.wanderState = 'IDLE';
        npc.wanderTimer = Cfg.MIN_IDLE_DURATION + Math.random() * (Cfg.MAX_IDLE_DURATION - Cfg.MIN_IDLE_DURATION);
        npc.vx = 0;
        npc.vy = 0;
      }
    }
  }

  private static applySeparationAndSocializing(npc: DiepShopNpc, g: any, npcX: number, npcY: number): void {
    for (const other of DIEP_SHOP_NPCS) {
      if (other.id === npc.id) continue;

      const otherX = g.width * other.x;
      const otherY = g.height * other.y;

      const dx = npcX - otherX;
      const dy = npcY - otherY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = npc.radius + other.radius + Cfg.SEPARATION_BUFFER;

      if (dist < minDist && dist > 0) {
        const force = ((minDist - dist) / minDist) * Cfg.SEPARATION_FORCE_WEIGHT;
        npc.vx += (dx / dist) * force;
        npc.vy += (dy / dist) * force;
      }

      if (dist < Cfg.SOCIAL_PROXIMITY && npc.wanderState === 'IDLE' && other.wanderState === 'IDLE') {
        if (npc.focusedNpcId === null && (npc.interactionTimer || 0) <= 0) {
          npc.focusedNpcId = other.id;
          npc.interactionTimer = Cfg.MIN_CHAT_DURATION + Math.random() * (Cfg.MAX_CHAT_DURATION - Cfg.MIN_CHAT_DURATION);
        }
      }
      
      if (npc.focusedNpcId === other.id && (npc.interactionTimer || 0) <= 0) {
        npc.focusedNpcId = 'BREAK_AWAY'; 
      }
    }
  }

  private static processLookingOrientation(npc: DiepShopNpc, g: any, npcX: number, npcY: number, playerX: number, playerY: number, tick: number): void {
    const pDx = playerX - npcX;
    const pDy = playerY - npcY;
    const distToPlayer = Math.sqrt(pDx * pDx + pDy * pDy);

    if (distToPlayer < Cfg.ENGAGE_PROXIMITY) {
      npc.targetAngle = Math.atan2(pDy, pDx);
    } 
    else if (npc.wanderState !== 'IDLE' && (Math.abs(npc.vx) > 0.1 || Math.abs(npc.vy) > 0.1)) {
      npc.targetAngle = Math.atan2(npc.vy, npc.vx);
    } 
    else if (npc.focusedNpcId && npc.focusedNpcId !== 'BREAK_AWAY') {
      const buddy = DIEP_SHOP_NPCS.find(n => n.id === npc.focusedNpcId);
      if (buddy) {
        npc.targetAngle = Math.atan2((buddy.y * g.height) - npcY, (buddy.x * g.width) - npcX);
      }
    } 
    else {
      npc.targetAngle = npc.lastHeadingAngle;
    }

    let angleDiff = npc.targetAngle - npc.currentAngle;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    npc.currentAngle += angleDiff * 0.08 * tick;
  }
}