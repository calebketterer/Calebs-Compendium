import { Injectable } from '@angular/core';
import { Player, DifficultyMode, GameSystem } from '../../core/diep.interfaces';
import { DiepPlayerUpgradesService } from './player-upgrades/diep.player-upgrades.service';
import { DiepGameEngineService } from '../diep.game-engine.service';

@Injectable({ providedIn: 'root' })
export class DiepPlayerService implements GameSystem {
    // This is now the definitive single-source-of-truth for the active player state.
    public player!: Player;

    constructor(private upgradeService: DiepPlayerUpgradesService) {}

    /**
     * Clean encapsulation getter to monitor player death without leaking health logic checks.
     */
    public get isPlayerDead(): boolean {
        return this.player ? this.player.health <= 0 : false;
    }

    /**
     * Initializes the internal player entity state.
     */
    public initializePlayer(difficulty: DifficultyMode = 'MEDIUM', carryOverXp: number = 0): void {
        this.player = { 
            x: 400, y: 300, vx: 0, vy: 0, 
            radius: 20, 
            mass: 25,
            angle: 0, 
            maxSpeed: 3, 
            color: '#3498db', 
            health: 100, maxHealth: 100,
            healthRegen: .5, 
            fireRate: 5, 
            bodyDamage: 20,
            bulletDamage: 10,
            bulletHealth: 10,
            bulletSpeed: 7.5,
            upgrades: {},
            progression: this.upgradeService.getDefaultProgression(difficulty, carryOverXp)
        };
    }

    /**
     * Implementation of GameSystem interface.
     * Evaluates keyboard physics forces, friction limits, mouse aiming tracking, and regeneration increments.
     */
    public update(engine: DiepGameEngineService, F: number, ms: number): void {
        if (!engine.isGameStarted || engine.isPaused || engine.gameOver) return;

        const results = this.updatePlayerPhysics(
            this.player,
            engine.keys,
            engine.mousePos,
            engine.mouseAiming,
            engine.width,
            engine.height,
            F,
            ms
        );

        engine.lastAngle = results.lastAngle;
    }

    public updatePlayerPhysics(
        player: Player,
        keys: { [key: string]: boolean },
        mousePos: { x: number; y: number },
        mouseAiming: boolean,
        width: number,
        height: number,
        F: number,
        deltaTime: number
    ): { lastAngle: number } {
        let lastAngle = player.angle;
        const FRICTION = Math.pow(0.9, F); 
        const ACCELERATION = 0.5 * F;

        if (keys['w']) player.vy -= ACCELERATION;
        if (keys['s']) player.vy += ACCELERATION;
        if (keys['a']) player.vx -= ACCELERATION;
        if (keys['d']) player.vx += ACCELERATION;

        player.x += player.vx * F;
        player.y += player.vy * F;

        player.vx *= FRICTION;
        player.vy *= FRICTION;

        const currentSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
        if (currentSpeed > player.maxSpeed) {
            const ratio = player.maxSpeed / currentSpeed;
            player.vx *= ratio;
            player.vy *= ratio;
        }

        if (mouseAiming) {
            player.angle = Math.atan2(mousePos.y - player.y, mousePos.x - player.x);
        } else if (Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1) {
            player.angle = Math.atan2(player.vy, player.vx);
        }
        lastAngle = player.angle;
        
        player.health = Math.min(player.maxHealth, player.health + (player.healthRegen * deltaTime / 1000));

        return { lastAngle };
    }
}