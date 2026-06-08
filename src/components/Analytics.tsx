import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BookOpen, Calendar, HelpCircle, Activity, HeartCrack } from "lucide-react";
import { ActivityLog } from "../services/db";

interface AnalyticsProps {
  logs: ActivityLog[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ logs }) => {
  // 1. Total Aggregations
  const totalSessions = logs.length;
  const totalFocusMinutes = logs.reduce((sum, log) => sum + log.duration_minutes, 0);
  const totalHours = (totalFocusMinutes / 60).toFixed(1);
  
  const avgRating = totalSessions > 0
    ? (logs.reduce((sum, log) => sum + log.focus_rating, 0) / totalSessions).toFixed(1)
    : "0.0";
    
  const totalDistractions = logs.reduce((sum, log) => sum + log.distraction_count, 0);
  const avgDistractionsPerSession = totalSessions > 0
    ? (totalDistractions / totalSessions).toFixed(1)
    : "0.0";

  // 2. Prepare Data for Daily Focus Chart (Last 7 Days)
  const getDailyData = () => {
    const dailyMap: { [date: string]: number } = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      dailyMap[dateString] = 0;
    }

    logs.forEach((log) => {
      const date = new Date(log.start_time);
      const dateString = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      if (dateString in dailyMap) {
        dailyMap[dateString] += log.duration_minutes;
      }
    });

    return Object.keys(dailyMap).map((date) => ({
      date,
      minutes: dailyMap[date],
    }));
  };

  const dailyChartData = getDailyData();

  // 3. Prepare Data for Subject breakdown
  const getSubjectData = () => {
    const subjectMap: { [subject: string]: number } = {};
    logs.forEach((log) => {
      subjectMap[log.subject] = (subjectMap[log.subject] || 0) + log.duration_minutes;
    });

    const colors = ["var(--color-primary)", "var(--color-secondary)", "var(--color-gold)", "var(--color-ember)", "#a78bfa", "#f472b6"];

    return Object.keys(subjectMap).map((sub, idx) => ({
      name: sub,
      value: subjectMap[sub],
      color: colors[idx % colors.length],
    }));
  };

  const subjectChartData = getSubjectData();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      
      {/* Aggregated Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        
        <div className="rpg-panel" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Total Study Time</span>
            <Calendar size={16} style={{ color: "var(--color-secondary)" }} />
          </div>
          <h3 style={{ fontSize: "1.8rem", marginTop: "0.5rem" }}>{totalHours} <span style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>hrs</span></h3>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>{totalFocusMinutes} minutes logged</p>
        </div>

        <div className="rpg-panel" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Sessions Completed</span>
            <BookOpen size={16} style={{ color: "var(--color-primary)" }} />
          </div>
          <h3 style={{ fontSize: "1.8rem", marginTop: "0.5rem" }}>{totalSessions} <span style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>quests</span></h3>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>Focus cycles completed</p>
        </div>

        <div className="rpg-panel" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Average Focus Quality</span>
            <Activity size={16} style={{ color: "var(--color-gold)" }} />
          </div>
          <h3 style={{ fontSize: "1.8rem", marginTop: "0.5rem" }}>{avgRating} <span style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>/ 5.0</span></h3>
          <div style={{ fontSize: "0.75rem", color: "var(--color-gold)", marginTop: "0.25rem" }}>
            {"★".repeat(Math.round(parseFloat(avgRating)))}
            {"☆".repeat(5 - Math.round(parseFloat(avgRating)))}
          </div>
        </div>

        <div className="rpg-panel" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Distractions Logged</span>
            <HeartCrack size={16} style={{ color: "var(--color-ember)" }} />
          </div>
          <h3 style={{ fontSize: "1.8rem", marginTop: "0.5rem", color: totalDistractions > 5 ? "var(--color-ember)" : "inherit" }}>
            {totalDistractions}
          </h3>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>Avg {avgDistractionsPerSession} per session</p>
        </div>
      </div>

      {/* Chart grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", minHeight: "300px" }}>
        
        {/* Daily Focus Chart */}
        <div className="rpg-panel" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h4 style={{ fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Daily Progress (Last 7 Days)</h4>
          {totalSessions === 0 ? (
            <EmptyStateMessage />
          ) : (
            <div style={{ width: "100%", height: "230px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData}>
                  <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} label={{ value: "Minutes", angle: -90, position: "insideLeft", style: { fill: "var(--color-text-muted)", fontSize: 11 } }} />
                  <Tooltip 
                    contentStyle={{ background: "#ffffff", border: "2px solid #ecd6bc", borderRadius: "10px" }}
                    labelStyle={{ color: "var(--color-text-dark)", fontWeight: "bold" }}
                  />
                  <Bar dataKey="minutes" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Subject Breakdown Chart */}
        <div className="rpg-panel" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h4 style={{ fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Subject Distribution</h4>
          {totalSessions === 0 ? (
            <EmptyStateMessage />
          ) : (
            <div style={{ display: "flex", alignItems: "center", height: "230px" }}>
              <div style={{ width: "50%", height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subjectChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {subjectChartData.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any) => [`${val} min`, "Study Time"]}
                      contentStyle={{ background: "#ffffff", border: "2px solid #ecd6bc", borderRadius: "10px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend List */}
              <div style={{ width: "50%", display: "flex", flexDirection: "column", gap: "0.5rem", overflowY: "auto", maxHeight: "180px", paddingRight: "0.5rem" }}>
                {subjectChartData.map((data) => (
                  <div key={data.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: data.color }} />
                      <span style={{ color: "var(--color-text-parchment)", fontWeight: "500" }}>{data.name}</span>
                    </div>
                    <span style={{ color: "var(--color-text-muted)" }}>{data.value} min</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ledger History List */}
      <div className="rpg-panel" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h4 style={{ fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Chronicle of Deeds (Ledger Logs)</h4>
        {logs.length === 0 ? (
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontStyle: "italic", textAlign: "center", padding: "1.5rem" }}>
            The chronicle lies empty. Embark on focus quests to record your actions.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "3px solid #ecd6bc", color: "var(--color-text-dark)", fontWeight: "bold" }}>
                  <th style={{ padding: "0.75rem" }}>Date</th>
                  <th style={{ padding: "0.75rem" }}>Subject</th>
                  <th style={{ padding: "0.75rem" }}>Stat Type</th>
                  <th style={{ padding: "0.75rem" }}>Duration</th>
                  <th style={{ padding: "0.75rem" }}>Rating</th>
                  <th style={{ padding: "0.75rem" }}>XP Gained</th>
                  <th style={{ padding: "0.75rem" }}>Adventure Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const date = new Date(log.start_time).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  
                  // Category specific colors
                  const badgeStyle = {
                    INT: { bg: "#e0f2fe", border: "#7dd3fc", color: "#0369a1" },
                    WIS: { bg: "#f3e8ff", border: "#d8b4fe", color: "#6b21a8" },
                    STR: { bg: "#fee2e2", border: "#fca5a5", color: "#b91c1c" },
                    DEX: { bg: "#dcfce7", border: "#86efac", color: "#15803d" },
                    CHA: { bg: "#fce7f3", border: "#fbcfe8", color: "#be185d" },
                  }[log.stat_category] || { bg: "#f1ede2", border: "#ecd6bc", color: "var(--color-text-dark)" };

                  return (
                    <tr key={log.id} style={{ borderBottom: "1px solid #ecd6bc", transition: "background 0.2s" }} className="table-row-hover">
                      <td style={{ padding: "0.75rem", color: "var(--color-text-muted)" }}>{date}</td>
                      <td style={{ padding: "0.75rem", fontWeight: "bold", color: "var(--color-text-dark)" }}>{log.subject}</td>
                      <td style={{ padding: "0.75rem" }}>
                        <span 
                          style={{ 
                            fontSize: "0.75rem", 
                            background: badgeStyle.bg, 
                            border: `1px solid ${badgeStyle.border}`, 
                            padding: "0.2rem 0.4rem", 
                            borderRadius: "6px", 
                            color: badgeStyle.color,
                            fontWeight: "bold"
                          }}
                        >
                          {log.stat_category}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem", color: "var(--color-text-dark)" }}>{log.duration_minutes} mins</td>
                      <td style={{ padding: "0.75rem", color: "var(--color-gold)", fontSize: "0.9rem" }}>
                        {"★".repeat(log.focus_rating)}
                      </td>
                      <td style={{ padding: "0.75rem", color: "var(--color-primary-dark)", fontWeight: "bold" }}>+{log.xp_gained} XP</td>
                      <td style={{ padding: "0.75rem", color: "var(--color-text-muted)", fontStyle: "italic", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.notes}>
                        {log.notes || "No notes inscribed."}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .table-row-hover:hover {
          background: rgba(116, 195, 60, 0.04);
        }
      `}</style>
    </div>
  );
};

const EmptyStateMessage = () => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1, height: "180px", color: "var(--color-text-muted)", gap: "0.5rem" }}>
    <HelpCircle size={24} style={{ color: "var(--color-gold-dim)" }} />
    <span style={{ fontSize: "0.85rem", fontStyle: "italic" }}>Awaiting records of your achievements...</span>
  </div>
);
