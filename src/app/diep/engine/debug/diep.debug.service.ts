// src/app/diep/engine/debug/diep.debug.service.ts
import { Injectable, isDevMode } from '@angular/core';
import { DiepGameEngineService } from '../diep.game-engine.service';
import { DiepAchievementToastRenderer } from '../../ui/hud/diep.achievement-toast';
import { DiepPlayerService } from '../subsystems/player/diep.player.service';
import { DiepPixelsService } from '../../core/diep.pixels.service';

@Injectable({ providedIn: 'root' })
export class DiepDebugService {
  constructor(
    private gameEngine: DiepGameEngineService,
    private playerService: DiepPlayerService,
    private pixelsService: DiepPixelsService
  ) {}

  public handleDebugInput(event: KeyboardEvent): boolean {
    if (!isDevMode()) return false;

    // We check exact key for 'P' (Shift+p) vs 'p' before converting to lowercase
    const exactKey = event.key;
    const lowerKey = exactKey.toLowerCase();

    switch (lowerKey) {
      case 'l':
        this.triggerRandomAchievement();
        return true;
      case 'i':
        this.toggleInvincibility();
        return true;
      case 'u':
        this.applyUpgrades();
        return true;
      case 'p':
        this.adjustBalance(exactKey, event.repeat);
        return true;
      default:
        return false;
    }
  }

  private adjustBalance(key: string, isRepeating: boolean): void {
    if (!this.playerService.player) return;

    if (key === 'p') {
      if (isRepeating) {
        // Holding lowercase 'p' zeros out the wallet account completely
        this.pixelsService.spend(this.pixelsService.balance);
        console.log(`[DEBUG] Wallet Emptied. Current Balance: ${this.pixelsService.balance} PX`);
      } else {
        // Tapping lowercase 'p' reduces balance by 100
        this.pixelsService.spend(100);
        console.log(`[DEBUG] Deducted 100 PX. Current Balance: ${this.pixelsService.balance} PX`);
      }
    } else if (key === 'P') {
      if (isRepeating) {
        // Holding uppercase 'P' sets balance directly to 1,000,000
        const deficit = 1000000 - this.pixelsService.balance;
        if (deficit > 0) {
          this.pixelsService.add(deficit);
        } else if (deficit < 0) {
          this.pixelsService.spend(Math.abs(deficit));
        }
        console.log(`[DEBUG] Wallet Maxed. Current Balance: ${this.pixelsService.balance} PX`);
      } else {
        // Tapping uppercase 'P' increments balance by 100
        this.pixelsService.add(100);
        console.log(`[DEBUG] Added 100 PX. Current Balance: ${this.pixelsService.balance} PX`);
      }
    }
  }

  private toggleInvincibility() {
    const p = this.playerService.player;
    if (!p) return;

    // Check if we are currently in god mode
    const isCurrentlyGod = p.maxHealth >= 10000;

    if (isCurrentlyGod) {
      // REVERT TO NORMAL
      p.maxHealth = 100;
      p.health = 100;
      p.healthRegen = 1;
      this.notify('DEBUG', 'MORTAL MODE ACTIVE');
    } else {
      // ENABLE GOD MODE
      p.maxHealth = 10000;
      p.health = 10000;
      p.healthRegen = 100;
      this.notify('DEBUG', 'GOD MODE ACTIVE');
    }
  }

  private applyUpgrades() {
    const p = this.playerService.player;
    if (!p) return;
    
    p.progression.upgradePoints = 50;
    this.notify('DEBUG', 'ADDED 50 UPGRADE POINTS');
  }

  private triggerRandomAchievement() {
    const achs = this.gameEngine.achievementService.achievements;
    if (achs && achs.length > 0) {
      const randomAch = achs[Math.floor(Math.random() * achs.length)];
      DiepAchievementToastRenderer.add(randomAch);
    }
  }

  private notify(name: string, description: string) {
    DiepAchievementToastRenderer.add({
      id: `debug-${Date.now()}`,
      name: name,
      description: description,
      targetValue: 1,
      currentValue: 1,
      isUnlocked: true,
      type: 'SCORE',
      weight: 666
    });
  }
}