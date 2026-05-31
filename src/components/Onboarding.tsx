import React, { useState } from 'react';
import { Bell, Camera, Clock, Key, ArrowRight, UserCheck, ShieldAlert, Zap, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types';

interface OnboardingProps {
  onComplete: (user: User) => void;
  onGuestMode: () => void;
}

export default function Onboarding({ onComplete, onGuestMode }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [wakePreference, setWakePreference] = useState('07:00');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Simulated Permissions
  const [notifState, setNotifState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [cameraState, setCameraState] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      setErrorMsg('Please supply a valid Name and Email!');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      });
      const data = await response.json();
      if (response.ok && data.user) {
        onComplete(data.user);
      } else {
        setErrorMsg(data.error || 'Failed registration.');
      }
    } catch {
      setErrorMsg('Server connection failed. Activating local guest profile.');
      onGuestMode();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAppleGoogleMockLogin = () => {
    setSubmitting(true);
    // Simulating instant seamless oauth redirection
    setTimeout(() => {
      const mockOAuthUser: User = {
        id: "oauth_user",
        name: "Ahmad",
        email: "uwaidaahmad@gmail.com",
        isPremium: false,
        isGuest: false
      };
      onComplete(mockOAuthUser);
    }, 1200);
  };

  return (
    <div className="flex-1 bg-slate-950 flex flex-col justify-between p-6 select-none relative font-sans">
      
      {/* Step Indicator dots */}
      <div className="flex items-center gap-1 justify-center mt-3">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step === s ? 'w-6 bg-gradient-to-r from-orange-400 to-purple-500' : 'w-2 bg-slate-800'
            }`}
          />
        ))}
      </div>

      {/* Screen step panels */}
      <div className="flex-1 flex flex-col justify-center my-6">
        
        {/* Step 1: Welcome Splash */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center flex flex-col items-center"
          >
            <div className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-950/40 relative">
              <span className="text-4xl font-extrabold text-white tracking-tighter">W4</span>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-400 animate-ping" />
            </div>
            
            <h1 className="text-4xl font-black text-white tracking-tight mt-6">
              W4KE<span className="text-orange-400">.</span>
            </h1>
            <p className="text-slate-400 text-xs font-mono tracking-widest mt-1 uppercase">MISSION ALARM CLOCK</p>

            <div className="h-[2px] w-12 bg-gradient-to-r from-orange-400 to-purple-600 my-4" />

            <p className="text-slate-300 text-base font-semibold leading-snug max-w-sm px-4">
              “Stop snoozing. Start winning your mornings with W4KE.”
            </p>
            <p className="text-slate-500 text-xs mt-3 px-6 leading-relaxed">
              We replace standard snooze buttons with cognitive, athletic, and ambient checkouts that guarantee you wake up energized.
            </p>

            <button
              onClick={handleNext}
              className="mt-8 w-full max-w-xs bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 hover:opacity-90 text-white font-semibold rounded-2xl py-3.5 shadow-lg shadow-purple-950/50 flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.01]"
            >
              Start Your Mornings <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Step 2: Push Notifications Permissions */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mb-4">
              <Bell className="w-6 h-6 text-orange-400" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Never miss a wake-up call</h2>
            <p className="text-slate-400 text-xs leading-relaxed mt-2">
              W4KE operates via reliable push alerts and high-intensity localized ring loops, playing even when your device screen is off.
            </p>

            {/* Simulating OS Prompt Dialog Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4.5 mt-6 relative overflow-hidden">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-400 text-xs font-extrabold">W4</div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-100">“W4KE” Would Like to Send You Notifications</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                    Notifications include loud custom synthesized alarm tones, reminder alerts, morning stats logs, and wake streaks.
                  </p>
                </div>
              </div>
              
              {notifState === 'prompt' ? (
                <div className="flex gap-2.5 mt-5">
                  <button
                    onClick={() => setNotifState('denied')}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-[11px] font-bold text-slate-400 cursor-pointer"
                  >
                    Don't Allow
                  </button>
                  <button
                    onClick={() => setNotifState('granted')}
                    className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-[11px] font-bold text-white cursor-pointer"
                  >
                    Allow Active Alerts
                  </button>
                </div>
              ) : (
                <div className="mt-4 bg-slate-950/65 rounded-xl p-2.5 border border-slate-800 flex items-center justify-center">
                  <span className={`text-[10px] font-mono ${notifState === 'granted' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {notifState === 'granted' ? '✓ Registered Loud Alarm Service' : '⚠️ System alerts disabled'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-between items-center mt-10">
              <button onClick={handleBack} className="text-xs text-slate-500 hover:text-slate-300 font-semibold cursor-pointer">
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={notifState === 'prompt'}
                className={`py-3 px-6 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  notifState !== 'prompt' 
                    ? 'bg-white text-black hover:opacity-95 shadow-md' 
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Wake Preferences */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 mb-4">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Your ideal wakeup window?</h2>
            <p className="text-slate-400 text-xs leading-relaxed mt-1">
              Select your average start preference. W4KE will customize initial templates based on this selection.
            </p>

            <div className="flex flex-col gap-2.5 mt-8">
              {['06:00', '07:00', '08:00', '09:00'].map((timeOption) => (
                <div
                  key={timeOption}
                  onClick={() => setWakePreference(timeOption)}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    wakePreference === timeOption
                      ? 'bg-purple-950/20 border-purple-500 text-white shadow-lg shadow-purple-950/20'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-semibold">{timeOption === '06:00' ? '🐣 Early riser' : timeOption === '07:00' ? '🌅 Morning Win' : timeOption === '08:00' ? '👔 Office prep' : '☕ Late start'}</span>
                  </div>
                  <span className="text-lg font-bold font-mono">{timeOption} AM</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-between items-center mt-10">
              <button onClick={handleBack} className="text-xs text-slate-500 hover:text-slate-300 font-semibold cursor-pointer">
                Back
              </button>
              <button
                onClick={handleNext}
                className="py-3 px-6 rounded-xl bg-white text-black hover:opacity-95 font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Mission Previews */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 mb-4">
              <Zap className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Interactive smart missions</h2>
            <p className="text-slate-400 text-xs leading-relaxed mt-1">
              Select how you'll prove you are up. Each alarm configures specific actions to silence the loops:
            </p>

            <div className="grid grid-cols-2 gap-2 mt-6 overflow-y-auto max-h-[300px] pr-1">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-1.5">
                <span className="text-xl">💪</span>
                <h4 className="text-xs font-bold text-white leading-tight">Push-up challenge</h4>
                <p className="text-[9px] text-slate-400 font-sans leading-relaxed">Counts chest-to-phone reps using proximity triggers.</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-1.5">
                <span className="text-xl">📸</span>
                <h4 className="text-xs font-bold text-white leading-tight">Sky Photo sync</h4>
                <p className="text-[9px] text-slate-400 font-sans leading-relaxed">Forces you to look outside up at daylight.</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-1.5">
                <span className="text-xl">🖩</span>
                <h4 className="text-xs font-bold text-white leading-tight">Cognitive Maths</h4>
                <p className="text-[9px] text-slate-400 font-sans leading-relaxed">Starts blood flow to neurons; solves equations.</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-1.5 opacity-80 border-dashed">
                <span className="text-xl">🛌</span>
                <h4 className="text-xs font-bold text-orange-400 flex items-center gap-1 leading-tight">
                  Bed Verification <span className="text-[8px] bg-orange-400/10 text-orange-400 px-1 rounded-sm uppercase">PRO</span>
                </h4>
                <p className="text-[9px] text-slate-400 font-sans leading-relaxed">Uses visual cameras to confirm the made bed.</p>
              </div>
            </div>

            <div className="flex gap-3 justify-between items-center mt-10">
              <button onClick={handleBack} className="text-xs text-slate-500 hover:text-slate-300 font-semibold cursor-pointer">
                Back
              </button>
              <button
                onClick={handleNext}
                className="py-3 px-6 rounded-xl bg-white text-black hover:opacity-95 font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 5: Account Setup */}
        {step === 5 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-4">
              <Key className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Sync & protect data</h2>
            <p className="text-slate-400 text-xs leading-relaxed mt-1">
              Synchronize alarms, preserve wake-up histories, and capture badges across multiple devices.
            </p>

            <form onSubmit={handleRegister} className="flex flex-col gap-3 mt-6">
              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10.5px] font-mono leading-relaxed">
                  ⚠️ {errorMsg}
                </div>
              )}

              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full Name (e.g. Ahmad)"
                className="bg-slate-900 border border-slate-800 text-xs rounded-xl p-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />

              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email Address"
                className="bg-slate-900 border border-slate-800 text-xs rounded-xl p-3.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />

              <button
                type="submit"
                disabled={submitting}
                className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 text-white rounded-xl py-3.5 text-xs font-bold hover:opacity-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Creating Sync Token...' : 'Create Account'} <UserCheck className="w-4 h-4" />
              </button>
            </form>

            <div className="relative flex items-center justify-center my-4 font-mono text-[9px] text-slate-500">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800/80"></div></div>
              <span className="relative bg-slate-950 px-2.5 uppercase font-sans tracking-widest text-[#727d92]">OR LOGIN INSTANTLY</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleAppleGoogleMockLogin}
                className="py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-center text-xs font-semibold text-slate-200 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🍏 Apple</span>
              </button>
              <button
                type="button"
                onClick={handleAppleGoogleMockLogin}
                className="py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-center text-xs font-semibold text-slate-200 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🔍 Google</span>
              </button>
            </div>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={onGuestMode}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Skip Account setup (Standby Guest Mode)
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
