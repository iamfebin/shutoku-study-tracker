/**
 * Calculates the XP needed to clear the current level.
 * Formula: XP_needed = Math.floor(Level^1.5 * 100)
 */
export function getXpNeeded(level: number): number {
  return Math.floor(Math.pow(level, 1.5) * 100);
}

export interface LevelUpResult {
  leveledUp: boolean;
  newLevel: number;
  remainingXp: number;
  statsAwarded: {
    strength: number;
    intelligence: number;
    dexterity: number;
    wisdom: number;
    charisma: number;
  };
}

/**
 * Calculates new level and remaining XP after gaining XP.
 * Supports multiple level-ups in a single massive XP gain.
 */
export function addXp(level: number, currentXp: number, xpGained: number): LevelUpResult {
  let tempLevel = level;
  let tempXp = currentXp + xpGained;
  let leveledUp = false;
  const statsAwarded = { strength: 0, intelligence: 0, dexterity: 0, wisdom: 0, charisma: 0 };

  while (tempXp >= getXpNeeded(tempLevel)) {
    tempXp -= getXpNeeded(tempLevel);
    tempLevel += 1;
    leveledUp = true;
    
    // Award attribute improvements on each level up
    statsAwarded.strength += 1;
    statsAwarded.intelligence += 1;
    statsAwarded.dexterity += 1;
    statsAwarded.wisdom += 1;
    statsAwarded.charisma += 1;
  }

  return {
    leveledUp,
    newLevel: tempLevel,
    remainingXp: tempXp,
    statsAwarded,
  };
}
