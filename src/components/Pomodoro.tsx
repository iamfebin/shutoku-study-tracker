import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { ActivityLog, HeroProfile } from "../services/db";
import { calculateSessionRewards } from "../utils/rpg";
import baseIdle from "../assets/cozy/base_idle_strip9.png";
import longhairIdle from "../assets/cozy/longhair_idle_strip9.png";

interface PomodoroProps {
  profile: HeroProfile;
  onSessionComplete: (
    log: Omit<ActivityLog, "id">,
    rewards: { focusOrbs: number; materials: number; gold: number; xp: number }
  ) => void;
  isResting: boolean;
  onToggleRest: () => void;
  onTravelToNode: (nodeId: number) => void;
}

export const Pomodoro: React.FC<PomodoroProps> = ({
  profile,
  onSessionComplete,
  isResting,
  onToggleRest,
  onTravelToNode,
}) => {
  // Config
  const [focusLength, setFocusLength] = useState<number>(25); // in minutes
  const [breakLength, setBreakLength] = useState<number>(5); // in minutes
  const [isBreak, setIsBreak] = useState<boolean>(false);
  const [subject, setSubject] = useState<string>("Python");
  const [statCategory, setStatCategory] = useState<string>("INT");
  const [notes, setNotes] = useState<string>("");

  // Running state
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [distractions, setDistractions] = useState<number>(0);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [focusRating, setFocusRating] = useState<number>(5);

  const timerRef = useRef<any>(null);
  const totalDurationRef = useRef<number>(25 * 60);
  const startTimeRef = useRef<Date | null>(null);

  // Auto-sync subject and stat categories
  const handleSubjectChange = (newSubject: string) => {
    setSubject(newSubject);
    if (newSubject === "German") {
      setStatCategory("CHA");
    } else if (newSubject === "Python") {
      setStatCategory("INT");
    } else if (newSubject === "SQL") {
      setStatCategory("WIS");
    } else {
      setStatCategory("INT");
    }
  };

  // Sound Synthesizers
  const playChimeSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      // RPG arpeggio (C5 -> E5 -> G5 -> C6)
      playTone(523.25, now, 0.6);
      playTone(659.25, now + 0.15, 0.6);
      playTone(783.99, now + 0.3, 0.6);
      playTone(1046.50, now + 0.45, 0.8);
    } catch (e) {
      console.error("Audio Web API not supported or blocked", e);
    }
  };

  const playClickSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  };

  // Reset timer whenever lengths change and not running
  useEffect(() => {
    if (!isRunning) {
      const mins = isBreak ? breakLength : focusLength;
      setTimeLeft(mins * 60);
      totalDurationRef.current = mins * 60;
    }
  }, [focusLength, breakLength, isBreak, isRunning]);

  // Main tick loop
  useEffect(() => {
    if (isRunning) {
      if (!startTimeRef.current && !isBreak) {
        startTimeRef.current = new Date();
      }
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    playChimeSound();

    if (!isBreak) {
      // Completed Focus Session -> Show rating and save to DB
      setShowReviewModal(true);
    } else {
      // Completed Break Session -> Swap back to Focus
      setIsBreak(false);
      setTimeLeft(focusLength * 60);
      totalDurationRef.current = focusLength * 60;
      startTimeRef.current = null;
      setDistractions(0);
    }
  };

  const toggleTimer = () => {
    if (isResting) return; // Cannot study while resting
    playClickSound();
    const willStart = !isRunning;
    setIsRunning(willStart);

    if (willStart) {
      // Auto-commute / Travel to study spot
      if (subject.toLowerCase() === "python") onTravelToNode(2);
      else if (subject.toLowerCase() === "german") onTravelToNode(3);
      else if (subject.toLowerCase() === "sql") onTravelToNode(4);
    }
  };

  const resetTimer = () => {
    playClickSound();
    setIsRunning(false);
    const mins = isBreak ? breakLength : focusLength;
    setTimeLeft(mins * 60);
    totalDurationRef.current = mins * 60;
    startTimeRef.current = null;
    setDistractions(0);
  };

  const logDistraction = () => {
    playClickSound();
    setDistractions((prev) => prev + 1);
  };

  const submitReview = () => {
    const end = new Date();
    const start = startTimeRef.current || new Date(end.getTime() - focusLength * 60 * 1000);
    const durationMins = focusLength;
    const isSloth = profile.sloth_active === 1;

    // Calculate rewards using utility function
    const rewards = calculateSessionRewards(
      subject,
      durationMins,
      focusRating,
      isSloth,
      profile.energy
    );

    // Pass complete logs & rewards to callback
    onSessionComplete(
      {
        subject,
        stat_category: statCategory,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        duration_minutes: durationMins,
        distraction_count: distractions,
        focus_rating: focusRating,
        xp_gained: rewards.xp,
        notes: notes,
      },
      rewards
    );

    // Reset UI state
    setShowReviewModal(false);
    setNotes("");
    setDistractions(0);
    startTimeRef.current = null;
    
    // Shift automatically to Break
    setIsBreak(true);
    setTimeLeft(breakLength * 60);
    totalDurationRef.current = breakLength * 60;
  };

  // SVG circular calculations
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = (timeLeft / totalDurationRef.current) || 0;
  const strokeDashoffset = circumference - progressPercent * circumference;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`rpg-panel ${isResting ? "success-panel" : isBreak ? "success-panel" : "ember-panel"}`}>
      <div className="panel-header">
        <h3 className="panel-title" style={{ color: isResting ? "var(--color-secondary)" : isBreak ? "var(--color-success)" : "var(--color-ember)" }}>
          <Clock size={18} /> {isResting ? "Home Rest Sanctuary" : isBreak ? "Rest & Recovery" : "Focus Chamber"}
        </h3>
        <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontFamily: "var(--font-display)" }}>
          {isResting ? "Home Base" : isBreak ? "Break Active" : `Training ${statCategory}`}
        </span>
      </div>

      <div style={{ display: "flex", gap: "2rem", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
        
        {/* Circular SVG Timer & Rest Display */}
        <div style={{ position: "relative", width: "220px", height: "220px", display: "flex", alignItems: "center", justifyItems: "center" }}>
          <svg width="220" height="220" style={{ transform: "rotate(-90deg)" }}>
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="transparent"
              stroke="#f1ede2"
              strokeWidth="8"
            />
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="transparent"
              stroke={isResting ? "var(--color-secondary)" : isBreak ? "var(--color-primary)" : "var(--color-ember)"}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={isResting ? circumference - (profile.energy / 100) * circumference : strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.2s linear" }}
            />
          </svg>
          <div 
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Sleeping particle text floating */}
            {isResting && (
              <>
                <span className="zzz-particle" style={{ top: "25px", right: "70px", animationDelay: "0s" }}>Z</span>
                <span className="zzz-particle" style={{ top: "15px", right: "85px", animationDelay: "0.6s" }}>z</span>
                <span className="zzz-particle" style={{ top: "35px", right: "55px", animationDelay: "1.2s" }}>z</span>
              </>
            )}
            
            {/* Animated pixel-art character */}
            <div 
              className="pixel-hero-idle" 
              style={{ 
                backgroundImage: `url(${isResting || isBreak ? longhairIdle : baseIdle})`,
                transform: "scale(3.5)",
                marginBottom: "0.5rem",
                marginTop: "-0.75rem",
                animationPlayState: isRunning || isResting ? "running" : "paused"
              }} 
            />
            <span style={{ fontSize: "2.3rem", fontWeight: "bold", fontFamily: "var(--font-display)", color: "var(--color-text-dark)", letterSpacing: "0.5px" }}>
              {isResting ? `${profile.energy}%` : formatTime(timeLeft)}
            </span>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "2px" }}>
              {isResting ? "Energy level" : isBreak ? "Resting" : "Focusing"}
            </span>
          </div>
        </div>

        {/* Configuration & Energy Controls */}
        <div style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          {/* Controls row */}
          {!isResting ? (
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button 
                className="rpg-btn rpg-btn-primary" 
                onClick={toggleTimer} 
                style={{ flex: 1 }}
                disabled={profile.energy < 20 && !isRunning}
              >
                {isRunning ? <Pause size={16} /> : <Play size={16} />} {isRunning ? "Pause" : "Commence"}
              </button>
              <button className="rpg-btn rpg-btn-secondary" onClick={resetTimer} title="Reset Timer">
                <RotateCcw size={16} />
              </button>
            </div>
          ) : (
            <div style={{ padding: "0.2rem", textAlign: "center" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: "bold" }}>
                Recovering from adventures...
              </span>
            </div>
          )}

          {/* Resting Button (Home Base Toggle) */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button 
              className={`rpg-btn ${isResting ? "rpg-btn-danger" : "rpg-btn-secondary"}`}
              onClick={() => {
                if (isRunning) {
                  setIsRunning(false); // Cancel current study
                }
                onToggleRest();
              }}
              style={{ flex: 1 }}
            >
              {isResting ? "🛌 Wake Up & Study" : "😴 Rest at Home"}
            </button>
          </div>

          {/* Distraction logging */}
          {!isBreak && !isResting && (
            <button 
              className="rpg-btn rpg-btn-secondary" 
              onClick={logDistraction} 
              disabled={!isRunning}
              style={{ borderColor: "rgba(226, 88, 34, 0.35)", color: distractions > 0 ? "var(--color-ember)" : "inherit" }}
            >
              <AlertTriangle size={15} /> Log Distraction ({distractions})
            </button>
          )}

          {/* Configuration Inputs */}
          {!isRunning && !isResting && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", background: "rgba(0,0,0,0.02)", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.05)" }}>
              
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ flex: 1 }}>
                  <label className="rpg-label">Focus (min)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="180" 
                    className="rpg-input" 
                    value={focusLength}
                    onChange={(e) => setFocusLength(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="rpg-label">Rest (min)</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="60" 
                    className="rpg-input" 
                    value={breakLength}
                    onChange={(e) => setBreakLength(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
              </div>

              {!isBreak && (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <div style={{ flex: 2 }}>
                    <label className="rpg-label">Subject Spot</label>
                    <select 
                      className="rpg-select" 
                      value={subject} 
                      onChange={(e) => handleSubjectChange(e.target.value)}
                    >
                      <option value="Python">Python Building</option>
                      <option value="German">German Town</option>
                      <option value="SQL">SQL Ruins</option>
                      <option value="Custom">Custom Spot</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="rpg-label">Stat Focus</label>
                    <input 
                      type="text" 
                      className="rpg-input" 
                      value={statCategory} 
                      readOnly 
                      style={{ background: "#f1ede2", cursor: "not-allowed" }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Energy levels & Active status effects */}
      <div style={{ marginTop: "1.25rem", borderTop: "2px dashed #ecd6bc", paddingTop: "0.75rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: "bold", marginBottom: "0.3rem" }}>
          <span style={{ color: "var(--color-text-dark)" }}>⚡ Hero Energy</span>
          <span style={{ color: "var(--color-text-dark)" }}>{profile.energy} / 100</span>
        </div>
        <div className="stat-bar-track" style={{ height: "14px" }}>
          <div 
            className="stat-bar-fill" 
            style={{ 
              width: `${profile.energy}%`, 
              background: profile.energy < 20 ? "linear-gradient(90deg, #f87171, #ef4444)" : "linear-gradient(90deg, #ffd43b, #fab005)",
              transition: "width 0.3s ease" 
            }}
          />
        </div>

        {/* Energy status tags */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.6rem" }}>
          {profile.energy < 20 && (
            <span style={{ fontSize: "0.75rem", background: "#fee2e2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.15rem 0.45rem", borderRadius: "6px", fontWeight: "bold" }}>
              🥱 Tired (-50% XP & Gold)
            </span>
          )}
          {profile.sloth_active === 1 && (
            <span style={{ fontSize: "0.75rem", background: "#fef3c7", border: "1px solid #fcd34d", color: "#d97706", padding: "0.15rem 0.45rem", borderRadius: "6px", fontWeight: "bold" }}>
              🦥 Slothful (-25% Productivity)
            </span>
          )}
          {profile.energy >= 50 && profile.sloth_active === 0 && (
            <span style={{ fontSize: "0.75rem", background: "#dcfce7", border: "1px solid #86efac", color: "#15803d", padding: "0.15rem 0.45rem", borderRadius: "6px", fontWeight: "bold" }}>
              💪 Fully Energetic
            </span>
          )}
          {isResting && (
            <span style={{ fontSize: "0.75rem", background: "#e0f2fe", border: "1px solid #7dd3fc", color: "#0369a1", padding: "0.15rem 0.45rem", borderRadius: "6px", fontWeight: "bold", animation: "pulseGlow 1.5s infinite" }}>
              💤 Charging Energy...
            </span>
          )}
        </div>
      </div>

      {/* Focus Session Completion & Review Modal */}
      {showReviewModal && (
        <div className="rpg-modal-overlay">
          <div className="rpg-panel rpg-modal">
            <div className="panel-header">
              <h3 className="panel-title" style={{ color: "var(--color-gold-bright)" }}>
                <CheckCircle size={18} /> Quest Completed!
              </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <p style={{ fontSize: "0.95rem" }}>
                You completed your focus session at the <strong>{subject === "Custom" ? "Custom Spot" : `${subject} Building`}</strong>. Write down some notes.
              </p>

              <div className="rpg-field">
                <label className="rpg-label">Focus Rating (1-5 Stars)</label>
                <div style={{ display: "flex", gap: "0.5rem", fontSize: "1.5rem" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                      key={star} 
                      style={{ 
                        cursor: "pointer", 
                        color: star <= focusRating ? "var(--color-gold-bright)" : "var(--color-text-muted)",
                        textShadow: star <= focusRating ? "0 0 5px var(--color-gold-glow)" : "none"
                      }}
                      onClick={() => setFocusRating(star)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div className="rpg-field">
                <label className="rpg-label">Quest Notes</label>
                <textarea 
                  rows={3} 
                  className="rpg-textarea"
                  placeholder="What did you achieve during this focus cycle?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                <button className="rpg-btn rpg-btn-primary" style={{ flex: 1 }} onClick={submitReview}>
                  Log to Ledger & Get Reward
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zzz floating keyframes */}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0px) scale(0.8); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: translateY(-20px) translateX(8px) scale(1.3); opacity: 0; }
        }
        .zzz-particle {
          position: absolute;
          color: #3aa6eb;
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: bold;
          animation: floatUp 2s infinite ease-out;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};
