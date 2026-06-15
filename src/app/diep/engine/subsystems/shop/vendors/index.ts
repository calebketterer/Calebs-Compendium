// src/app/diep/engine/subsystems/shop/vendors/index.ts

import { GeneralVendor } from './general.vendor';
import { WeaponsVendor } from './weapons.vendor';
import { CosmeticsVendor } from './cosmetics.vendor';

// An array gathering all individual imports automatically
export const REGISTERED_SHOP_VENDORS = [
  GeneralVendor,
  WeaponsVendor,
  CosmeticsVendor
];

export * from './vendor.interface';