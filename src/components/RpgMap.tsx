import React, { useState, useEffect, useRef } from "react";
import { Compass, ShieldAlert } from "lucide-react";
import gsap from "gsap";
import { HeroProfile } from "../services/db";
import baseIdle from "../assets/cozy/base_idle_strip9.png";

interface RpgMapProps {
  profile: HeroProfile;
  onUnlockGate: () => void;
}

interface MapNode {
  id: number;
  name: string;
  percent: number; // position on path (0.0 to 1.0)
  icon: string;
  description: string;
  requirementText: string;
}

export const RpgMap: React.FC<RpgMapProps> = ({ profile, onUnlockGate }) => {
  const nodes: MapNode[] = [
    { 
      id: 1, 
      name: "Home Base", 
      percent: 0.05, 
      icon: "🏕️", 
      description: "Your cozy campsite where resting restores Energy.",
      requirementText: "Rest Zone"
    },
    { 
      id: 2, 
      name: "Python Building", 
      percent: 0.28, 
      icon: "⚡", 
      description: "A high-tech spire where compilers hum. Study Python here to collect Python Pages.",
      requirementText: "Goal: 2 Hours/day"
    },
    { 
      id: 3, 
      name: "German Town", 
      percent: 0.52, 
      icon: "🏡", 
      description: "A scenic alpine village. Study German here to collect German Cards.",
      requirementText: "Goal: 5 Hours/day"
    },
    { 
      id: 4, 
      name: "SQL Ruins", 
      percent: 0.76, 
      icon: "🏺", 
      description: "Ancient stone slabs etched with relational database schemas. Study SQL here for SQL Runestones.",
      requirementText: "Goal: 2 Hours/day"
    },
    { 
      id: 5, 
      name: "Kingdom's Gate", 
      percent: 0.95, 
      icon: profile.princess_rescued ? "👑" : "🏰", 
      description: profile.princess_rescued 
        ? "The magical gate is unlocked, and the Princess is rescued! You are the champion of Shutoku!"
        : "The magically sealed castle gate. Collect and combine shards to forge 3 Key Fragments and open it!",
      requirementText: "Requires 3 Key Fragments"
    },
  ];

  const pathD = "M 80 280 C 180 140, 240 400, 360 220 C 420 120, 520 180, 580 320 C 640 420, 720 160, 850 200";

  // Coordinates of the character token
  const [tokenPos, setTokenPos] = useState({ x: 80, y: 280 });
  const [hoverNode, setHoverNode] = useState<MapNode | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Particles (leaves/petals) loop
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
      "rgba(244, 114, 182, 0.3)"   // Pink flower petals!
    ];

    const spawnParticle = () => {
      particles.push({
        x: Math.random() * width,
        y: -10,
        size: Math.random() * 3 + 2,
        speedY: Math.random() * 0.7 + 0.4,
        speedX: Math.random() * 0.4 - 0.1,
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
        
        ctx.moveTo(0, -p.size);
        ctx.quadraticCurveTo(p.size / 2, 0, 0, p.size);
        ctx.quadraticCurveTo(-p.size / 2, 0, 0, -p.size);
        
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
    if (node.id === 5) {
      if (profile.princess_rescued === 1) {
        setSuccessMessage("You have already rescued the princess! You are a legendary scholar.");
        setTimeout(() => setSuccessMessage(null), 3500);
        return;
      }
      if (profile.key_fragments < 3) {
        setErrorMessage(`The gate is magically sealed! You need 3 Key Fragments. (You have: ${profile.key_fragments})`);
        setTimeout(() => setErrorMessage(null), 3500);
        return;
      }
      onUnlockGate();
    } else {
      // General feedback
      setSuccessMessage(`To travel to the ${node.name}, go to the Focus Room and start studying/resting.`);
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  const getNodeCoords = (percent: number) => {
    if (!pathRef.current) return { x: 0, y: 0 };
    const totalLength = pathRef.current.getTotalLength();
    const pt = pathRef.current.getPointAtLength(percent * totalLength);
    return { x: pt.x, y: pt.y };
  };

  const [coordsLoaded, setCoordsLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setCoordsLoaded(true);
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
        background: "linear-gradient(to bottom, #dff0fe 0%, #ebfdf0 100%)", // sky to soft bright meadow
        border: "var(--border-wood-thick)",
        position: "relative",
        overflow: "hidden"
      }}
    >
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
          <Compass size={18} style={{ color: "var(--color-secondary)" }} /> The Kingdom of Shutoku
        </h3>
        <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: "bold" }}>
          Unseal the Castle Gate at the end of the trail to rescue the Princess!
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

      {/* Informational popup */}
      {successMessage && (
        <div 
          style={{ 
            position: "absolute", 
            top: "1.25rem", 
            right: "1.25rem", 
            zIndex: 100, 
            background: "var(--color-secondary)", 
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
            boxShadow: "0 6px 0px var(--color-secondary-dark)"
          }}
        >
          <Compass size={14} />
          {successMessage}
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
          stroke="#bfeefc"
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
          
          {/* Whispering Ruins flower beds */}
          <text x="440" y="250" style={{ fontSize: "1.4rem" }}>🌸</text>
          <text x="460" y="220" style={{ fontSize: "1.2rem" }}>🌷</text>
          <text x="490" y="240" style={{ fontSize: "1.3rem" }}>🌻</text>
          
          {/* SQL Cavern Rocks */}
          <text x="540" y="370" style={{ fontSize: "1.8rem" }}>🪨</text>
          <text x="640" y="390" style={{ fontSize: "1.8rem" }}>🪨</text>
          <text x="660" y="330" style={{ fontSize: "1.4rem" }}>🔥</text>
          
          {/* Castle lotus garden */}
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
          <text x="110" y="210" style={{ fontSize: "1.4rem" }}>🐑</text> 
          <text x="280" y="190" style={{ fontSize: "1.5rem" }}>🐄</text> 
          <text x="325" y="390" style={{ fontSize: "1.4rem" }}>🦆</text> 
          <text x="880" y="260" style={{ fontSize: "1.3rem" }}>🐥</text> 
          {/* A dragon flying in the sky near SQL ruins */}
          <text x="610" y="80" style={{ fontSize: "2.2rem", filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))", animation: "bounceDragon 4s ease-in-out infinite" }}>🐉</text>
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

        {/* Highlight completed path portion */}
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
              {/* shadow */}
              <circle
                r="18"
                fill="rgba(116, 195, 60, 0.15)"
                cy="6"
              />
              
              {/* Outer ring */}
              <circle
                r={isCurrent ? "21" : "15"}
                fill="transparent"
                stroke={isCurrent ? "var(--color-secondary)" : node.id === 5 ? "var(--color-ember)" : "var(--color-primary)"}
                strokeWidth="3"
                style={{
                  animation: isCurrent ? "pulseGlow 2s infinite" : "none"
                }}
              />
              {/* Inner node */}
              <circle
                r={isCurrent ? "17" : "11"}
                fill={isCurrent ? "#e0f2fe" : "#ffffff"}
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
            <ellipse cx="20" cy="34" rx="12" ry="4" fill="rgba(141, 110, 99, 0.3)" />
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
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: "bold" }}>Location Info</span>
              <span style={{ fontSize: "0.9rem", color: "var(--color-secondary-dark)", display: "flex", alignItems: "center", gap: "0.2rem", fontWeight: "bold" }}>
                {hoverNode.requirementText}
              </span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulseGlow {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 0.9; }
        }
        @keyframes bounceDragon {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(-3deg) scaleX(-1); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
      `}</style>
    </div>
  );
};
