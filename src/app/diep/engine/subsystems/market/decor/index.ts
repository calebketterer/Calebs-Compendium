// src/app/diep/engine/subsystems/market/decor/index.ts
import { StructuralPillar } from './pillar.prop';
import { PowerCrystal } from './crystal.prop';
import { FloorVent } from './vent.prop';

// Direct export matching your established architectural registry patterns
export const REGISTERED_DECOR_BLUEPRINTS = [
  { classRef: StructuralPillar, type: 'PILLAR' },
  { classRef: PowerCrystal, type: 'CRYSTAL' },
  { classRef: FloorVent, type: 'VENT' }
];

export * from './decor.interface';