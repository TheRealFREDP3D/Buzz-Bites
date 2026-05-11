import React, { useReducer, useCallback, useRef, useEffect } from 'react';
import { GameState, Faction, UnitType } from '../types';
import { gameReducer, initialGameState, GameStateActions, GameStateSelectors } from '../engine/GameStateReducer';
import { GameEngine, DEFAULT_ENGINE_CONFIG } from '../engine/GameEngine';
import { difficultyScaler } from '../engine/difficultyScaler';
import { BEE_UNITS, ANT_UNITS, GAME_TICK_MS, LANE_COUNT, UPGRADE_COST_INCREASE, UPGRADE_STAT_INCREASE } from '../constants';

export interface GameStateReturn {
  gameState: GameState;
  dispatch: React.Dispatch<ReturnType<typeof GameStateActions[keyof typeof GameStateActions]>>;
  actions: typeof GameStateActions;
  selectors: typeof GameStateSelectors;
  
  // Game actions
  spawnUnit: (faction: Faction, unitType: UnitType, lane: number) => void;
  upgradeUnit: (unitType: UnitType) => void;
  selectUnit: (unitType: UnitType | null) => void;
  addLog: (text: string, faction?: Faction) => void;
  restartGame: () => void;
  advanceLevel: () => void;
  startNextLevel: () => void;
  
  // Derived state
  canAffordUnit: (cost: number, faction: Faction) => boolean;
  getUpgradeCost: (unitType: UnitType) => number;
  getUnitCount: (faction?: Faction) => number;
  
  // Level and phase
  currentLevel: number;
  gamePhase: 'playing' | 'level_victory' | 'game_over';
}

