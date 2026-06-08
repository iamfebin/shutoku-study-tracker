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
  return (
    <div 
      style={{
        background: "rgba(18, 16, 14, 0.6)",
        border: equipped ? "1px solid var(--color-gold)" : "1px solid rgba(212, 175, 55, 0.1)",
        padding: "1rem",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "0.75rem",
        boxShadow: equipped ? "inset 0 0 10px rgba(212, 175, 55, 0.08)" : "none",
        transition: "all 0.2s ease"
      }}
    >
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "start" }}>
        <span style={{ fontSize: "2rem", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
          {item.icon}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <h5 style={{ fontSize: "0.95rem", color: "var(--color-text-parchment)", fontFamily: "var(--font-sans)", fontWeight: "bold" }}>
              {item.name}
            </h5>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-gold)", fontWeight: "bold", background: "rgba(212, 175, 55, 0.1)", padding: "0.1rem 0.4rem", borderRadius: "4px", border: "1px solid rgba(212,175,55,0.2)" }}>
              {item.bonusText}
            </span>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
            {item.description}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--color-text-gold)", fontSize: "0.9rem", fontWeight: "bold" }}>
          <Coins size={14} className="gold-icon" /> {item.cost}g
        </div>

        {equipped ? (
          <span style={{ fontSize: "0.8rem", color: "var(--color-gold)", display: "flex", alignItems: "center", gap: "0.2rem", padding: "0.4rem 0.8rem", background: "rgba(212, 175, 55, 0.08)", borderRadius: "6px", border: "1px solid rgba(212,175,55,0.2)", fontWeight: "bold" }}>
            <Check size={12} /> Equipped
          </span>
        ) : (
          <button 
            className="rpg-btn rpg-btn-primary" 
            style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }} 
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
