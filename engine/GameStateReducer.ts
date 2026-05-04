import { GameState, Faction, UnitType, GameUnit, LogEntry } from '../types';
import { BASE_HEALTH, FOOD_ITEMS } from '../constants';

export type GameStateAction = 
  | { type: 'SPAWN_UNIT'; payload: { faction: Faction; unitType: UnitType; lane: number; unitLevels: Record<UnitType, number> } }
  | { type: 'UPGRADE_UNIT'; payload: { unitType: UnitType; cost: number; statMultiplier: number } }
  | { type: 'UPDATE_RESOURCES'; payload: { beeResources: number; antResources: number } }
  | { type: 'UPDATE_BASE_HEALTH'; payload: { beeBaseHealth: number; antBaseHealth: number } }
  | { type: 'UPDATE_UNITS'; payload: { units: GameUnit[] } }
  | { type: 'ADD_LOG'; payload: { text: string; faction?: Faction } }
  | { type: 'SELECT_UNIT'; payload: { unitType: UnitType | null } }
  | { type: 'TRIGGER_COMMENTARY'; payload: { event?: string; timestamp: number } }
  | { type: 'UPDATE_COMMENTARY'; payload: { commentary: string; isLoading?: boolean } }
  | { type: 'END_GAME'; payload: { winner: Faction } }
  | { type: 'RESTART_GAME' }
  | { type: 'GAME_TICK_UPDATE'; payload: Partial<GameState> };

export const initialGameState: GameState = {
  beeResources: 50,
  antResources: 50,
  beeBaseHealth: BASE_HEALTH,
  antBaseHealth: BASE_HEALTH,
  units: [],
  unitLevels: {
    [UnitType.WORKER]: 1,
    [UnitType.GATHERER]: 1,
    [UnitType.SOLDIER]: 1,
    [UnitType.ELITE]: 1,
    [UnitType.SPECIAL]: 1,
  },
  gameActive: true,
  winner: null,
  logs: [{ id: 0, text: "Welcome to the Backyard Brawl! Place units to defend the hive!", timestamp: Date.now() }],
  commentary: "Select a unit and click a lane to deploy!",
  isLoadingCommentary: false,
  selectedUnit: null,
  lastCommentaryTime: Date.now(),
  centerFoodItem: FOOD_ITEMS[Math.floor(Math.random() * FOOD_ITEMS.length)]
};

export function gameReducer(state: GameState, action: GameStateAction): GameState {
  switch (action.type) {
    case 'SPAWN_UNIT': {
      const { faction, unitType, lane, unitLevels } = action.payload;
      return {
        ...state,
        units: [...state.units, createNewUnit(faction, unitType, lane, unitLevels)]
      };
    }

    case 'UPGRADE_UNIT': {
      const { unitType, cost, statMultiplier } = action.payload;
      return {
        ...state,
        beeResources: state.beeResources - cost,
        unitLevels: {
          ...state.unitLevels,
          [unitType]: state.unitLevels[unitType] + 1
        },
        units: state.units.map(u => {
          if (u.faction === Faction.BEES && u.type === unitType) {
            const newHp = u.hp * statMultiplier;
            const newCurrentHp = u.currentHp * statMultiplier;
            return {
              ...u,
              hp: newHp,
              currentHp: newCurrentHp,
              attack: u.attack * statMultiplier
            };
          }
          return u;
        })
      };
    }

    case 'UPDATE_RESOURCES': {
      const { beeResources, antResources } = action.payload;
      return {
        ...state,
        beeResources,
        antResources
      };
    }

    case 'UPDATE_BASE_HEALTH': {
      const { beeBaseHealth, antBaseHealth } = action.payload;
      return {
        ...state,
        beeBaseHealth: Math.max(0, beeBaseHealth),
        antBaseHealth: Math.max(0, antBaseHealth)
      };
    }

    case 'UPDATE_UNITS': {
      return {
        ...state,
        units: action.payload.units
      };
    }

    case 'ADD_LOG': {
      const newLog: LogEntry = {
        id: Date.now() + Math.random(),
        text: action.payload.text,
        faction: action.payload.faction,
        timestamp: Date.now()
      };
      return {
        ...state,
        logs: [...state.logs, newLog].slice(-10) // Keep only last 10 logs
      };
    }

    case 'SELECT_UNIT': {
      return {
        ...state,
        selectedUnit: action.payload.unitType
      };
    }

    case 'TRIGGER_COMMENTARY': {
      return {
        ...state,
        triggerCommentaryForEvent: action.payload.event,
        lastCommentaryTime: action.payload.timestamp
      };
    }

    case 'UPDATE_COMMENTARY': {
      return {
        ...state,
        commentary: action.payload.commentary,
        isLoadingCommentary: action.payload.isLoading ?? false
      };
    }

    case 'END_GAME': {
      return {
        ...state,
        gameActive: false,
        winner: action.payload.winner
      };
    }

    case 'RESTART_GAME': {
      return {
        ...initialGameState,
        logs: [{ id: Date.now(), text: "A new battle begins! Fight!", timestamp: Date.now() }],
        commentary: "Round 2! Ding Ding!",
        lastCommentaryTime: Date.now(),
        centerFoodItem: FOOD_ITEMS[Math.floor(Math.random() * FOOD_ITEMS.length)]
      };
    }

    case 'GAME_TICK_UPDATE': {
      return {
        ...state,
        ...action.payload
      };
    }

    default:
      return state;
  }
}

