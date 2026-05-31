import React from 'react';
import { Award, Calendar, Zap, Clock, ChevronRight, BarChart2, ShieldCheck } from 'lucide-react';
import { UserStats, MissionLog, MISSION_DETAILS } from '../types';

interface StatsScreenProps {
  stats: UserStats;
  logs: MissionLog[];
}

export default function StatsScreen({ stats, logs }: StatsScreenProps) {
  const weekdaysFull = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const weekdaysName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Helper to get total completions
  const completionRate = stats.missionsCompleted > 0 
    ? Math.round((stats.weeklyHistory.filter(h => h.completed).length / 7) * 100) 
    : 0;

  return (
    <div className="flex-1 bg-slate-950 p-5 flex flex-col gap-5 text-left font-sans text-white select-none">
      
      {/* Header Profile Title */}
      <div className="flex items-center justify-between mt-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Morning Statistics</h2>
          <p className="text-slate-400 text-xs mt-0.5">Your commitment to early rise records</p>
        </div>
        <Award className="w-6 h-6 text-orange-400 animate-pulse" />
      </div>

      {/* Grid Highlights cards */}
      <div className="grid grid-cols-2 gap-3.5">
        
        {/* Streak card */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-4 flex flex-col gap-1 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 opacity-5">
            <Zap className="w-24 h-24 text-orange-400" />
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-[10.5px] font-mono">
            <Zap className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            <span>CURRENT STREAK</span>
          </div>
          <span className="text-3xl font-black mt-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500 font-mono">
            {stats.streak} Days
          </span>
          <span className="text-[10px] text-slate-500 mt-1 font-medium">Record: {stats.maxStreak} Days max</span>
        </div>

        {/* Avg checkout wake time card */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-4 flex flex-col gap-1 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 opacity-5">
            <Clock className="w-24 h-24 text-purple-400" />
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-[10.5px] font-mono">
            <Clock className="w-3.5 h-3.5 text-purple-400" />
            <span>AVG WAKE TIME</span>
          </div>
          <span className="text-3xl font-black mt-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 font-mono">
            {stats.averageWakeTime}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 font-medium">Target window: 07:00 AM</span>
        </div>
      </div>

      {/* Completion Calendar row */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Weekly Achievement Calendar</h3>
          </div>
          <span className="text-xs font-bold text-orange-400 font-mono">{completionRate}% Goal</span>
        </div>

        {/* Calendar visual grid */}
        <div className="flex items-center justify-between px-1.5">
          {stats.weeklyHistory.map((h, i) => {
            const todayIndex = new Date().getDay();
            const isToday = weekdaysName[todayIndex] === h.day;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className={`text-[9.5px] font-semibold ${isToday ? 'text-purple-400' : 'text-slate-500'}`}>
                  {h.day}
                </span>
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                    h.completed 
                      ? 'bg-gradient-to-tr from-orange-400 to-purple-600 border-purple-500 text-white shadow-md' 
                      : isToday
                        ? 'bg-slate-950 border-purple-500/50 text-purple-400 border-dashed animate-pulse'
                        : 'bg-slate-950 border-slate-900 text-slate-700'
                  }`}
                >
                  {h.completed ? '✓' : '•'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown bar graph representation */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Missions Completed Breakdown</h3>
        </div>

        <div className="flex flex-col gap-2.5 mt-2">
          {Object.entries(stats.missionBreakdown).filter(([type]) => type !== 'none').map(([type, value]) => {
            const info = MISSION_DETAILS[type as any] || { name: type };
            // Calc width % relative to max value or total
            const totalVal = Object.values(stats.missionBreakdown).reduce((a, b) => a + b, 0) || 1;
            const pct = Math.round((value / totalVal) * 100);
            return (
              <div key={type} className="flex items-center justify-between text-left gap-3 text-xs">
                <div className="flex items-center gap-2 w-28 shrink-0">
                  <span className="text-[11px] font-semibold text-slate-300 truncate">{info.name}</span>
                </div>
                <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-400 to-purple-500 h-full rounded" style={{ width: `${Math.max(pct, 5)}%` }} />
                </div>
                <span className="w-8 text-right font-mono text-[10.5px] font-bold text-slate-400">{value} reps</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* History logs card list */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-4 flex flex-col gap-3 mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Historical Wake Logs</h3>
        {logs.length === 0 ? (
          <p className="text-center py-4 text-xs text-slate-500 italic font-medium">No wake entries in history logs yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {logs.slice(0, 6).map((log, index) => {
              const dateStr = new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
              const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const info = MISSION_DETAILS[log.missionType] || { name: 'Normal Alarm' };
              return (
                <div key={log.id || index} className="flex items-center justify-between p-3.5 bg-slate-950/45 border border-slate-900 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                      <span className="text-xs">
                        {log.missionType === 'push-ups' ? '💪' : log.missionType === 'sky' ? '🌤️' : log.missionType === 'math' ? '🖩' : '⏰'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{info.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{dateStr} • {timeStr}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-bold ${log.completed ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {log.completed ? 'SUCCESS' : 'MISSED'}
                    </span>
                    {log.completed && <span className="text-[9px] font-mono text-slate-500">{log.durationSeconds}s taken</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
