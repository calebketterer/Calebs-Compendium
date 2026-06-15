// src/app/diep/engine/subsystems/shop/shop-npc.initializer.ts
import { DIEP_SHOP_NPCS, DiepShopNpc, DiepShopNpcConfigRegistry as Cfg } from './shop-npc.config';
import { REGISTERED_SHOP_VENDORS } from './vendors';

export class DiepShopNpcInitializer {
  /**
   * Randomizes NPC traits and behaviors upon shop entrance passes
   */
  public static initializeDynamicNpcs(): void {
    for (const npc of DIEP_SHOP_NPCS) {
      npc.behaviorType = Math.random() > 0.5 ? 'WANDER' : 'STAND';

      let isFirstTimeThisSession = !Cfg.sessionPositionCache.has(npc.id);

      if (isFirstTimeThisSession) {
        const profile = REGISTERED_SHOP_VENDORS.find(v => v.id === npc.id);
        let startupX = npc.x;
        let startupY = npc.y;

        if (profile) {
          startupX = profile.initialX !== undefined ? profile.initialX : (Math.random() * 0.6 + 0.2);
          startupY = profile.initialY !== undefined ? profile.initialY : (Math.random() * 0.4 + 0.4);
        }
        Cfg.sessionPositionCache.set(npc.id, { x: startupX, y: startupY });
      }

      const cachedPos = Cfg.sessionPositionCache.get(npc.id)!;
      npc.x = cachedPos.x;
      npc.y = cachedPos.y;
      
      if (isFirstTimeThisSession) {
        const deltaX = 0.5 - npc.x;
        const deltaY = 0.85 - npc.y;
        const angleToPlayerSpawn = Math.atan2(deltaY, deltaX);
        
        npc.currentAngle = angleToPlayerSpawn;
        npc.targetAngle = angleToPlayerSpawn;
        npc.lastHeadingAngle = angleToPlayerSpawn;
      }

      npc.vx = 0;
      npc.vy = 0;
      npc.wanderState = 'IDLE';
      npc.wanderTimer = 0;
      npc.focusedNpcId = null;
      npc.interactionTimer = 0;

      // Session Size Configuration Setup
      if (!Cfg.sessionSizeCache.has(npc.id)) {
        const sizeBounds = Cfg.TYPE_SIZE_CONFIGS[npc.type] || Cfg.TYPE_SIZE_CONFIGS['ABILITIES'];
        const delta = sizeBounds.MAX_RADIUS - sizeBounds.MIN_RADIUS;
        const randomRadius = sizeBounds.MIN_RADIUS + Math.random() * delta;
        Cfg.sessionSizeCache.set(npc.id, Math.round(randomRadius));
      }
      npc.radius = Cfg.sessionSizeCache.get(npc.id)!;

      // Session Color Configuration Setup
      if (!Cfg.sessionColorCache.has(npc.id)) {
        const randomPalette = Cfg.COLOR_PALETTES[Math.floor(Math.random() * Cfg.COLOR_PALETTES.length)];
        Cfg.sessionColorCache.set(npc.id, randomPalette);
      }
      const cachedColors = Cfg.sessionColorCache.get(npc.id)!;
      npc.baseColor = cachedColors.base;
      npc.accentColor = cachedColors.accent;
    }
  }
}