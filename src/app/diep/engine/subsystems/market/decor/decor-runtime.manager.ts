// src/app/diep/engine/subsystems/market/decor/decor-runtime.manager.ts
import { Injectable } from '@angular/core';
import { MarketDecorProp } from './decor.interface';
import { REGISTERED_DECOR_BLUEPRINTS } from './index';
import { REGISTERED_SHOP_BLUEPRINTS } from '../shops/index';
import { Player } from '../../../../core/diep.interfaces';

@Injectable({
  providedIn: 'root'
})
export class MarketDecorRuntimeManager {
  public activeProps: MarketDecorProp[] = [];

  private readonly MAX_SHOPS_LIMIT = 6;     
  private readonly MAX_DECOR_LIMIT = 40;     
  private readonly MIN_SAFETY_CLEARANCE = 60; 

  private getRandomWeightedBlueprint(blueprints: any[]): any {
    const totalWeight = blueprints.reduce((sum, bp) => sum + (bp.weight || 1), 0);
    let roll = Math.random() * totalWeight;
    
    for (const blueprint of blueprints) {
      roll -= (blueprint.weight || 1);
      if (roll <= 0) {
        return blueprint;
      }
    }
    return blueprints[blueprints.length - 1];
  }

  private getGaussianFactor(sd: number = 0.1): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); 
    while (v === 0) v = Math.random();
    
    const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    let res = num * sd + 0.5; 
    
    if (res > 1 || res < 0) return this.getGaussianFactor(sd); 
    return res;
  }

  public generateMarketDecor(worldWidth: number, worldHeight: number): void {
    this.activeProps = [];
    let instanceIdCounter = 0;

    const anglesPool = [
      0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4,
      Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4
    ];

    // 1. Populate Central Commercial Shops (Kept at your preferred tight cluster)
    let shopAttempts = 0;
    while (this.activeProps.length < this.MAX_SHOPS_LIMIT && shopAttempts < 500) {
      shopAttempts++;
      
      const testX = worldWidth * this.getGaussianFactor(0.1);
      const testY = worldHeight * this.getGaussianFactor(0.1);

      const blueprint = this.getRandomWeightedBlueprint(REGISTERED_SHOP_BLUEPRINTS);
      const randomAngle = anglesPool[Math.floor(Math.random() * anglesPool.length)];
      
      const shopInstance = new blueprint.classRef(testX, testY, randomAngle);
      shopInstance.id = `${blueprint.type}-${instanceIdCounter++}`;

      if (!this.isPositionValid(shopInstance)) {
        continue; 
      }
      this.activeProps.push(shopInstance);
    }

    // 2. Populate Ambient Environment Clutter (FIXED: Spread widened to 0.45)
    const targetedTotal = this.activeProps.length + this.MAX_DECOR_LIMIT;
    let decorAttempts = 0;
    
    while (this.activeProps.length < targetedTotal && decorAttempts < 1500) {
      decorAttempts++;

      // FIXED: Swapped out the tight .1 factor for a wide .45 standard deviation
      // This forces props to distribute across the entire layout space out to the map borders
      const testX = worldWidth * this.getGaussianFactor(0.45);
      const testY = worldHeight * this.getGaussianFactor(0.45);

      // Keep ambient rocks/vents from polluting the core shopping walkways
      const distFromCenterX = testX - worldWidth / 2;
      const distFromCenterY = testY - worldHeight / 2;
      const distFromCenter = Math.sqrt(distFromCenterX * distFromCenterX + distFromCenterY * distFromCenterY);
      
      if (distFromCenter < worldWidth * 0.15 && Math.random() < 0.90) {
        continue;
      }

      const blueprint = this.getRandomWeightedBlueprint(REGISTERED_DECOR_BLUEPRINTS);
      const randomAngle = anglesPool[Math.floor(Math.random() * anglesPool.length)];
      
      const propInstance = new blueprint.classRef(testX, testY, randomAngle);
      propInstance.id = `${blueprint.type}-${instanceIdCounter++}`;

      if (propInstance.disableDefaultRotation) {
        propInstance.angle = 0;
      }

      if (!this.isPositionValid(propInstance)) {
        continue;
      }
      this.activeProps.push(propInstance);
    }
  }

  private isPositionValid(candidate: MarketDecorProp): boolean {
    for (const existing of this.activeProps) {
      const dx = candidate.x - existing.x;
      const dy = candidate.y - existing.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const candidateSize = candidate.isRectangular && candidate.width 
        ? Math.max(candidate.width, candidate.height || 0) / 2 
        : candidate.radius;

      const existingSize = existing.isRectangular && existing.width 
        ? Math.max(existing.width, existing.height || 0) / 2 
        : existing.radius;

      const minimumSafeGap = candidateSize + existingSize + this.MIN_SAFETY_CLEARANCE;

      if (distance < minimumSafeGap) {
        return false;
      }
    }
    return true;
  }

  public processDecorCollisions(player: Player): void {
    if (!player) return;

    for (const prop of this.activeProps) {
      if (!prop.isSolid) continue;

      if (prop.isRectangular && prop.width && prop.height) {
        const angle = prop.angle || 0;
        const subCircleRadius = prop.height / 2;
        const spacing = subCircleRadius * 1.2; 
        const steps = Math.max(1, Math.floor(prop.width / spacing));
        
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        let centerX = prop.x;
        let centerY = prop.y;
        if (prop.centerOffset) {
          centerX += prop.centerOffset.x * cos - prop.centerOffset.y * sin;
          centerY += prop.centerOffset.x * sin + prop.centerOffset.y * cos;
        }

        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const offsetDist = (t - 0.5) * (prop.width - subCircleRadius * 2);
          
          const nodeX = centerX + offsetDist * cos;
          const nodeY = centerY + offsetDist * sin;

          const dx = player.x - nodeX;
          const dy = player.y - nodeY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = player.radius + subCircleRadius;

          if (distance < minDistance && distance > 0) {
            const overlap = minDistance - distance;
            player.x += (dx / distance) * overlap;
            player.y += (dy / distance) * overlap;
          }
        }
      } else {
        const dx = player.x - prop.x;
        const dy = player.y - prop.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = player.radius + prop.radius;

        if (distance < minDistance && distance > 0) {
          const overlap = minDistance - distance;
          player.x += (dx / distance) * overlap;
          player.y += (dy / distance) * overlap;
        }
      }
    }
  }
}