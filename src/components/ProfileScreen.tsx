import React, { useState } from 'react';
import { User, Settings, ShieldCheck, CreditCard, Volume2, Globe, Database, Trash2, LogOut, Award, Check } from 'lucide-react';
import { User as UserType, SOUND_PRESETS, MISSION_DETAILS, MissionType } from '../types';

interface ProfileScreenProps {
  user: UserType;
  onLogout: () => void;
  onUpgrade: () => void;
  onDowngrade: () => void;
  onDeleteAccount: () => void;
  defaultAlarmSound: string;
  setDefaultAlarmSound: (snd: string) => void;
  defaultMissionType: MissionType;
  setDefaultMissionType: (type: MissionType) => void;
}

export default function ProfileScreen({
  user,
  onLogout,
  onUpgrade,
  onDowngrade,
  onDeleteAccount,
  defaultAlarmSound,
  setDefaultAlarmSound,
  defaultMissionType,
  setDefaultMissionType
}: ProfileScreenProps) {
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');
  const [lang, setLang] = useState('English');
  const [notifSound, setNotifSound] = useState(true);
  const [vibeSound, setVibeSound] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExportData = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
        user: user,
        app: "W4KE",
        version: "1.1.2",
        exportedAt: new Date().toISOString()
      }, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href",     dataStr     );
      downloadAnchor.setAttribute("download", `W4KE_user_profile.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }, 1500);
  };

  return (
    <div className="flex-1 bg-slate-950 p-5 flex flex-col gap-4 text-left font-sans text-white select-none">
      
      {/* Header Profile Title */}
      <div className="flex items-center justify-between mt-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">System Settings</h2>
          <p className="text-slate-400 text-xs mt-0.5">Control billing preferences and parameters</p>
        </div>
        <Settings className="w-6 h-6 text-indigo-400 rotate-45" />
      </div>

      {/* Profile Bio block */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-4.5 flex gap-3.5 items-center">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-400 to-purple-650 flex items-center justify-center flex-shrink-0 relative shadow">
          <span className="text-white font-extrabold text-sm">{user.name ? user.name.slice(0, 2).toUpperCase() : 'W4'}</span>
          <div className="absolute right-0 bottom-0 w-3 h-3 bg-emerald-400 border-2 border-slate-900 rounded-full" />
        </div>
        <div className="overflow-hidden">
          <h3 className="text-sm font-bold text-white truncate leading-snug">{user.name || 'W4KE Guest'}</h3>
          <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">{user.email || 'guest_client@w4ke.net'}</p>
          <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-slate-950 text-[8px] font-mono text-purple-400 border border-slate-900 leading-none">
            {user.isGuest ? '⚠️ LOCAL PROFILE' : '✓ CLOUD BACKUP SYNCED'}
          </span>
        </div>
      </div>

      {/* Subscription PRO Banner */}
      <div className="bg-gradient-to-br from-purple-900/40 via-indigo-950/40 to-slate-900 border border-purple-500/20 rounded-3xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <Award className="w-24 h-24 text-orange-400" />
        </div>
        
        <div className="flex justify-between items-start gap-4">
          <div>
            <span className="text-[9.5px] font-mono tracking-widest text-orange-400 uppercase font-bold">W4KE PREMIUM MEMBERSHIP</span>
            <h4 className="text-sm font-extrabold text-white mt-1">Unlock Multi-Device Cloud Syncing</h4>
            <p className="text-[10.5px] text-slate-300 mt-1.5 leading-relaxed max-w-[210px] font-medium">
              Gain access to custom Made-Bed cameras, Object scavenger hunts, and unlimited alarm profiles!
            </p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span className="text-lg font-black text-orange-400 font-mono">$4.99<span className="text-[10px] font-normal text-slate-400">/m</span></span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-900/60 flex items-center justify-between">
          <span className="text-[10px] font-medium text-slate-400">
            Active status: <b className={user.isPremium ? 'text-orange-400' : 'text-sky-400'}>{user.isPremium ? '🏆 PRO MEMBER' : 'FREE TIER'}</b>
          </span>

          {user.isPremium ? (
            <button
              onClick={onDowngrade}
              className="px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[9.5px] font-mono text-slate-400 uppercase font-bold cursor-pointer"
            >
              Downgrade
            </button>
          ) : (
            <button
              onClick={onUpgrade}
              className="bg-gradient-to-r from-orange-400 to-purple-600 hover:opacity-95 text-slate-950 font-bold font-mono text-[9px] px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer uppercase shadow"
            >
              🚀 UPGRADE TO W4KE PRO
            </button>
          )}
        </div>
      </div>

      {/* Alarm Parameter Preferences */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-4 flex flex-col gap-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Alarm Configuration</h3>
        
        {/* Default sound config dropdown */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium">Default Alarm Ringtone</span>
          <select 
            value={defaultAlarmSound} 
            onChange={(e) => setDefaultAlarmSound(e.target.value)}
            className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-[10.5px] font-medium focus:outline-none focus:border-purple-500 font-sans cursor-pointer text-slate-100"
          >
            {SOUND_PRESETS.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} {s.premium ? '(PRO)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Default mission config dropdown */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium">Default Wake Challenge</span>
          <select 
            value={defaultMissionType} 
            onChange={(e) => setDefaultMissionType(e.target.value as MissionType)}
            className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-[10.5px] font-medium focus:outline-none focus:border-purple-500 font-sans cursor-pointer text-slate-100"
          >
            {Object.entries(MISSION_DETAILS).map(([type, detail]) => (
              <option key={type} value={type}>
                {detail.name} {detail.premium ? '(PRO)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* 12h / 24h toggle */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium">Time Format Setting</span>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
            <button
              onClick={() => setTimeFormat('12h')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${timeFormat === '12h' ? 'bg-purple-600 text-white' : 'text-slate-450'}`}
            >
              12 Hour
            </button>
            <button
              onClick={() => setTimeFormat('24h')}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${timeFormat === '24h' ? 'bg-purple-600 text-white' : 'text-slate-450'}`}
            >
              24 Hour
            </button>
          </div>
        </div>
      </div>

      {/* Global Interface Preferences */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-4 flex flex-col gap-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Global Settings</h3>
        
        {/* Languages dropdown selection */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-slate-500" />
            <span className="text-slate-300 font-medium">System Language</span>
          </div>
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value)}
            className="bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-[10.5px] font-medium focus:outline-none focus:border-purple-500 font-sans cursor-pointer text-slate-100"
          >
            <option value="English">🇬🇧 English</option>
            <option value="Arabic">🇸🇦 Arabic (العربية)</option>
            <option value="French">🇫🇷 French (Français)</option>
            <option value="Spanish">🇪🇸 Spanish (Español)</option>
          </select>
        </div>

        {/* Sound toggles */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium">Loud Background Notification Sound</span>
          <button
            onClick={() => setNotifSound(!notifSound)}
            className={`w-9 h-5 rounded-full p-0.5 flex transition-colors cursor-pointer ${notifSound ? 'bg-purple-600 justify-end' : 'bg-slate-850 justify-start'}`}
          >
            <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </button>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium">Haptic Vibration feedback</span>
          <button
            onClick={() => setVibeSound(!vibeSound)}
            className={`w-9 h-5 rounded-full p-0.5 flex transition-colors cursor-pointer ${vibeSound ? 'bg-purple-600 justify-end' : 'bg-slate-850 justify-start'}`}
          >
            <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </button>
        </div>
      </div>

      {/* System Actions Area */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-4 flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">System Actions</h3>
        
        <div className="flex flex-col gap-2">
          
          <button 
            onClick={handleExportData}
            disabled={exporting}
            className="w-full bg-slate-950/85 hover:bg-slate-900 border border-slate-850 py-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs text-slate-300 cursor-pointer disabled:opacity-40"
          >
            <Database className="w-4 h-4 text-indigo-400" /> 
            {exporting ? 'Compiling JSON profile...' : 'Export Local History & Profile'}
          </button>

          {user.isGuest ? null : (
            <button 
              onClick={onLogout}
              className="w-full bg-slate-950/85 hover:bg-slate-900 border border-slate-850 py-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs text-amber-500 cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-amber-400" /> Log Out (Pivot to Demo Ahmad)
            </button>
          )}

          <button 
            onClick={onDeleteAccount}
            className="w-full bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/35 py-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs text-rose-400 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-400" /> Wipe and Delete Active account
          </button>
        </div>
      </div>

      {/* About Box Section */}
      <div className="mb-4 text-center text-[10.5px] text-slate-500 font-mono flex flex-col gap-0.5">
        <span><b>W4KE App</b> • Made in Cloud Native Container</span>
        <span>Version 1.1.2 (Stable Build)</span>
      </div>

    </div>
  );
}