export function useGameState(): GameStateReturn {
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  const gameStateRef = useRef(gameState);
  const gameEngineRef = useRef(new GameEngine(DEFAULT_ENGINE_CONFIG));
  const lastUpdateRef = useRef(Date.now());

  // Update ref on each render to keep it current
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Game loop
  useEffect(() => {
    if (gameState.gamePhase !== 'playing') return;

    const interval = setInterval(() => {
      const now = Date.now();
      const deltaTime = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      // Use current state from ref to avoid stale closure
      const currentState = gameStateRef.current;
      
      // Update game state through engine
      const updatedState = gameEngineRef.current.update(currentState, deltaTime);
      
      // Apply updates through reducer
      if (updatedState !== currentState) {
        dispatch(GameStateActions.gameTickUpdate({
          beeResources: updatedState.beeResources,
          antResources: updatedState.antResources,
          beeBaseHealth: updatedState.beeBaseHealth,
          antBaseHealth: updatedState.antBaseHealth,
          units: updatedState.units,
          gameActive: updatedState.gameActive,
          winner: updatedState.winner,
          gamePhase: updatedState.gamePhase,
          triggerCommentaryForEvent: updatedState.triggerCommentaryForEvent,
          lastCommentaryTime: updatedState.lastCommentaryTime
        }));
      }
    }, GAME_TICK_MS);

    return () => clearInterval(interval);
  }, [gameState.gamePhase]);

  // Game actions
  const spawnUnit = useCallback((faction: Faction, unitType: UnitType, lane: number) => {
    if (!gameState.gameActive) return;

    const unitStats = faction === Faction.BEES ? BEE_UNITS[unitType] : ANT_UNITS[unitType];
    const canAfford = GameStateSelectors.canAffordUnit(gameState, unitStats.cost, faction);
    
    if (!canAfford) {
      dispatch(GameStateActions.addLog("Not enough resources!", faction));
      return;
    }

    // Validate lane placement
    const centerLaneIndex = Math.floor(LANE_COUNT / 2);
    const isGatherer = unitType === UnitType.GATHERER;
    const isResourceLane = lane === centerLaneIndex;

    if (isGatherer && !isResourceLane) {
      dispatch(GameStateActions.addLog("⚠️ Gatherers must go to the Resource Corridor (Center)!", faction));
      return;
    }
    if (!isGatherer && isResourceLane) {
      dispatch(GameStateActions.addLog("⚠️ Combat units cannot fight in the Resource Corridor!", faction));
      return;
    }

    dispatch(GameStateActions.spawnUnit(faction, unitType, lane, gameState.unitLevels));
    
    // Properly deduct resources for the spawning faction
    const newBeeResources = faction === Faction.BEES ? gameState.beeResources - unitStats.cost : gameState.beeResources;
    const newAntResources = faction === Faction.ANTS ? gameState.antResources - unitStats.cost : gameState.antResources;
    
    dispatch(GameStateActions.updateResources(newBeeResources, newAntResources));
    dispatch(GameStateActions.addLog(`Deployed ${unitStats.name} to Lane ${lane + 1}`, faction));

    // Trigger commentary if enough time has passed
    const now = Date.now();
    if (now - gameState.lastCommentaryTime > 8000) {
      dispatch(GameStateActions.triggerCommentary(`${faction === Faction.BEES ? 'Bees' : 'Ants'} deploy reinforcements in lane ${lane + 1}!`));
    }
  }, [gameState]);

  const upgradeUnit = useCallback((unitType: UnitType) => {
    if (!gameState.gameActive) return;

    const unitStats = BEE_UNITS[unitType];
    const currentLevel = gameState.unitLevels[unitType];
    const cost = GameStateSelectors.getUpgradeCost(unitStats.baseUpgradeCost, currentLevel, UPGRADE_COST_INCREASE);
    const statMultiplier = GameStateSelectors.getStatMultiplier(currentLevel, UPGRADE_STAT_INCREASE);

    if (gameState.beeResources < cost) {
      dispatch(GameStateActions.addLog("Not enough nectar for upgrade!", Faction.BEES));
      return;
    }

    dispatch(GameStateActions.upgradeUnit(unitType, cost, statMultiplier));
    dispatch(GameStateActions.addLog(`${unitStats.name} upgraded to Level ${currentLevel + 1}!`, Faction.BEES));
    dispatch(GameStateActions.triggerCommentary(`${unitStats.name}s just got stronger!`));
  }, [gameState]);

  const selectUnit = useCallback((unitType: UnitType | null) => {
    if (!gameState.gameActive) return;
    dispatch(GameStateActions.selectUnit(unitType));
  }, [gameState.gameActive]);

  const addLog = useCallback((text: string, faction?: Faction) => {
    dispatch(GameStateActions.addLog(text, faction));
  }, []);

  const restartGame = useCallback(() => {
    dispatch(GameStateActions.restartGame());
  }, []);

  const advanceLevel = useCallback(() => {
    const nextLevel = gameState.currentLevel + 1;
    const newConfig = difficultyScaler(nextLevel);
    gameEngineRef.current = new GameEngine(newConfig);
    dispatch(GameStateActions.advanceLevel());
  }, [gameState.currentLevel]);

  const startNextLevel = useCallback(() => {
    dispatch(GameStateActions.startNextLevel());
  }, []);

  // Derived state helpers
  const canAffordUnit = useCallback((cost: number, faction: Faction) => {
    return GameStateSelectors.canAffordUnit(gameState, cost, faction);
  }, [gameState]);

  const getUpgradeCost = useCallback((unitType: UnitType) => {
    const unitStats = BEE_UNITS[unitType];
    const currentLevel = gameState.unitLevels[unitType];
    return GameStateSelectors.getUpgradeCost(unitStats.baseUpgradeCost, currentLevel, UPGRADE_COST_INCREASE);
  }, [gameState]);

  const getUnitCount = useCallback((faction?: Faction) => {
    return GameStateSelectors.getUnitCount(gameState, faction);
  }, [gameState]);

  return {
    gameState,
    dispatch,
    actions: GameStateActions,
    selectors: GameStateSelectors,
    
    spawnUnit,
    upgradeUnit,
    selectUnit,
    addLog,
    restartGame,
    advanceLevel,
    startNextLevel,
    
    canAffordUnit,
    getUpgradeCost,
    getUnitCount,
    
    currentLevel: gameState.currentLevel,
    gamePhase: gameState.gamePhase
  };
}
