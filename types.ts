
export enum Faction {
  BEES = 'BEES',
  ANTS = 'ANTS'
}

export enum UnitType {
  WORKER = 'WORKER',
  GATHERER = 'GATHERER',
  SOLDIER = 'SOLDIER',
  ELITE = 'ELITE',
  SPECIAL = 'SPECIAL' // Queen/General
}

export interface Unit {
  id: string;
  type: UnitType;
  name: string;
  cost: number;
  baseUpgradeCost: number; // Cost to reach level 2
  attack: number; // Damage per attack tick
  hp: number;
  speed: number; // Percent of lane per tick
  range: number; // Percent of lane
  gatherRate: number; // Resource generation per tick (passive)
  description: string;
  emoji: string;
  attackSpeed: number; // ms between attacks
}

export interface GameUnit extends Unit {
  instanceId: string;
  faction: Faction;
  lane: number;
  position: number; // 0 to 100
  currentHp: number;
  lastAttackTime: number;
  isAttacking: boolean; // Visual state
  isCarrying: boolean; // For Gatherers
}

export interface FoodItem {
  name: string;
  emoji: string;
}

export type GamePhase = 'playing' | 'level_victory' | 'game_over';

export interface GameState {
  beeResources: number;
  antResources: number;
  beeBaseHealth: number;
  antBaseHealth: number;
  units: GameUnit[];
  unitLevels: Record<UnitType, number>;
  currentLevel: number;
  gamePhase: GamePhase;
  gameActive: boolean;
  winner: Faction | null;
  logs: LogEntry[];
  commentary: string;
  isLoadingCommentary: boolean;
  selectedUnit: UnitType | null; // The unit the player is currently placing
  triggerCommentaryForEvent?: string; // Event description to trigger AI commentary
  lastCommentaryTime: number; // Timestamp of last commentary to prevent spam
  centerFoodItem: FoodItem;
}

export interface LogEntry {
  id: number;
  text: string;
  faction?: Faction;
  timestamp: number;
}
