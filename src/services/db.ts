import Database from "@tauri-apps/plugin-sql";

export interface HeroProfile {
  id: number;
  level: number;
  current_xp: number;
  gold: number;
  current_node_id: number;
  strength: number;
  intelligence: number;
  dexterity: number;
  wisdom: number;
  charisma: number;
  equipped_weapon: string | null;
  equipped_armor: string | null;
  equipped_scroll: string | null;
  energy: number;
  sloth_active: number; // 0 or 1
  german_shards: number;
  python_shards: number;
  sql_shards: number;
  key_fragments: number;
  focus_orbs: number;
  materials_python: number;
  materials_german: number;
  materials_sql: number;
  princess_rescued: number; // 0 or 1
}

export interface ActivityLog {
  id?: number;
  subject: string;
  stat_category: string;
  start_time: string; // ISO String
  end_time: string; // ISO String
  duration_minutes: number;
  distraction_count: number;
  focus_rating: number;
  xp_gained: number;
  notes: string;
}

// Check if running inside the Tauri native app container
const isTauri = (): boolean => {
  return typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__ !== undefined;
};

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await Database.load("sqlite:shutoku.db");
  }
  return dbInstance;
}

// Browser Mock Database Implementation
class LocalStorageMockDb {
  static getProfile(): HeroProfile {
    const defaultProfile: HeroProfile = {
      id: 1,
      level: 1,
      current_xp: 0,
      gold: 0,
      current_node_id: 1,
      strength: 10,
      intelligence: 10,
      dexterity: 10,
      wisdom: 10,
      charisma: 10,
      equipped_weapon: null,
      equipped_armor: null,
      equipped_scroll: null,
      energy: 100,
      sloth_active: 0,
      german_shards: 0,
      python_shards: 0,
      sql_shards: 0,
      key_fragments: 0,
      focus_orbs: 0,
      materials_python: 0,
      materials_german: 0,
      materials_sql: 0,
      princess_rescued: 0,
    };
    const data = localStorage.getItem("shutoku_hero_profile");
    if (!data) {
      localStorage.setItem("shutoku_hero_profile", JSON.stringify(defaultProfile));
      return defaultProfile;
    }
    const parsed = JSON.parse(data);
    return { ...defaultProfile, ...parsed };
  }

  static saveProfile(profile: HeroProfile): void {
    localStorage.setItem("shutoku_hero_profile", JSON.stringify(profile));
  }

  static getLogs(): ActivityLog[] {
    const data = localStorage.getItem("shutoku_activity_logs");
    return data ? JSON.parse(data) : [];
  }

  static addLog(log: ActivityLog): void {
    const logs = this.getLogs();
    const newLog = { ...log, id: logs.length + 1 };
    logs.unshift(newLog); // Put new log at the start
    localStorage.setItem("shutoku_activity_logs", JSON.stringify(logs));
  }
}

