import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Signal, Bell, X, Compass, Award, User, Volume2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MobileFrameProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isPremium: boolean;
  userEmail?: string;
  userName?: string;
  pendingNotification: { id: string; label: string; mission: string; time: string } | null;
  onAcceptNotification: () => void;
  onClearNotification: () => void;
  onTogglePower: () => void;
  isPhoneLocked: boolean;
}

export default function MobileFrame({
  children,
  activeTab,
  setActiveTab,
  isPremium,
  userEmail,
  userName,
  pendingNotification,
  onAcceptNotification,
  onClearNotification,
  onTogglePower,
  isPhoneLocked
}: MobileFrameProps) {
  const [deviceTime, setDeviceTime] = useState('');

  // Sync clock time
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      setDeviceTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div id="w4ke-app-viewport" className="min-h-screen w-full max-w-md mx-auto bg-slate-950 text-white font-sans flex flex-col relative select-none overflow-x-hidden md:shadow-[0_0_50px_rgba(0,0,0,0.8)] md:border-x md:border-slate-900">
      
      {/* Visual background atmospheric lights */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-purple-900/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-900/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Dynamic Status Bar for polished application look */}
      <div className="h-10 bg-slate-950 text-white flex items-center justify-between px-6 select-none z-50 text-[11px] font-sans font-medium border-b border-slate-900/30">
        <span>{deviceTime}</span>
        
        <div className="flex items-center gap-1.5 text-slate-350">
          <Signal className="w-3.5 h-3.5 text-slate-400" />
          <Wifi className="w-3.5 h-3.5 text-slate-400" />
          <Battery className="w-4 h-4 text-emerald-400" />
        </div>
      </div>

      {/* Screen Content Area */}
      <div className="flex-1 relative bg-slate-950 flex flex-col w-full overflow-hidden">
        
        <AnimatePresence>
          {isPhoneLocked && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 flex flex-col justify-between p-8 text-center z-40"
            >
              <div className="mt-12">
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest">W4KE Standby Active</span>
                <h2 className="text-4xl font-light text-slate-100 tracking-tight mt-3">{deviceTime.split(' ')[0]}</h2>
                <p className="text-xs text-slate-400 mt-1">Ready for next alarm schedule</p>
              </div>

              <div className="flex flex-col items-center gap-2 mb-12 bg-slate-900/40 p-5 rounded-2xl border border-slate-800/60">
                <ShieldAlert className="w-6 h-6 text-orange-400 animate-pulse" />
                <p className="text-xs text-slate-300 font-sans">App is in background standby mode.</p>
                <button 
                  onClick={onTogglePower} 
                  className="mt-3 text-[11px] font-sans text-white rounded-xl px-4 py-2 bg-gradient-to-r from-orange-400 to-purple-500 hover:opacity-90 active:scale-95 cursor-pointer font-semibold transition-all"
                >
                  Wake up app
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Local Notification Banner Simulated Layer */}
        <AnimatePresence>
          {pendingNotification && !isPhoneLocked && (
            <motion.div
              initial={{ transform: 'translateY(-120%)', opacity: 0 }}
              animate={{ transform: 'translateY(0%)', opacity: 1 }}
              exit={{ transform: 'translateY(-120%)', opacity: 0 }}
              className="absolute top-2 left-3 right-3 bg-slate-900/95 border border-slate-800 rounded-3xl p-3.5 shadow-2xl z-50 flex flex-col text-left gap-2 cursor-pointer outline outline-1 outline-purple-500/20"
              onClick={onAcceptNotification}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-orange-400 to-purple-600 flex items-center justify-center">
                    <span className="text-[9px] font-extrabold text-white">W4</span>
                  </div>
                  <span className="text-xs font-bold text-slate-100 font-sans">W4KE Alarm Clock</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono text-slate-450">now</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearNotification();
                    }}
                    className="p-1 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white leading-snug">🚨 Ready to Rise: {pendingNotification.label}!</h4>
                <p className="text-[10px] text-slate-300 mt-0.5 font-sans leading-relaxed">
                  Alarm firing. Click here to solve the <span className="text-purple-400 font-semibold">{pendingNotification.mission}</span> mission now!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Inner application content viewport */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col relative bg-slate-950">
          {children}
        </div>

        {/* Polished navigation footer indicator */}
        <div className="h-2.5 bg-slate-950 flex items-center justify-center select-none z-30">
          <div className="w-24 h-1 bg-slate-900 rounded-full" />
        </div>
      </div>
    </div>
  );
}
