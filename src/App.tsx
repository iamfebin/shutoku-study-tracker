import { useState, useEffect } from "react";
import { Coins, Award, Compass, ShoppingCart, Activity, Clock, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";

import { 
  initDb, 
  getHeroProfile, 
  updateHeroProfile, 
  addActivityLog, 
  getActivityLogs, 
  HeroProfile, 
  ActivityLog 
} from "./services/db";
import { addXp } from "./utils/rpg";
import { Pomodoro } from "./components/Pomodoro";
import { StatsPanel } from "./components/StatsPanel";
import { RpgMap } from "./components/RpgMap";
import { Shop, ShopItem } from "./components/Shop";
import { Analytics } from "./components/Analytics";

type ActiveTab = "dashboard" | "map" | "shop" | "analytics";

function App() {
  const [profile, setProfile] = useState<HeroProfile | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // Load database and load state
  useEffect(() => {
    async function setupApp() {
      try {
        await initDb();
        await refreshData();
      } catch (err: any) {
        console.error("Database initialization failed:", err);
        setDbError(err?.message || "Failed to load database. Are you running under Tauri?");
      } finally {
        setIsLoading(false);
      }
    }
    setupApp();
  }, []);

  const refreshData = async () => {
    const prof = await getHeroProfile();
    const history = await getActivityLogs();
    setProfile(prof);
    setLogs(history);
  };

  const triggerLevelUpConfetti = () => {
    // Left burst
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#d4af37", "#ffffff", "#ffd700"]
    });
    // Right burst
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#d4af37", "#ffffff", "#ffd700"]
    });
  };

  // Pomodoro session completes
  const handleSessionComplete = async (logData: Omit<ActivityLog, "id">) => {
    if (!profile) return;

    // 1. Calculate bonuses based on current stats and equipment
    // Intelligence boosts XP gains slightly
    const xpBoost = Math.round(profile.intelligence * 0.15);
    const finalXpGained = logData.xp_gained + xpBoost;

    // Charisma/Wisdom boosts Gold gains (base gold 10g + stat bonuses)
    const goldEarned = Math.max(5, Math.round(15 + (profile.charisma * 0.4) + (profile.wisdom * 0.2)));

    // 2. Increment the trained stat category by 1 point
    const updatedProfile = { ...profile };
    
    switch (logData.stat_category) {
      case "INT":
        updatedProfile.intelligence += 1;
        break;
      case "WIS":
        updatedProfile.wisdom += 1;
        break;
      case "STR":
        updatedProfile.strength += 1;
        break;
      case "DEX":
        updatedProfile.dexterity += 1;
        break;
      case "CHA":
        updatedProfile.charisma += 1;
        break;
    }

    // 3. Process XP and Levels
    const levelResult = addXp(profile.level, profile.current_xp, finalXpGained);
    
    updatedProfile.level = levelResult.newLevel;
    updatedProfile.current_xp = levelResult.remainingXp;
    updatedProfile.gold += goldEarned;

    // Apply any additional level up stat bonuses (+1 to all stats)
    if (levelResult.leveledUp) {
      updatedProfile.strength += levelResult.statsAwarded.strength;
      updatedProfile.intelligence += levelResult.statsAwarded.intelligence;
      updatedProfile.dexterity += levelResult.statsAwarded.dexterity;
      updatedProfile.wisdom += levelResult.statsAwarded.wisdom;
      updatedProfile.charisma += levelResult.statsAwarded.charisma;
      
      triggerLevelUpConfetti();
    }

    // 4. Save to Database
    try {
      // Create final activity log entry
      const finalLog: ActivityLog = {
        ...logData,
        xp_gained: finalXpGained,
        notes: `${logData.notes ? logData.notes + " " : ""}(Gained ${goldEarned}g) (+1 ${logData.stat_category})`
      };

      await addActivityLog(finalLog);
      await updateHeroProfile(updatedProfile);
      await refreshData();
    } catch (e) {
      console.error("Failed to save session completion:", e);
    }
  };

  // Node travel on RpgMap
  const handleSelectNode = async (nodeId: number, goldReward: number) => {
    if (!profile) return;

    const updatedProfile = { ...profile };
    const oldNode = profile.current_node_id;
    updatedProfile.current_node_id = nodeId;

    // Award gold reward if traveling forward to a new node
    if (nodeId > oldNode) {
      updatedProfile.gold += goldReward;
      
      // Fire subtle gold confetti
      confetti({
        particleCount: 30,
        spread: 30,
        origin: { y: 0.8 },
        colors: ["#d4af37", "#ffd700"]
      });
    }

    try {
      await updateHeroProfile(updatedProfile);
      await refreshData();
    } catch (e) {
      console.error("Failed to update map node:", e);
    }
  };

  // Merchant Shop purchase
  const handlePurchaseItem = async (item: ShopItem) => {
    if (!profile || profile.gold < item.cost) return;

    const updatedProfile = { ...profile };
    updatedProfile.gold -= item.cost;

    // Apply equipment and handle old item stat adjustments
    // We add stats directly when buying. For simplicity:
    // When a weapon is bought:
    // Remove old weapon stat boosts, add new weapon stat boosts
    const getWeaponBoost = (name: string | null) => {
      if (!name) return { str: 0, int: 0, dex: 0 };
      const n = name.toLowerCase();
      if (n.includes("staff")) return { str: 0, int: 2, dex: 0 };
      if (n.includes("sword")) return { str: 4, int: 0, dex: 0 };
      if (n.includes("bow")) return { str: 0, int: 0, dex: 8 };
      if (n.includes("excalibur")) return { str: 15, int: 0, dex: 0 }; // Excalibur wis bonus is handled inside sheet display dynamically
      return { str: 0, int: 0, dex: 0 };
    };

    const getArmorBoost = (name: string | null) => {
      if (!name) return { str: 0, int: 0, dex: 0, wis: 0 };
      const n = name.toLowerCase();
      if (n.includes("leather")) return { str: 0, int: 0, dex: 1, wis: 0 };
      if (n.includes("chainmail")) return { str: 4, int: 0, dex: 0, wis: 0 };
      if (n.includes("robes")) return { str: 0, int: 6, dex: 0, wis: 2 };
      if (n.includes("paladin")) return { str: 10, int: 0, dex: 0, wis: 10 };
      return { str: 0, int: 0, dex: 0, wis: 0 };
    };

    const getScrollBoost = (name: string | null) => {
      if (!name) return { wis: 0, cha: 0 };
      const n = name.toLowerCase();
      if (n.includes("wisdom")) return { wis: 1, cha: 0 };
      if (n.includes("charisma")) return { wis: 0, cha: 6 };
      return { wis: 0, cha: 0 };
    };

    if (item.category === "weapon") {
      // Revert old weapon stat boosts
      const oldBoosts = getWeaponBoost(profile.equipped_weapon);
      updatedProfile.strength = Math.max(10, updatedProfile.strength - oldBoosts.str);
      updatedProfile.intelligence = Math.max(10, updatedProfile.intelligence - oldBoosts.int);
      updatedProfile.dexterity = Math.max(10, updatedProfile.dexterity - oldBoosts.dex);

      // Apply new weapon
      updatedProfile.equipped_weapon = item.name;
      const newBoosts = getWeaponBoost(item.name);
      updatedProfile.strength += newBoosts.str;
      updatedProfile.intelligence += newBoosts.int;
      updatedProfile.dexterity += newBoosts.dex;
    } 
    else if (item.category === "armor") {
      // Revert old armor stat boosts
      const oldBoosts = getArmorBoost(profile.equipped_armor);
      updatedProfile.strength = Math.max(10, updatedProfile.strength - oldBoosts.str);
      updatedProfile.intelligence = Math.max(10, updatedProfile.intelligence - oldBoosts.int);
      updatedProfile.dexterity = Math.max(10, updatedProfile.dexterity - oldBoosts.dex);
      updatedProfile.wisdom = Math.max(10, updatedProfile.wisdom - oldBoosts.wis);

      // Apply new armor
      updatedProfile.equipped_armor = item.name;
      const newBoosts = getArmorBoost(item.name);
      updatedProfile.strength += newBoosts.str;
      updatedProfile.intelligence += newBoosts.int;
      updatedProfile.dexterity += newBoosts.dex;
      updatedProfile.wisdom += newBoosts.wis;
    } 
    else if (item.category === "scroll") {
      // Revert old scroll
      const oldBoosts = getScrollBoost(profile.equipped_scroll);
      updatedProfile.wisdom = Math.max(10, updatedProfile.wisdom - oldBoosts.wis);
      updatedProfile.charisma = Math.max(10, updatedProfile.charisma - oldBoosts.cha);

      // Apply new scroll
      updatedProfile.equipped_scroll = item.name;
      const newBoosts = getScrollBoost(item.name);
      updatedProfile.wisdom += newBoosts.wis;
      updatedProfile.charisma += newBoosts.cha;
    }

    try {
      await updateHeroProfile(updatedProfile);
      await refreshData();
      
      // Satisfying click chime
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
      osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.error("Failed to complete purchase:", e);
    }
  };

  // Error Loading Screen
  if (dbError) {
    return (
      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          height: "100vh", 
          width: "100vw",
          padding: "2rem",
          background: "var(--bg-obsidian)",
          color: "var(--color-text-parchment)",
          textAlign: "center"
        }}
      >
        <div className="rpg-panel" style={{ maxWidth: "500px" }}>
          <h2 style={{ color: "var(--color-danger)", marginBottom: "1rem" }}>
            ⚠️ Database Connection Error
          </h2>
          <p style={{ fontSize: "0.95rem", color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
            {dbError}
          </p>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            Please ensure you are running this application within the <strong>Tauri desktop runtime</strong> (e.g. using <code>npm run tauri dev</code>) so that SQLite local storage bindings can load properly.
          </p>
        </div>
      </div>
    );
  }

  // Loader state
  if (isLoading || !profile) {
    return (
      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          justifyContent: "center", 
          height: "100vh", 
          width: "100vw",
          background: "var(--bg-obsidian)"
        }}
      >
        <div style={{ fontSize: "1.2rem", fontFamily: "var(--font-display)", color: "var(--color-gold)", animation: "pulseGlow 1.5s infinite" }}>
          📜 Decrypting Chronicles...
        </div>
      </div>
    );
  }

  // Active Map Node Details
  const nodeNames = [
    "Novice Rest",
    "Deepwood Camp",
    "Whispering Ruins",
    "Dragon's Ridge",
    "Sunken Citadel",
    "Imperial Spire"
  ];
  const currentNodeName = nodeNames[profile.current_node_id - 1] || "Unknown Realm";

  return (
    <div className="app-container">
      
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-header">
            <h1 className="sidebar-title">Shutoku</h1>
            <div className="sidebar-subtitle">Study Pathfinder</div>
          </div>

          <nav className="nav-links">
            <button 
              className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              <Clock size={16} /> Focus Room
            </button>
            <button 
              className={`nav-item ${activeTab === "map" ? "active" : ""}`}
              onClick={() => setActiveTab("map")}
            >
              <Compass size={16} /> World Map
            </button>
            <button 
              className={`nav-item ${activeTab === "shop" ? "active" : ""}`}
              onClick={() => setActiveTab("shop")}
            >
              <ShoppingCart size={16} /> Merchant
            </button>
            <button 
              className={`nav-item ${activeTab === "analytics" ? "active" : ""}`}
              onClick={() => setActiveTab("analytics")}
            >
              <Activity size={16} /> Ledger Logs
            </button>
          </nav>
        </div>

        <div className="sidebar-footer">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem", color: "var(--color-success)" }}>
            <ShieldCheck size={12} /> Local Ledger Secure
          </div>
          <div style={{ fontSize: "0.7rem", marginTop: "0.25rem" }}>Shutoku Tracker v0.2.0</div>
        </div>
      </aside>

      {/* RIGHT MAIN VIEW AREA */}
      <main className="content-area">
        
        {/* Header Bar */}
        <header className="header-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-muted)" }}>Current Camp:</span>
            <span style={{ fontSize: "0.95rem", fontFamily: "var(--font-display)", color: "var(--color-text-parchment)" }}>
              📍 {currentNodeName}
            </span>
          </div>

          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Award size={16} style={{ color: "var(--color-gold)" }} />
              <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Lvl {profile.level}</span>
            </div>
            <div className="gold-badge">
              <Coins size={16} className="gold-icon" /> {profile.gold}g
            </div>
          </div>
        </header>

        {/* View container switcher */}
        <div className="view-container">
          {activeTab === "dashboard" && (
            <div className="rpg-grid-dashboard">
              <Pomodoro onSessionComplete={handleSessionComplete} />
              <StatsPanel profile={profile} />
            </div>
          )}

          {activeTab === "map" && (
            <RpgMap profile={profile} onSelectNode={handleSelectNode} />
          )}

          {activeTab === "shop" && (
            <Shop profile={profile} onPurchaseItem={handlePurchaseItem} />
          )}

          {activeTab === "analytics" && (
            <Analytics logs={logs} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
