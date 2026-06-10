import React from "react";
import { Shield, Sword, Scroll, User, Award, Coins } from "lucide-react";
import { HeroProfile } from "../services/db";
import { getXpNeeded } from "../utils/rpg";
import baseIdle from "../assets/cozy/base_idle_strip9.png";
import bowlhairIdle from "../assets/cozy/bowlhair_idle_strip9.png";

interface StatsPanelProps {
  profile: HeroProfile;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ profile }) => {
  const xpNeeded = getXpNeeded(profile.level);
  const xpPercent = Math.min(100, Math.floor((profile.current_xp / xpNeeded) * 100));

  // Determine total bonus stats from equipped items
  const getGearBonuses = () => {
    let strBonus = 0;
    let intBonus = 0;
    let dexBonus = 0;
    let wisBonus = 0;
    let chaBonus = 0;

    const addBonuses = (itemName: string | null) => {
      if (!itemName) return;
      const name = itemName.toLowerCase();
      if (name.includes("sword")) strBonus += 4;
      if (name.includes("excalibur")) { strBonus += 15; wisBonus += 5; }
      if (name.includes("staff")) intBonus += 2;
      if (name.includes("bow")) dexBonus += 8;
      if (name.includes("leather")) dexBonus += 1;
      if (name.includes("chainmail")) strBonus += 4;
      if (name.includes("robes")) { intBonus += 6; wisBonus += 2; }
      if (name.includes("paladin")) { strBonus += 10; wisBonus += 10; }
      if (name.includes("wisdom")) wisBonus += 1;
      if (name.includes("charisma")) chaBonus += 6;
    };

    addBonuses(profile.equipped_weapon);
    addBonuses(profile.equipped_armor);
    addBonuses(profile.equipped_scroll);

    return { strBonus, intBonus, dexBonus, wisBonus, chaBonus };
  };

  const bonuses = getGearBonuses();

  const attributes = [
    { name: "Strength", abbreviation: "STR", value: profile.strength, bonus: bonuses.strBonus, color: "#f87171", desc: "Trained by Fitness & Physical Tasks" },
    { name: "Intelligence", abbreviation: "INT", value: profile.intelligence, bonus: bonuses.intBonus, color: "#60a5fa", desc: "Trained by Coding & Science" },
    { name: "Dexterity", abbreviation: "DEX", value: profile.dexterity, bonus: bonuses.dexBonus, color: "#34d399", desc: "Trained by Skill Practice & Art" },
    { name: "Wisdom", abbreviation: "WIS", value: profile.wisdom, bonus: bonuses.wisBonus, color: "#a78bfa", desc: "Trained by Reading & Writing" },
    { name: "Charisma", abbreviation: "CHA", value: profile.charisma, bonus: bonuses.chaBonus, color: "#f472b6", desc: "Trained by Speaking & Languages" },
  ];

  return (
    <div className="rpg-panel">
      <div className="panel-header">
        <h3 className="panel-title">
          <User size={18} className="gold-icon" /> Hero Sheet
        </h3>
        <div className="gold-badge">
          <Coins size={16} className="gold-icon" /> {profile.gold}g
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        
        {/* Character Card Head */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div className="hero-box">
            <div 
              style={{ 
                position: "relative",
                width: "16px",
                height: "18px",
                transform: "scale(3.5)",
                transformOrigin: "center",
                marginTop: "0.25rem"
              }}
            >
              <div 
                className="pixel-hero-idle" 
                style={{ 
                  backgroundImage: `url(${baseIdle})`,
                  position: "absolute",
                  top: 0,
                  left: 0
                }} 
              />
              <div 
                className="pixel-hero-idle" 
                style={{ 
                  backgroundImage: `url(${bowlhairIdle})`,
                  position: "absolute",
                  top: 0,
                  left: 0
                }} 
              />
            </div>
          </div>
          <div>
            <h4 style={{ fontSize: "1.2rem", fontFamily: "var(--font-display)", color: "var(--color-text-dark)" }}>
              {profile.princess_rescued ? "👑 Royal Hero" : "Shutoku Traveler"}
            </h4>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-dark)", display: "flex", alignItems: "center", gap: "0.25rem", fontWeight: "bold" }}>
              <Award size={14} style={{ color: "var(--color-ember)" }} /> Level {profile.level} Pathfinder
            </p>
          </div>
        </div>

        {/* Status Effects / Conditions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <h5 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>Active Statuses</h5>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {profile.princess_rescued === 1 && (
              <span style={{ fontSize: "0.75rem", background: "#fef3c7", border: "1px solid #fcd34d", color: "#b45309", padding: "0.2rem 0.5rem", borderRadius: "8px", fontWeight: "bold" }}>
                🏆 Champion of the Realm (Princess Rescued!)
              </span>
            )}
            {profile.sloth_active === 1 && (
              <span style={{ fontSize: "0.75rem", background: "#fef3c7", border: "1px solid #fbbf24", color: "#b45309", padding: "0.2rem 0.5rem", borderRadius: "8px", fontWeight: "bold" }} title="Sloth debuff: -25% XP and Gold on your next study session.">
                🦥 Slothful (-25% stats)
              </span>
            )}
            {profile.energy < 20 && (
              <span style={{ fontSize: "0.75rem", background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.2rem 0.5rem", borderRadius: "8px", fontWeight: "bold" }} title="Tired condition: -50% XP and Gold gains. Go rest at Home Base!">
                🥱 Exhausted (-50% rewards)
              </span>
            )}
            {profile.energy >= 20 && profile.sloth_active === 0 && profile.princess_rescued === 0 && (
              <span style={{ fontSize: "0.75rem", background: "#dcfce7", border: "1px solid #86efac", color: "#15803d", padding: "0.2rem 0.5rem", borderRadius: "8px", fontWeight: "bold" }}>
                🌿 Normal (Healthy)
              </span>
            )}
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="stat-bar-container">
          <div className="stat-bar-header">
            <span className="stat-bar-label">Experience Points</span>
            <span className="stat-bar-value">{profile.current_xp} / {xpNeeded} XP</span>
          </div>
          <div className="stat-bar-track">
            <div className="stat-bar-fill xp" style={{ width: `${xpPercent}%` }}></div>
          </div>
        </div>

        {/* Core Attributes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <h5 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>Attributes</h5>
          <div className="attribute-grid">
            {attributes.map((attr) => (
              <div className="attribute-card" key={attr.abbreviation} title={attr.desc}>
                <span className="attribute-name" style={{ color: attr.color }}>
                  {attr.abbreviation}
                </span>
                <span className="attribute-val">
                  {attr.value}
                  {attr.bonus > 0 && (
                    <span style={{ fontSize: "0.8rem", color: "var(--color-success)", marginLeft: "0.2rem" }}>
                      +{attr.bonus}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Equipment & Inventory split */}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "1rem" }}>
          
          {/* Equipped Gear */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <h5 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>Equipped Gear</h5>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.65rem", background: "#fffbf5", borderRadius: "8px", border: "1px solid #ecd6bc", fontSize: "0.8rem" }}>
                <Sword size={13} style={{ color: "var(--color-secondary)", flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: profile.equipped_weapon ? "var(--color-text-dark)" : "var(--color-text-muted)", fontWeight: "bold" }}>
                  {profile.equipped_weapon || "No Weapon"}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.65rem", background: "#fffbf5", borderRadius: "8px", border: "1px solid #ecd6bc", fontSize: "0.8rem" }}>
                <Shield size={13} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: profile.equipped_armor ? "var(--color-text-dark)" : "var(--color-text-muted)", fontWeight: "bold" }}>
                  {profile.equipped_armor || "No Armor"}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.5rem 0.65rem", background: "#fffbf5", borderRadius: "8px", border: "1px solid #ecd6bc", fontSize: "0.8rem" }}>
                <Scroll size={13} style={{ color: "#a78bfa", flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: profile.equipped_scroll ? "var(--color-text-dark)" : "var(--color-text-muted)", fontWeight: "bold" }}>
                  {profile.equipped_scroll || "No Relic"}
                </span>
              </div>
            </div>
          </div>

          {/* Resources Bag */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <h5 style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)" }}>Inventory</h5>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.8rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.45rem 0.65rem", background: "#fffdf9", borderRadius: "8px", border: "1px solid #ecd6bc", fontWeight: "bold" }}>
                <span>🌟 Focus Orbs</span>
                <span>{profile.focus_orbs}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.45rem 0.65rem", background: "#fffdf9", borderRadius: "8px", border: "1px solid #ecd6bc", fontWeight: "bold" }}>
                <span>🔑 Key Frags</span>
                <span style={{ color: "var(--color-text-gold)" }}>{profile.key_fragments} / 3</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.45rem 0.65rem", background: "#fffdf9", borderRadius: "8px", border: "1px solid #ecd6bc", fontWeight: "bold" }} title="Subject Shards (German, Python, SQL)">
                <span>💎 Shards</span>
                <span>
                  {profile.german_shards} | {profile.python_shards} | {profile.sql_shards}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
