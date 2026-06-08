import React, { useState, useEffect, useRef } from "react";
import { Compass, ShieldAlert, Award } from "lucide-react";
import gsap from "gsap";
import { HeroProfile } from "../services/db";

interface RpgMapProps {
  profile: HeroProfile;
  onSelectNode: (nodeId: number, goldReward: number) => void;
}

interface MapNode {
  id: number;
  name: string;
  lvlRequired: number;
  goldReward: number;
  percent: number; // position on path (0.0 to 1.0)
  icon: string;
  description: string;
}

export const RpgMap: React.FC<RpgMapProps> = ({ profile, onSelectNode }) => {
  const nodes: MapNode[] = [
    { id: 1, name: "Novice Rest", lvlRequired: 1, goldReward: 20, percent: 0.05, icon: "🏕️", description: "A quiet clearing for fresh apprentices." },
    { id: 2, name: "Deepwood Camp", lvlRequired: 3, goldReward: 50, percent: 0.22, icon: "🌲", description: "Brave the dark trees and test your willpower." },
    { id: 3, name: "Whispering Ruins", lvlRequired: 5, goldReward: 100, percent: 0.44, icon: "🏛️", description: "Ancient scripts that reveal deep wisdom." },
    { id: 4, name: "Dragon's Ridge", lvlRequired: 8, goldReward: 200, percent: 0.62, icon: "🌋", description: "A fiery mountain range training physical endurance." },
    { id: 5, name: "Sunken Citadel", lvlRequired: 12, goldReward: 400, percent: 0.81, icon: "🏰", description: "A submerged castle requiring ultimate intelligence." },
    { id: 6, name: "Imperial Spire", lvlRequired: 15, goldReward: 800, percent: 0.96, icon: "👑", description: "The peak of knowledge. Only true masters reach here." },
  ];

  const pathD = "M 80 280 C 180 140, 240 400, 360 220 C 420 120, 520 180, 580 320 C 640 420, 720 160, 850 200";

  // Coordinates of the character token
  const [tokenPos, setTokenPos] = useState({ x: 80, y: 280 });
  const [hoverNode, setHoverNode] = useState<MapNode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pathRef = useRef<SVGPathElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Keep track of the current percent value in a GSAP-animatable object
  const progressObj = useRef({ progress: 0.05 });

  // Initialize and animate token when active node changes
  useEffect(() => {
    const targetNode = nodes.find((n) => n.id === profile.current_node_id) || nodes[0];
    
    // We will animate progress from current value to target node's percent
    if (pathRef.current) {
      const pathEl = pathRef.current;
      const totalLength = pathEl.getTotalLength();

      gsap.to(progressObj.current, {
        progress: targetNode.percent,
        duration: 2.0,
        ease: "power2.inOut",
        onUpdate: () => {
          const pt = pathEl.getPointAtLength(progressObj.current.progress * totalLength);
          setTokenPos({ x: pt.x, y: pt.y });
        }
      });
    }
  }, [profile.current_node_id]);

  // Particles (embers) loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      alpha: number;
      life: number;
    }> = [];

    const spawnParticle = () => {
      particles.push({
        x: Math.random() * width,
        y: height + 10,
        size: Math.random() * 2 + 1,
        speedY: -(Math.random() * 0.8 + 0.3),
        speedX: Math.random() * 0.4 - 0.2,
        alpha: Math.random() * 0.5 + 0.3,
        life: Math.random() * 300 + 200,
      });
    };

    const updateAndDraw = () => {
      ctx.clearRect(0, 0, width, height);

      // Spawn new particles occasionally
      if (particles.length < 50 && Math.random() < 0.2) {
        spawnParticle();
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.life--;
        p.alpha -= 0.002;

        if (p.life <= 0 || p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${p.alpha})`; // glowing gold embers
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#d4af37";
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      animationId = requestAnimationFrame(updateAndDraw);
    };

    updateAndDraw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const handleNodeClick = (node: MapNode) => {
    if (profile.level < node.lvlRequired) {
      setErrorMessage(`Cannot unlock ${node.name}. Requires Level ${node.lvlRequired}!`);
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    
    // Call parent handler to update current node and award gold if applicable
    onSelectNode(node.id, node.goldReward);
  };

  // Convert node percentage to SVG coordinates on render to place node markers
  const getNodeCoords = (percent: number) => {
    if (!pathRef.current) return { x: 0, y: 0 };
    const totalLength = pathRef.current.getTotalLength();
    const pt = pathRef.current.getPointAtLength(percent * totalLength);
    return { x: pt.x, y: pt.y };
  };

  const [coordsLoaded, setCoordsLoaded] = useState(false);

  useEffect(() => {
    // A small timeout allows the SVG to render and path length to calculate
    const t = setTimeout(() => {
      setCoordsLoaded(true);
      
      // Also update token position immediately on mount
      if (pathRef.current) {
        const activeNode = nodes.find((n) => n.id === profile.current_node_id) || nodes[0];
        const totalLength = pathRef.current.getTotalLength();
        const pt = pathRef.current.getPointAtLength(activeNode.percent * totalLength);
        setTokenPos({ x: pt.x, y: pt.y });
        progressObj.current.progress = activeNode.percent;
      }
    }, 100);
    return () => clearTimeout(t);
  }, [coordsLoaded]);

  return (
    <div 
      className="rpg-panel" 
      style={{ 
        height: "100%", 
        minHeight: "450px", 
        padding: "0", 
        background: "radial-gradient(circle at center, #1b1612 0%, #0d0a08 100%)",
        border: "var(--border-rpg-bright)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Canvas for background embers */}
      <canvas 
        ref={canvasRef} 
        style={{ 
          position: "absolute", 
          top: 0, 
          left: 0, 
          width: "100%", 
          height: "100%", 
          pointerEvents: "none",
          zIndex: 1
        }} 
      />

      {/* Map Header */}
      <div 
        style={{ 
          position: "absolute", 
          top: "1.25rem", 
          left: "1.25rem", 
          zIndex: 10, 
          display: "flex", 
          flexDirection: "column", 
          gap: "0.25rem" 
        }}
      >
        <h3 className="panel-title" style={{ textShadow: "0 2px 8px #000" }}>
          <Compass size={18} className="gold-icon" /> Map of Shutoku
        </h3>
        <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          Travel to unlocked nodes as your Level increases to claim your destiny.
        </p>
      </div>

      {/* Warning popup */}
      {errorMessage && (
        <div 
          style={{ 
            position: "absolute", 
            top: "1.25rem", 
            right: "1.25rem", 
            zIndex: 100, 
            background: "rgba(207, 67, 67, 0.9)", 
            padding: "0.5rem 1rem", 
            borderRadius: "6px",
            border: "1px solid #ffaaaa",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            animation: "modalEnter 0.2s ease",
            boxShadow: "0 4px 15px rgba(0,0,0,0.5)"
          }}
        >
          <ShieldAlert size={14} />
          {errorMessage}
        </div>
      )}

      {/* SVG Map Layout */}
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 950 450" 
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "relative", zIndex: 2 }}
      >
        {/* Wavy bezier path */}
        <path
          ref={pathRef}
          id="map-path"
          d={pathD}
          fill="none"
          stroke="rgba(212, 175, 55, 0.15)"
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Highlight completed path portion */}
        {pathRef.current && coordsLoaded && (
          <path
            d={pathD}
            fill="none"
            stroke="var(--color-gold)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={pathRef.current.getTotalLength()}
            strokeDashoffset={pathRef.current.getTotalLength() - (progressObj.current.progress * pathRef.current.getTotalLength())}
            style={{ 
              opacity: 0.75, 
              filter: "drop-shadow(0 0 4px var(--color-gold-glow))",
              transition: "stroke-dashoffset 0.1s linear"
            }}
          />
        )}

        {/* Draw Nodes */}
        {pathRef.current && coordsLoaded && nodes.map((node) => {
          const pos = getNodeCoords(node.percent);
          const isUnlocked = profile.level >= node.lvlRequired;
          const isCurrent = profile.current_node_id === node.id;

          return (
            <g 
              key={node.id} 
              transform={`translate(${pos.x}, ${pos.y})`}
              style={{ cursor: "pointer" }}
              onClick={() => handleNodeClick(node)}
              onMouseEnter={() => setHoverNode(node)}
              onMouseLeave={() => setHoverNode(null)}
            >
              {/* Outer pulsing ring */}
              <circle
                r={isCurrent ? "22" : "16"}
                fill="transparent"
                stroke={isCurrent ? "var(--color-ember)" : isUnlocked ? "var(--color-gold)" : "#5a5045"}
                strokeWidth="2"
                style={{
                  opacity: isCurrent ? 0.9 : 0.6,
                  filter: isUnlocked ? "drop-shadow(0 0 8px var(--color-gold-glow))" : "none",
                  animation: isCurrent ? "pulseGlow 2s infinite" : "none"
                }}
              />
              {/* Inner node background */}
              <circle
                r={isCurrent ? "18" : "12"}
                fill={isCurrent ? "#2d160f" : isUnlocked ? "#282015" : "#191715"}
                stroke={isCurrent ? "var(--color-ember)" : isUnlocked ? "var(--color-gold-dim)" : "#3a3229"}
                strokeWidth="1.5"
              />
              {/* Emoji representation */}
              <text 
                y={isCurrent ? "5" : "4"} 
                textAnchor="middle" 
                style={{ fontSize: isCurrent ? "1.1rem" : "0.8rem", userSelect: "none" }}
              >
                {node.icon}
              </text>
            </g>
          );
        })}

        {/* Character token (represented as sprite node) */}
        {pathRef.current && coordsLoaded && (
          <g 
            transform={`translate(${tokenPos.x}, ${tokenPos.y - 12})`}
            style={{ pointerEvents: "none" }}
          >
            {/* Outer halo */}
            <circle
              r="20"
              fill="rgba(226, 88, 34, 0.12)"
              stroke="var(--color-ember)"
              strokeWidth="1.5"
              strokeDasharray="4,4"
              style={{ animation: "rotateClockwise 6s linear infinite" }}
            />
            {/* Token Circle */}
            <circle
              r="14"
              fill="var(--bg-charcoal-light)"
              stroke="var(--color-ember)"
              strokeWidth="2.5"
              style={{ filter: "drop-shadow(0 0 8px rgba(226, 88, 34, 0.8))" }}
            />
            {/* Mage Avatar */}
            <text y="5" textAnchor="middle" style={{ fontSize: "1.05rem" }}>
              🧙‍♂️
            </text>
          </g>
        )}
      </svg>

      {/* Node Info Hover Tooltip */}
      {hoverNode && (
        <div 
          style={{ 
            position: "absolute", 
            bottom: "1.25rem", 
            left: "1.25rem", 
            right: "1.25rem", 
            zIndex: 10,
            background: "rgba(18, 16, 14, 0.9)",
            border: hoverNode.id === profile.current_node_id ? "var(--border-rpg-ember)" : "var(--border-rpg)",
            padding: "0.85rem 1.25rem",
            borderRadius: "8px",
            backdropFilter: "blur(6px)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            animation: "modalEnter 0.2s ease"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
            <h4 style={{ fontSize: "1rem", color: "var(--color-text-parchment)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>{hoverNode.icon}</span> {hoverNode.name}
            </h4>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{hoverNode.description}</p>
          </div>
          
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "end" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Requirement</span>
              <span style={{ fontSize: "0.85rem", color: profile.level >= hoverNode.lvlRequired ? "var(--color-success)" : "var(--color-danger)", display: "flex", alignItems: "center", gap: "0.2rem", fontWeight: "bold" }}>
                <Award size={12} /> Level {hoverNode.lvlRequired}
              </span>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", alignItems: "end" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Gold Reward</span>
              <span style={{ fontSize: "0.9rem", color: "var(--color-text-gold)", fontWeight: "bold" }}>
                +{hoverNode.goldReward}g
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Embedded local keyframes animations style */}
      <style>{`
        @keyframes pulseGlow {
          0% { transform: scale(1); opacity: 0.9; box-shadow: 0 0 0 0 rgba(226, 88, 34, 0.4); }
          50% { transform: scale(1.08); opacity: 1; box-shadow: 0 0 10px 4px rgba(226, 88, 34, 0.6); }
          100% { transform: scale(1); opacity: 0.9; box-shadow: 0 0 0 0 rgba(226, 88, 34, 0.4); }
        }
        @keyframes rotateClockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
