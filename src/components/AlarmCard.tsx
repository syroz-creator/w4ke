import React from 'react';
import { Power, Trash2, Clock, Dumbbell, CloudSun, Bed, Search, BookOpen, Calculator, Volume2 } from 'lucide-react';
import { Alarm, MissionType, MISSION_DETAILS } from '../types';

interface AlarmCardProps {
  key?: any;
  alarm: Alarm;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (alarm: Alarm) => void;
}

export default function AlarmCard({ alarm, onToggle, onDelete, onSelect }: AlarmCardProps) {
  const getMissionIcon = (type: MissionType) => {
    switch (type) {
      case 'push-ups': return <Dumbbell className="w-3.5 h-3.5" />;
      case 'sky': return <CloudSun className="w-3.5 h-3.5" />;
      case 'bed': return <Bed className="w-3.5 h-3.5" />;
      case 'object': return <Search className="w-3.5 h-3.5" />;
      case 'reading': return <BookOpen className="w-3.5 h-3.5" />;
      case 'math': return <Calculator className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Convert HH:MM to friendly display time
  const formatFriendlyTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hourDisplay = hour % 12 || 12;
    return {
      hours: hourDisplay,
      minutes: m,
      ampm
    };
  };

  const { hours, minutes, ampm } = formatFriendlyTime(alarm.time);
  const info = MISSION_DETAILS[alarm.missionType] || MISSION_DETAILS['none'];

  return (
    <div 
      className={`relative rounded-3xl border p-5 transition-all text-left flex flex-col gap-3 group ${
        alarm.isActive 
          ? 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/60 shadow-lg' 
          : 'bg-slate-950 border-slate-900 opacity-60 hover:opacity-80'
      }`}
    >
      <div className="flex items-start justify-between">
        
        {/* Core details trigger */}
        <div className="cursor-pointer flex-1" onClick={() => onSelect(alarm)}>
          <div className="flex items-baseline gap-1 text-white">
            <span className="text-4xl font-extrabold tracking-tight font-sans">
              {hours}:{minutes}
            </span>
            <span className="text-[11px] font-bold font-sans text-slate-400 uppercase tracking-widest ml-1">{ampm}</span>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <h4 className="text-xs font-semibold text-slate-200 tracking-tight leading-tight">
              {alarm.label || 'Alarm'}
            </h4>

            {/* Weekday indicator rows */}
            <div className="flex items-center gap-1.5 mt-1 select-none">
              {weekdays.map((letter, i) => {
                const isActiveDay = alarm.repeatDays.includes(i);
                return (
                  <span
                    key={i}
                    className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[8.5px] font-sans font-bold transition-all ${
                      isActiveDay
                        ? alarm.isActive 
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30' 
                          : 'bg-slate-800 text-slate-400 border border-slate-700/30'
                        : 'bg-slate-950/20 text-slate-600 border border-slate-900/30'
                    }`}
                  >
                    {letter}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Master Active Switch Slider */}
        <div className="flex flex-col items-end gap-5">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggle(alarm.id)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                alarm.isActive ? 'bg-gradient-to-r from-orange-400 to-purple-600' : 'bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  alarm.isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          
          {/* Quick trash action */}
          <button 
            onClick={() => onDelete(alarm.id)}
            className="p-1.5 rounded-full bg-slate-900/80 border border-slate-800/80 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer"
            title="Delete Alarm"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Footer quick badges */}
      <div className="border-t border-slate-900 mt-2 pt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-sans font-semibold flex items-center gap-1 leading-none ${
            alarm.isActive
              ? 'bg-purple-500/10 text-purple-300 border border-purple-500/10'
              : 'bg-slate-900 text-slate-500 border border-slate-900'
          }`}>
            {getMissionIcon(alarm.missionType)}
            {info.name}
          </span>
          <span className="text-[10px] font-sans text-slate-500 truncate max-w-[120px] font-medium">
            {info.shortDesc}
          </span>
        </div>

        {/* Level and sound tag details */}
        <div className="flex items-center gap-2">
          {alarm.difficulty && alarm.missionType !== 'none' && (
            <span className={`text-[8.5px] font-bold uppercase tracking-wider rounded-sm px-1.5 py-0.5 leading-none ${
              alarm.difficulty === 'hard' 
                ? 'bg-rose-500/10 text-rose-400' 
                : alarm.difficulty === 'medium'
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-indigo-500/10 text-indigo-400'
            }`}>
              {alarm.difficulty}
            </span>
          )}
          <Volume2 className="w-3 h-3 text-slate-500" />
        </div>
      </div>
    </div>
  );
}
