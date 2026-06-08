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

/**
 * Checks if a date string matches today's date in local time.
 */
export function isToday(dateString: string): boolean {
  const logDate = new Date(dateString);
  const today = new Date();
  return logDate.getDate() === today.getDate() &&
         logDate.getMonth() === today.getMonth() &&
         logDate.getFullYear() === today.getFullYear();
}

/**
 * Calculates total minutes studied for a given subject on the current calendar day.
 */
export function calculateDailyMinutes(
  logs: { start_time: string; duration_minutes: number; subject: string }[],
  subjectName: string
): number {
  return logs
    .filter((log) => log.subject.toLowerCase() === subjectName.toLowerCase() && isToday(log.start_time))
    .reduce((sum, log) => sum + log.duration_minutes, 0);
}

export interface SessionRewards {
  focusOrbs: number;
  materials: number;
  gold: number;
  xp: number;
}

/**
 * Calculates session rewards (XP, Gold, Focus Orbs, Materials) factoring in active status effects.
 */
export function calculateSessionRewards(
  subject: string,
  durationMins: number,
  focusRating: number,
  slothActive: boolean,
  energy: number
): SessionRewards {
  // Base XP: 4 XP per minute
  let xp = durationMins * 4;
  // Base Gold: 1.5g per minute
  let gold = Math.round(durationMins * 1.5);
  // Base Focus Orbs: ~1 orb per 5 minutes of study, scaled by focus rating
  let focusOrbs = Math.max(1, Math.round((durationMins / 5) * (focusRating / 5)));
  // Base Materials: ~1 material per 8 minutes of study, scaled by focus rating
  // Only for German, Python, SQL
  let materials = 0;
  const isSubjectEligible = ["german", "python", "sql"].includes(subject.toLowerCase());
  if (isSubjectEligible) {
    materials = Math.max(1, Math.round((durationMins / 8) * (focusRating / 5)));
  }

  // Apply Energy penalty (Tired: energy < 20 -> -50% to all rewards)
  if (energy < 20) {
    xp = Math.max(1, Math.round(xp * 0.5));
    gold = Math.max(1, Math.round(gold * 0.5));
    focusOrbs = Math.max(1, Math.round(focusOrbs * 0.5));
    if (materials > 0) {
      materials = Math.max(1, Math.round(materials * 0.5));
    }
  }

  // Apply Sloth penalty (-25% to all rewards)
  if (slothActive) {
    xp = Math.max(1, Math.round(xp * 0.75));
    gold = Math.max(1, Math.round(gold * 0.75));
    focusOrbs = Math.max(1, Math.round(focusOrbs * 0.75));
    if (materials > 0) {
      materials = Math.max(1, Math.round(materials * 0.75));
    }
  }

  return { xp, gold, focusOrbs, materials };
}
