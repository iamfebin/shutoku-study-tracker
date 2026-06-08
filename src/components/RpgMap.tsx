import React, { useState, useEffect, useRef } from "react";
import { Compass, ShieldAlert, Award } from "lucide-react";
import gsap from "gsap";
import { HeroProfile } from "../services/db";
import baseIdle from "../assets/cozy/base_idle_strip9.png";

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
      angle: number;
      spin: number;
      color: string;
    }> = [];

    const colors = [
      "rgba(116, 195, 60, 0.4)",  // Grassy green
      "rgba(163, 230, 53, 0.4)",   // Lime green
      "rgba(254, 195, 30, 0.4)",   // Gold sparkle
      "rgba(141, 110, 99, 0.2)"    // Wood brown leaf
    ];

    const spawnParticle = () => {
      particles.push({
        x: Math.random() * width,
        y: -10, // Top of canvas
        size: Math.random() * 3 + 2,
        speedY: Math.random() * 0.7 + 0.4, // float downwards
        speedX: Math.random() * 0.4 - 0.1, // drift rightwards
        alpha: Math.random() * 0.5 + 0.3,
        life: Math.random() * 350 + 150,
        angle: Math.random() * Math.PI * 2,
        spin: Math.random() * 0.02 - 0.01,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    };

    const updateAndDraw = () => {
      ctx.clearRect(0, 0, width, height);

      if (particles.length < 35 && Math.random() < 0.15) {
        spawnParticle();
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.angle += p.spin;
        p.life--;
        p.alpha -= 0.0015;

        if (p.life <= 0 || p.alpha <= 0 || p.x > width || p.y > height) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.beginPath();
        
        // Leaf/diamond shape
        ctx.moveTo(0, -p.size);
        ctx.quadraticCurveTo(p.size / 2, 0, 0, p.size);
        ctx.quadraticCurveTo(-p.size / 2, 0, 0, -p.size);
        
        // Dynamically adjust alpha
        const drawColor = p.color.replace(/[\d\.]+\)$/, `${p.alpha})`);
        ctx.fillStyle = drawColor;
        ctx.fill();
        ctx.restore();
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
        background: "linear-gradient(to bottom, #e0f2fe 0%, #dcfce7 100%)", // Sky to meadow green gradient!
        border: "var(--border-wood-thick)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Canvas for background soughing leaves */}
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
        <h3 className="panel-title" style={{ color: "var(--color-text-dark)" }}>
          <Compass size={18} style={{ color: "var(--color-secondary)" }} /> Map of Shutoku
        </h3>
        <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: "bold" }}>
          Travel to unlocked camps as your Level increases to claim your destiny.
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
            background: "var(--color-ember)", 
            padding: "0.6rem 1.15rem", 
            borderRadius: "10px",
            border: "2px solid #8d6e63",
            color: "#ffffff",
            fontSize: "0.85rem",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            animation: "modalEnter 0.2s ease",
            boxShadow: "0 6px 0px var(--color-ember-dark)"
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
        {/* Decorative Grid - Grass Tufts */}
        <g opacity="0.25">
          <text x="50" y="80" style={{ fontSize: "1rem" }}>🌱</text>
          <text x="140" y="60" style={{ fontSize: "1rem" }}>🌱</text>
          <text x="300" y="70" style={{ fontSize: "1rem" }}>🌱</text>
          <text x="600" y="50" style={{ fontSize: "1rem" }}>🌱</text>
          <text x="750" y="60" style={{ fontSize: "1rem" }}>🌱</text>
          <text x="900" y="80" style={{ fontSize: "1rem" }}>🌱</text>
          
          <text x="80" y="390" style={{ fontSize: "1rem" }}>🌱</text>
          <text x="320" y="420" style={{ fontSize: "1rem" }}>🌱</text>
          <text x="500" y="410" style={{ fontSize: "1rem" }}>🌱</text>
          <text x="700" y="390" style={{ fontSize: "1rem" }}>🌱</text>
          <text x="880" y="410" style={{ fontSize: "1rem" }}>🌱</text>
        </g>

        {/* Winding Blue River */}
        <path
          d="M 450 -20 C 490 140, 310 260, 340 470"
          fill="none"
          stroke="#a5f3fc"
          strokeWidth="22"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M 450 -20 C 490 140, 310 260, 340 470"
          fill="none"
          stroke="#e0f2fe"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.95"
        />

        {/* Wooden Bridge at river crossing (x ~ 335, y ~ 310) */}
        <g transform="translate(332, 312) rotate(35)">
          <rect x="-12" y="-22" width="24" height="44" fill="#8d6e63" rx="4" stroke="#5d4037" strokeWidth="2" />
          <line x1="-12" y1="-14" x2="12" y2="-14" stroke="#5d4037" strokeWidth="2" />
          <line x1="-12" y1="-7" x2="12" y2="-7" stroke="#5d4037" strokeWidth="2" />
          <line x1="-12" y1="0" x2="12" y2="0" stroke="#5d4037" strokeWidth="2" />
          <line x1="-12" y1="7" x2="12" y2="7" stroke="#5d4037" strokeWidth="2" />
          <line x1="-12" y1="14" x2="12" y2="14" stroke="#5d4037" strokeWidth="2" />
          {/* Bridge Rails */}
          <path d="M -12 -22 Q 0 -18 12 -22" stroke="#ecd6bc" strokeWidth="2.5" fill="none" />
          <path d="M -12 22 Q 0 18 12 22" stroke="#ecd6bc" strokeWidth="2.5" fill="none" />
        </g>

        {/* Scenic Forest Trees (Background Decor) */}
        <g style={{ userSelect: "none" }}>
          {/* Near Novice Rest & Deepwood */}
          <text x="140" y="240" style={{ fontSize: "1.6rem" }}>🌳</text>
          <text x="160" y="320" style={{ fontSize: "1.5rem" }}>🌳</text>
          <text x="250" y="370" style={{ fontSize: "1.8rem" }}>🌲</text>
          <text x="280" y="390" style={{ fontSize: "2rem" }}>🌲</text>
          <text x="220" y="400" style={{ fontSize: "1.6rem" }}>🌲</text>
          
          {/* Whispering Ruins flower beds */}
          <text x="440" y="250" style={{ fontSize: "1.4rem" }}>🌸</text>
          <text x="460" y="220" style={{ fontSize: "1.2rem" }}>🌷</text>
          <text x="490" y="240" style={{ fontSize: "1.3rem" }}>🌻</text>
          
          {/* Dragon Ridge Volcanic Rocks */}
          <text x="540" y="370" style={{ fontSize: "1.8rem" }}>🪨</text>
          <text x="640" y="390" style={{ fontSize: "1.8rem" }}>🪨</text>
          <text x="660" y="330" style={{ fontSize: "1.4rem" }}>🔥</text>
          
          {/* Sunken Citadel lotus garden */}
          <text x="680" y="120" style={{ fontSize: "1.5rem" }}>🪷</text>
          <text x="760" y="100" style={{ fontSize: "1.6rem" }}>🪷</text>
          <text x="730" y="70" style={{ fontSize: "1.4rem" }}>⛲</text>
          <text x="780" y="130" style={{ fontSize: "1.8rem" }}>🌳</text>
          
          {/* Final Spire fields */}
          <text x="890" y="150" style={{ fontSize: "1.8rem" }}>🌳</text>
          <text x="910" y="220" style={{ fontSize: "1.7rem" }}>🌳</text>
        </g>

        {/* Cute Animals grazing */}
        <g style={{ userSelect: "none" }}>
          <text x="110" y="210" style={{ fontSize: "1.4rem" }}>🐑</text> {/* Sheep near camp */}
          <text x="280" y="190" style={{ fontSize: "1.5rem" }}>🐄</text> {/* Cow near ruins */}
          <text x="325" y="390" style={{ fontSize: "1.4rem" }}>🦆</text> {/* Duck in river */}
          <text x="880" y="260" style={{ fontSize: "1.3rem" }}>🐥</text> {/* Chicks near spire */}
          <text x="855" y="280" style={{ fontSize: "1.3rem" }}>🐥</text>
          {/* A dragon flying in the sky near Dragon's Ridge */}
          <text x="590" y="90" style={{ fontSize: "2.2rem", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))", animation: "bounceDragon 4s ease-in-out infinite" }}>🐉</text>
        </g>

        {/* Wavy bezier path - Wood/dirt trail */}
        <path
          ref={pathRef}
          id="map-path"
          d={pathD}
          fill="none"
          stroke="#ecd6bc"
          strokeWidth="8"
          strokeLinecap="round"
        />

        {/* Highlight completed path portion - Grass green path */}
        {pathRef.current && coordsLoaded && (
          <path
            d={pathD}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={pathRef.current.getTotalLength()}
            strokeDashoffset={pathRef.current.getTotalLength() - (progressObj.current.progress * pathRef.current.getTotalLength())}
            style={{ 
              opacity: 0.85, 
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
              {/* Node grassy shadow platform */}
              <circle
                r="18"
                fill="rgba(116, 195, 60, 0.15)"
                cy="6"
              />
              
              {/* Outer ring */}
              <circle
                r={isCurrent ? "21" : "15"}
                fill="transparent"
                stroke={isCurrent ? "var(--color-ember)" : isUnlocked ? "var(--color-primary)" : "#c69c6d"}
                strokeWidth="3"
                style={{
                  opacity: 1,
                  animation: isCurrent ? "pulseGlow 2s infinite" : "none"
                }}
              />
              {/* Inner node background */}
              <circle
                r={isCurrent ? "17" : "11"}
                fill={isCurrent ? "#fffbeb" : isUnlocked ? "#ffffff" : "#f1ede2"}
                stroke="#8d6e63"
                strokeWidth="2"
              />
              {/* Emoji representation */}
              <text 
                y={isCurrent ? "5" : "4"} 
                textAnchor="middle" 
                style={{ fontSize: isCurrent ? "1.1rem" : "0.75rem", userSelect: "none" }}
              >
                {node.icon}
              </text>
            </g>
          );
        })}

        {/* Character token (represented as animated pixel scholar) */}
        {pathRef.current && coordsLoaded && (
          <g 
            transform={`translate(${tokenPos.x - 20}, ${tokenPos.y - 36})`}
            style={{ pointerEvents: "none" }}
          >
            {/* Tiny soft shadow */}
            <ellipse cx="20" cy="34" rx="12" ry="4" fill="rgba(141, 110, 99, 0.3)" />
            {/* Animated pixel character */}
            <foreignObject width="40" height="40">
              <div 
                className="pixel-hero-idle" 
                style={{ 
                  backgroundImage: `url(${baseIdle})`,
                  transform: "scale(2.5)",
                  transformOrigin: "top left",
                  marginLeft: "12px",
                  marginTop: "6px"
                }} 
              />
            </foreignObject>
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
            background: "#ffffff",
            border: "3px solid #8d6e63",
            padding: "0.85rem 1.25rem",
            borderRadius: "16px",
            boxShadow: "0 8px 0px rgba(141, 110, 99, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            animation: "modalEnter 0.2s ease"
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
            <h4 style={{ fontSize: "1.15rem", color: "var(--color-text-dark)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>{hoverNode.icon}</span> {hoverNode.name}
            </h4>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: "bold" }}>{hoverNode.description}</p>
          </div>
          
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "end" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Requirement</span>
              <span style={{ fontSize: "0.9rem", color: profile.level >= hoverNode.lvlRequired ? "var(--color-primary-dark)" : "var(--color-danger)", display: "flex", alignItems: "center", gap: "0.2rem", fontWeight: "bold" }}>
                <Award size={14} /> Level {hoverNode.lvlRequired}
              </span>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", alignItems: "end" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Gold Reward</span>
              <span style={{ fontSize: "0.95rem", color: "var(--color-text-gold)", fontWeight: "bold" }}>
                +{hoverNode.goldReward}g
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Embedded local keyframes animations style */}
      <style>{`
        @keyframes pulseGlow {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 0.9; }
        }
        @keyframes bounceDragon {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(-3deg) scaleX(-1); } /* flip and hover! */
          100% { transform: translateY(0px) rotate(0deg); }
        }
      `}</style>
    </div>
  );
};
