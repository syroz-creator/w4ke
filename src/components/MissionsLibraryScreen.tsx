import React from 'react';
import { Compass, Play, ShieldAlert, Award, ChevronRight, Dumbbell, CloudSun, Calculator, Bed, Search, BookOpen } from 'lucide-react';
import { Alarm, MissionType, MISSION_DETAILS } from '../types';

interface MissionsLibraryScreenProps {
  onTriggerTestAlarm: (type: MissionType) => void;
  isPremium: boolean;
  onShowPaywall: () => void;
  activeAlarms: Alarm[];
}

export default function MissionsLibraryScreen({ onTriggerTestAlarm, isPremium, onShowPaywall, activeAlarms }: MissionsLibraryScreenProps) {
  
  const getMissionIconLarge = (type: MissionType) => {
    switch (type) {
      case 'push-ups': return <Dumbbell className="w-5 h-5 text-purple-400" />;
      case 'sky': return <CloudSun className="w-5 h-5 text-orange-400" />;
      case 'bed': return <Bed className="w-5 h-5 text-sky-400" />;
      case 'object': return <Search className="w-5 h-5 text-indigo-400" />;
      case 'reading': return <BookOpen className="w-5 h-5 text-pink-400" />;
      case 'math': return <Calculator className="w-5 h-5 text-emerald-400" />;
      default: return <Compass className="w-5 h-5 text-slate-400" />;
    }
  };

  // Helper to count how many alarms rely on this mission
  const activeCountForMission = (type: MissionType) => {
    return activeAlarms.filter(a => a.missionType === type).length;
  };

  return (
    <div className="flex-1 bg-slate-950 p-5 flex flex-col gap-4 text-left font-sans text-white select-none">
      
      {/* Header Profile Title */}
      <div className="flex items-center justify-between mt-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Missions Directory</h2>
          <p className="text-slate-400 text-xs mt-0.5">Explore challenges, configure limits, and test runs</p>
        </div>
        <Compass className="w-6 h-6 text-purple-400" />
      </div>

      <div className="bg-slate-900/35 border border-slate-850 p-4.5 rounded-3xl mb-1 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase">Interactive Sandbox Mode</span>
          <h4 className="text-xs font-bold font-sans">Morning Mission Playground</h4>
          <p className="text-[10px] text-slate-400 max-w-[220px]">Test any cognitive check immediately. No need to wait for alarms!</p>
        </div>
        <span className="text-xl">☀️</span>
      </div>

      <div className="flex flex-col gap-3">
        {(Object.keys(MISSION_DETAILS) as MissionType[]).filter(k => k !== 'none').map((key) => {
          const info = MISSION_DETAILS[key];
          const isLocked = info.premium && !isPremium;
          const assignedAlarmsCount = activeCountForMission(key);

          return (
            <div 
              key={key} 
              className={`rounded-3xl border p-4.5 transition-all text-left flex flex-col justify-between gap-3 relative ${
                isLocked 
                  ? 'bg-slate-950/85 border-slate-900 opacity-75' 
                  : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/50 shadow-sm'
              }`}
            >
              
              {/* Header block info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-center">
                    {getMissionIconLarge(key)}
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-white flex items-center gap-1.5 leading-snug">
                      {info.name}
                      {info.premium && (
                        <span className={`text-[8.5px] px-1.5 py-0.5 rounded uppercase font-bold leading-none ${
                          isPremium ? 'bg-orange-400/10 text-orange-400 border border-orange-400/20' : 'bg-orange-500/10 text-orange-400'
                        }`}>
                          PRO
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal max-w-[190px]">
                      {info.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-mono text-slate-500 uppercase">
                    {assignedAlarmsCount > 0 ? `Active: ${assignedAlarmsCount}` : 'Unassigned'}
                  </span>
                </div>
              </div>

              {/* Action layout trigger */}
              <div className="mt-1 pt-3.5 border-t border-slate-900/40 flex items-center justify-between">
                <span className="text-[9px] font-mono text-slate-500 font-bold uppercase">
                  ⭐ Challenge Preview Available
                </span>

                {isLocked ? (
                  <button
                    onClick={onShowPaywall}
                    className="bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold font-mono text-[9px] px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer uppercase transition-all"
                  >
                    Unlock Pro
                  </button>
                ) : (
                  <button
                    onClick={() => onTriggerTestAlarm(key)}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold font-mono text-[9px] px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer uppercase tracking-wider"
                  >
                    <Play className="w-2.5 h-2.5" /> Test Run Trial
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

      <div className="mb-4 text-center text-[10px] text-slate-500 font-mono">
        All templates support multi-tier snooze parameters.
      </div>

    </div>
  );
}
