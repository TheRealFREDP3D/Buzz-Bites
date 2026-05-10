import { Unit, UnitType, FoodItem } from './types';

// Re-export constants from centralized location
export {
  GAME_TICK_MS,
  LANE_COUNT,
  BASE_HEALTH,
  UPGRADE_STAT_INCREASE,
  UPGRADE_COST_INCREASE,
  GATHERER_CARRY_AMOUNT,
  GAME_CONFIG,
  CENTER_LANE_INDEX,
  POSITIONS,
  RESOURCES,
  COMBAT,
  AI,
  validateLane,
  validatePosition,
  isCenterLane,
  isResourceLane,
  isCombatLane,
  getCombatLanes,
  calculateUpgradeCost,
  calculateStatMultiplier,
  calculateDefensiveBonus,
  calculateDamageMultiplier,
  formatTime,
  generateUniqueId,
  validateUnitPlacement,
} from './utils/gameConstants';

// Legacy constants for backward compatibility
export const WINNING_SCORE = 100;
export const INITIAL_TERRITORY = 50;

export const FOOD_ITEMS: FoodItem[] = [
  { name: "Giant Cupcake", emoji: "🧁" },
  { name: "Sticky Soda", emoji: "🥤" },
  { name: "Lost Lollipop", emoji: "🍭" },
  { name: "Strawberry Slice", emoji: "🍰" },
  { name: "Glazed Donut", emoji: "🍩" },
  { name: "Pizza Crust", emoji: "🍕" },
  { name: "Melting Ice Cream", emoji: "🍦" }
];

export const BEE_UNITS: Record<UnitType, Unit> = {
  [UnitType.WORKER]: {
    id: 'bee_worker',
    type: UnitType.WORKER,
    name: 'Pollen Puffer',
    cost: 5,
    baseUpgradeCost: 30,
    hp: 30,
    attack: 2,
    speed: 0.3,
    range: 5,
    gatherRate: 0.05,
    attackSpeed: 1000,
    description: 'Generates resources passively. Weak fighter.',
    emoji: '🐝'
  },
  [UnitType.GATHERER]: {
    id: 'bee_gatherer',
    type: UnitType.GATHERER,
    name: 'Nectar Hauler',
    cost: 25,
    baseUpgradeCost: 150,
    hp: 60,
    attack: 0,
    speed: 0.6,
    range: 1,
    gatherRate: 0,
    attackSpeed: 0,
    description: 'Sprints to center lane food and brings back 15 resources.',
    emoji: '👜🐝'
  },
  [UnitType.SOLDIER]: {
    id: 'bee_soldier',
    type: UnitType.SOLDIER,
    name: 'Stinger Striker',
    cost: 37,
    baseUpgradeCost: 200,
    hp: 120,
    attack: 15,
    speed: 0.5,
    range: 8,
    gatherRate: 0,
    attackSpeed: 800,
    description: 'Frontline fighter. Fast and sharp.',
    emoji: '⚔️🐝'
  },
  [UnitType.ELITE]: {
    id: 'bee_elite',
    type: UnitType.ELITE,
    name: 'Hornet Ace',
    cost: 50,
    baseUpgradeCost: 300,
    hp: 90,
    attack: 25,
    speed: 0.9,
    range: 10,
    gatherRate: 0,
    attackSpeed: 600,
    description: 'High-speed aerial unit. Hits hard and fast.',
    emoji: '🚁🐝'
  },
  [UnitType.SPECIAL]: {
    id: 'bee_special',
    type: UnitType.SPECIAL,
    name: 'Royal Jelly Jet',
    cost: 75,
    baseUpgradeCost: 400,
    hp: 300,
    attack: 40,
    speed: 0.8,
    range: 25,
    gatherRate: 0,
    attackSpeed: 1500,
    description: 'Fast, ranged aerial bombardment.',
    emoji: '🚀🐝'
  }
};

export const ANT_UNITS: Record<UnitType, Unit> = {
  [UnitType.WORKER]: {
    id: 'ant_worker',
    type: UnitType.WORKER,
    name: 'Crumb Carrier',
    cost: 7,
    baseUpgradeCost: 100,
    hp: 30,
    attack: 2,
    speed: 0.2,
    range: 5,
    gatherRate: 0.05,
    attackSpeed: 1000,
    description: 'Slow but steady resource generator.',
    emoji: '🐜'
  },
  [UnitType.GATHERER]: {
    id: 'ant_gatherer',
    type: UnitType.GATHERER,
    name: 'Sugar Scout',
    cost: 20,
    baseUpgradeCost: 150,
    hp: 70,
    attack: 0,
    speed: 0.5,
    range: 1,
    gatherRate: 0,
    attackSpeed: 0,
    description: 'Runs to center lane food and returns with 15 resources.',
    emoji: '🎒🐜'
  },
  [UnitType.SOLDIER]: {
    id: 'ant_soldier',
    type: UnitType.SOLDIER,
    name: 'Mandible Mauler',
    cost: 25,
    baseUpgradeCost: 200,
    hp: 140,
    attack: 12,
    speed: 0.4,
    range: 5,
    gatherRate: 0,
    attackSpeed: 900,
    description: 'Tanky melee unit. Hard to squish.',
    emoji: '🛡️🐜'
  },
  [UnitType.ELITE]: {
    id: 'ant_elite',
    type: UnitType.ELITE,
    name: 'Drill Sergeant',
    cost: 50,
    baseUpgradeCost: 300,
    hp: 220,
    attack: 18,
    speed: 0.3,
    range: 4,
    gatherRate: 0,
    attackSpeed: 1200,
    description: 'Burrowing tank. High HP and resilience.',
    emoji: '🏗️🐜'
  },
  [UnitType.SPECIAL]: {
    id: 'ant_special',
    type: UnitType.SPECIAL,
    name: 'Picnic Tank',
    cost: 75,
    baseUpgradeCost: 400,
    hp: 500,
    attack: 50,
    speed: 0.15,
    range: 8,
    gatherRate: 0,
    attackSpeed: 2000,
    description: 'Massive HP, slow movement, huge bite.',
    emoji: '🚜🐜'
  }
};

export const FALLBACK_QUOTES = [
  "The ants are stealing the potato salad!",
  "The bees are buzzing with excitement!",
  "It's chaos in the clover patch!",
  "A gentle breeze has knocked over a soldier!",
  "The Queen is demanding more snacks!",
  "Ouch! That stinger looked sharp!",
  "Flank them by the garden hose!",
  "Reinforcements arriving from the compost bin!",
  "The hornets are breaking the sound barrier!",
  "Watch out for the underground ambush!"
];