export async function initDb(): Promise<void> {
  if (!isTauri()) {
    // Initialize LocalStorage arrays
    LocalStorageMockDb.getProfile();
    return;
  }

  const db = await getDb();

  // Create SQLite tables
  await db.execute(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT NOT NULL,
      stat_category TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      distraction_count INTEGER DEFAULT 0,
      focus_rating INTEGER CHECK(focus_rating BETWEEN 1 AND 5),
      xp_gained INTEGER NOT NULL,
      notes TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS hero_profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level INTEGER DEFAULT 1,
      current_xp INTEGER DEFAULT 0,
      gold INTEGER DEFAULT 0,
      current_node_id INTEGER DEFAULT 1,
      strength INTEGER DEFAULT 10,
      intelligence INTEGER DEFAULT 10,
      dexterity INTEGER DEFAULT 10,
      wisdom INTEGER DEFAULT 10,
      charisma INTEGER DEFAULT 10,
      equipped_weapon TEXT DEFAULT NULL,
      equipped_armor TEXT DEFAULT NULL,
      equipped_scroll TEXT DEFAULT NULL,
      energy INTEGER DEFAULT 100,
      sloth_active INTEGER DEFAULT 0,
      german_shards INTEGER DEFAULT 0,
      python_shards INTEGER DEFAULT 0,
      sql_shards INTEGER DEFAULT 0,
      key_fragments INTEGER DEFAULT 0,
      focus_orbs INTEGER DEFAULT 0,
      materials_python INTEGER DEFAULT 0,
      materials_german INTEGER DEFAULT 0,
      materials_sql INTEGER DEFAULT 0,
      princess_rescued INTEGER DEFAULT 0
    );
  `);

  // Run migrations to add missing columns in case database exists from older versions
  const migrations = [
    "ALTER TABLE hero_profile ADD COLUMN energy INTEGER DEFAULT 100",
    "ALTER TABLE hero_profile ADD COLUMN sloth_active INTEGER DEFAULT 0",
    "ALTER TABLE hero_profile ADD COLUMN german_shards INTEGER DEFAULT 0",
    "ALTER TABLE hero_profile ADD COLUMN python_shards INTEGER DEFAULT 0",
    "ALTER TABLE hero_profile ADD COLUMN sql_shards INTEGER DEFAULT 0",
    "ALTER TABLE hero_profile ADD COLUMN key_fragments INTEGER DEFAULT 0",
    "ALTER TABLE hero_profile ADD COLUMN focus_orbs INTEGER DEFAULT 0",
    "ALTER TABLE hero_profile ADD COLUMN materials_python INTEGER DEFAULT 0",
    "ALTER TABLE hero_profile ADD COLUMN materials_german INTEGER DEFAULT 0",
    "ALTER TABLE hero_profile ADD COLUMN materials_sql INTEGER DEFAULT 0",
    "ALTER TABLE hero_profile ADD COLUMN princess_rescued INTEGER DEFAULT 0"
  ];
  for (const q of migrations) {
    try {
      await db.execute(q);
    } catch (e) {
      // Ignore errors if columns already exist
    }
  }

  // Seed default hero profile if not present
  const profiles = await db.select<HeroProfile[]>("SELECT * FROM hero_profile LIMIT 1");
  if (profiles.length === 0) {
    await db.execute(`
      INSERT INTO hero_profile (
        level, current_xp, gold, current_node_id, 
        strength, intelligence, dexterity, wisdom, charisma,
        equipped_weapon, equipped_armor, equipped_scroll,
        energy, sloth_active, german_shards, python_shards, sql_shards,
        key_fragments, focus_orbs, materials_python, materials_german, materials_sql, princess_rescued
      )
      VALUES (1, 0, 0, 1, 10, 10, 10, 10, 10, NULL, NULL, NULL, 100, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    `);
  }
}

export async function getHeroProfile(): Promise<HeroProfile> {
  if (!isTauri()) {
    return LocalStorageMockDb.getProfile();
  }

  const db = await getDb();
  const profiles = await db.select<HeroProfile[]>("SELECT * FROM hero_profile LIMIT 1");
  if (profiles.length === 0) {
    throw new Error("No hero profile found. Database may not be initialized.");
  }
  return profiles[0];
}

export async function updateHeroProfile(profile: HeroProfile): Promise<void> {
  if (!isTauri()) {
    LocalStorageMockDb.saveProfile(profile);
    return;
  }

  const db = await getDb();
  await db.execute(
    `UPDATE hero_profile SET 
      level = $1, 
      current_xp = $2, 
      gold = $3, 
      current_node_id = $4, 
      strength = $5, 
      intelligence = $6, 
      dexterity = $7, 
      wisdom = $8, 
      charisma = $9,
      equipped_weapon = $10,
      equipped_armor = $11,
      equipped_scroll = $12,
      energy = $13,
      sloth_active = $14,
      german_shards = $15,
      python_shards = $16,
      sql_shards = $17,
      key_fragments = $18,
      focus_orbs = $19,
      materials_python = $20,
      materials_german = $21,
      materials_sql = $22,
      princess_rescued = $23
     WHERE id = $24`,
    [
      profile.level,
      profile.current_xp,
      profile.gold,
      profile.current_node_id,
      profile.strength,
      profile.intelligence,
      profile.dexterity,
      profile.wisdom,
      profile.charisma,
      profile.equipped_weapon,
      profile.equipped_armor,
      profile.equipped_scroll,
      profile.energy,
      profile.sloth_active,
      profile.german_shards,
      profile.python_shards,
      profile.sql_shards,
      profile.key_fragments,
      profile.focus_orbs,
      profile.materials_python,
      profile.materials_german,
      profile.materials_sql,
      profile.princess_rescued,
      profile.id,
    ]
  );
}

export async function addActivityLog(log: ActivityLog): Promise<void> {
  if (!isTauri()) {
    LocalStorageMockDb.addLog(log);
    return;
  }

  const db = await getDb();
  await db.execute(
    `INSERT INTO activity_log (
      subject, stat_category, start_time, end_time, 
      duration_minutes, distraction_count, focus_rating, xp_gained, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      log.subject,
      log.stat_category,
      log.start_time,
      log.end_time,
      log.duration_minutes,
      log.distraction_count,
      log.focus_rating,
      log.xp_gained,
      log.notes,
    ]
  );
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  if (!isTauri()) {
    return LocalStorageMockDb.getLogs();
  }

  const db = await getDb();
  return await db.select<ActivityLog[]>("SELECT * FROM activity_log ORDER BY start_time DESC");
}
