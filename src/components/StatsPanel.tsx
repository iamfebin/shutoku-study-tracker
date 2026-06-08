import React from "react";
import { Shield, Sword, Scroll, User, Award, Coins } from "lucide-react";
import { HeroProfile } from "../services/db";
import { getXpNeeded } from "../utils/rpg";
import baseIdle from "../assets/cozy/base_idle_strip9.png";

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

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Character Card Head */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div className="hero-box">
            <div 
              className="pixel-hero-idle" 
              style={{ 
                backgroundImage: `url(${baseIdle})`,
                transform: "scale(3.5)",
                marginTop: "0.25rem"
              }} 
            />
          </div>
          <div>
            <h4 style={{ fontSize: "1.2rem", fontFamily: "var(--font-display)", color: "var(--color-text-dark)" }}>Shutoku Scholar</h4>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-dark)", display: "flex", alignItems: "center", gap: "0.25rem", fontWeight: "bold" }}>
              <Award size={14} style={{ color: "var(--color-ember)" }} /> Level {profile.level} Pathfinder
            </p>
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
          <h5 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-muted)" }}>Attributes</h5>
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

        {/* Equipment slots */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <h5 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-text-muted)" }}>Equipped Gear</h5>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between", 
                padding: "0.6rem 0.85rem", 
                background: "#fffbf5", 
                borderRadius: "10px",
                border: "2px solid #ecd6bc",
                boxShadow: "0 2px 0px rgba(141, 110, 99, 0.04)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
                <Sword size={15} style={{ color: "var(--color-secondary)" }} />
                <span style={{ color: "var(--color-text-muted)" }}>Weapon:</span>
                <span style={{ color: profile.equipped_weapon ? "var(--color-secondary)" : "var(--color-text-muted)", fontWeight: profile.equipped_weapon ? "bold" : "bold", fontStyle: profile.equipped_weapon ? "normal" : "italic" }}>
                  {profile.equipped_weapon || "Empty Slot"}
                </span>
              </div>
            </div>

            <div 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between", 
                padding: "0.6rem 0.85rem", 
                background: "#fffbf5", 
                borderRadius: "10px",
                border: "2px solid #ecd6bc",
                boxShadow: "0 2px 0px rgba(141, 110, 99, 0.04)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
                <Shield size={15} style={{ color: "var(--color-primary)" }} />
                <span style={{ color: "var(--color-text-muted)" }}>Armor:</span>
                <span style={{ color: profile.equipped_armor ? "var(--color-text-green)" : "var(--color-text-muted)", fontWeight: profile.equipped_armor ? "bold" : "bold", fontStyle: profile.equipped_armor ? "normal" : "italic" }}>
                  {profile.equipped_armor || "Empty Slot"}
                </span>
              </div>
            </div>

            <div 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between", 
                padding: "0.6rem 0.85rem", 
                background: "#fffbf5", 
                borderRadius: "10px",
                border: "2px solid #ecd6bc",
                boxShadow: "0 2px 0px rgba(141, 110, 99, 0.04)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
                <Scroll size={15} style={{ color: "#a78bfa" }} />
                <span style={{ color: "var(--color-text-muted)" }}>Accessory:</span>
                <span style={{ color: profile.equipped_scroll ? "#8b5cf6" : "var(--color-text-muted)", fontWeight: profile.equipped_scroll ? "bold" : "bold", fontStyle: profile.equipped_scroll ? "normal" : "italic" }}>
                  {profile.equipped_scroll || "Empty Slot"}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
