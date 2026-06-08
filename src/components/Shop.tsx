import React from "react";
import { Coins, Shield, Sword, Scroll, ShoppingCart, Check } from "lucide-react";
import { HeroProfile } from "../services/db";

interface ShopProps {
  profile: HeroProfile;
  onPurchaseItem: (item: ShopItem) => void;
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

export const Shop: React.FC<ShopProps> = ({ profile, onPurchaseItem }) => {
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

  return (
    <div className="rpg-panel">
      <div className="panel-header">
        <h3 className="panel-title">
          <ShoppingCart size={18} className="gold-icon" /> Merchant Shop
        </h3>
        <div className="gold-badge">
          <Coins size={16} className="gold-icon" /> {profile.gold}g
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
          Upgrade your gear to train stats faster. Buying an item automatically replaces any currently equipped gear in that slot.
        </p>

        {/* Weapons Section */}
        <div>
          <h4 style={{ fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-gold-dim)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Sword size={14} /> Weaponry
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

        {/* Armor Section */}
        <div>
          <h4 style={{ fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-gold-dim)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Shield size={14} /> Defensive Protection
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

        {/* Accessories Section */}
        <div>
          <h4 style={{ fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--color-gold-dim)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Scroll size={14} /> Relics & Accessories
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
  );
};

interface ShopCardProps {
  item: ShopItem;
  equipped: boolean;
  canAfford: boolean;
  onBuy: () => void;
}

const ShopCard: React.FC<ShopCardProps> = ({ item, equipped, canAfford, onBuy }) => {
  // Theme styling based on category
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
        boxShadow: equipped ? "inset 0 0 10px rgba(141, 110, 99, 0.05)" : "none",
        transition: "all 0.2s ease",
        transform: equipped ? "translateY(-1px)" : "none"
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
