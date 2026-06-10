import React, { useState, useEffect, useRef } from "react";
import { Compass } from "lucide-react";
import gsap from "gsap";
import { HeroProfile } from "../services/db";
import baseIdle from "../assets/cozy/base_idle_strip9.png";
import bowlhairIdle from "../assets/cozy/bowlhair_idle_strip9.png";

interface RpgMapProps {
  profile: HeroProfile;
  onUnlockGate: () => void;
  onStartStudy: (subject: string, nodeId: number) => void;
  onToggleRest: () => void;
  isResting: boolean;

  // Timer states for the stopwatch overlay
  timerSubject: string;
  timeLeft: number;
  timerIsRunning: boolean;
  timerIsBreak: boolean;
  showReviewModal: boolean;
  onTimerClick: () => void;
}

interface MapNode {
  id: number;
  name: string;
  x: number;
  y: number;
  index: number; // Index in fullPath array
  icon: string;
  description: string;
  requirementText: string;
}

// Coordinates from study_map_v2.json
const PLAYER_HOME = { x: 581.5, y: 779.5 };
const PYTHON_SPOT = { x: 970, y: 674.667 };
const SQL_SPOT = { x: 1274.67, y: 639.333 };
const GERMAN_SPOT = { x: 1648.67, y: 666.667 };
const GATE_SPOT = { x: 1719.667, y: 340 }; // castle_gate

const PATH_PYTHON = [
  { x: 582.333, y: 743 },
  { x: 617.667, y: 756 },
  { x: 637.667, y: 762.333 },
  { x: 649.667, y: 759.333 },
  { x: 662.333, y: 748 },
  { x: 681.333, y: 744 },
  { x: 700.333, y: 742.333 },
  { x: 729, y: 740 },
  { x: 746, y: 731.667 },
  { x: 762, y: 729 },
  { x: 775, y: 730 },
  { x: 791.333, y: 729 },
  { x: 808, y: 729.667 },
  { x: 808.333, y: 717.667 },
  { x: 837.667, y: 714 },
  { x: 850.667, y: 728 },
  { x: 874.333, y: 729.667 },
  { x: 899.667, y: 730.333 },
  { x: 909.667, y: 713 },
  { x: 942.333, y: 714.333 },
  { x: 964.667, y: 713.667 },
  { x: 968.667, y: 687.667 }
];

const SQL_ROUTE = [
  { x: 990, y: 714.667 },
  { x: 1018, y: 716 },
  { x: 1066, y: 712.5 },
  { x: 1148, y: 702.5 },
  { x: 1258.5, y: 701.5 },
  { x: 1271, y: 667 }
];

const GERMAN_ROUTE = [
  { x: 1298, y: 703 },
  { x: 1332.5, y: 695 },
  { x: 1385.5, y: 696.5 },
  { x: 1415, y: 710 },
  { x: 1444.5, y: 705.5 },
  { x: 1481.33, y: 733.333 },
  { x: 1482, y: 770.667 },
  { x: 1518, y: 800 },
  { x: 1560, y: 812 },
  { x: 1560, y: 836 },
  { x: 1561.33, y: 876.667 },
  { x: 1638, y: 870 },
  { x: 1640.67, y: 828.667 },
  { x: 1633.33, y: 787.333 },
  { x: 1648, y: 758 },
  { x: 1670.67, y: 732.667 },
  { x: 1650.67, y: 702 }
];

// castle_path from study_map_v2.json (reversed to go from german_spot up to castle_gate)
const CASTLE_ROUTE = [
  { x: 1701.333, y: 732 },
  { x: 1737, y: 743 },
  { x: 1834, y: 740.667 },
  { x: 1836.333, y: 711.667 },
  { x: 1834, y: 614.333 },
  { x: 1831.333, y: 552 },
  { x: 1816.333, y: 473.667 },
  { x: 1769, y: 422.333 },
  { x: 1769.333, y: 376.667 },
  { x: 1721, y: 376.667 }
];

