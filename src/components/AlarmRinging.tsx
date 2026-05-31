import React, { useState, useEffect, useRef } from 'react';
import { VolumeX, Play, Zap, ShieldAlert, Dumbbell, CloudSun, Calculator, Bed, Search, BookOpen, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { Alarm, MISSION_DETAILS } from '../types';

interface AlarmRingingProps {
  alarm: Alarm;
  onStartMission: () => void;
  onSnooze: () => void;
  soundEnabled: boolean;
}

export default function AlarmRinging({ alarm, onStartMission, onSnooze, soundEnabled }: AlarmRingingProps) {
  const [deviceTime, setDeviceTime] = useState('');
  const [audioTriggered, setAudioTriggered] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<any>(null);

  // Time ticker
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

  // Web Audio Synth Engine for realistic browser alarm sounds matching selection
  const startSynthEngine = () => {
    if (!soundEnabled || audioTriggered) return;
    try {
      // Create Context
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      setAudioTriggered(true);

      const scheduleBeeps = () => {
        let step = 0;
        const intervalMs = alarm.sound === 'energy-booster' ? 150 : alarm.sound === 'heavy-metal' ? 250 : 500;

        synthIntervalRef.current = setInterval(() => {
          if (ctx.state === 'suspended') return;

          const now = ctx.currentTime;
          
          if (alarm.sound === 'digital-alarm') {
            // Traditional Beep Beep Beep
            if (step % 2 === 0) {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'square';
              osc.frequency.setValueAtTime(980, now);
              gain.gain.setValueAtTime(0.0, now);
              gain.gain.linearRampToValueAtTime(alarm.volume * 0.4, now + 0.02);
              gain.gain.setValueAtTime(alarm.volume * 0.4, now + 0.15);
              gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(now);
              osc.stop(now + 0.35);
            }
          } 
          else if (alarm.sound === 'gentle-waves') {
            // Smooth sine swells
            if (step % 4 === 0) {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(220, now);
              // frequency mod
              osc.frequency.exponentialRampToValueAtTime(280, now + 1.0);
              gain.gain.setValueAtTime(0.001, now);
              gain.gain.linearRampToValueAtTime(alarm.volume * 0.5, now + 0.8);
              gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(now);
              osc.stop(now + 2.5);
            }
          }
          else if (alarm.sound === 'morning-birds') {
            // Random cute chirp sweeps
            if (step % 2 === 0) {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(1500, now);
              osc.frequency.exponentialRampToValueAtTime(3200, now + 0.12);
              gain.gain.setValueAtTime(0.0, now);
              gain.gain.linearRampToValueAtTime(alarm.volume * 0.3, now + 0.02);
              gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(now);
              osc.stop(now + 0.2);
            }
          }
          else if (alarm.sound === 'energy-booster') {
            // Dynamic techno arpeggio
            const freqs = [330, 392, 440, 523, 587, 659];
            const currentFreq = freqs[step % freqs.length];
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(currentFreq, now);
            gain.gain.setValueAtTime(0.0, now);
            gain.gain.linearRampToValueAtTime(alarm.volume * 0.25, now + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.14);
          }
          else if (alarm.sound === 'heavy-metal') {
            // Distorted high volume low frequency feedback loop
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(90 + (step % 3) * 35, now);
            gain.gain.setValueAtTime(0.0, now);
            gain.gain.linearRampToValueAtTime(alarm.volume * 0.5, now + 0.05);
            gain.gain.linearRampToValueAtTime(alarm.volume * 0.5, now + 0.18);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
          }
          else if (alarm.sound === 'zen-flute') {
            // Zen flute swells 
            if (step % 3 === 0) {
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(392, now); // G4
              osc.frequency.linearRampToValueAtTime(440, now + 0.4); // A4
              gain.gain.setValueAtTime(0.0, now);
              gain.gain.linearRampToValueAtTime(alarm.volume * 0.4, now + 0.3);
              gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start(now);
              osc.stop(now + 1.4);
            }
          }

          step++;
        }, intervalMs);
      };

      scheduleBeeps();
    } catch (e) {
      console.warn("Audio Context init blocked by browser state restriction", e);
    }
  };

  // Autoplay trigger on component load
  useEffect(() => {
    startSynthEngine();
    return () => {
      if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  const info = MISSION_DETAILS[alarm.missionType] || MISSION_DETAILS['none'];

  // Add a shake CSS animation class directly on the card
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-orange-600 via-purple-950 to-slate-950 z-50 flex flex-col justify-between p-6 overflow-hidden animate-shake select-none text-left font-sans">
      
      {/* Decorative energy lines */}
      <div className="absolute top-0 right-0 left-0 h-44 bg-gradient-to-b from-orange-500/20 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.15),transparent_60%)] pointer-events-none" />

      {/* Header status panel */}
      <div className="flex flex-col items-center text-center mt-12 z-10">
        <div className="w-16 h-16 rounded-full bg-orange-400/10 border-2 border-orange-400 p-1 animate-pulse mb-6 flex items-center justify-center">
          <div className="w-full h-full bg-gradient-to-tr from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
            <Zap className="w-6 h-6 text-slate-950 animate-bounce" />
          </div>
        </div>

        <span className="text-[11px] font-mono tracking-widest text-orange-300 uppercase bg-orange-500/10 px-2.5 py-1 rounded-full border border-orange-400/20">
          🔥 WAKE UP CALL ACTIVED
        </span>

        <h1 className="text-6xl font-black text-white tracking-tighter font-sans mt-5 animate-pulse">
          {deviceTime.split(' ')[0]}
        </h1>
        <p className="text-xs font-bold text-slate-300 tracking-wider uppercase font-mono mt-0.5">{deviceTime.split(' ')[1]}</p>

        <h2 className="text-xl font-extrabold text-slate-100 tracking-tight mt-6 max-w-xs leading-snug">
          {alarm.label || 'W4KE Alarm'}
        </h2>
      </div>

      {/* Browser Autoplay Block Warning Banner */}
      {!audioTriggered && soundEnabled && (
        <div className="mx-2 p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col gap-2 text-center items-center z-20 shadow-xl">
          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
            🔇 Browser audio is muted until interaction. Unmute to hear the <b>{alarm.sound}</b> alarm!
          </p>
          <button 
            onClick={startSynthEngine}
            className="px-4 py-1.5 rounded-xl bg-orange-400 text-slate-950 font-bold text-[10px] uppercase font-mono tracking-wider flex items-center gap-1 cursor-pointer transition-transform hover:scale-105"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" /> Play Synth Alarm
          </button>
        </div>
      )}

      {/* Mission brief overlay card */}
      <div className="bg-slate-900/85 border border-slate-800 rounded-3xl p-5 z-10 flex flex-col gap-4 mx-3 shadow-2xl relative">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center border border-purple-500 text-white text-xs">
          {alarm.missionType === 'push-ups' ? <Dumbbell className="w-4 h-4" /> : 
           alarm.missionType === 'sky' ? <CloudSun className="w-4 h-4" /> : 
           alarm.missionType === 'math' ? <Calculator className="w-4 h-4" /> :
           alarm.missionType === 'reading' ? <BookOpen className="w-4 h-4" /> : 
           <Clock className="w-4 h-4" />}
        </div>

        <div className="text-left">
          <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold">W4KE Mission Required</span>
          <h3 className="text-base font-extrabold text-white mt-1">{info.name}</h3>
          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-sans font-medium">
            {info.instructions}
          </p>
          {alarm.missionType !== 'none' && (
            <div className="flex gap-1.5 mt-3">
              <span className="text-[9px] font-mono uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Difficulty: {alarm.difficulty}
              </span>
              <span className="text-[9px] font-mono uppercase text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-400/20">
                Loud Sound: {alarm.sound.replaceAll('-', ' ')}
              </span>
            </div>
          )}
        </div>

        {/* Buttons: Primary slide or start mission */}
        <div className="flex flex-col gap-2.5 mt-2">
          <button
            onClick={() => {
              // stop synth and start
              if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
              if (audioCtxRef.current) audioCtxRef.current.close();
              onStartMission();
            }}
            className="w-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 hover:opacity-95 text-xs text-white font-extrabold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98]"
          >
            {alarm.missionType === 'none' ? '🔐 DISMISS ALARM' : '🔓 START MISSION NOW'}
          </button>

          {alarm.snoozeEnabled && (alarm.currentSnoozeCount < alarm.maxSnoozes) ? (
            <button
              onClick={() => {
                if (synthIntervalRef.current) clearInterval(synthIntervalRef.current);
                if (audioCtxRef.current) audioCtxRef.current.close();
                onSnooze();
              }}
              className="w-full bg-slate-950/60 hover:bg-slate-950/80 border border-slate-800 text-xs text-slate-300 font-bold py-3 rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Clock className="w-4 h-4 text-slate-400" />
              Snooze ({alarm.snoozeDuration}m) — {alarm.currentSnoozeCount}/{alarm.maxSnoozes} left
            </button>
          ) : (
            <div className="py-2.5 text-center text-[10.5px] font-mono font-bold text-rose-400 bg-rose-500/5 rounded-xl border border-rose-500/10">
              🚫 Snooze Forbidden or Over Limit
            </div>
          )}
        </div>
      </div>

      <div className="mb-8 text-center text-[10px] text-slate-400 font-mono">
        W4KE v1.1.2 • Fully Sound Synthesized
      </div>
    </div>
  );
}
