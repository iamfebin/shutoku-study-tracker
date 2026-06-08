import React, { useState } from "react";
import { Coins, Shield, Sword, Scroll, ShoppingCart, Hammer, Sparkles, Check } from "lucide-react";
import { HeroProfile } from "../services/db";

interface ShopProps {
  profile: HeroProfile;
  onPurchaseItem: (item: ShopItem) => void;
  onCraftItem: (craftType: "key_fragment" | "python_codex" | "german_scroll" | "sql_runestone") => void;
}

export interface ShopItem {
  id: string;
  name: string;
  category: "weapon" | "armor" | "scroll";
  cost: number;
  bonusText: string;
  icon: string;
  description: string;
}

export const Shop: React.FC<ShopProps> = ({ profile, onPurchaseItem, onCraftItem }) => {
  const [activeTab, setActiveTab] = useState<"shop" | "forge">("shop");

  const shopItems: ShopItem[] = [
    // Weapons
    {
      id: "wood_staff",
      name: "Wooden Staff",
      category: "weapon",
      cost: 50,
      bonusText: "+2 INT",
      icon: "🪄",
      description: "A standard maple staff carved with focus runes. Enhances study concentration."
    },
    {
      id: "iron_sword",
      name: "Iron Sword",
      category: "weapon",
      cost: 100,
      bonusText: "+4 STR",
      icon: "⚔️",
      description: "A heavy practice blade forged in the local barracks. Trains physical power."
    },
    {
      id: "elven_bow",
      name: "Elven Bow",
      category: "weapon",
      cost: 200,
      bonusText: "+8 DEX",
      icon: "🏹",
      description: "A flexible bow carved from yew. Refines motor skills and precision."
    },
    {
      id: "excalibur",
      name: "Excalibur",
      category: "weapon",
      cost: 500,
      bonusText: "+15 STR, +5 WIS",
      icon: "🗡️",
      description: "The sword of kings, glowing with starlight. Grants extreme fortitude."
    },
    // Armor
    {
      id: "leather_jerkin",
      name: "Leather Jerkin",
      category: "armor",
      cost: 40,
      bonusText: "+1 DEX",
      icon: "🧥",
      description: "Lightweight leather armor. Flexible, durable, and comfortable."
    },
    {
      id: "chainmail",
      name: "Chainmail Shield",
      category: "armor",
      cost: 120,
      bonusText: "+4 STR",
      icon: "🛡️",
      description: "Interlinking steel rings offering substantial protection."
    },
    {
      id: "mage_robes",
      name: "Mage Robes",
      category: "armor",
      cost: 180,
      bonusText: "+6 INT, +2 WIS",
      icon: "🥋",
      description: "Silk robes dyed in midnight blue. Imbued with study enchantments."
    },
    {
      id: "paladin_plate",
      name: "Paladin Armor",
      category: "armor",
      cost: 450,
      bonusText: "+10 WIS, +10 STR",
      icon: "💂",
      description: "Gleaming golden plate armor worn by the highest templars."
    },
    // Accessories / Scrolls
    {
      id: "wisdom_scroll",
      name: "Scroll of Wisdom",
      category: "scroll",
      cost: 30,
      bonusText: "+1 WIS",
      icon: "📜",
      description: "A crumbling parchment detailing focus exercises."
    },
    {
      id: "charisma_ring",
      name: "Ring of Charisma",
      category: "scroll",
      cost: 150,
      bonusText: "+6 CHA",
      icon: "💍",
      description: "A polished silver ring that sparkles with confidence."
    }
  ];

  const getSlotEquippedItem = (category: string) => {
    if (category === "weapon") return profile.equipped_weapon;
    if (category === "armor") return profile.equipped_armor;
    if (category === "scroll") return profile.equipped_scroll;
    return null;
  };

  const playForgeSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.15);
    } catch(e){}
  };

  const handleCraft = (type: "key_fragment" | "python_codex" | "german_scroll" | "sql_runestone") => {
    playForgeSound();
    onCraftItem(type);
  };

  // Crafting Recipes definition
  const canCraftKey = profile.german_shards >= 1 && profile.python_shards >= 1 && profile.sql_shards >= 1;
  const canCraftPython = profile.focus_orbs >= 10 && profile.materials_python >= 5;
  const canCraftGerman = profile.focus_orbs >= 10 && profile.materials_german >= 5;
  const canCraftSQL = profile.focus_orbs >= 10 && profile.materials_sql >= 5;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* Visual Inventory Bar */}
      <div 
        className="rpg-panel" 
        style={{ 
          padding: "1rem 1.25rem", 
          background: "linear-gradient(to right, #fffdf5, #faf9f6)",
          border: "3px solid #8d6e63",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem"
        }}
      >
        <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          🎒 Adventure Satchel & Resources
        </h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#fef3c7", border: "1px solid #fcd34d", padding: "0.3rem 0.65rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "bold" }} title="Focus Orbs: earned by study cycles">
            🌟 <span style={{ color: "#d97706" }}>Focus Orbs:</span> {profile.focus_orbs}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#e0f2fe", border: "1px solid #7dd3fc", padding: "0.3rem 0.65rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "bold" }} title="Python Pages: study Python at the Python Building">
            📄 <span style={{ color: "#0284c7" }}>Python Pages:</span> {profile.materials_python}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#ecfdf5", border: "1px solid #6ee7b7", padding: "0.3rem 0.65rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "bold" }} title="German Cards: study German at German Town">
            🎴 <span style={{ color: "#059669" }}>German Cards:</span> {profile.materials_german}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#f3e8ff", border: "1px solid #d8b4fe", padding: "0.3rem 0.65rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "bold" }} title="SQL Runestones: study SQL at SQL Ruins">
            🪨 <span style={{ color: "#7c3aed" }}>SQL Runestones:</span> {profile.materials_sql}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#fff1f2", border: "1px solid #fecdd3", padding: "0.3rem 0.65rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "bold" }} title="Subject Shards: earned by meeting daily goals">
            💎 <span style={{ color: "#e11d48" }}>Shards:</span> 
            <span style={{ fontSize: "0.75rem", marginLeft: "0.2rem" }}>
              🇩🇪 {profile.german_shards} | 🐍 {profile.python_shards} | 💾 {profile.sql_shards}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "#fffdf5", border: "2px solid #fab005", padding: "0.3rem 0.65rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "bold", boxShadow: "0 2px 4px rgba(250,176,5,0.15)" }} title="Key Fragments: combine shards to forge these. Unlock Kingdom Gate with 3!">
            🔑 <span style={{ color: "#d9480f" }}>Key Fragments:</span> {profile.key_fragments} / 3
          </div>

        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button 
          className={`rpg-btn ${activeTab === "shop" ? "rpg-btn-primary" : "rpg-btn-secondary"}`} 
          style={{ flex: 1, padding: "0.75rem" }}
          onClick={() => setActiveTab("shop")}
        >
          <ShoppingCart size={16} /> Merchant Shop
        </button>
        <button 
          className={`rpg-btn ${activeTab === "forge" ? "rpg-btn-primary" : "rpg-btn-secondary"}`} 
          style={{ flex: 1, padding: "0.75rem" }}
          onClick={() => setActiveTab("forge")}
        >
          <Hammer size={16} /> Crafting Forge
        </button>
      </div>

      {/* TAB CONTENTS */}
      {activeTab === "shop" ? (
        <div className="rpg-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <ShoppingCart size={18} className="gold-icon" /> Royal Armory
            </h3>
            <div className="gold-badge">
              <Coins size={16} className="gold-icon" /> {profile.gold}g
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: "bold" }}>
              Spend your gold to equip weapons and armor. Each piece grants permanent attribute boosts while equipped.
            </p>

            {/* Weapons */}
            <div>
              <h4 style={{ fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Sword size={14} style={{ color: "var(--color-secondary)" }} /> Weaponry & Staves
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {shopItems.filter(i => i.category === "weapon").map(item => {
                  const equipped = getSlotEquippedItem(item.category) === item.name;
                  const canAfford = profile.gold >= item.cost;
                  return (
                    <ShopCard 
                      key={item.id}
                      item={item} 
                      equipped={equipped} 
                      canAfford={canAfford} 
                      onBuy={() => onPurchaseItem(item)} 
                    />
                  );
                })}
              </div>
            </div>

            {/* Armor */}
            <div>
              <h4 style={{ fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Shield size={14} style={{ color: "var(--color-primary)" }} /> Protective Gear
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {shopItems.filter(i => i.category === "armor").map(item => {
                  const equipped = getSlotEquippedItem(item.category) === item.name;
                  const canAfford = profile.gold >= item.cost;
                  return (
                    <ShopCard 
                      key={item.id}
                      item={item} 
                      equipped={equipped} 
                      canAfford={canAfford} 
                      onBuy={() => onPurchaseItem(item)} 
                    />
                  );
                })}
              </div>
            </div>

            {/* Relics */}
            <div>
              <h4 style={{ fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: "0.6rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Scroll size={14} style={{ color: "#a78bfa" }} /> Spell Scrolls & Accessories
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                {shopItems.filter(i => i.category === "scroll").map(item => {
                  const equipped = getSlotEquippedItem(item.category) === item.name;
                  const canAfford = profile.gold >= item.cost;
                  return (
                    <ShopCard 
                      key={item.id}
                      item={item} 
                      equipped={equipped} 
                      canAfford={canAfford} 
                      onBuy={() => onPurchaseItem(item)} 
                    />
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      ) : (
        <div className="rpg-panel">
          <div className="panel-header">
            <h3 className="panel-title" style={{ color: "var(--color-secondary)" }}>
              <Hammer size={18} /> Crafting Forge
            </h3>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontFamily: "var(--font-display)" }}>
              🛠️ Construct Magic Artifacts
            </span>
          </div>

          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: "bold", marginBottom: "1.25rem" }}>
            Transmute the materials and shards you gather during daily study sessions. Artifacts provide permanent attribute boosts.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem" }}>
            
            {/* RECIPE: KEY FRAGMENT */}
            <div style={{ border: "2px solid #8d6e63", borderRadius: "14px", padding: "1rem", display: "flex", flexDirection: "column", justifySelf: "stretch", justifyContent: "space-between", background: "#fffdf9" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h5 style={{ fontSize: "1rem", color: "var(--color-text-dark)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    🔑 Key Fragment
                  </h5>
                  <span style={{ fontSize: "0.75rem", background: "var(--color-primary-light)", color: "var(--color-primary-dark)", padding: "0.1rem 0.4rem", borderRadius: "4px", fontWeight: "bold" }}>Legendary Item</span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0.4rem 0", fontWeight: "bold" }}>
                  Forges 1 Key Fragment by combining all three daily subject shards. Collect 3 to unlock the Castle Gate.
                </p>
                
                {/* Cost Badges */}
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", margin: "0.6rem 0" }}>
                  <span style={{ fontSize: "0.75rem", background: profile.german_shards >= 1 ? "#ecfdf5" : "#fee2e2", border: profile.german_shards >= 1 ? "1px solid #a7f3d0" : "1px solid #fecaca", color: profile.german_shards >= 1 ? "#047857" : "#b91c1c", padding: "0.15rem 0.35rem", borderRadius: "6px", fontWeight: "bold" }}>
                    🇩🇪 Shard: {profile.german_shards} / 1
                  </span>
                  <span style={{ fontSize: "0.75rem", background: profile.python_shards >= 1 ? "#ecfdf5" : "#fee2e2", border: profile.python_shards >= 1 ? "1px solid #a7f3d0" : "1px solid #fecaca", color: profile.python_shards >= 1 ? "#047857" : "#b91c1c", padding: "0.15rem 0.35rem", borderRadius: "6px", fontWeight: "bold" }}>
                    🐍 Shard: {profile.python_shards} / 1
                  </span>
                  <span style={{ fontSize: "0.75rem", background: profile.sql_shards >= 1 ? "#ecfdf5" : "#fee2e2", border: profile.sql_shards >= 1 ? "1px solid #a7f3d0" : "1px solid #fecaca", color: profile.sql_shards >= 1 ? "#047857" : "#b91c1c", padding: "0.15rem 0.35rem", borderRadius: "6px", fontWeight: "bold" }}>
                    💾 Shard: {profile.sql_shards} / 1
                  </span>
                </div>
              </div>

              <button 
                className="rpg-btn rpg-btn-primary" 
                style={{ width: "100%", padding: "0.45rem", fontSize: "0.85rem", marginTop: "0.5rem" }}
                disabled={!canCraftKey}
                onClick={() => handleCraft("key_fragment")}
              >
                <Hammer size={12} /> Forge Key Fragment
              </button>
            </div>

            {/* RECIPE: PYTHON CODEX */}
            <div style={{ border: "2px solid #8d6e63", borderRadius: "14px", padding: "1rem", display: "flex", flexDirection: "column", justifySelf: "stretch", justifyContent: "space-between", background: "#fffdf9" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h5 style={{ fontSize: "1rem", color: "var(--color-text-dark)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    📘 Python Codex
                  </h5>
                  <span style={{ fontSize: "0.75rem", background: "#e0f2fe", color: "#0369a1", padding: "0.1rem 0.4rem", borderRadius: "4px", fontWeight: "bold" }}>+8 INT (Permanent)</span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0.4rem 0", fontWeight: "bold" }}>
                  A heavy tome documenting syntax logic and compiler details. Grants permanent intelligence.
                </p>
                
                {/* Cost Badges */}
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", margin: "0.6rem 0" }}>
                  <span style={{ fontSize: "0.75rem", background: profile.focus_orbs >= 10 ? "#ecfdf5" : "#fee2e2", border: profile.focus_orbs >= 10 ? "1px solid #a7f3d0" : "1px solid #fecaca", color: profile.focus_orbs >= 10 ? "#047857" : "#b91c1c", padding: "0.15rem 0.35rem", borderRadius: "6px", fontWeight: "bold" }}>
                    🌟 Orbs: {profile.focus_orbs} / 10
                  </span>
                  <span style={{ fontSize: "0.75rem", background: profile.materials_python >= 5 ? "#ecfdf5" : "#fee2e2", border: profile.materials_python >= 5 ? "1px solid #a7f3d0" : "1px solid #fecaca", color: profile.materials_python >= 5 ? "#047857" : "#b91c1c", padding: "0.15rem 0.35rem", borderRadius: "6px", fontWeight: "bold" }}>
                    📄 Pages: {profile.materials_python} / 5
                  </span>
                </div>
              </div>

              <button 
                className="rpg-btn rpg-btn-primary" 
                style={{ width: "100%", padding: "0.45rem", fontSize: "0.85rem", marginTop: "0.5rem" }}
                disabled={!canCraftPython}
                onClick={() => handleCraft("python_codex")}
              >
                <Sparkles size={12} /> Craft Python Codex
              </button>
            </div>

            {/* RECIPE: GERMAN SCROLL */}
            <div style={{ border: "2px solid #8d6e63", borderRadius: "14px", padding: "1rem", display: "flex", flexDirection: "column", justifySelf: "stretch", justifyContent: "space-between", background: "#fffdf9" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h5 style={{ fontSize: "1rem", color: "var(--color-text-dark)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    📜 German Vocab Scroll
                  </h5>
                  <span style={{ fontSize: "0.75rem", background: "#ecfdf5", color: "#047857", padding: "0.1rem 0.4rem", borderRadius: "4px", fontWeight: "bold" }}>+8 CHA (Permanent)</span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0.4rem 0", fontWeight: "bold" }}>
                  A beautifully annotated scroll mapping verbs and conversations. Grants permanent charisma.
                </p>
                
                {/* Cost Badges */}
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", margin: "0.6rem 0" }}>
                  <span style={{ fontSize: "0.75rem", background: profile.focus_orbs >= 10 ? "#ecfdf5" : "#fee2e2", border: profile.focus_orbs >= 10 ? "1px solid #a7f3d0" : "1px solid #fecaca", color: profile.focus_orbs >= 10 ? "#047857" : "#b91c1c", padding: "0.15rem 0.35rem", borderRadius: "6px", fontWeight: "bold" }}>
                    🌟 Orbs: {profile.focus_orbs} / 10
                  </span>
                  <span style={{ fontSize: "0.75rem", background: profile.materials_german >= 5 ? "#ecfdf5" : "#fee2e2", border: profile.materials_german >= 5 ? "1px solid #a7f3d0" : "1px solid #fecaca", color: profile.materials_german >= 5 ? "#047857" : "#b91c1c", padding: "0.15rem 0.35rem", borderRadius: "6px", fontWeight: "bold" }}>
                    🎴 Cards: {profile.materials_german} / 5
                  </span>
                </div>
              </div>

              <button 
                className="rpg-btn rpg-btn-primary" 
                style={{ width: "100%", padding: "0.45rem", fontSize: "0.85rem", marginTop: "0.5rem" }}
                disabled={!canCraftGerman}
                onClick={() => handleCraft("german_scroll")}
              >
                <Sparkles size={12} /> Craft German Scroll
              </button>
            </div>

            {/* RECIPE: SQL RUNESTONE */}
            <div style={{ border: "2px solid #8d6e63", borderRadius: "14px", padding: "1rem", display: "flex", flexDirection: "column", justifySelf: "stretch", justifyContent: "space-between", background: "#fffdf9" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h5 style={{ fontSize: "1rem", color: "var(--color-text-dark)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    🏺 SQL Relic Runestone
                  </h5>
                  <span style={{ fontSize: "0.75rem", background: "#f3e8ff", color: "#6b21a8", padding: "0.1rem 0.4rem", borderRadius: "4px", fontWeight: "bold" }}>+8 WIS (Permanent)</span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: "0.4rem 0", fontWeight: "bold" }}>
                  A glowing relic that whispers relational algebraic truths. Grants permanent wisdom.
                </p>
                
                {/* Cost Badges */}
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", margin: "0.6rem 0" }}>
                  <span style={{ fontSize: "0.75rem", background: profile.focus_orbs >= 10 ? "#ecfdf5" : "#fee2e2", border: profile.focus_orbs >= 10 ? "1px solid #a7f3d0" : "1px solid #fecaca", color: profile.focus_orbs >= 10 ? "#047857" : "#b91c1c", padding: "0.15rem 0.35rem", borderRadius: "6px", fontWeight: "bold" }}>
                    🌟 Orbs: {profile.focus_orbs} / 10
                  </span>
                  <span style={{ fontSize: "0.75rem", background: profile.materials_sql >= 5 ? "#ecfdf5" : "#fee2e2", border: profile.materials_sql >= 5 ? "1px solid #a7f3d0" : "1px solid #fecaca", color: profile.materials_sql >= 5 ? "#047857" : "#b91c1c", padding: "0.15rem 0.35rem", borderRadius: "6px", fontWeight: "bold" }}>
                    🪨 Stones: {profile.materials_sql} / 5
                  </span>
                </div>
              </div>

              <button 
                className="rpg-btn rpg-btn-primary" 
                style={{ width: "100%", padding: "0.45rem", fontSize: "0.85rem", marginTop: "0.5rem" }}
                disabled={!canCraftSQL}
                onClick={() => handleCraft("sql_runestone")}
              >
                <Sparkles size={12} /> Craft SQL Runestone
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

interface ShopCardProps {
  item: ShopItem;
  equipped: boolean;
  canAfford: boolean;
  onBuy: () => void;
}

const ShopCard: React.FC<ShopCardProps> = ({ item, equipped, canAfford, onBuy }) => {
  const theme = {
    weapon: {
      bg: "#f0f9ff",
      border: equipped ? "3px solid var(--color-secondary)" : "3px solid #ecd6bc",
      tagBg: "#e0f2fe",
      tagText: "var(--color-secondary-dark)",
      equippedBg: "rgba(58, 166, 235, 0.1)",
      equippedText: "var(--color-secondary-dark)",
      equippedBorder: "2px solid var(--color-secondary)"
    },
    armor: {
      bg: "#f0fdf4",
      border: equipped ? "3px solid var(--color-primary)" : "3px solid #ecd6bc",
      tagBg: "#dcfce7",
      tagText: "var(--color-primary-dark)",
      equippedBg: "rgba(116, 195, 60, 0.1)",
      equippedText: "var(--color-primary-dark)",
      equippedBorder: "2px solid var(--color-primary)"
    },
    scroll: {
      bg: "#faf5ff",
      border: equipped ? "3px solid #8b5cf6" : "3px solid #ecd6bc",
      tagBg: "#f3e8ff",
      tagText: "#7c3aed",
      equippedBg: "rgba(139, 92, 246, 0.1)",
      equippedText: "#7c3aed",
      equippedBorder: "2px solid #8b5cf6"
    }
  }[item.category];

  return (
    <div 
      style={{
        background: theme.bg,
        border: theme.border,
        padding: "1.25rem 1rem",
        borderRadius: "16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "0.75rem",
        transition: "all 0.2s ease"
      }}
    >
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "start" }}>
        <span style={{ fontSize: "2rem", filter: "drop-shadow(0 2px 4px rgba(141,110,99,0.15))" }}>
          {item.icon}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "0.25rem" }}>
            <h5 style={{ fontSize: "0.95rem", color: "var(--color-text-dark)", fontFamily: "var(--font-display)", fontWeight: "bold" }}>
              {item.name}
            </h5>
            <span 
              style={{ 
                fontSize: "0.75rem", 
                color: theme.tagText, 
                fontWeight: "bold", 
                background: theme.tagBg, 
                padding: "0.15rem 0.45rem", 
                borderRadius: "6px", 
                border: `1px solid ${theme.tagText}30` 
              }}
            >
              {item.bonusText}
            </span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.35rem", fontWeight: "bold" }}>
            {item.description}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#d9480f", fontSize: "0.95rem", fontWeight: "bold" }}>
          <Coins size={15} className="gold-icon" /> {item.cost}g
        </div>

        {equipped ? (
          <span 
            style={{ 
              fontSize: "0.8rem", 
              color: theme.equippedText, 
              display: "flex", 
              alignItems: "center", 
              gap: "0.25rem", 
              padding: "0.4rem 0.8rem", 
              background: theme.equippedBg, 
              borderRadius: "8px", 
              border: theme.equippedBorder, 
              fontWeight: "bold" 
            }}
          >
            <Check size={12} /> Equipped
          </span>
        ) : (
          <button 
            className="rpg-btn rpg-btn-primary" 
            style={{ padding: "0.45rem 0.95rem", fontSize: "0.8rem", boxShadow: "0 3px 0px #c69c6d" }} 
            onClick={onBuy}
            disabled={!canAfford}
          >
            Purchase
          </button>
        )}
      </div>
    </div>
  );
};
