import { GameEngineConfig, DEFAULT_ENGINE_CONFIG } from './GameEngine';
import { GAME_CONFIG } from '../utils/gameConstants';

export interface DifficultyConfig extends GameEngineConfig {}

/**
 * Pure function. Returns a GameEngineConfig scaled for the given level.
 * Level 1 returns values equal to DEFAULT_ENGINE_CONFIG for the scaled fields.
 */
export function difficultyScaler(level: number): DifficultyConfig {
  // Scaling increments per level above 1
  const levelsAboveBase = Math.max(0, level - 1);

  return {
    ...DEFAULT_ENGINE_CONFIG,
    aiSpawnChance:       clamp(DEFAULT_ENGINE_CONFIG.aiSpawnChance       + levelsAboveBase * GAME_CONFIG.DIFFICULTY_AI_SPAWN_INCREMENT,     0, GAME_CONFIG.DIFFICULTY_AI_SPAWN_MAX),
    aiEconomyPriority:   clamp(DEFAULT_ENGINE_CONFIG.aiEconomyPriority   + levelsAboveBase * GAME_CONFIG.DIFFICULTY_AI_ECONOMY_INCREMENT,  0, GAME_CONFIG.DIFFICULTY_AI_ECONOMY_MAX),
    aiEliteUnitChance:   clamp(DEFAULT_ENGINE_CONFIG.aiEliteUnitChance   + levelsAboveBase * GAME_CONFIG.DIFFICULTY_AI_ELITE_INCREMENT,     0, GAME_CONFIG.DIFFICULTY_AI_ELITE_MAX),
    aiSpecialUnitChance: clamp(DEFAULT_ENGINE_CONFIG.aiSpecialUnitChance + levelsAboveBase * GAME_CONFIG.DIFFICULTY_AI_SPECIAL_INCREMENT,   0, GAME_CONFIG.DIFFICULTY_AI_SPECIAL_MAX),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
