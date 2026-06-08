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

interface EndDaySummary {
  germanMins: number;
  pythonMins: number;
  sqlMins: number;
  germanShardEarned: boolean;
  pythonShardEarned: boolean;
  sqlShardEarned: boolean;
  slothPenalized: boolean;
}

function App() {
  const [profile, setProfile] = useState<HeroProfile | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // New RPG gameplay states
  const [demoMode, setDemoMode] = useState<boolean>(() => {
    return localStorage.getItem("shutoku_demo_mode") === "true";
  });
  const [isResting, setIsResting] = useState<boolean>(false);
  const [oversleepSeconds, setOversleepSeconds] = useState<number>(0);
  const [showOversleepWarning, setShowOversleepWarning] = useState<boolean>(false);

  // Daily totals
  const [dailyGerman, setDailyGerman] = useState<number>(0);
  const [dailyPython, setDailyPython] = useState<number>(0);
  const [dailySQL, setDailySQL] = useState<number>(0);

  // Modals
  const [showEndDayModal, setShowEndDayModal] = useState<boolean>(false);
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);
  const [endDaySummary, setEndDaySummary] = useState<EndDaySummary | null>(null);

  // Persist demo mode choice
  useEffect(() => {
    localStorage.setItem("shutoku_demo_mode", demoMode ? "true" : "false");
  }, [demoMode]);

  // Load database and initial state
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

  // Background energy ticker when resting
  useEffect(() => {
    let intervalId: any = null;
    if (isResting && profile) {
      intervalId = setInterval(() => {
        setProfile((prev) => {
          if (!prev) return null;
          let newEnergy = prev.energy;
          let newSloth = prev.sloth_active;
          let newOversleep = oversleepSeconds;

          // Restore energy: +2 energy per tick (or +20 in demo mode)
          const restoreRate = demoMode ? 20 : 2;
          if (newEnergy < 100) {
            newEnergy = Math.min(100, newEnergy + restoreRate);
            newOversleep = 0;
          } else {
            // Energy is 100, increment oversleep counter
            newOversleep += 1;
            
            // Apply sloth penalty if resting past full energy for 30s (or 5s in demo)
            const slothThreshold = demoMode ? 5 : 30;
            if (newOversleep >= slothThreshold && newSloth === 0) {
              newSloth = 1;
              setShowOversleepWarning(true);
            }
          }

          setOversleepSeconds(newOversleep);

          const updated = { ...prev, energy: newEnergy, sloth_active: newSloth };
          
          // Save to database/local storage on every tick
          updateHeroProfile(updated).catch(console.error);
          return updated;
        });
      }, 1000);
    } else {
      setOversleepSeconds(0);
      setShowOversleepWarning(false);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isResting, demoMode]);

  const refreshData = async () => {
    const prof = await getHeroProfile();
    const history = await getActivityLogs();
    setProfile(prof);
    setLogs(history);
    refreshDailyProgress(history);
  };

  const refreshDailyProgress = (historyLogs: ActivityLog[]) => {
    // Filter logs created since the last day end / commute
    const lastCommuteStr = localStorage.getItem("last_commute_time") || new Date(0).toISOString();
    const lastCommute = new Date(lastCommuteStr);

    const currentDayLogs = historyLogs.filter(log => new Date(log.start_time) > lastCommute);

    const germanMins = currentDayLogs
      .filter(log => log.subject.toLowerCase() === "german")
      .reduce((sum, log) => sum + log.duration_minutes, 0);

    const pythonMins = currentDayLogs
      .filter(log => log.subject.toLowerCase() === "python")
      .reduce((sum, log) => sum + log.duration_minutes, 0);

    const sqlMins = currentDayLogs
      .filter(log => log.subject.toLowerCase() === "sql")
      .reduce((sum, log) => sum + log.duration_minutes, 0);

    setDailyGerman(germanMins);
    setDailyPython(pythonMins);
    setDailySQL(sqlMins);
  };

  const triggerLevelUpConfetti = () => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ["#74c33c", "#35a0df", "#fec31e", "#ff7043", "#a78bfa"]
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ["#74c33c", "#35a0df", "#fec31e", "#ff7043", "#a78bfa"]
    });
  };

  // Pomodoro session completes
  const handleSessionComplete = async (
    logData: Omit<ActivityLog, "id">,
    rewards: { focusOrbs: number; materials: number; gold: number; xp: number }
  ) => {
    if (!profile) return;

    // Apply demoMode time scaling to the logged minutes if active
    const finalDuration = demoMode ? logData.duration_minutes * 60 : logData.duration_minutes;

    const updatedProfile = { ...profile };
    
    // Add stats category +1
    switch (logData.stat_category) {
      case "INT": updatedProfile.intelligence += 1; break;
      case "WIS": updatedProfile.wisdom += 1; break;
      case "STR": updatedProfile.strength += 1; break;
      case "DEX": updatedProfile.dexterity += 1; break;
      case "CHA": updatedProfile.charisma += 1; break;
    }

    // Process XP and Levels
    const levelResult = addXp(profile.level, profile.current_xp, rewards.xp);
    updatedProfile.level = levelResult.newLevel;
    updatedProfile.current_xp = levelResult.remainingXp;
    updatedProfile.gold += rewards.gold;

    // Apply level up boosts
    if (levelResult.leveledUp) {
      updatedProfile.strength += levelResult.statsAwarded.strength;
      updatedProfile.intelligence += levelResult.statsAwarded.intelligence;
      updatedProfile.dexterity += levelResult.statsAwarded.dexterity;
      updatedProfile.wisdom += levelResult.statsAwarded.wisdom;
      updatedProfile.charisma += levelResult.statsAwarded.charisma;
      triggerLevelUpConfetti();
    }

    // Add inventory rewards
    updatedProfile.focus_orbs += rewards.focusOrbs;
    if (logData.subject.toLowerCase() === "python") {
      updatedProfile.materials_python += rewards.materials;
    } else if (logData.subject.toLowerCase() === "german") {
      updatedProfile.materials_german += rewards.materials;
    } else if (logData.subject.toLowerCase() === "sql") {
      updatedProfile.materials_sql += rewards.materials;
    }

    // Drain energy proportional to focus minutes (-0.8 energy per focus minute)
    const energyDrain = Math.round(logData.duration_minutes * 0.8);
    updatedProfile.energy = Math.max(0, updatedProfile.energy - energyDrain);

    // Consume Slothfulness on completing a study quest
    updatedProfile.sloth_active = 0;

    try {
      const finalLog: ActivityLog = {
        ...logData,
        duration_minutes: finalDuration,
        xp_gained: rewards.xp,
        notes: `${logData.notes ? logData.notes + " " : ""}(Gained ${rewards.gold}g, +${rewards.focusOrbs} Orbs, +${rewards.materials} Materials)`
      };

      await addActivityLog(finalLog);
      await updateHeroProfile(updatedProfile);
      await refreshData();

      confetti({
        particleCount: 30,
        spread: 30,
        origin: { y: 0.8 },
        colors: ["#74c33c", "#fec31e", "#3aa6eb"]
      });
    } catch (e) {
      console.error("Failed to save session completion:", e);
    }
  };

  const handleTravelToNode = async (nodeId: number) => {
    if (!profile) return;
    const updatedProfile = { ...profile, current_node_id: nodeId };
    try {
      await updateHeroProfile(updatedProfile);
      await refreshData();
    } catch (e) {
      console.error("Failed to update map node:", e);
    }
  };

  const handleToggleRest = async () => {
    if (!profile) return;
    const willRest = !isResting;
    setIsResting(willRest);

    const updatedProfile = { ...profile };
    if (willRest) {
      updatedProfile.current_node_id = 1; // Travel to Home Base
    }

    try {
      await updateHeroProfile(updatedProfile);
      await refreshData();
    } catch (e) {
      console.error("Failed to toggle resting:", e);
    }
  };

  // Merchant Shop purchase
  const handlePurchaseItem = async (item: ShopItem) => {
    if (!profile || profile.gold < item.cost) return;

    const updatedProfile = { ...profile };
    updatedProfile.gold -= item.cost;

    const getWeaponBoost = (name: string | null) => {
      if (!name) return { str: 0, int: 0, dex: 0 };
      const n = name.toLowerCase();
      if (n.includes("staff")) return { str: 0, int: 2, dex: 0 };
      if (n.includes("sword")) return { str: 4, int: 0, dex: 0 };
      if (n.includes("bow")) return { str: 0, int: 0, dex: 8 };
      if (n.includes("excalibur")) return { str: 15, int: 0, dex: 0 };
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
      const oldBoosts = getWeaponBoost(profile.equipped_weapon);
      updatedProfile.strength = Math.max(10, updatedProfile.strength - oldBoosts.str);
      updatedProfile.intelligence = Math.max(10, updatedProfile.intelligence - oldBoosts.int);
      updatedProfile.dexterity = Math.max(10, updatedProfile.dexterity - oldBoosts.dex);

      updatedProfile.equipped_weapon = item.name;
      const newBoosts = getWeaponBoost(item.name);
      updatedProfile.strength += newBoosts.str;
      updatedProfile.intelligence += newBoosts.int;
      updatedProfile.dexterity += newBoosts.dex;
    } 
    else if (item.category === "armor") {
      const oldBoosts = getArmorBoost(profile.equipped_armor);
      updatedProfile.strength = Math.max(10, updatedProfile.strength - oldBoosts.str);
      updatedProfile.intelligence = Math.max(10, updatedProfile.intelligence - oldBoosts.int);
      updatedProfile.dexterity = Math.max(10, updatedProfile.dexterity - oldBoosts.dex);
      updatedProfile.wisdom = Math.max(10, updatedProfile.wisdom - oldBoosts.wis);

      updatedProfile.equipped_armor = item.name;
      const newBoosts = getArmorBoost(item.name);
      updatedProfile.strength += newBoosts.str;
      updatedProfile.intelligence += newBoosts.int;
      updatedProfile.dexterity += newBoosts.dex;
      updatedProfile.wisdom += newBoosts.wis;
    } 
    else if (item.category === "scroll") {
      const oldBoosts = getScrollBoost(profile.equipped_scroll);
      updatedProfile.wisdom = Math.max(10, updatedProfile.wisdom - oldBoosts.wis);
      updatedProfile.charisma = Math.max(10, updatedProfile.charisma - oldBoosts.cha);

      updatedProfile.equipped_scroll = item.name;
      const newBoosts = getScrollBoost(item.name);
      updatedProfile.wisdom += newBoosts.wis;
      updatedProfile.charisma += newBoosts.cha;
    }

    try {
      await updateHeroProfile(updatedProfile);
      await refreshData();
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); 
      osc.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.1); 
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

  // Crafting custom items or Key Fragments
  const handleCraftItem = async (craftType: "key_fragment" | "python_codex" | "german_scroll" | "sql_runestone") => {
    if (!profile) return;

    const updatedProfile = { ...profile };

    if (craftType === "key_fragment") {
      if (profile.german_shards < 1 || profile.python_shards < 1 || profile.sql_shards < 1) return;
      updatedProfile.german_shards -= 1;
      updatedProfile.python_shards -= 1;
      updatedProfile.sql_shards -= 1;
      updatedProfile.key_fragments += 1;
    } else if (craftType === "python_codex") {
      if (profile.focus_orbs < 10 || profile.materials_python < 5) return;
      updatedProfile.focus_orbs -= 10;
      updatedProfile.materials_python -= 5;
      updatedProfile.intelligence += 8;
    } else if (craftType === "german_scroll") {
      if (profile.focus_orbs < 10 || profile.materials_german < 5) return;
      updatedProfile.focus_orbs -= 10;
      updatedProfile.materials_german -= 5;
      updatedProfile.charisma += 8;
    } else if (craftType === "sql_runestone") {
      if (profile.focus_orbs < 10 || profile.materials_sql < 5) return;
      updatedProfile.focus_orbs -= 10;
      updatedProfile.materials_sql -= 5;
      updatedProfile.wisdom += 8;
    }

    try {
      await updateHeroProfile(updatedProfile);
      await refreshData();
      
      confetti({
        particleCount: 40,
        spread: 30,
        origin: { y: 0.8 },
        colors: ["#fab005", "#3aa6eb"]
      });
    } catch (e) {
      console.error("Failed to craft item:", e);
    }
  };

  // End Day & Commute Home
  const handleEndDay = async () => {
    if (!profile) return;

    // Wake up if resting
    if (isResting) {
      setIsResting(false);
    }

    // Determine shards earned based on daily totals
    const germanShardEarned = dailyGerman >= 300;
    const pythonShardEarned = dailyPython >= 120;
    const sqlShardEarned = dailySQL >= 120;

    const totalStudyMins = dailyGerman + dailyPython + dailySQL;

    // Apply Sloth penalty if very little studying occurred (less than 30 mins total)
    const slothPenalized = totalStudyMins < 30;

    const updatedProfile = {
      ...profile,
      german_shards: profile.german_shards + (germanShardEarned ? 1 : 0),
      python_shards: profile.python_shards + (pythonShardEarned ? 1 : 0),
      sql_shards: profile.sql_shards + (sqlShardEarned ? 1 : 0),
      energy: 100, // Restoring to 100% on sleeping
      sloth_active: slothPenalized ? 1 : 0,
      current_node_id: 1 // travel back to Home Base
    };

    setEndDaySummary({
      germanMins: dailyGerman,
      pythonMins: dailyPython,
      sqlMins: dailySQL,
      germanShardEarned,
      pythonShardEarned,
      sqlShardEarned,
      slothPenalized
    });

    try {
      // Record last commute timestamp
      localStorage.setItem("last_commute_time", new Date().toISOString());
      await updateHeroProfile(updatedProfile);
      await refreshData();
      setShowEndDayModal(true);
    } catch (e) {
      console.error("Failed to end day commute:", e);
    }
  };

  // Unlock Kingdom Gate and Rescue Princess
  const handleUnlockGate = async () => {
    if (!profile || profile.key_fragments < 3) return;

    const updatedProfile = {
      ...profile,
      princess_rescued: 1,
      key_fragments: profile.key_fragments - 3,
      current_node_id: 5 // Maintain position at Castle
    };

    try {
      await updateHeroProfile(updatedProfile);
      await refreshData();
      
      // Giant victory confetti sequence
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#fec31e", "#3aa6eb", "#74c33c", "#ff7043", "#f472b6"]
          });
        }, i * 350);
      }

      setShowVictoryModal(true);
    } catch (e) {
      console.error("Failed to unlock gate:", e);
    }
  };

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
          background: "#f7f5ee",
          color: "var(--color-text-dark)",
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
          background: "#f7f5ee"
        }}
      >
        <div style={{ fontSize: "1.3rem", fontFamily: "var(--font-display)", color: "var(--color-primary)", animation: "pulseGlow 1.5s infinite", fontWeight: "bold" }}>
          📜 Decrypting Chronicles...
        </div>
      </div>
    );
  }

  const nodeNames = [
    "Home Base",
    "Python Building",
    "German Town",
    "SQL Ruins",
    "Kingdom's Gate"
  ];
  const currentNodeName = nodeNames[profile.current_node_id - 1] || "Unknown Realm";

  return (
    <div className="app-container">
      
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-header">
            <h1 className="sidebar-title">Shutoku</h1>
            <div className="sidebar-subtitle">Kingdom Pathfinder</div>
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
              <ShoppingCart size={16} /> Merchant & Forge
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
          <div style={{ fontSize: "0.7rem", marginTop: "0.25rem" }}>Shutoku Tracker v0.3.0</div>
        </div>
      </aside>

      {/* RIGHT MAIN VIEW AREA */}
      <main className="content-area">
        
        {/* Header Bar */}
        <header className="header-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-muted)" }}>Location:</span>
              <span style={{ fontSize: "0.95rem", fontFamily: "var(--font-display)", color: "var(--color-text-dark)", fontWeight: "bold" }}>
                📍 {currentNodeName}
              </span>
            </div>

            {/* Demo Mode Speed Up Toggle */}
            <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "var(--color-text-muted)", cursor: "pointer", background: "#fcfbfa", padding: "0.25rem 0.6rem", borderRadius: "8px", border: "1px solid #ecd6bc", fontWeight: "bold" }}>
              <input 
                type="checkbox" 
                checked={demoMode} 
                onChange={(e) => {
                  setDemoMode(e.target.checked);
                }} 
                style={{ cursor: "pointer" }}
              />
              ⏱️ Demo Mode (60x Speed)
            </label>
          </div>

          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            {profile.princess_rescued === 1 && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.85rem", background: "#fff9db", border: "2px solid #fab005", color: "#d9480f", padding: "0.25rem 0.75rem", borderRadius: "20px", fontWeight: "bold", boxShadow: "0 2px 4px rgba(250,176,5,0.15)" }}>
                👑 Savior of the Princess
              </span>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Award size={16} style={{ color: "var(--color-ember)" }} />
              <span style={{ fontSize: "0.9rem", color: "var(--color-text-dark)", fontWeight: "bold" }}>Lvl {profile.level}</span>
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
              <div className="flex-col-gap">
                <Pomodoro 
                  profile={profile}
                  onSessionComplete={handleSessionComplete} 
                  isResting={isResting}
                  onToggleRest={handleToggleRest}
                  onTravelToNode={handleTravelToNode}
                />

                {/* Daily Study Quest Goals */}
                <div className="rpg-panel">
                  <div className="panel-header">
                    <h3 className="panel-title" style={{ color: "var(--color-primary-dark)" }}>
                      ⚔️ Daily Quest Goals
                    </h3>
                    <button 
                      className="rpg-btn rpg-btn-secondary"
                      style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem" }}
                      onClick={handleEndDay}
                    >
                      🌇 End Day & Commute Home
                    </button>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: "bold" }}>
                      Achieve your daily study targets to earn Subject Shards. Combine all 3 shards in the Forge to craft a Key Fragment!
                    </p>
                    
                    {/* German Goal */}
                    <div className="stat-bar-container">
                      <div className="stat-bar-header">
                        <span className="stat-bar-label">🇩🇪 German Spot (Goal: 5 hrs / 300 mins)</span>
                        <span className="stat-bar-value" style={{ fontWeight: "bold" }}>
                          {dailyGerman} / 300m {dailyGerman >= 300 ? "🌟 Shard Unlocked!" : ""}
                        </span>
                      </div>
                      <div className="stat-bar-track">
                        <div className="stat-bar-fill" style={{ width: `${Math.min(100, (dailyGerman / 300) * 100)}%`, background: "linear-gradient(90deg, #dcfce7, var(--color-primary))" }} />
                      </div>
                    </div>

                    {/* Python Goal */}
                    <div className="stat-bar-container">
                      <div className="stat-bar-header">
                        <span className="stat-bar-label">🐍 Python Spot (Goal: 2 hrs / 120 mins)</span>
                        <span className="stat-bar-value" style={{ fontWeight: "bold" }}>
                          {dailyPython} / 120m {dailyPython >= 120 ? "🌟 Shard Unlocked!" : ""}
                        </span>
                      </div>
                      <div className="stat-bar-track">
                        <div className="stat-bar-fill" style={{ width: `${Math.min(100, (dailyPython / 120) * 100)}%`, background: "linear-gradient(90deg, #e0f2fe, var(--color-secondary))" }} />
                      </div>
                    </div>

                    {/* SQL Goal */}
                    <div className="stat-bar-container">
                      <div className="stat-bar-header">
                        <span className="stat-bar-label">💾 SQL Spot (Goal: 2 hrs / 120 mins)</span>
                        <span className="stat-bar-value" style={{ fontWeight: "bold" }}>
                          {dailySQL} / 120m {dailySQL >= 120 ? "🌟 Shard Unlocked!" : ""}
                        </span>
                      </div>
                      <div className="stat-bar-track">
                        <div className="stat-bar-fill" style={{ width: `${Math.min(100, (dailySQL / 120) * 100)}%`, background: "linear-gradient(90deg, #faf5ff, #a78bfa)" }} />
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              <StatsPanel profile={profile} />
            </div>
          )}

          {activeTab === "map" && (
            <RpgMap profile={profile} onUnlockGate={handleUnlockGate} />
          )}

          {activeTab === "shop" && (
            <Shop profile={profile} onPurchaseItem={handlePurchaseItem} onCraftItem={handleCraftItem} />
          )}

          {activeTab === "analytics" && (
            <Analytics logs={logs} />
          )}
        </div>
      </main>

      {/* Oversleep / Sloth Warning Overlay */}
      {showOversleepWarning && (
        <div className="rpg-modal-overlay">
          <div className="rpg-panel rpg-modal" style={{ border: "3px solid var(--color-ember)" }}>
            <div className="panel-header">
              <h3 className="panel-title" style={{ color: "var(--color-ember)" }}>
                🦥 Sloth Penalty Incurred!
              </h3>
            </div>
            <p style={{ fontSize: "0.9rem", lineHeight: "1.4" }}>
              You overslept past full recovery at Home Base! Your character has developed "Slothfulness". 
              Your next study session will suffer a <strong>-25% productivity penalty</strong>.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button className="rpg-btn rpg-btn-primary" onClick={() => setShowOversleepWarning(false)}>
                Acknowledge Lesson
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Day Commute Sunset Summary Modal */}
      {showEndDayModal && endDaySummary && (
        <div className="rpg-modal-overlay">
          <div className="rpg-panel rpg-modal">
            <div className="panel-header">
              <h3 className="panel-title" style={{ color: "var(--color-gold-dark)" }}>
                🌇 Daily sunset on Shutoku
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ fontSize: "0.9rem" }}>
                Your traveler commutes back home to rest. Here is the chronicle of today's study achievements:
              </p>

              <div style={{ background: "#fcfbfa", padding: "0.75rem", borderRadius: "10px", border: "1px solid #ecd6bc", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>🇩🇪 German Progress:</span>
                  <span style={{ fontWeight: "bold" }}>
                    {endDaySummary.germanMins} mins {endDaySummary.germanShardEarned ? "🌟 (German Shard Earned!)" : ""}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>🐍 Python Progress:</span>
                  <span style={{ fontWeight: "bold" }}>
                    {endDaySummary.pythonMins} mins {endDaySummary.pythonShardEarned ? "🌟 (Python Shard Earned!)" : ""}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>💾 SQL Progress:</span>
                  <span style={{ fontWeight: "bold" }}>
                    {endDaySummary.sqlMins} mins {endDaySummary.sqlShardEarned ? "🌟 (SQL Shard Earned!)" : ""}
                  </span>
                </div>
              </div>

              {endDaySummary.slothPenalized ? (
                <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.6rem 0.85rem", borderRadius: "8px", fontSize: "0.8rem", lineHeight: "1.4" }}>
                  <strong>🦥 Sloth Alert:</strong> You did not study at least 30 minutes in total today! You wake up feeling sluggish, incurring the Sloth penalty (-25% productivity on your next study quest).
                </div>
              ) : (
                <div style={{ background: "#dcfce7", border: "1px solid #86efac", color: "#15803d", padding: "0.6rem 0.85rem", borderRadius: "8px", fontSize: "0.8rem", lineHeight: "1.4" }}>
                  <strong>🔋 Refreshed Alert:</strong> Fantastic work today! You go to sleep and wake up refreshed, ready to tackle tomorrow's focus quests.
                </div>
              )}

              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontStyle: "italic", textAlign: "center" }}>
                ⚡ Energy restored to 100%
              </p>

              <button 
                className="rpg-btn rpg-btn-primary" 
                style={{ width: "100%", padding: "0.6rem", fontWeight: "bold" }}
                onClick={() => {
                  setShowEndDayModal(false);
                  setEndDaySummary(null);
                }}
              >
                🌞 Begin New Day
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Castle Modal */}
      {showVictoryModal && (
        <div className="rpg-modal-overlay">
          <div className="rpg-panel rpg-modal" style={{ border: "4px solid var(--color-gold)", maxWidth: "520px", background: "linear-gradient(to bottom, #fffdf2 0%, #fff 100%)" }}>
            <div style={{ textAlign: "center", padding: "1rem 0" }}>
              <span style={{ fontSize: "3.5rem", display: "block", marginBottom: "0.5rem", animation: "bounceDragon 2s infinite" }}>👑</span>
              <h2 style={{ color: "#b45309", fontFamily: "var(--font-display)", fontSize: "1.8rem", marginBottom: "1rem" }}>
                Gate Unlocked! Princess Rescued!
              </h2>
              <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "var(--color-text-dark)", padding: "0 0.5rem", fontWeight: "bold" }}>
                The magic Castle Gate swings wide open. Using the three forged Key Fragments and the power of knowledge, 
                you have shattered the seal and rescued the Princess!
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginTop: "1rem", fontWeight: "bold" }}>
                You have been crowned the Ultimate Scholar of Shutoku.
              </p>
              
              <button 
                className="rpg-btn rpg-btn-primary" 
                style={{ margin: "1.5rem auto 0 auto", width: "80%", fontWeight: "bold" }}
                onClick={() => setShowVictoryModal(false)}
              >
                📜 Continue Your Chronicle
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