function createNewUnit(
  faction: Faction, 
  unitType: UnitType, 
  lane: number, 
  unitLevels: Record<UnitType, number>
): GameUnit {
  // This will be implemented with the actual unit creation logic
  // For now, return a placeholder
  const instanceId = `${faction.toLowerCase()}_${unitType.toLowerCase()}_${Date.now()}_${Math.random()}`;
  const level = unitLevels[unitType] || 1;
  
  // This is a simplified version - the actual implementation would use BEE_UNITS/ANT_UNITS
  return {
    id: `${faction}_${unitType}`,
    type: unitType,
    name: `${unitType} Unit`,
    cost: 10,
    baseUpgradeCost: 50,
    attack: 10,
    hp: 50,
    speed: 0.5,
    range: 5,
    gatherRate: 0,
    description: `${unitType} unit`,
    emoji: faction === Faction.BEES ? '🐝' : '🐜',
    attackSpeed: 1000,
    instanceId,
    faction,
    lane,
    position: faction === Faction.BEES ? 0 : 100,
    currentHp: 50,
    lastAttackTime: 0,
    isAttacking: false,
    isCarrying: false
  };
}

// Utility functions for common state operations
export const GameStateSelectors = {
  getUnitsByFaction: (state: GameState, faction: Faction): GameUnit[] => 
    state.units.filter(u => u.faction === faction),
  
  getUnitsByLane: (state: GameState, lane: number): GameUnit[] => 
    state.units.filter(u => u.lane === lane),
  
  getUnitsByType: (state: GameState, unitType: UnitType): GameUnit[] => 
    state.units.filter(u => u.type === unitType),
  
  getLivingUnits: (state: GameState): GameUnit[] => 
    state.units.filter(u => u.currentHp > 0),
  
  getUnitCount: (state: GameState, faction?: Faction): number => 
    faction ? state.units.filter(u => u.faction === faction).length : state.units.length,
  
  canAffordUnit: (state: GameState, cost: number, faction: Faction): boolean => 
    faction === Faction.BEES ? state.beeResources >= cost : state.antResources >= cost,
  
  getUpgradeCost: (baseCost: number, currentLevel: number, costMultiplier: number): number =>
    Math.floor(baseCost * Math.pow(costMultiplier, currentLevel - 1)),
  
  getStatMultiplier: (level: number, statIncrease: number): number =>
    Math.pow(1 + statIncrease, level - 1)
};

export const GameStateActions = {
  spawnUnit: (faction: Faction, unitType: UnitType, lane: number, unitLevels: Record<UnitType, number>): GameStateAction => ({
    type: 'SPAWN_UNIT',
    payload: { faction, unitType, lane, unitLevels }
  }),

  upgradeUnit: (unitType: UnitType, cost: number, statMultiplier: number): GameStateAction => ({
    type: 'UPGRADE_UNIT',
    payload: { unitType, cost, statMultiplier }
  }),

  updateResources: (beeResources: number, antResources: number): GameStateAction => ({
    type: 'UPDATE_RESOURCES',
    payload: { beeResources, antResources }
  }),

  updateBaseHealth: (beeBaseHealth: number, antBaseHealth: number): GameStateAction => ({
    type: 'UPDATE_BASE_HEALTH',
    payload: { beeBaseHealth, antBaseHealth }
  }),

  addLog: (text: string, faction?: Faction): GameStateAction => ({
    type: 'ADD_LOG',
    payload: { text, faction }
  }),

  selectUnit: (unitType: UnitType | null): GameStateAction => ({
    type: 'SELECT_UNIT',
    payload: { unitType }
  }),

  triggerCommentary: (event?: string, timestamp?: number): GameStateAction => ({
    type: 'TRIGGER_COMMENTARY',
    payload: { event, timestamp: timestamp || Date.now() }
  }),

  updateCommentary: (commentary: string, isLoading?: boolean): GameStateAction => ({
    type: 'UPDATE_COMMENTARY',
    payload: { commentary, isLoading }
  }),

  endGame: (winner: Faction): GameStateAction => ({
    type: 'END_GAME',
    payload: { winner }
  }),

  restartGame: (): GameStateAction => ({
    type: 'RESTART_GAME'
  }),

  gameTickUpdate: (updates: Partial<GameState>): GameStateAction => ({
    type: 'GAME_TICK_UPDATE',
    payload: updates
  })
};
