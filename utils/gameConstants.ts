// Game Configuration Constants
export const GAME_CONFIG = {
  // Timing
  GAME_TICK_MS: 50,
  COMMENTARY_COOLDOWN_MS: 8000,
  SPECIAL_UNIT_COMMENTARY_COOLDOWN_MS: 6000,
  ELITE_UNIT_COMMENTARY_COOLDOWN_MS: 8000,
  BASE_ATTACK_COOLDOWN_MS: 50,
  
  // Battlefield
  LANE_COUNT: 7,
  BASE_HEALTH: 200,
  POSITION_MAX: 100,
  POSITION_MIN: 0,
  GATHERER_FOOD_POSITION: 50,
  
  // Resources
  INITIAL_RESOURCES: 50,
  BASE_RESOURCE_GENERATION: 0.05,
  GATHERER_CARRY_AMOUNT: 20,
  
  // Upgrades
  UPGRADE_STAT_INCREASE: 0.50,
  UPGRADE_COST_INCREASE: 1.5,
  
  // Combat
  DEFENSIVE_STACKING_BONUS: 0.10,
  MAX_DEFENSIVE_BONUS: 0.50,
  STACKING_PROXIMITY_THRESHOLD: 3,
  
  // AI Behavior
  AI_SPAWN_CHANCE: 0.05,
  AI_ECONOMY_PRIORITY: 0.6,
  AI_DEFENSE_PRIORITY: 0.7,
  AI_SPECIAL_UNIT_CHANCE: 0.1,
  AI_ELITE_UNIT_CHANCE: 0.25,
  AI_SOLDIER_UNIT_CHANCE: 0.6,
  
  // Resource Thresholds
  LOW_RESOURCE_THRESHOLD: 50,
  MIN_GATHERERS_FOR_ECONOMY: 3,
  
  // UI
  LOG_MAX_ENTRIES: 10,
  UNIT_STACK_VERTICAL_OFFSET: 6,
  UNIT_STACK_PROXIMITY_THRESHOLD: 3,
  
  // Validation
  MAX_UNITS_PER_LANE: 50,
  MAX_GAME_DURATION_MS: 30 * 60 * 1000, // 30 minutes
} as const;

// Derived Constants
export const CENTER_LANE_INDEX = Math.floor(GAME_CONFIG.LANE_COUNT / 2);

// Position Constants
export const POSITIONS = {
  BEE_BASE: GAME_CONFIG.POSITION_MIN,
  ANT_BASE: GAME_CONFIG.POSITION_MAX,
  CENTER_FOOD: GAME_CONFIG.GATHERER_FOOD_POSITION,
} as const;

// Resource Constants
export const RESOURCES = {
  INITIAL: GAME_CONFIG.INITIAL_RESOURCES,
  BASE_GENERATION: GAME_CONFIG.BASE_RESOURCE_GENERATION,
  GATHERER_CARRY: GAME_CONFIG.GATHERER_CARRY_AMOUNT,
  LOW_THRESHOLD: GAME_CONFIG.LOW_RESOURCE_THRESHOLD,
} as const;

// Combat Constants
export const COMBAT = {
  DEFENSIVE_BONUS_PER_ALLY: GAME_CONFIG.DEFENSIVE_STACKING_BONUS,
  MAX_DEFENSIVE_REDUCTION: GAME_CONFIG.MAX_DEFENSIVE_BONUS,
  PROXIMITY_THRESHOLD: GAME_CONFIG.STACKING_PROXIMITY_THRESHOLD,
  ATTACK_COOLDOWN: GAME_CONFIG.BASE_ATTACK_COOLDOWN_MS,
} as const;

// AI Constants
export const AI = {
  SPAWN_CHANCE: GAME_CONFIG.AI_SPAWN_CHANCE,
  ECONOMY_PRIORITY: GAME_CONFIG.AI_ECONOMY_PRIORITY,
  DEFENSE_PRIORITY: GAME_CONFIG.AI_DEFENSE_PRIORITY,
  UNIT_CHANCES: {
    SPECIAL: GAME_CONFIG.AI_SPECIAL_UNIT_CHANCE,
    ELITE: GAME_CONFIG.AI_ELITE_UNIT_CHANCE,
    SOLDIER: GAME_CONFIG.AI_SOLDIER_UNIT_CHANCE,
  },
  MIN_GATHERERS: GAME_CONFIG.MIN_GATHERERS_FOR_ECONOMY,
} as const;

// Validation Functions
export const validateLane = (lane: number): boolean => {
  return lane >= 0 && lane < GAME_CONFIG.LANE_COUNT;
};

export const validatePosition = (position: number): boolean => {
  return position >= GAME_CONFIG.POSITION_MIN && position <= GAME_CONFIG.POSITION_MAX;
};

export const isCenterLane = (lane: number): boolean => {
  return lane === CENTER_LANE_INDEX;
};

export const isResourceLane = (lane: number): boolean => {
  return isCenterLane(lane);
};

export const isCombatLane = (lane: number): boolean => {
  return !isResourceLane(lane);
};

export const getCombatLanes = (): number[] => {
  return Array.from({ length: GAME_CONFIG.LANE_COUNT }, (_, i) => i)
    .filter(i => !isResourceLane(i));
};

// Utility Functions
export const calculateUpgradeCost = (baseCost: number, currentLevel: number): number => {
  return Math.floor(baseCost * Math.pow(GAME_CONFIG.UPGRADE_COST_INCREASE, currentLevel - 1));
};

export const calculateStatMultiplier = (level: number): number => {
  return Math.pow(1 + GAME_CONFIG.UPGRADE_STAT_INCREASE, level - 1);
};

export const calculateDefensiveBonus = (allyCount: number): number => {
  const bonus = allyCount * GAME_CONFIG.DEFENSIVE_STACKING_BONUS;
  return Math.min(bonus, GAME_CONFIG.MAX_DEFENSIVE_BONUS);
};

export const calculateDamageMultiplier = (allyCount: number): number => {
  const reduction = calculateDefensiveBonus(allyCount);
  return 1 - reduction;
};

export const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], { 
    hour12: false, 
    minute: '2-digit', 
    second: '2-digit' 
  });
};

export const generateUniqueId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random()}`;
};

// Lane Validation
export const validateUnitPlacement = (
  unitType: string, 
  lane: number
): { valid: boolean; reason?: string } => {
  if (!validateLane(lane)) {
    return { valid: false, reason: 'Invalid lane number' };
  }

  const isGatherer = unitType === 'GATHERER';
  const resourceLane = isResourceLane(lane);

  if (isGatherer && !resourceLane) {
    return { valid: false, reason: 'Gatherers must go to the Resource Corridor (Center)!' };
  }

  if (!isGatherer && resourceLane) {
    return { valid: false, reason: 'Combat units cannot fight in the Resource Corridor!' };
  }

  return { valid: true };
};

// Export all constants for backward compatibility
export const GAME_TICK_MS = GAME_CONFIG.GAME_TICK_MS;
export const LANE_COUNT = GAME_CONFIG.LANE_COUNT;
export const BASE_HEALTH = GAME_CONFIG.BASE_HEALTH;
export const UPGRADE_STAT_INCREASE = GAME_CONFIG.UPGRADE_STAT_INCREASE;
export const UPGRADE_COST_INCREASE = GAME_CONFIG.UPGRADE_COST_INCREASE;
export const GATHERER_CARRY_AMOUNT = GAME_CONFIG.GATHERER_CARRY_AMOUNT;
