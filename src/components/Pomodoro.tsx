import React, { useState } from "react";
import { Play, Pause, RotateCcw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { HeroProfile } from "../services/db";
import baseIdle from "../assets/cozy/base_idle_strip9.png";
import bowlhairIdle from "../assets/cozy/bowlhair_idle_strip9.png";

interface PomodoroProps {
  profile: HeroProfile;
  isResting: boolean;
  onToggleRest: () => void;

  // Lifted timer state
  focusLength: number;
  breakLength: number;
  isBreak: boolean;
  subject: string;
  statCategory: string;
  timeLeft: number;
  isRunning: boolean;
  distractions: number;
  showReviewModal: boolean;

  setFocusLength: (val: number) => void;
  setBreakLength: (val: number) => void;
  setSubject: (val: string) => void;
  setStatCategory: (val: string) => void;
  setIsRunning: (val: boolean) => void;

  toggleTimer: () => void;
  resetTimer: () => void;
  logDistraction: () => void;
  submitReview: (rating: number, notes: string) => void;
}

export const Pomodoro: React.FC<PomodoroProps> = ({
  profile,
  isResting,
  onToggleRest,

  focusLength,
  breakLength,
  isBreak,
  subject,
  statCategory,
  timeLeft,
  isRunning,
  distractions,
  showReviewModal,

  setFocusLength,
  setBreakLength,
  setSubject,
  setStatCategory,
  setIsRunning,

  toggleTimer,
  resetTimer,
  logDistraction,
  submitReview,
}) => {
  // Local Review modal state
  const [notes, setNotes] = useState<string>("");
  const [focusRating, setFocusRating] = useState<number>(5);

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

  const handleSubmitReview = () => {
    submitReview(focusRating, notes);
    setNotes("");
    setFocusRating(5);
  };

  // SVG circular calculations
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const totalDuration = (isBreak ? breakLength : focusLength) * 60;
  const progressPercent = (timeLeft / totalDuration) || 0;
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
            
            <div 
              style={{ 
                position: "relative",
                width: "16px",
                height: "18px",
                transform: "scale(3.5)",
                transformOrigin: "center",
                marginBottom: "0.5rem",
                marginTop: "-0.75rem"
              }}
            >
              <div 
                className="pixel-hero-idle" 
                style={{ 
                  backgroundImage: `url(${baseIdle})`,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  animationPlayState: isRunning || isResting ? "running" : "paused"
                }} 
              />
              <div 
                className="pixel-hero-idle" 
                style={{ 
                  backgroundImage: `url(${bowlhairIdle})`,
                  position: "absolute",
                  top: 0,
                  left: 0,
                  animationPlayState: isRunning || isResting ? "running" : "paused"
                }} 
              />
            </div>
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
                <button className="rpg-btn rpg-btn-primary" style={{ flex: 1 }} onClick={handleSubmitReview}>
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