// Combine all points into a single continuous trail path
const fullPath = [
  PLAYER_HOME,
  ...PATH_PYTHON,
  PYTHON_SPOT,
  ...SQL_ROUTE,
  SQL_SPOT,
  ...GERMAN_ROUTE,
  GERMAN_SPOT,
  ...CASTLE_ROUTE,
  GATE_SPOT
];

export const RpgMap: React.FC<RpgMapProps> = ({ 
  profile, 
  onUnlockGate,
  onStartStudy,
  onToggleRest,
  isResting,
  timerSubject,
  timeLeft,
  timerIsRunning,
  timerIsBreak,
  showReviewModal,
  onTimerClick
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const nodes: MapNode[] = [
    { 
      id: 1, 
      name: "Home Base", 
      x: PLAYER_HOME.x,
      y: PLAYER_HOME.y,
      index: 0,
      icon: "🏕️", 
      description: "Your cozy campsite where resting restores Energy.",
      requirementText: "Rest Zone"
    },
    { 
      id: 2, 
      name: "Python Building", 
      x: PYTHON_SPOT.x,
      y: PYTHON_SPOT.y,
      index: 23,
      icon: "⚡", 
      description: "A high-tech spire where compilers hum. Study Python here to collect Python Pages.",
      requirementText: "Goal: 2 Hours/day"
    },
    { 
      id: 4, 
      name: "SQL Ruins", 
      x: SQL_SPOT.x,
      y: SQL_SPOT.y,
      index: 30,
      icon: "🏺", 
      description: "Ancient stone slabs etched with relational database schemas. Study SQL here for SQL Runestones.",
      requirementText: "Goal: 2 Hours/day"
    },
    { 
      id: 3, 
      name: "German Town", 
      x: GERMAN_SPOT.x,
      y: GERMAN_SPOT.y,
      index: 48,
      icon: "🏡", 
      description: "A scenic alpine village. Study German here to collect German Cards.",
      requirementText: "Goal: 5 Hours/day"
    },
    { 
      id: 5, 
      name: "Kingdom's Gate", 
      x: GATE_SPOT.x,
      y: GATE_SPOT.y,
      index: 59,
      icon: profile.princess_rescued ? "👑" : "🏰", 
      description: profile.princess_rescued 
        ? "The magical gate is unlocked, and the Princess is rescued! You are the champion of Shutoku!"
        : "The magically sealed castle gate. Collect and combine shards to forge 3 Key Fragments and open it!",
      requirementText: "Requires 3 Key Fragments"
    },
  ];

  const targetNode = nodes.find((n) => n.id === profile.current_node_id) || nodes[0];

  const getActiveSpotNode = () => {
    if (isResting) {
      return nodes.find(n => n.id === 1); // Home Base
    }
    if (timerIsRunning || showReviewModal || (timeLeft === 0 && !timerIsBreak)) {
      if (timerSubject === "Python") return nodes.find(n => n.id === 2);
      if (timerSubject === "German") return nodes.find(n => n.id === 3);
      if (timerSubject === "SQL") return nodes.find(n => n.id === 4);
    }
    return null;
  };

  const activeSpotNode = getActiveSpotNode();

  // Coordinates of the character token
  const [tokenPos, setTokenPos] = useState({ x: targetNode.x, y: targetNode.y });
  const [facingLeft, setFacingLeft] = useState(false);
  const [hoverNode, setHoverNode] = useState<MapNode | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activePrompt, setActivePrompt] = useState<{
    type: "study" | "rest" | "lock" | "unlock";
    node: MapNode;
    subject?: string;
  } | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const hasScrolledInitially = useRef(false);
  
  // Keep track of the current path index in a GSAP-animatable object
  const progressObj = useRef({ index: targetNode.index });
  const prevX = useRef(targetNode.x);
  const isFirstRender = useRef(true);

  // Initialize and animate token when active node changes
  useEffect(() => {
    const activeTarget = nodes.find((n) => n.id === profile.current_node_id) || nodes[0];
    
    if (isFirstRender.current) {
      isFirstRender.current = false;
      setTokenPos({ x: activeTarget.x, y: activeTarget.y });
      progressObj.current.index = activeTarget.index;
      prevX.current = activeTarget.x;
      return;
    }
    
    // We will animate index from current value to target node's index
    gsap.to(progressObj.current, {
      index: activeTarget.index,
      duration: 2.0,
      ease: "power2.inOut",
      onUpdate: () => {
        const idx = progressObj.current.index;
        const baseIdx = Math.floor(idx);
        const nextIdx = Math.ceil(idx);
        const ratio = idx - baseIdx;
        const p1 = fullPath[baseIdx];
        const p2 = fullPath[nextIdx];
        
        if (p1 && p2) {
          const interpolatedX = p1.x + (p2.x - p1.x) * ratio;
          const interpolatedY = p1.y + (p2.y - p1.y) * ratio;
          
          if (interpolatedX < prevX.current - 0.1) {
            setFacingLeft(true);
          } else if (interpolatedX > prevX.current + 0.1) {
            setFacingLeft(false);
          }
          prevX.current = interpolatedX;
          setTokenPos({ x: interpolatedX, y: interpolatedY });
        }
      }
    });
  }, [profile.current_node_id]);

  // Auto-scroll map to keep token centered
  useEffect(() => {
    if (mapContainerRef.current) {
      const container = mapContainerRef.current;
      const rect = container.getBoundingClientRect();
      
      const targetScrollLeft = tokenPos.x - rect.width / 2;
      const targetScrollTop = tokenPos.y - rect.height / 2;
      
      if (!hasScrolledInitially.current) {
        container.scrollLeft = targetScrollLeft;
        container.scrollTop = targetScrollTop;
        hasScrolledInitially.current = true;
      } else {
        container.scrollTo({
          left: targetScrollLeft,
          top: targetScrollTop,
          behavior: "smooth"
        });
      }
    }
  }, [tokenPos]);

  const handleNodeClick = (node: MapNode) => {
    if (node.id === 1) {
      if (isResting) {
        setSuccessMessage("You are already resting at Home Base.");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setActivePrompt({ type: "rest", node });
      }
    } else if (node.id === 5) {
      if (profile.princess_rescued === 1) {
        setSuccessMessage("You have already rescued the princess! You are a legendary scholar.");
        setTimeout(() => setSuccessMessage(null), 3500);
        return;
      }
      if (profile.key_fragments < 3) {
        setActivePrompt({ type: "lock", node });
      } else {
        setActivePrompt({ type: "unlock", node });
      }
    } else {
      let subject = "Python";
      if (node.id === 3) subject = "German";
      if (node.id === 4) subject = "SQL";
      setActivePrompt({ type: "study", node, subject });
    }
  };

  // Get points for the highlighted completed path portion
  const getHighlightPoints = () => {
    const currentIdx = Math.floor(progressObj.current.index);
    const pts = fullPath.slice(0, currentIdx + 1);
    pts.push({ x: tokenPos.x, y: tokenPos.y });
    return pts.map(p => `${p.x},${p.y}`).join(" ");
  };

  return (
    <div 
      className="rpg-panel" 
      style={{ 
        height: "100%", 
        minHeight: "450px", 
        padding: "0", 
        border: "var(--border-wood-thick)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Fixed UI Overlays */}
      {/* Map Header */}
      <div 
        style={{ 
          position: "absolute", 
          top: "1.25rem", 
          left: "1.25rem", 
          zIndex: 10, 
          display: "flex", 
          flexDirection: "column", 
          gap: "0.25rem",
          pointerEvents: "none"
        }}
      >
        <h3 className="panel-title" style={{ color: "var(--color-text-dark)" }}>
          <Compass size={18} style={{ color: "var(--color-secondary)" }} /> The Kingdom of Shutoku
        </h3>
        <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: "bold" }}>
          Unseal the Castle Gate at the end of the trail to rescue the Princess!
        </p>
      </div>



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

      {/* Travel/Quest Prompt Modals */}
      {activePrompt && (
        <div className="rpg-modal-overlay">
          <div className="rpg-panel rpg-modal" style={{ border: activePrompt.type === 'lock' ? '3px solid var(--color-ember)' : '3px solid var(--color-secondary)', zIndex: 1000 }}>
            <div className="panel-header">
              <h3 
                className="panel-title" 
                style={{ 
                  color: activePrompt.type === 'lock' 
                    ? 'var(--color-ember)' 
                    : activePrompt.type === 'unlock' 
                    ? 'var(--color-gold-dark)' 
                    : 'var(--color-secondary)' 
                }}
              >
                {activePrompt.type === 'study' && `📜 ${activePrompt.node.name} Quest`}
                {activePrompt.type === 'rest' && `🛌 Rest Sanctuary`}
                {activePrompt.type === 'lock' && `🏰 Castle Gate Sealed`}
                {activePrompt.type === 'unlock' && `👑 Unseal the Castle Gate`}
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ fontSize: "0.95rem", lineHeight: "1.5" }}>
                {activePrompt.type === 'study' && (
                  <>
                    Would you like to travel to the <strong>{activePrompt.node.name}</strong> and begin a <strong>{activePrompt.subject}</strong> study session?
                  </>
                )}
                {activePrompt.type === 'rest' && (
                  <>
                    Would you like to travel back to <strong>Home Base</strong> to rest and recover your Energy?
                  </>
                )}
                {activePrompt.type === 'lock' && (
                  <>
                    The Castle Gate is sealed by ancient magic! You must forge <strong>3 Key Fragments</strong> in the Forge using materials from your study quests to break the seal.
                    <br />
                    <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", display: "block", marginTop: "0.5rem" }}>
                      🔑 Current fragments: {profile.key_fragments} / 3
                    </span>
                  </>
                )}
                {activePrompt.type === 'unlock' && (
                  <>
                    You have all <strong>3 Key Fragments</strong>! Would you like to travel to the Castle Gate, shatter the magic seal, and rescue the Princess?
                  </>
                )}
              </p>

              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                {activePrompt.type === 'lock' ? (
                  <button 
                    className="rpg-btn rpg-btn-primary" 
                    onClick={() => setActivePrompt(null)}
                    style={{ flex: 1 }}
                  >
                    Acknowledge Quest
                  </button>
                ) : (
                  <>
                    <button 
                      className="rpg-btn rpg-btn-secondary" 
                      onClick={() => setActivePrompt(null)}
                    >
                      Decline
                    </button>
                    <button 
                      className="rpg-btn rpg-btn-primary"
                      onClick={() => {
                        const prompt = activePrompt;
                        setActivePrompt(null);
                        if (prompt.type === 'study' && prompt.subject) {
                          onStartStudy(prompt.subject, prompt.node.id);
                        } else if (prompt.type === 'rest') {
                          onToggleRest();
                        } else if (prompt.type === 'unlock') {
                          onUnlockGate();
                        }
                      }}
                    >
                      {activePrompt.type === 'study' && "Commence Quest"}
                      {activePrompt.type === 'rest' && "Rest at Home"}
                      {activePrompt.type === 'unlock' && "Break Seal!"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <div 
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "100%",
          overflow: "auto",
          background: "#182010" // Dark border background matching the tilemap feel
        }}
      >
        <div style={{ position: "relative", width: "1920px", height: "1088px" }}>
          {/* Tiled Map Background Image */}
          <img 
            src="/study_map.png" 
            alt="World Map" 
            style={{ 
              position: "absolute", 
              top: 0, 
              left: 0, 
              width: "1920px", 
              height: "1088px", 
              pointerEvents: "none" 
            }} 
          />

          {/* SVG Overlay for Interactive Paths and Markers */}
          <svg 
            width="1920" 
            height="1088" 
            viewBox="0 0 1920 1088" 
            style={{ 
              position: "absolute", 
              top: 0, 
              left: 0, 
              zIndex: 2,
              pointerEvents: "auto"
            }}
          >
            {/* Complete Underlying Dirt/Wood Trail Line */}
            <polyline
              points={fullPath.map(p => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="#dfc09c"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.4" // Blend nicely on top of PNG path
            />

            {/* Highlighted completed/traversed path portion in primary green */}
            <polyline
              points={getHighlightPoints()}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />

            {/* Interactive Clickable Nodes */}
            {nodes.map((node) => {
              const isCurrent = profile.current_node_id === node.id;

              return (
                <g 
                  key={node.id} 
                  transform={`translate(${node.x}, ${node.y})`}
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

            {/* Animated Character Token */}
            <g 
              transform={`translate(${tokenPos.x - 72}, ${tokenPos.y - 150})`}
              style={{ pointerEvents: "none" }}
            >
              {/* Shadow */}
              <ellipse cx="72" cy="148" rx="42" ry="12" fill="rgba(141, 110, 99, 0.3)" />
              {/* Pixel Hero Wrapper */}
              <foreignObject width="144" height="162">
                <div 
                  style={{ 
                    position: "relative",
                    width: "16px",
                    height: "18px",
                    transform: `scale(9) ${facingLeft ? "scaleX(-1)" : ""}`,
                    transformOrigin: "center",
                    marginLeft: "64px",
                    marginTop: "72px"
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
              </foreignObject>
            </g>
            {/* Floating Stopwatch Badge */}
            {activeSpotNode && (
              <foreignObject 
                x={activeSpotNode.x - 65} 
                y={activeSpotNode.y - 70} 
                width="130" 
                height="45"
                style={{ zIndex: 100 }}
              >
                <div 
                  className="rpg-stopwatch-badge"
                  style={{
                    border: isResting 
                      ? '2px solid var(--color-secondary)' 
                      : showReviewModal 
                      ? '2px solid var(--color-gold-bright)' 
                      : timerIsBreak 
                      ? '2px solid var(--color-primary)' 
                      : '2px solid var(--color-ember)'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTimerClick();
                  }}
                >
                  {isResting ? (
                    <>
                      <span className="rpg-stopwatch-icon">🛌</span>
                      <span className="rpg-stopwatch-text">Rest {profile.energy}%</span>
                    </>
                  ) : showReviewModal ? (
                    <>
                      <span className="rpg-stopwatch-icon">🏆</span>
                      <span className="rpg-stopwatch-text claimant">Claim Reward!</span>
                    </>
                  ) : (
                    <>
                      <span className="rpg-stopwatch-icon">{timerIsBreak ? "☕" : "⏱️"}</span>
                      <span className="rpg-stopwatch-text">
                        {timerIsBreak ? "Break " : ""}
                        {formatTime(timeLeft)}
                      </span>
                    </>
                  )}
                </div>
              </foreignObject>
            )}
          </svg>
        </div>
      </div>

      <style>{`
        @keyframes pulseGlow {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 0.9; }
        }
        .rpg-stopwatch-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          background: rgba(247, 245, 238, 0.95);
          border-radius: 20px;
          padding: 0.35rem 0.6rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15), 0 0 10px rgba(116, 195, 60, 0.2);
          cursor: pointer;
          font-family: var(--font-display);
          font-size: 0.8rem;
          font-weight: bold;
          color: var(--color-text-dark);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
          animation: floatAnimation 2s infinite ease-in-out;
          user-select: none;
        }
        .rpg-stopwatch-badge:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25), 0 0 15px rgba(116, 195, 60, 0.4);
          background: #ffffff;
        }
        .rpg-stopwatch-icon {
          font-size: 1rem;
        }
        .rpg-stopwatch-text {
          white-space: nowrap;
        }
        .rpg-stopwatch-text.claimant {
          color: var(--color-gold-dark);
          animation: textFlash 1.5s infinite alternate;
        }
        @keyframes floatAnimation {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
          100% { transform: translateY(0px); }
        }
        @keyframes textFlash {
          0% { opacity: 0.8; }
          100% { opacity: 1; text-shadow: 0 0 8px rgba(250, 176, 5, 0.6); }
        }
      `}</style>
    </div>
  );
};
