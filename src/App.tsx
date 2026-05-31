import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Sparkles, AlertCircle, Compass, Award, User, Clock, Bell, RefreshCw, Zap, Volume2, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Alarm, MissionType, DifficultySetting, User as UserType, UserStats, SOUND_PRESETS, MISSION_DETAILS } from './types';

// Importing high-fidelity sub-components
import MobileFrame from './components/MobileFrame';
import Onboarding from './components/Onboarding';
import AlarmCard from './components/AlarmCard';
import AlarmRinging from './components/AlarmRinging';
import MissionsScreen from './components/MissionsScreen';
import StatsScreen from './components/StatsScreen';
import MissionsLibraryScreen from './components/MissionsLibraryScreen';
import ProfileScreen from './components/ProfileScreen';

export default function App() {
  // Global States
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'alarms' | 'missions' | 'stats' | 'profile'>('alarms');
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Active Alarm Ringing state
  const [activeRingingAlarm, setActiveRingingAlarm] = useState<Alarm | null>(null);
  const [activeMissionAlarm, setActiveMissionAlarm] = useState<Alarm | null>(null);
  
  // Pending Simulated Background Push notification item
  const [pendingNotif, setPendingNotif] = useState<{ id: string; label: string; mission: string; time: string } | null>(null);
  
  // Simulated hardware lockscreen state 
  const [isPhoneLocked, setIsPhoneLocked] = useState(false);
  const [notifSound, setNotifSound] = useState(true);

  // Edit / Create Alarm Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // Form Fields
  const [timeField, setTimeField] = useState('07:00');
  const [labelField, setLabelField] = useState('');
  const [repeatDaysField, setRepeatDaysField] = useState<number[]>([1, 2, 3, 4, 5]); // defaults weekdays
  const [missionField, setMissionField] = useState<MissionType>('none');
  const [diffField, setDiffField] = useState<DifficultySetting>('easy');
  const [soundField, setSoundField] = useState('gentle-waves');
  const [volumeField, setVolumeField] = useState(0.8);
  const [snoozeField, setSnoozeField] = useState(true);
  const [snoozeDurationField, setSnoozeDurationField] = useState(5);
  const [maxSnoozeField, setMaxSnoozeField] = useState(3);
  const [gradualField, setGradualField] = useState(false);

  // Sync Profile Details Default state
  const [defaultAlarmSound, setDefaultAlarmSound] = useState('gentle-waves');
  const [defaultMissionType, setDefaultMissionType] = useState<MissionType>('push-ups');

  // Triggering countdown state for simulated tests
  const [currentCountdown, setCurrentCountdown] = useState<number | null>(null);
  const countdownIntervalRef = useRef<any>(null);
  const lastTriggeredTimeStrRef = useRef<string>('');

  /* =========================================================================
     REST BACKEND COMMUNICATION SYNC
     ========================================================================= */

  const syncAllData = async () => {
    try {
      // 1. Fetch Session user
      const userRes = await fetch('/api/auth/session');
      const userData = await userRes.json();
      
      if (userRes.ok && userData.user) {
        setCurrentUser(userData.user);
        
        // 2. Fetch Alarms
        const alarmRes = await fetch('/api/alarms');
        const alarmData = await alarmRes.json();
        setAlarms(alarmData);

        // 3. Fetch stats and logs
        const statsRes = await fetch('/api/stats');
        const statsData = await statsRes.json();
        setStats(statsData.stats);
        setLogs(statsData.logs);
      }
    } catch (e) {
      console.error("Backend offline, utilizing default guest sandbox states.", e);
      setErrorMsg("Backend offline. Fallback memory operation activated.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    syncAllData();
  }, []);

  // Monitor regular background clock to see if alarm triggers (exact hh:mm match)
  useEffect(() => {
    const clockScheduler = setInterval(() => {
      if (activeRingingAlarm || activeMissionAlarm || pendingNotif || isPhoneLocked) return;

      const now = new Date();
      const currentH = now.getHours().toString().padStart(2, '0');
      const currentM = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentH}:${currentM}`;

      // Search matching active alarms
      const currentDayIndex = now.getDay();
      const triggered = alarms.find(alarm => {
        if (!alarm.isActive) return false;
        
        // Match repeat days if configured, otherwise matches exact time
        const dayMatch = alarm.repeatDays.length === 0 || alarm.repeatDays.includes(currentDayIndex);
        return alarm.time === currentTimeStr && dayMatch;
      });

      if (triggered && lastTriggeredTimeStrRef.current !== currentTimeStr) {
        lastTriggeredTimeStrRef.current = currentTimeStr;

        // Start ringing instantly in-app!
        setActiveRingingAlarm(triggered);

        // Also queue system banner alert
        const missionInfo = MISSION_DETAILS[triggered.missionType] || { name: 'Slide Dismiss' };
        setPendingNotif({
          id: triggered.id,
          label: triggered.label || 'W4KE Wakeup',
          mission: missionInfo.name,
          time: triggered.time
        });

        // Trigger automatic system phone vibration sound beep
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.35);
        } catch {}
      }
    }, 3000); // Check every 3s for exact high-fidelity response

    return () => clearInterval(clockScheduler);
  }, [alarms, activeRingingAlarm, activeMissionAlarm, pendingNotif, isPhoneLocked]);

  /* =========================================================================
     ALARM REQUISITE MUTATIONS
     ========================================================================= */

  const handleToggleAlarm = async (id: string) => {
    try {
      const response = await fetch(`/api/alarms/${id}/toggle`, { method: 'PUT' });
      if (response.ok) {
        const data = await response.json();
        setAlarms(data.alarms);
      }
    } catch {
      // Local fallback
      setAlarms(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
    }
  };

  const handleDeleteAlarm = async (id: string) => {
    try {
      const response = await fetch(`/api/alarms/${id}`, { method: 'DELETE' });
      if (response.ok) {
        const data = await response.json();
        setAlarms(data.alarms);
      }
    } catch {
      setAlarms(prev => prev.filter(a => a.id !== id));
    }
  };

  const handleOpenAddModal = (existing?: Alarm) => {
    if (existing) {
      setEditingAlarm(existing);
      setTimeField(existing.time);
      setLabelField(existing.label);
      setRepeatDaysField(existing.repeatDays);
      setMissionField(existing.missionType);
      setDiffField(existing.difficulty);
      setSoundField(existing.sound);
      setVolumeField(existing.volume);
      setSnoozeField(existing.snoozeEnabled);
      setSnoozeDurationField(existing.snoozeDuration);
      setMaxSnoozeField(existing.maxSnoozes);
      setGradualField(existing.gradualVolume);
    } else {
      setEditingAlarm(null);
      setTimeField('07:30');
      setLabelField('');
      setRepeatDaysField([1, 2, 3, 4, 5]);
      setMissionField(defaultMissionType);
      setDiffField('easy');
      setSoundField(defaultAlarmSound);
      setVolumeField(0.8);
      setSnoozeField(true);
      setSnoozeDurationField(5);
      setMaxSnoozeField(3);
      setGradualField(false);
    }
    setShowAddModal(true);
  };

  const handleSaveAlarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // W4KE Free Tier Guard check (limit 3 active alarms)
    const isEditing = !!editingAlarm;
    const isPro = currentUser?.isPremium;
    if (!isPro && !isEditing && alarms.length >= 3) {
      setShowAddModal(false);
      setShowPaywall(true);
      return;
    }

    // Build the payload
    const payload = {
      time: timeField,
      label: labelField || (missionField === 'none' ? 'Alarm' : `${MISSION_DETAILS[missionField].name}`),
      repeatDays: repeatDaysField,
      missionType: missionField,
      difficulty: diffField,
      sound: soundField,
      vibration: true,
      snoozeEnabled: snoozeField,
      snoozeDuration: snoozeDurationField,
      maxSnoozes: maxSnoozeField,
      volume: volumeField,
      gradualVolume: gradualField,
      isActive: true
    };

    try {
      let response;
      if (isEditing) {
        response = await fetch(`/api/alarms/${editingAlarm.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch('/api/alarms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await response.json();
      if (response.ok) {
        syncAllData();
        setShowAddModal(false);
      } else {
        // Limit error payload handle
        if (data.error === "Limit Reached") {
          setShowAddModal(false);
          setShowPaywall(true);
        } else {
          setErrorMsg(data.error || 'Failed saving alarm specifications.');
        }
      }
    } catch {
      // Offline fallback
      if (isEditing) {
        setAlarms(prev => prev.map(a => a.id === editingAlarm.id ? { ...a, ...payload } : a));
      } else {
        const dummy: Alarm = { id: `alarm_fallback_${Date.now()}`, currentSnoozeCount: 0, ...payload };
        setAlarms(prev => [...prev, dummy]);
      }
      setShowAddModal(false);
    }
  };

  const handleTriggerSimulatedLockdown = (alarmObj: Alarm) => {
    // 1. Close modal
    setShowAddModal(false);
    
    // 2. Lock device view instantly
    setIsPhoneLocked(true);
    
    // 3. Initiate countdown inside device
    setCurrentCountdown(3);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    let cnt = 3;
    countdownIntervalRef.current = setInterval(() => {
      cnt--;
      setCurrentCountdown(cnt);
      if (cnt <= 0) {
        clearInterval(countdownIntervalRef.current);
        setCurrentCountdown(null);
        // Turn device back on
        setIsPhoneLocked(false);
        // Fire alarm ring state immediately!
        setActiveRingingAlarm(alarmObj);
        // Deploy notifications block
        setPendingNotif({
          id: alarmObj.id,
          label: alarmObj.label || 'W4KE Wakeup',
          mission: MISSION_DETAILS[alarmObj.missionType].name,
          time: alarmObj.time
        });
      }
    }, 1000);
  };

  /* =========================================================================
     NOTIFICATION & TRIAL ACCEPTOR
     ========================================================================= */

  const handleAcceptNotif = () => {
    if (!pendingNotif) return;
    const targetAlarm = alarms.find(a => a.id === pendingNotif.id);
    setPendingNotif(null);
    if (targetAlarm) {
      setActiveRingingAlarm(targetAlarm);
    }
  };

  const handleSnoozeActiveAlarm = () => {
    if (!activeRingingAlarm) return;
    
    // Increase internal snooze index
    const updatedAlarms = alarms.map(a => {
      if (a.id === activeRingingAlarm.id) {
        return { ...a, currentSnoozeCount: a.currentSnoozeCount + 1 };
      }
      return a;
    });
    setAlarms(updatedAlarms);
    
    // Switch state off and simulated pop up alarm notification after 10 seconds of snooze
    const storedRinging = { ...activeRingingAlarm, currentSnoozeCount: activeRingingAlarm.currentSnoozeCount + 1 };
    setActiveRingingAlarm(null);

    setPendingNotif(null);
    setTimeout(() => {
      setPendingNotif({
        id: storedRinging.id,
        label: `[SNOOZED] ${storedRinging.label}`,
        mission: MISSION_DETAILS[storedRinging.missionType].name,
        time: storedRinging.time
      });
    }, 8000);
  };

  /* =========================================================================
     MISSION STAGES & ACTIONS CALLBACKS
     ========================================================================= */

  const handleCompleteActiveMission = async (secondsTaken: number) => {
    const alarmRef = activeMissionAlarm || activeRingingAlarm;
    setActiveMissionAlarm(null);
    setActiveRingingAlarm(null);

    if (!alarmRef) return;

    try {
      const res = await fetch('/api/stats/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alarmId: alarmRef.id,
          missionType: alarmRef.missionType,
          durationSeconds: secondsTaken
        })
      });
      if (res.ok) {
        syncAllData();
      }
    } catch {
      // Fallback
      if (stats) {
        setStats({
          ...stats,
          streak: stats.streak + 1,
          missionsCompleted: stats.missionsCompleted + 1
        });
      }
    }

    // Success sound synthesis fanfare!
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      let now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.5);
      });
    } catch {}

    // Pop alert greeting
    alert(`🎉 MISSION ACCOMPLISHED! \n"Mission accomplished. You’re unstoppable." \nAlarm silenced completely.`);
  };

  const handleAbandonMission = async () => {
    const alarmRef = activeMissionAlarm || activeRingingAlarm;
    setActiveMissionAlarm(null);
    setActiveRingingAlarm(null);

    if (!alarmRef) return;

    try {
      const res = await fetch('/api/stats/miss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alarmId: alarmRef.id, missionType: alarmRef.missionType })
      });
      if (res.ok) {
        syncAllData();
      }
    } catch {
      if (stats) setStats({ ...stats, streak: 0 });
    }

    alert(`⚠️ MISSION BYPASSED \n"You missed this one. Tomorrow is yours." \nAlarm has been quietened but streak has reset.`);
  };

  /* =========================================================================
     PREMIUM CHEKCOUT SUBSCRIPTION MUTATORS
     ========================================================================= */

  const handleUpgradeToPremium = async () => {
    try {
      const res = await fetch('/api/subscription/upgrade', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setShowPaywall(false);
        // high pitch bell synth
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          const ctx = new AudioCtx();
          const osc = ctx.createOscillator();
          osc.frequency.setValueAtTime(1200, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.3);
          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        } catch {}
      }
    } catch {
      if (currentUser) setCurrentUser({ ...currentUser, isPremium: true });
    }
  };

  const handleCancelPremium = async () => {
    try {
      const res = await fetch('/api/subscription/downgrade', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } catch {
      if (currentUser) setCurrentUser({ ...currentUser, isPremium: false });
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to completely erase your account and synched database entries?")) {
      try {
        await fetch('/api/auth/delete', { method: 'POST' });
        syncAllData();
        setActiveTab('alarms');
      } catch {
        alert("Account reset completed.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      syncAllData();
      setActiveTab('alarms');
    } catch {}
  };

  // Determine dynamic greeting based on real-world local hour of browser
  const getDynamicGreetingAndSubtext = () => {
    const hour = new Date().getHours();
    const isAhmad = currentUser?.name === "Ahmad";
    const nameStr = currentUser?.name || 'Ahmad';
    
    let greet = "Good morning, " + nameStr + " 🌅";
    if (hour >= 12 && hour < 17) greet = "Good afternoon, " + nameStr + " ☕";
    else if (hour >= 17 || hour < 4) greet = "Good evening, " + nameStr + " 🌙";

    const completedThisWeek = stats?.weeklyHistory.filter(h => h.completed).length || 0;
    const sub = `You’ve completed ${completedThisWeek} missions this week.`;

    return { greet, sub };
  };

  const { greet, sub } = getDynamicGreetingAndSubtext();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-sans text-center">
        <RefreshCw className="w-10 h-10 text-orange-400 animate-spin mb-4" />
        <h2 className="text-xl font-bold tracking-tight">Waking up W4KE system...</h2>
        <p className="text-slate-500 text-xs mt-1">Acquiring sandbox databases & initializing loop clocks</p>
      </div>
    );
  }

  // If no user is logged in, show the beautiful onboarding flow
  if (!currentUser) {
    return (
      <MobileFrame 
        activeTab="alarms" 
        setActiveTab={() => {}} 
        isPremium={false}
        pendingNotification={null}
        onAcceptNotification={() => {}}
        onClearNotification={() => {}}
        onTogglePower={() => {}}
        isPhoneLocked={false}
      >
        <Onboarding 
          onComplete={(usr) => setCurrentUser(usr)} 
          onGuestMode={async () => {
            try {
              const res = await fetch('/api/auth/guest', { method: 'POST' });
              const d = await res.json();
              if (res.ok && d.user) setCurrentUser(d.user);
            } catch {
              setCurrentUser({ id: 'guest_fallback', name: 'Ahmad Guest', isPremium: false, isGuest: true });
            }
          }} 
        />
      </MobileFrame>
    );
  }

  return (
    <MobileFrame
      activeTab={activeTab}
      setActiveTab={(t: any) => setActiveTab(t)}
      isPremium={currentUser.isPremium}
      userEmail={currentUser.email}
      userName={currentUser.name}
      pendingNotification={pendingNotif}
      onAcceptNotification={handleAcceptNotif}
      onClearNotification={() => setPendingNotif(null)}
      onTogglePower={() => setIsPhoneLocked(prev => !prev)}
      isPhoneLocked={isPhoneLocked}
    >
      
      {/* Dynamic Alarm countdown timing active overlay */}
      {currentCountdown !== null && (
        <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center z-50 text-center p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          <Clock className="w-12 h-12 text-orange-400 animate-pulse mb-4" />
          <h2 className="text-2xl font-black text-white tracking-tight">STANDBY WAKE ACTIVE</h2>
          <p className="text-slate-400 text-xs mt-1 max-w-[240px] leading-relaxed">
            W4KE is armed. Keep screen active or let it countdown. Alarm triggers in:
          </p>
          <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-orange-400 to-purple-600 font-mono mt-5">
            {currentCountdown}s
          </span>
        </div>
      )}

      {/* FULL RINGING MODE SCREEN OVERLAY */}
      {activeRingingAlarm && (
        <AlarmRinging
          alarm={activeRingingAlarm}
          soundEnabled={notifSound}
          onStartMission={() => {
            setActiveMissionAlarm(activeRingingAlarm);
            setActiveRingingAlarm(null);
          }}
          onSnooze={handleSnoozeActiveAlarm}
        />
      )}

      {/* INTERACTIVE MISSION RUN EXECUTOR OVERLAY */}
      {activeMissionAlarm && (
        <MissionsScreen
          alarm={activeMissionAlarm}
          onCompleteMission={handleCompleteActiveMission}
          onAbandon={handleAbandonMission}
        />
      )}

      {/* Main tab content selector router */}
      <div className="flex-1 overflow-y-auto w-full relative flex flex-col bg-slate-950">
        
        {/* TAB 1: ALARMS LIST DASHBOARD */}
        {activeTab === 'alarms' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 flex flex-col gap-4 text-left">
            
            {/* Header section with Greeting */}
            <div className="flex items-center justify-between mt-3">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">{greet}</h2>
                <p className="text-xs text-slate-450 mt-0.5 text-slate-400">{sub}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center relative shadow cursor-pointer" onClick={() => setActiveTab('profile')}>
                <User className="w-4 h-4 text-slate-300" />
                {!currentUser.isPremium && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-orange-400" />}
              </div>
            </div>

            {/* Simulated background reminder info */}
            <div className="bg-gradient-to-r from-orange-500/10 via-purple-500/5 to-transparent border border-orange-500/15 rounded-3xl p-4 mt-1">
              <span className="text-[10px] font-mono tracking-widest text-orange-400 uppercase font-bold flex items-center gap-1">
                ⚡ Proximity Alert enabled
              </span>
              <p className="text-[11px] text-slate-300 font-medium leading-relaxed mt-1">
                To test an alarm immediately without waiting, select <b>“Simulate Rise”</b> inside your alarm edit drawer.
              </p>
            </div>

            {/* List block */}
            <div className="flex flex-col gap-3.5 mt-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider select-none font-mono">
                <span>Wakeup routines</span>
                <span>Active: {alarms.filter(a => a.isActive).length}</span>
              </div>

              {alarms.length === 0 ? (
                <div className="border border-dashed border-slate-850 p-8 rounded-3xl flex flex-col items-center justify-center text-center text-slate-500">
                  <span className="text-3xl">⏰</span>
                  <p className="text-xs font-semibold mt-2">No alarms configured</p>
                  <p className="text-[10px] text-slate-400 max-w-[200px] mt-1">Click the float plus below to configure standard wake schedules!</p>
                </div>
              ) : (
                alarms.map((alarm) => (
                  <AlarmCard
                    key={alarm.id}
                    alarm={alarm}
                    onToggle={(id) => { handleToggleAlarm(id); }}
                    onDelete={(id) => { handleDeleteAlarm(id); }}
                    onSelect={(a) => { handleOpenAddModal(a); }}
                  />
                ))
              )}
            </div>

            {/* Floating add action */}
            <div className="h-20" /> {/* spacing bottom */}
            
            <button
              onClick={() => handleOpenAddModal()}
              className="absolute right-6 bottom-6 w-14 h-14 rounded-full bg-gradient-to-tr from-orange-400 via-pink-500 to-purple-600 text-white flex items-center justify-center shadow-xl shadow-purple-950/40 z-30 cursor-pointer border border-white/20 transition-transform active:scale-95"
              title="Configure wake alarm"
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </button>
          </motion.div>
        )}

        {/* TAB 2: MISSIONS LIBRARY */}
        {activeTab === 'missions' && (
          <MissionsLibraryScreen
            activeAlarms={alarms}
            isPremium={currentUser.isPremium}
            onShowPaywall={() => setShowPaywall(true)}
            onTriggerTestAlarm={(type) => {
              // start active sandbox alarm testing
              const templateAlarm: Alarm = {
                id: "sandbox_temp_alarm",
                time: "Current",
                label: `Sandbox Test Run`,
                repeatDays: [],
                missionType: type,
                difficulty: 'easy',
                sound: 'gentle-waves',
                vibration: true,
                snoozeEnabled: true,
                snoozeDuration: 5,
                maxSnoozes: 2,
                currentSnoozeCount: 0,
                isActive: true,
                volume: 0.6,
                gradualVolume: false
              };
              setActiveRingingAlarm(templateAlarm);
            }}
          />
        )}

        {/* TAB 3: STATISTICS */}
        {activeTab === 'stats' && stats && (
          <StatsScreen stats={stats} logs={logs} />
        )}

        {/* TAB 4: SYSTEM PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <ProfileScreen
            user={currentUser}
            onLogout={handleLogout}
            onUpgrade={handleUpgradeToPremium}
            onDowngrade={handleCancelPremium}
            onDeleteAccount={handleDeleteAccount}
            defaultAlarmSound={defaultAlarmSound}
            setDefaultAlarmSound={setDefaultAlarmSound}
            defaultMissionType={defaultMissionType}
            setDefaultMissionType={setDefaultMissionType}
          />
        )}

      </div>

      {/* FIXED BOTTOM EMBEDDED TAB BAR */}
      <div className="h-16 bg-slate-950/95 border-t border-slate-900 flex items-center justify-around px-2 select-none z-30">
        {[
          { tabId: 'alarms', label: 'Alarms', icon: <Clock className="w-[18px] h-[18px]" /> },
          { tabId: 'missions', label: 'Missions', icon: <Compass className="w-[18px] h-[18px]" /> },
          { tabId: 'stats', label: 'Stats', icon: <Award className="w-[18px] h-[18px]" /> },
          { tabId: 'profile', label: 'Profile', icon: <User className="w-[18px] h-[18px]" /> }
        ].map((item) => {
          const isActive = activeTab === item.tabId;
          return (
            <button
              key={item.tabId}
              onClick={() => setActiveTab(item.tabId as any)}
              className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3.5 rounded-2xl cursor-pointer transition-all ${
                isActive 
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-purple-500 scale-105 font-bold' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className={isActive ? "text-purple-400" : "text-current"}>{item.icon}</div>
              <span className="text-[9.5px] font-sans font-medium tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
         MODAL DRAWERS (CREATE/EDIT ALARM DRAWER)
         ========================================================================= */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-xs z-50 flex flex-col justify-end text-left"
          >
            {/* Slide up panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-slate-900 rounded-t-[36px] max-h-[85%] overflow-y-auto border-t border-slate-800 p-6 flex flex-col gap-4 text-white font-sans selection:bg-purple-900/40"
            >
              
              {/* Drawer Top Header strip */}
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
                <div className="flex gap-2.5 items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                    {editingAlarm ? 'Update Alarm Profile' : 'Configure New Alarm'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 px-2.5 rounded-full bg-slate-800 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Error messages if any */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/25 text-rose-400 text-xs font-mono">
                  {errorMsg}
                </div>
              )}

              {/* Form entries */}
              <form onSubmit={handleSaveAlarm} className="flex flex-col gap-4">
                
                {/* Simulated Quick rise Sandbox Test button in Drawer */}
                {editingAlarm && (
                  <button
                    type="button"
                    onClick={() => handleTriggerSimulatedLockdown(editingAlarm)}
                    className="w-full bg-gradient-to-r from-orange-400 to-purple-600 hover:opacity-95 text-xs text-slate-950 font-black py-3 rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer shadow active:scale-98 transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
                    SIMULATE RINGING (Countdown sleep)
                  </button>
                )}

                {/* Section A: Time Picker Picker */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-purple-400 font-bold uppercase">Time Schedule</label>
                  <div className="flex gap-2 items-center justify-start">
                    <input
                      type="time"
                      value={timeField}
                      onChange={(e) => setTimeField(e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-3xl font-extrabold font-mono rounded-2xl p-4 w-full text-center text-orange-400 select-all"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">Traditional and Smart wakeup windows available in high resolution.</span>
                </div>

                {/* Section B: Name Label */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-purple-400 font-bold uppercase">Description Label</label>
                  <input
                    type="text"
                    value={labelField}
                    onChange={(e) => setLabelField(e.target.value)}
                    placeholder="e.g. 🌅 Wake and Grind, Gym Session"
                    className="bg-slate-950 border border-slate-800 text-xs rounded-xl p-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Section C: Weekday Dots Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-purple-400 font-bold uppercase">Weekly Repeats</label>
                  <div className="flex gap-2 justify-between mt-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => {
                      const isSelected = repeatDaysField.includes(idx);
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setRepeatDaysField(prev => prev.filter(d => d !== idx));
                            } else {
                              setRepeatDaysField(prev => [...prev, idx]);
                            }
                          }}
                          className={`w-9 h-9 rounded-full text-xs font-bold font-sans transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-purple-600 text-white border border-purple-500 shadow-md scale-105' 
                              : 'bg-slate-950 text-slate-500 hover:text-slate-300 hover:border-slate-800 border border-slate-850/60'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Presets Row */}
                  <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-950 p-1.5 border border-slate-850 mt-1.5 text-[9.5px]">
                    <button
                      type="button"
                      onClick={() => setRepeatDaysField([1, 2, 3, 4, 5])}
                      className="py-1 rounded bg-slate-900 border border-slate-800 hover:text-slate-200 cursor-pointer font-semibold text-slate-400 text-center"
                    >
                      Weekdays
                    </button>
                    <button
                      type="button"
                      onClick={() => setRepeatDaysField([6, 0])}
                      className="py-1 rounded bg-slate-900 border border-slate-800 hover:text-slate-200 cursor-pointer font-semibold text-slate-400 text-center"
                    >
                      Weekends
                    </button>
                    <button
                      type="button"
                      onClick={() => setRepeatDaysField([0, 1, 2, 3, 4, 5, 6])}
                      className="py-1 rounded bg-slate-900 border border-slate-800 hover:text-slate-200 cursor-pointer font-semibold text-slate-400 text-center"
                    >
                      Every Day
                    </button>
                    <button
                      type="button"
                      onClick={() => setRepeatDaysField([])}
                      className="py-1 rounded bg-slate-900 border border-slate-800 hover:text-slate-200 cursor-pointer font-semibold text-slate-400 text-center"
                    >
                      Once
                    </button>
                  </div>
                </div>

                {/* Section D: Mission Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-purple-400 font-bold uppercase">Morning Duty Mission</label>
                  <select
                    value={missionField}
                    onChange={(e) => {
                      const selected = e.target.value as MissionType;
                      // Guard paywall for premium-only select
                      const info = MISSION_DETAILS[selected];
                      if (info.premium && !currentUser?.isPremium) {
                        setShowPaywall(true);
                      } else {
                        setMissionField(selected);
                      }
                    }}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500 font-sans cursor-pointer"
                  >
                    {Object.entries(MISSION_DETAILS).map(([type, detail]) => (
                      <option key={type} value={type}>
                        {detail.name} {detail.premium ? '🏆 [PRO]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section E: Difficulty configurations (only relevant if not default immediate turn off) */}
                {missionField !== 'none' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-purple-400 font-bold uppercase">Duty Difficulty Level</label>
                    <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-850">
                      {(['easy', 'medium', 'hard'] as DifficultySetting[]).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setDiffField(level)}
                          className={`py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer cursor-grab ${
                            diffField === level 
                              ? 'bg-purple-650 bg-gradient-to-tr from-purple-600 to-indigo-700 text-white shadow-md' 
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section F: Sounds dropdown & Volumes */}
                <div className="p-4 bg-slate-950 border border-slate-850 rounded-2xl flex flex-col gap-3.5 mt-1.5">
                    
                  {/* Select sound key */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Synthesizer Tone</span>
                    <select
                      value={soundField}
                      onChange={(e) => {
                        const sPreset = SOUND_PRESETS.find(p => p.id === e.target.value);
                        if (sPreset?.premium && !currentUser?.isPremium) {
                          setShowPaywall(true);
                        } else {
                          setSoundField(e.target.value);
                        }
                      }}
                      className="bg-slate-905 bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[10px] focus:outline-none font-medium cursor-pointer text-slate-200"
                    >
                      {SOUND_PRESETS.map((snd) => (
                        <option key={snd.id} value={snd.id}>
                          {snd.name} {snd.premium ? '[🏆 PRO]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Volume Slider selector with gradient */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="text-slate-400 font-medium flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5" /> Tone loudness volume
                      </span>
                      <span className="font-mono text-purple-400 font-bold">{Math.round(volumeField * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={volumeField}
                      onChange={(e) => setVolumeField(parseFloat(e.target.value))}
                      className="w-full accent-purple-500 h-1 bg-slate-900 rounded-lg appearance-auto cursor-pointer"
                    />
                  </div>

                  {/* Gradual Volume increases */}
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>Gradual crescent volume (Increase over 30s)</span>
                    <button
                      type="button"
                      onClick={() => setGradualField(!gradualField)}
                      className={`w-9 h-5 rounded-full p-0.5 flex transition-colors cursor-pointer ${gradualField ? 'bg-purple-600 justify-end' : 'bg-slate-800 justify-start'}`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                    </button>
                  </div>

                  {/* Snoozes configure switch */}
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>In-app standard loops snooze allowed</span>
                    <button
                      type="button"
                      onClick={() => setSnoozeField(!snoozeField)}
                      className={`w-9 h-5 rounded-full p-0.5 flex transition-colors cursor-pointer ${snoozeField ? 'bg-purple-600 justify-end' : 'bg-slate-800 justify-start'}`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                    </button>
                  </div>

                  {snoozeField && (
                    <div className="grid grid-cols-2 gap-3 mt-1 pt-2.5 border-t border-slate-900 text-xs">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 uppercase font-mono">Interval Length</label>
                        <select 
                          value={snoozeDurationField} 
                          onChange={(e) => setSnoozeDurationField(parseInt(e.target.value))}
                          className="bg-slate-900 rounded p-1.5 text-[10.5px] border border-slate-800 text-slate-300 font-medium"
                        >
                          <option value="5">5 Minutes</option>
                          <option value="10">10 Minutes</option>
                          <option value="15">15 Minutes</option>
                          <option value="30">30 Minutes</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-slate-500 uppercase font-mono">Max snooze caps</label>
                        <select 
                          value={maxSnoozeField} 
                          onChange={(e) => setMaxSnoozeField(parseInt(e.target.value))}
                          className="bg-slate-900 rounded p-1.5 text-[10.5px] border border-slate-800 text-slate-300 font-medium"
                        >
                          <option value="1">1 Time</option>
                          <option value="3">3 Times</option>
                          <option value="5">5 Times</option>
                          <option value="10">10 Times</option>
                        </select>
                      </div>
                    </div>
                  )}

                </div>

                {/* Confirm updates button */}
                <div className="grid grid-cols-2 gap-2 mt-3 select-none">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="py-3.5 text-center text-xs font-bold rounded-xl border border-slate-800 bg-slate-950 text-slate-400 cursor-pointer"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    className="py-3.5 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 text-white rounded-xl text-center font-bold text-xs cursor-pointer shadow active:scale-[0.98] transition-transform"
                  >
                    Confirm & Save
                  </button>
                </div>

              </form>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
         MODAL PAYWALL (PRO TIER PURCHASES PAYWALL DIALOG)
         ========================================================================= */}
      <AnimatePresence>
        {showPaywall && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6 text-left"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-slate-900 border border-slate-800 max-w-sm w-full rounded-3xl p-5 text-white font-sans flex flex-col gap-5 shadow-2xl relative"
            >
              
              {/* Close paywall X */}
              <button 
                onClick={() => setShowPaywall(false)}
                className="absolute top-4 right-4 p-1 rounded-full bg-slate-800 hover:bg-slate-705 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="text-center pt-2">
                <span className="text-4xl">👑</span>
                <h3 className="text-xl font-black mt-2 tracking-tight">Upgrade to W4KE PRO</h3>
                <p className="text-[10.5px] text-slate-400 mt-1 uppercase tracking-widest font-mono">Unlock unlimited focus mornings</p>
              </div>

              <div className="flex flex-col gap-2.5 my-1 bg-slate-950/60 p-4 rounded-2xl border border-slate-850 text-xs">
                <div className="flex gap-2.5 items-center">
                  <div className="w-5 h-5 rounded bg-orange-400/10 flex items-center justify-center text-orange-400 text-[10px] font-bold">✓</div>
                  <span className="text-slate-200 font-medium">Unlimited Alarms profiles (More than 3)</span>
                </div>
                <div className="flex gap-2.5 items-center">
                  <div className="w-5 h-5 rounded bg-orange-400/10 flex items-center justify-center text-orange-400 text-[10px] font-bold">✓</div>
                  <span className="text-slate-200 font-medium">Custom Bed verification photography</span>
                </div>
                <div className="flex gap-2.5 items-center">
                  <div className="w-5 h-5 rounded bg-orange-400/10 flex items-center justify-center text-orange-400 text-[10px] font-bold">✓</div>
                  <span className="text-slate-200 font-medium">Object Scavenger Hunts list</span>
                </div>
                <div className="flex gap-2.5 items-center">
                  <div className="w-5 h-5 rounded bg-orange-400/10 flex items-center justify-center text-orange-400 text-[10px] font-bold">✓</div>
                  <span className="text-slate-200 font-medium">Premium synthesizers (Metal and Flute tunes)</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleUpgradeToPremium}
                  className="w-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 text-slate-950 font-black text-xs py-3.5 rounded-xl cursor-pointer text-center flex items-center justify-center gap-1.5 shadow"
                >
                  💳 SIMULATE PRO CHECKOUT ($4.99/mo)
                </button>
                <button
                  onClick={() => setShowPaywall(false)}
                  className="w-full text-center text-slate-500 hover:text-slate-300 text-[10.5px] font-medium cursor-pointer"
                >
                  Continue on basic version
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </MobileFrame>
  );
}
