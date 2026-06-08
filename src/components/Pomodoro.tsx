import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { ActivityLog } from "../services/db";
import baseIdle from "../assets/cozy/base_idle_strip9.png";
import longhairIdle from "../assets/cozy/longhair_idle_strip9.png";

interface PomodoroProps {
  onSessionComplete: (log: Omit<ActivityLog, "id">) => void;
}

export const Pomodoro: React.FC<PomodoroProps> = ({ onSessionComplete }) => {
  // Config
  const [focusLength, setFocusLength] = useState<number>(25); // in minutes
  const [breakLength, setBreakLength] = useState<number>(5); // in minutes
  const [isBreak, setIsBreak] = useState<boolean>(false);
  const [subject, setSubject] = useState<string>("Coding");
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
    playClickSound();
    setIsRunning(!isRunning);
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
    
    // XP Calculation: 1 XP per minute of focus, reduced slightly for distractions, with base rewards
    const durationMins = focusLength;
    const rawXp = durationMins * 4;
    // XP Deduction: -10% per distraction, capped at 50% loss
    const penaltyRatio = Math.max(0.5, 1 - distractions * 0.1);
    const finalXp = Math.max(5, Math.round(rawXp * penaltyRatio));

    onSessionComplete({
      subject,
      stat_category: statCategory,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_minutes: durationMins,
      distraction_count: distractions,
      focus_rating: focusRating,
      xp_gained: finalXp,
      notes: notes,
    });

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
    <div className={`rpg-panel ${isBreak ? "success-panel" : "ember-panel"}`}>
      <div className="panel-header">
        <h3 className="panel-title" style={{ color: isBreak ? "var(--color-success)" : "var(--color-ember)" }}>
          <Clock size={18} /> {isBreak ? "Rest & Recovery" : "Focus Chamber"}
        </h3>
        <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontFamily: "var(--font-display)" }}>
          {isBreak ? "Break Active" : `Training ${statCategory}`}
        </span>
      </div>

      <div style={{ display: "flex", gap: "2rem", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
        
        {/* Circular SVG Timer */}
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
              stroke={isBreak ? "var(--color-primary)" : "var(--color-ember)"}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.1s linear" }}
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
            {/* Animated pixel-art character */}
            <div 
              className="pixel-hero-idle" 
              style={{ 
                backgroundImage: `url(${isBreak ? longhairIdle : baseIdle})`,
                transform: "scale(3.5)",
                marginBottom: "0.5rem",
                marginTop: "-0.75rem",
                animationPlayState: isRunning ? "running" : "paused" // character pauses when timer pauses! Cute details!
              }} 
            />
            <span style={{ fontSize: "2.3rem", fontWeight: "bold", fontFamily: "var(--font-display)", color: "var(--color-text-dark)", letterSpacing: "0.5px" }}>
              {formatTime(timeLeft)}
            </span>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "2px" }}>
              {isBreak ? "Resting" : "Focusing"}
            </span>
          </div>
        </div>

        {/* Configuration Column */}
        <div style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column", gap: "1rem" }}>
          
          {/* Controls row */}
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button className="rpg-btn rpg-btn-primary" onClick={toggleTimer} style={{ flex: 1 }}>
              {isRunning ? <Pause size={16} /> : <Play size={16} />} {isRunning ? "Pause" : "Commence"}
            </button>
            <button className="rpg-btn rpg-btn-secondary" onClick={resetTimer} title="Reset Timer">
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Distraction logging */}
          {!isBreak && (
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
          {!isRunning && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", background: "rgba(0,0,0,0.25)", padding: "0.75rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.02)" }}>
              
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
                <>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <div style={{ flex: 2 }}>
                      <label className="rpg-label">Subject</label>
                      <input 
                        type="text" 
                        className="rpg-input" 
                        value={subject} 
                        onChange={(e) => setSubject(e.target.value)} 
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="rpg-label">Stat Focus</label>
                      <select 
                        className="rpg-select" 
                        value={statCategory} 
                        onChange={(e) => setStatCategory(e.target.value)}
                      >
                        <option value="INT">INT (Code/Sci)</option>
                        <option value="WIS">WIS (Read/Lib)</option>
                        <option value="STR">STR (Fit/Phys)</option>
                        <option value="DEX">DEX (Art/Skill)</option>
                        <option value="CHA">CHA (Speak/Lang)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
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
                You have completed your focus session on <strong>{subject}</strong>. Write down some notes about what you achieved.
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
                  placeholder="E.g., Finished Calculus Homework 3, worked on React state..."
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

    </div>
  );
};
