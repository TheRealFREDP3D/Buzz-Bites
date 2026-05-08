import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Faction, UnitType, GameUnit } from './types';
import { BEE_UNITS, ANT_UNITS, GAME_TICK_MS, BASE_HEALTH, LANE_COUNT, UPGRADE_STAT_INCREASE, UPGRADE_COST_INCREASE, FOOD_ITEMS, GATHERER_CARRY_AMOUNT } from './constants';
import { ResourceBar } from './components/ResourceBar';
import { UnitControls } from './components/UnitControls';
import { BattleLog } from './components/BattleLog';
import { VictoryModal } from './components/VictoryModal';
import { BaseHealth } from './components/BaseHealth';
import { generateBattleCommentary, generateVictoryMessage } from './services/geminiService';

const App: React.FC = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>({
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
  });

  const stateRef = useRef(gameState);
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  // --- Helpers ---
  const addLog = useCallback((text: string, faction?: Faction) => {
    setGameState(prev => ({
      ...prev,
      logs: [...prev.logs, { id: Date.now() + Math.random(), text, faction, timestamp: Date.now() }].slice(-10)
    }));
  }, []);

  // --- Game Loop ---
  useEffect(() => {
    if (!gameState.gameActive) return;

    const interval = setInterval(() => {
      setGameState(current => {
        let { 
          beeResources, antResources, 
          beeBaseHealth, antBaseHealth, 
          units, 
          gameActive, winner,
          lastCommentaryTime,
          centerFoodItem
        } = current;

        const now = Date.now();
        const nextUnits: GameUnit[] = [];
        let beeBaseDamage = 0;
        let antBaseDamage = 0;
        const deadUnits: GameUnit[] = [];
        const centerLaneIndex = Math.floor(LANE_COUNT / 2);

        // 1. Resource Generation (Passive + Unit based)
        let beeIncome = 0.05;
        let antIncome = 0.05;
        
        // 2. Process Units
        units.forEach(unit => {
          let nextUnit = { ...unit };
          
          // Passive Resource Generation (Workers)
          if (unit.faction === Faction.BEES) beeIncome += unit.gatherRate;
          else antIncome += unit.gatherRate;

          // === GATHERER LOGIC ===
          if (unit.type === UnitType.GATHERER) {
              // Gatherers only work in the center lane
              
              if (unit.faction === Faction.BEES) {
                  if (unit.isCarrying) {
                      // Return to base
                      nextUnit.position -= unit.speed;
                      if (nextUnit.position <= 0) {
                          nextUnit.position = 0;
                          nextUnit.isCarrying = false;
                          if (unit.lane === centerLaneIndex) {
                              beeResources += GATHERER_CARRY_AMOUNT;
                          }
                      }
                  } else {
                      // Go to food
                      nextUnit.position += unit.speed;
                      if (nextUnit.position >= 50) {
                          nextUnit.position = 50;
                          nextUnit.isCarrying = true; // Picked up food
                      }
                  }
              } else {
                  // ANTS (Sugar Scout) Logic
                  if (unit.isCarrying) {
                      // Return to base (100)
                      nextUnit.position += unit.speed;
                      if (nextUnit.position >= 100) {
                          nextUnit.position = 100;
                          nextUnit.isCarrying = false;
                          // Deposit resources
                          if (unit.lane === centerLaneIndex) {
                              antResources += GATHERER_CARRY_AMOUNT;
                          }
                      }
                  } else {
                      // Go to food (50) from base (100)
                      nextUnit.position -= unit.speed;
                      if (nextUnit.position <= 50) {
                          nextUnit.position = 50;
                          nextUnit.isCarrying = true; // Picked up food
                      }
                  }
              }
              nextUnits.push(nextUnit);
              return; // Skip combat logic for gatherers
          }

          // === COMBAT UNIT LOGIC ===

          // Find Targets
          const enemies = units.filter(u => 
            u.lane === unit.lane && 
            u.faction !== unit.faction && 
            u.currentHp > 0
          );

          let target: GameUnit | null = null;
          let distanceToTarget = 1000;

          if (unit.faction === Faction.BEES) {
            const enemiesAhead = enemies.filter(e => e.position >= unit.position);
            if (enemiesAhead.length > 0) {
              target = enemiesAhead.reduce((prev, curr) => prev.position < curr.position ? prev : curr);
              distanceToTarget = target.position - unit.position;
            } else {
              distanceToTarget = 100 - unit.position;
            }
          } else {
            const enemiesAhead = enemies.filter(e => e.position <= unit.position);
            if (enemiesAhead.length > 0) {
              target = enemiesAhead.reduce((prev, curr) => prev.position > curr.position ? prev : curr);
              distanceToTarget = unit.position - target.position;
            } else {
              distanceToTarget = unit.position;
            }
          }

          // Action Logic
          if (distanceToTarget <= unit.range) {
            nextUnit.isAttacking = true;
            if (now - unit.lastAttackTime >= unit.attackSpeed) {
              nextUnit.lastAttackTime = now;
              if (!target) {
                if (unit.faction === Faction.BEES) antBaseDamage += unit.attack;
                else beeBaseDamage += unit.attack;
              }
            }
          } else {
            nextUnit.isAttacking = false;
            if (unit.faction === Faction.BEES) {
               nextUnit.position += unit.speed;
               if (nextUnit.position > 100) nextUnit.position = 100;
            } else {
               nextUnit.position -= unit.speed;
               if (nextUnit.position < 0) nextUnit.position = 0;
            }
          }
          
          nextUnits.push(nextUnit);
        });

        // 3. Resolve Combat Damage
        const unitsAfterDamage = nextUnits.map(u => ({...u}));
        
        unitsAfterDamage.forEach(attacker => {
           if (attacker.type === UnitType.GATHERER) return; // Gatherers don't attack

           if (attacker.isAttacking && now - attacker.lastAttackTime < 50) {
              const enemies = unitsAfterDamage.filter(u => 
                u.lane === attacker.lane && 
                u.faction !== attacker.faction
              );
              
              let target: GameUnit | undefined;
              if (attacker.faction === Faction.BEES) {
                 target = enemies.filter(e => e.position >= attacker.position)
                                 .sort((a,b) => a.position - b.position)[0];
              } else {
                 target = enemies.filter(e => e.position <= attacker.position)
                                 .sort((a,b) => b.position - a.position)[0];
              }

              if (target && Math.abs(target.position - attacker.position) <= attacker.range) {
                 // --- DEFENSIVE STACKING BONUS ---
                 // Count nearby allies of same type
                 const nearbyAllies = unitsAfterDamage.filter(ally => 
                    ally.instanceId !== target!.instanceId &&
                    ally.faction === target!.faction &&
                    ally.type === target!.type &&
                    ally.lane === target!.lane &&
                    Math.abs(ally.position - target!.position) < 3 // Within 3% position
                 ).length;

                 // Bonus: 10% damage reduction per ally, max 50%
                 const reductionPercent = Math.min(nearbyAllies * 0.10, 0.50);
                 const damageMultiplier = 1 - reductionPercent;

                 target.currentHp -= (attacker.attack * damageMultiplier);
              }
           }
        });

        // 4. Cleanup Dead Units & Update Bases
        const livingUnits: GameUnit[] = [];
        unitsAfterDamage.forEach(u => {
          if (u.currentHp > 0) {
            livingUnits.push(u);
          } else {
            deadUnits.push(u);
          }
        });

        beeBaseHealth -= beeBaseDamage;
        antBaseHealth -= antBaseDamage;

        // --- Event Detection for Commentary ---
        let triggerEvent: string | undefined = undefined;
        let updateLastCommentaryTime = false;
        const timeSinceLast = now - lastCommentaryTime;

        // Priority 1: Base Under Heavy Attack
        if ((beeBaseDamage > 5 || antBaseDamage > 5) && timeSinceLast > 4000) {
             if (beeBaseDamage > 5) triggerEvent = "The Hive is taking heavy damage!";
             else triggerEvent = "The Ant Colony is crumbling!";
             updateLastCommentaryTime = true;
        } 
        // Priority 2: Special Unit Death
        else if (timeSinceLast > 5000 && deadUnits.length > 0) {
            const specialDeath = deadUnits.find(u => u.type === UnitType.SPECIAL);
            if (specialDeath) {
                triggerEvent = `A ${specialDeath.name} has fallen in battle!`;
                updateLastCommentaryTime = true;
            } 
            // Priority 3: Multi-Kill
            else if (deadUnits.length >= 2) {
                triggerEvent = "It's total chaos! Units are dropping everywhere!";
                updateLastCommentaryTime = true;
            }
        }
        
        // 5. AI Spawning Logic (Ant AI)
        if (Math.random() < 0.05) { // 5% chance per tick
           const canBuyWorker = antResources >= ANT_UNITS.WORKER.cost;
           const canBuySoldier = antResources >= ANT_UNITS.SOLDIER.cost;
           const canBuyElite = antResources >= ANT_UNITS.ELITE.cost;
           const canBuySpecial = antResources >= ANT_UNITS.SPECIAL.cost;
           const canBuyGatherer = antResources >= ANT_UNITS.GATHERER.cost;

           // Count existing units
           const antGatherers = livingUnits.filter(u => u.faction === Faction.ANTS && u.type === UnitType.GATHERER).length;
           const totalAnts = livingUnits.filter(u => u.faction === Faction.ANTS).length;

           // AI Strategy: 
           // 1. If we have 0 gatherers, priority #1 is to get a Scout.
           // 2. If resources are low (< 50) and we have few gatherers (< 3), prioritize Scout.
           const needsEconomy = antGatherers === 0 || (antResources < 50 && antGatherers < 3);

           if (needsEconomy && canBuyGatherer && Math.random() < 0.6) {
                // AI spawns gatherer explicitly in Center Lane
                antResources -= ANT_UNITS.GATHERER.cost;
                livingUnits.push({
                   ...ANT_UNITS.GATHERER,
                   instanceId: `ant_g_${now}_${Math.random()}`,
                   faction: Faction.ANTS,
                   lane: centerLaneIndex, // FORCE Resource Corridor
                   position: 100,
                   currentHp: ANT_UNITS.GATHERER.hp,
                   lastAttackTime: 0,
                   isAttacking: false,
                   isCarrying: false
                });
                // Log if it's the first one to let user know AI is playing the mechanic
                if (antGatherers === 0) {
                    addLog("Ants dispatched a Sugar Scout to the Resource Corridor!", Faction.ANTS);
                }
           } else if (canBuyWorker || canBuySoldier || canBuySpecial || canBuyElite) {
             // Combat Logic - AVOID CENTER LANE
             // Dynamically calculate valid combat lanes (all except center)
             const combatLanes = Array.from({ length: LANE_COUNT }, (_, i) => i).filter(i => i !== centerLaneIndex);
             
             let laneToSpawn = combatLanes[Math.floor(Math.random() * combatLanes.length)];
             
             // Smart Defense: Find lane with most Bee progress
             let dangerousLane = -1;
             let maxDanger = -1;
             
             for(let l of combatLanes) {
                const beesInLane = livingUnits.filter(u => u.lane === l && u.faction === Faction.BEES);
                if (beesInLane.length > 0) {
                   const closestBee = Math.max(...beesInLane.map(u => u.position));
                   if (closestBee > maxDanger) {
                      maxDanger = closestBee;
                      dangerousLane = l;
                   }
                }
             }

             // 70% chance to defend dangerous lane, 30% chance to push random
             if (dangerousLane !== -1 && Math.random() < 0.7) laneToSpawn = dangerousLane;

             // Unit Selection Weighting
             let unitTypeToSpawn = UnitType.WORKER;
             
             if (canBuySpecial && Math.random() < 0.1) unitTypeToSpawn = UnitType.SPECIAL;
             else if (canBuyElite && Math.random() < 0.25) unitTypeToSpawn = UnitType.ELITE;
             else if (canBuySoldier && Math.random() < 0.6) unitTypeToSpawn = UnitType.SOLDIER;
             
             const unitStats = ANT_UNITS[unitTypeToSpawn];
             
             if (antResources >= unitStats.cost) {
                antResources -= unitStats.cost;
                livingUnits.push({
                   ...unitStats,
                   instanceId: `ant_${now}_${Math.random()}`,
                   faction: Faction.ANTS,
                   lane: laneToSpawn,
                   position: 100,
                   currentHp: unitStats.hp, 
                   lastAttackTime: 0,
                   isAttacking: false,
                   isCarrying: false
                });

                if (unitTypeToSpawn === UnitType.SPECIAL && timeSinceLast > 6000) {
                    triggerEvent = "The Ants have deployed a heavy tank!";
                    updateLastCommentaryTime = true;
                } else if (unitTypeToSpawn === UnitType.ELITE && timeSinceLast > 8000) {
                    triggerEvent = "Watch out for the Drill Sergeant!";
                    updateLastCommentaryTime = true;
                }
             }
           }
        }

        // 6. Win Condition
        if (beeBaseHealth <= 0) {
          gameActive = false;
          winner = Faction.ANTS;
        } else if (antBaseHealth <= 0) {
           gameActive = false;
           winner = Faction.BEES;
        }

        return {
          ...current,
          beeResources: beeResources + beeIncome,
          antResources: antResources + antIncome,
          beeBaseHealth: Math.max(0, beeBaseHealth),
          antBaseHealth: Math.max(0, antBaseHealth),
          units: livingUnits,
          gameActive,
          winner,
          triggerCommentaryForEvent: triggerEvent || current.triggerCommentaryForEvent,
          lastCommentaryTime: updateLastCommentaryTime ? now : lastCommentaryTime
        };
      });
    }, GAME_TICK_MS);

    return () => clearInterval(interval);
  }, [gameState.gameActive]);

  // --- Event Commentary Trigger Effect ---
  useEffect(() => {
    const handleCommentaryTrigger = async () => {
      if (gameState.triggerCommentaryForEvent && !gameState.isLoadingCommentary) {
          setGameState(prev => ({ ...prev, triggerCommentaryForEvent: undefined, isLoadingCommentary: true }));
          
          const eventDesc = gameState.triggerCommentaryForEvent;
          const territoryRatio = (gameState.beeBaseHealth / (gameState.beeBaseHealth + gameState.antBaseHealth)) * 100;
          const winningFaction = territoryRatio > 50 ? Faction.BEES : Faction.ANTS;

          if (import.meta.env.VITE_GEMINI_API_KEY) {
             const comment = await generateBattleCommentary(winningFaction, eventDesc, territoryRatio);
             setGameState(prev => ({ ...prev, commentary: comment, isLoadingCommentary: false }));
          } else {
             setGameState(prev => ({ ...prev, commentary: eventDesc, isLoadingCommentary: false }));
          }
      }
    };
    
    if (gameState.triggerCommentaryForEvent) {
        handleCommentaryTrigger();
    }
  }, [gameState.triggerCommentaryForEvent, gameState.beeBaseHealth, gameState.antBaseHealth, gameState.isLoadingCommentary]);

  // --- Post-Game Commentary ---
  useEffect(() => {
    if (!gameState.gameActive && gameState.winner) {
        generateVictoryMessage(gameState.winner).then(msg => {
             setGameState(prev => ({ ...prev, commentary: msg }));
        });
    }
  }, [gameState.gameActive, gameState.winner]);

  // --- Handlers ---
  const handleSelectUnit = (type: UnitType) => {
    if (!gameState.gameActive) return;
    setGameState(prev => ({ 
      ...prev, 
      selectedUnit: prev.selectedUnit === type ? null : type 
    }));
  };

  const handleUpgradeUnit = (type: UnitType) => {
    if (!gameState.gameActive) return;
    
    const unitStats = BEE_UNITS[type];
    const currentLevel = gameState.unitLevels[type];
    const cost = Math.floor(unitStats.baseUpgradeCost * Math.pow(UPGRADE_COST_INCREASE, currentLevel - 1));

    if (gameState.beeResources >= cost) {
       const multiplier = 1 + UPGRADE_STAT_INCREASE;
       const now = Date.now();
       
       setGameState(prev => ({
         ...prev,
         beeResources: prev.beeResources - cost,
         unitLevels: {
           ...prev.unitLevels,
           [type]: prev.unitLevels[type] + 1
         },
         units: prev.units.map(u => {
           if (u.faction === Faction.BEES && u.type === type) {
             const newHp = u.hp * multiplier;
             const newCurrentHp = u.currentHp * multiplier;
             return {
               ...u,
               hp: newHp,
               currentHp: newCurrentHp,
               attack: u.attack * multiplier
             };
           }
           return u;
         }),
         triggerCommentaryForEvent: `${unitStats.name}s just got stronger!`,
         lastCommentaryTime: now 
       }));
       
       addLog(`${unitStats.name} upgraded to Level ${currentLevel + 1}!`, Faction.BEES);
    }
  };

  const handleLaneClick = (laneIndex: number) => {
    if (!gameState.gameActive || !gameState.selectedUnit) return;
    
    const centerLaneIndex = Math.floor(LANE_COUNT / 2);
    const isGatherer = gameState.selectedUnit === UnitType.GATHERER;
    const isResourceLane = laneIndex === centerLaneIndex;

    // Logic: Gatherers ONLY in center (resource) lane. Others ONLY in combat lanes.
    if (isGatherer && !isResourceLane) {
        addLog("⚠️ Nectar Haulers must go to the Resource Corridor (Center)!", Faction.BEES);
        return;
    }
    if (!isGatherer && isResourceLane) {
        addLog("⚠️ Combat units cannot fight in the Resource Corridor!", Faction.BEES);
        return;
    }

    const unitStats = BEE_UNITS[gameState.selectedUnit];
    if (gameState.beeResources >= unitStats.cost) {
       const level = gameState.unitLevels[gameState.selectedUnit];
       const statMultiplier = Math.pow(1 + UPGRADE_STAT_INCREASE, level - 1);

       const newUnit: GameUnit = {
          ...unitStats,
          instanceId: `bee_${Date.now()}_${Math.random()}`,
          faction: Faction.BEES,
          lane: laneIndex,
          position: 0,
          hp: unitStats.hp * statMultiplier,
          currentHp: unitStats.hp * statMultiplier,
          attack: unitStats.attack * statMultiplier,
          lastAttackTime: 0,
          isAttacking: false,
          isCarrying: false
       };

       const now = Date.now();
       let trigger = undefined;
       if (now - gameState.lastCommentaryTime > 8000) {
           trigger = `Bees deploy reinforcements in lane ${laneIndex + 1}!`;
       }

       setGameState(prev => ({
          ...prev,
          beeResources: prev.beeResources - unitStats.cost,
          units: [...prev.units, newUnit],
          selectedUnit: null,
          triggerCommentaryForEvent: trigger,
          lastCommentaryTime: trigger ? now : prev.lastCommentaryTime
       }));

       addLog(`Deployed ${unitStats.name} to Lane ${laneIndex + 1}`, Faction.BEES);
    } else {
       addLog("Not enough nectar!", Faction.BEES);
    }
  };

  const handleRestart = () => {
    setGameState({
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
        logs: [{ id: Date.now(), text: "A new battle begins! Fight!", timestamp: Date.now() }],
        commentary: "Round 2! Ding Ding!",
        isLoadingCommentary: false,
        selectedUnit: null,
        lastCommentaryTime: Date.now(),
        centerFoodItem: FOOD_ITEMS[Math.floor(Math.random() * FOOD_ITEMS.length)]
    });
  };

  const centerLaneIndex = Math.floor(LANE_COUNT / 2);

  // --- Rendering ---
  return (
    <div className="min-h-screen flex flex-col max-w-[1800px] mx-auto p-4 select-none">
      
      {/* Header */}
      <div className="relative h-40 rounded-3xl overflow-hidden mb-4 shadow-2xl border-4 border-white">
         <img 
           src="https://image.pollinations.ai/prompt/cartoon%20backyard%20battle%20bees%20vs%20ants%20funny%20comic%20style%20wide%20angle?width=1024&height=512&nologo=true" 
           alt="Backyard Battle" 
           className="w-full h-full object-cover"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end justify-between px-8 pb-4">
            <h1 className="text-5xl text-white comic-font drop-shadow-md stroke-black text-stroke-2">
              BUZZ <span className="text-yellow-400">vs</span> BITE
            </h1>
            <div className="text-white font-mono text-sm opacity-80 text-right">
              Resource Corridor Edition<br/>
              Defend the Hive!
            </div>
         </div>
      </div>

      <ResourceBar 
        nectar={gameState.beeResources} 
        crumbs={gameState.antResources} 
        beeHealth={gameState.beeBaseHealth}
        antHealth={gameState.antBaseHealth}
      />

      {/* Commentary */}
      <div className="backdrop-blur-md bg-slate-900/70 text-yellow-300 p-3 rounded-xl mb-4 text-center font-bold border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)] relative z-20 text-lg tracking-wide transition-all duration-300">
         <span className="mr-3 text-xl animate-pulse inline-block">🎙️</span>
         "{gameState.commentary}"
      </div>

      {/* MAIN BATTLEFIELD CONTAINER - Increased height and reduced bottom margin */}
      <div className="flex flex-row gap-2 h-[500px] mb-2">
        
        {/* LEFT: BEE HIVE + HEALTH */}
        <BaseHealth 
            faction={Faction.BEES} 
            currentHealth={gameState.beeBaseHealth} 
            maxHealth={BASE_HEALTH} 
        />

        {/* CENTER: LANES */}
        <div className="flex-1 bg-green-700 rounded-xl border-8 border-green-900 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {Array.from({ length: LANE_COUNT }).map((_, laneIndex) => {
                const isCenterLane = laneIndex === centerLaneIndex;
                const isGathererSelected = gameState.selectedUnit === UnitType.GATHERER;
                const isCombatUnitSelected = gameState.selectedUnit && !isGathererSelected;
                
                // Determine if this lane is valid for the selected unit
                const isValidLane = !gameState.selectedUnit || 
                                    (isGathererSelected && isCenterLane) || 
                                    (isCombatUnitSelected && !isCenterLane);

                return (
                <div 
                    key={laneIndex}
                    onClick={() => handleLaneClick(laneIndex)}
                    className={`
                    relative flex-1 w-full border-b border-black/30 flex items-center transition-all duration-300
                    ${isCenterLane 
                        ? 'bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 border-y-4 border-amber-300/50 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]' 
                        : (laneIndex % 2 === 0 ? 'bg-gradient-to-r from-green-800 to-green-700' : 'bg-gradient-to-r from-green-700 to-green-600')
                    }
                    ${gameState.selectedUnit && isValidLane ? 'cursor-pointer hover:brightness-125' : ''}
                    ${gameState.selectedUnit && !isValidLane ? 'cursor-not-allowed grayscale-[0.7] opacity-60' : ''}
                    ${gameState.selectedUnit && isValidLane ? 'ring-inset ring-4 ring-yellow-400 z-10 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : ''}
                    group
                    `}
                    style={isCenterLane ? { backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v20h2v2H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm0 4h20v2H16v-2zm0 4h20v2H16v-2zm0 4h20v2H16v-2zm0 4h20v2H16v-2z\' fill=\'%23ffffff\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' } : {}}
                >
                    {/* Lane Number */}
                    <div className="absolute left-2 text-white/20 font-mono text-4xl font-bold pointer-events-none z-0">
                    {laneIndex + 1}
                    </div>

                    {/* Center Lane Specifics (Food + Corridor Label) */}
                    {isCenterLane && (
                        <>
                            <div className="absolute inset-0 flex justify-around items-center opacity-40 pointer-events-none">
                                <span>🥤</span><span>🥪</span><span>🍎</span><span>🍩</span>
                            </div>
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black/20 text-white text-[10px] font-bold px-2 rounded-b">
                                RESOURCE CORRIDOR
                            </div>
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 flex flex-col items-center opacity-100 scale-150">
                                <span className="text-4xl filter drop-shadow-lg animate-wiggle-slow">{gameState.centerFoodItem.emoji}</span>
                            </div>
                        </>
                    )}

                    {/* Units in this lane */}
                    {(() => {
                      const laneUnits = gameState.units.filter(u => u.lane === laneIndex);
                      // Stable sort by position for rendering order
                      laneUnits.sort((a, b) => a.position - b.position);

                      return laneUnits.map((unit) => {
                        // Logic to detect stacks of same type/faction
                        const stackGroup = laneUnits.filter(u => 
                          u.faction === unit.faction && 
                          u.type === unit.type && 
                          Math.abs(u.position - unit.position) < 3 // 3% proximity threshold
                        );

                        // Sort stack group by ID for stable offset assignment
                        stackGroup.sort((a, b) => a.instanceId.localeCompare(b.instanceId));
                        const stackIndex = stackGroup.findIndex(u => u.instanceId === unit.instanceId);
                        const stackSize = stackGroup.length;
                        
                        // Vertical offset: Fan out alternating up/down
                        const verticalOffset = stackIndex === 0 ? 0 : 
                                               (stackIndex % 2 === 0 ? (stackIndex/2) * 6 : -((stackIndex+1)/2) * 6);

                        return (
                          <div
                            key={unit.instanceId}
                            className="absolute transition-all duration-75 ease-linear flex flex-col items-center justify-center w-9 h-9"
                            style={{ 
                              left: `${unit.position}%`, 
                              transform: `translate(-50%, ${verticalOffset}px) scaleX(${unit.faction === Faction.BEES ? 1 : -1})`,
                              zIndex: 20 + stackIndex // Ensure specific stacking order
                            }}
                          >
                            {/* HP Bar */}
                            <div className="w-full h-1 bg-gray-700 rounded-full mb-0.5 overflow-hidden" style={{ transform: 'scaleX(1)' }}> 
                                <div 
                                    className={`h-full ${unit.faction === Faction.BEES ? 'bg-yellow-400' : 'bg-red-500'}`} 
                                    style={{ width: `${(unit.currentHp / unit.hp) * 100}%` }}
                                ></div>
                            </div>
                            
                            {/* Unit Emoji */}
                            <div className="relative">
                                    <div className={`text-2xl filter drop-shadow-md ${unit.isAttacking ? 'animate-wiggle-fast' : 'animate-bounce-slow'}`}>
                                        {unit.emoji}
                                    </div>
                                    
                                    {/* Carrying indicator */}
                                    {unit.isCarrying && (
                                        <div className="absolute -top-2 -right-2 text-xs animate-bounce bg-white/80 rounded-full w-4 h-4 flex items-center justify-center border border-gray-400 shadow">
                                            {gameState.centerFoodItem.emoji}
                                        </div>
                                    )}

                                    {/* Stack Count Badge - Only on the 'primary' unit of the stack */}
                                    {stackIndex === 0 && stackSize > 1 && (
                                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-white/30 z-30 shadow-sm backdrop-blur-[1px]">
                                        x{stackSize}
                                      </div>
                                    )}
                            </div>
                            
                            {unit.isAttacking && (
                                <div className="absolute -right-3 top-1/2 -translate-y-1/2 text-lg animate-ping">💥</div>
                            )}
                          </div>
                        );
                      });
                    })()}

                    {/* Hover Effects */}
                    {gameState.selectedUnit && (
                        <div className={`absolute inset-0 hidden group-hover:flex items-center justify-center z-20 transition-all duration-200
                             ${isValidLane ? 'bg-white/10 backdrop-blur-[1px]' : 'bg-black/40'}
                        `}>
                             {/* Valid Placement */}
                             {isValidLane && (
                                 <div className="flex items-center gap-2 animate-bounce">
                                     <span className="text-4xl">{BEE_UNITS[gameState.selectedUnit].emoji}</span>
                                     <span className="font-bold text-white drop-shadow-md text-2xl border-b-2 border-white">DEPLOY</span>
                                 </div>
                             )}
                             
                             {/* Invalid Placement */}
                             {!isValidLane && (
                                 <div className="flex flex-col items-center">
                                    <span className="text-4xl mb-1">🚫</span>
                                    <span className="font-bold text-white text-sm bg-red-600/90 px-3 py-1 rounded shadow-lg uppercase tracking-wider">
                                        {isGathererSelected ? "GATHERER NEEDS FOOD" : "NO COMBAT IN CORRIDOR"}
                                    </span>
                                 </div>
                             )}
                        </div>
                    )}
                </div>
            )})}
        </div>

        {/* RIGHT: ANT NEST + HEALTH */}
        <BaseHealth 
            faction={Faction.ANTS} 
            currentHealth={gameState.antBaseHealth} 
            maxHealth={BASE_HEALTH} 
        />

      </div>
      {/* END MAIN BATTLEFIELD */}

      {/* Controls - Moved closer via parent container margin reduction */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <UnitControls 
            units={BEE_UNITS} 
            resources={gameState.beeResources} 
            onSelect={handleSelectUnit}
            onUpgrade={handleUpgradeUnit}
            selectedUnit={gameState.selectedUnit}
            beeArmyCount={gameState.units.filter(u => u.faction === Faction.BEES).length}
            unitLevels={gameState.unitLevels}
          />
        </div>
        <div className="md:col-span-1">
             <BattleLog logs={gameState.logs} />
             <div className="mt-2 text-xs text-center text-slate-500">
               <span className="bg-green-200 px-1 rounded">Lane 3</span> is the Resource Corridor. Only Gatherers can enter!
             </div>
        </div>
      </div>

      <VictoryModal 
        winner={gameState.winner} 
        message={gameState.commentary} 
        onRestart={handleRestart} 
      />
      
      <style>{`
        .animate-wiggle-fast { animation: wiggle 0.2s ease-in-out infinite; }
        .animate-wiggle-slow { animation: wiggle 3s ease-in-out infinite; }
        .animate-bounce-slow { animation: bounce 1s infinite; }
        @keyframes wiggle { 0%, 100% { transform: rotate(-10deg); } 50% { transform: rotate(10deg); } }
      `}</style>
    </div>
  );
};

export default App;