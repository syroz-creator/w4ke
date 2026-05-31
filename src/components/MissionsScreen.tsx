import React, { useState, useEffect, useRef } from 'react';
import { Camera, Dumbbell, Play, RefreshCw, Key, ShieldCheck, AlignLeft, Calculator, RotateCcw, Cloud, Check, Eye, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Alarm, MissionType, MISSION_DETAILS } from '../types';

interface MissionsScreenProps {
  alarm: Alarm;
  onCompleteMission: (secondsTaken: number) => void;
  onAbandon: () => void;
}

export default function MissionsScreen({ alarm, onCompleteMission, onAbandon }: MissionsScreenProps) {
  const [loadingCamera, setLoadingCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Gemini AI visual checking state
  const [aiChecking, setAiChecking] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    success: boolean;
    confidence?: number;
    description?: string;
    feedback?: string;
    error?: string;
  } | null>(null);

  // Scavenge objects target hunt state
  const [targetObject, setTargetObject] = useState('Toothpaste');

  // Deep pixel-by-pixel sky color verification state
  const [skyAnalysis, setSkyAnalysis] = useState<{
    success: boolean;
    reason: string;
    metrics?: { brightness: number; skyPixelsPercent: number; averageR: number; averageG: number; averageB: number };
  } | null>(null);

  // General Timer
  useEffect(() => {
    const tracker = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => {
      clearInterval(tracker);
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const startCamera = async () => {
    setLoadingCamera(true);
    setScreenshot(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.warn("Camera media access blocked or unavailable, using fallback mock viewfinder.", e);
    } finally {
      setLoadingCamera(false);
    }
  };

  const capturePhoto = () => {
    setAiAnalysis(null);
    if (videoRef.current && cameraStream) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setScreenshot(dataUrl);

        // Quantitative sky color heuristic evaluation
        const width = canvas.width;
        const height = canvas.height;
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        let totalR = 0;
        let totalG = 0;
        let totalB = 0;
        let skyPixels = 0;
        let sampledCount = 0;

        const stepsX = 25;
        const stepsY = 25;
        const stepSizeX = Math.floor(width / stepsX) || 1;
        const stepSizeY = Math.floor(height / stepsY) || 1;

        for (let y = 0; y < height; y += stepSizeY) {
          for (let x = 0; x < width; x += stepSizeX) {
            const idx = (y * width + x) * 4;
            if (idx >= data.length) continue;

            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            totalR += r;
            totalG += g;
            totalB += b;
            sampledCount++;

            const isBlueSky = (b > 110 && b - r > 12 && b - g > 8);
            const isCloudyOvercast = (r > 165 && g > 165 && b > 165 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20);
            const isMorningGlow = (r > 160 && g > 125 && r > b && (r - b) > 35);

            if (isBlueSky || isCloudyOvercast || isMorningGlow) {
              skyPixels++;
            }
          }
        }

        const avgR = totalR / sampledCount;
        const avgG = totalG / sampledCount;
        const avgB = totalB / sampledCount;
        const avgBrightness = (0.299 * avgR + 0.587 * avgG + 0.114 * avgB) / 255;
        const skyPercent = (skyPixels / sampledCount) * 100;

        const isSkyLike = avgBrightness > 0.42 && skyPercent > 35;
        let reasonStr = "";
        if (isSkyLike) {
          reasonStr = "Daylight sky verified!";
        } else if (avgBrightness <= 0.42) {
          reasonStr = "The image is too dark. Point the lens directly at a brightly daylit window/sky.";
        } else {
          reasonStr = "Unrecognized indoor colors. Move away from desks, walls, and point at open sky daylight.";
        }

        setSkyAnalysis({
          success: isSkyLike,
          reason: reasonStr,
          metrics: {
            brightness: Math.round(avgBrightness * 100),
            skyPixelsPercent: Math.round(skyPercent),
            averageR: Math.round(avgR),
            averageG: Math.round(avgG),
            averageB: Math.round(avgB)
          }
        });
      }
      stopCamera();
    } else {
      // Create a gorgeous canvas-drawn fallback representation of what they are targeting
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Draw custom gradient background to simulate environment
        const grad = ctx.createLinearGradient(0, 0, 320, 240);
        if (alarm.missionType === 'sky') {
          grad.addColorStop(0, '#38bdf8'); // Sky Blue
          grad.addColorStop(1, '#fef08a'); // Warm Yellow sunrise
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 320, 240);
          
          // Draw a fluffy white cloud
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.beginPath();
          ctx.arc(160, 120, 32, 0, Math.PI * 2);
          ctx.arc(135, 130, 24, 0, Math.PI * 2);
          ctx.arc(185, 130, 24, 0, Math.PI * 2);
          ctx.fill();
        } else if (alarm.missionType === 'bed') {
          grad.addColorStop(0, '#4338ca'); // Indigo
          grad.addColorStop(1, '#7e22ce'); // Purple
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 320, 240);
          
          // Draw neat duvet sheet
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.roundRect(30, 90, 260, 120, 16);
          ctx.fill();
          
          // Draw neat pillow
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.roundRect(60, 60, 80, 40, 8);
          ctx.roundRect(180, 60, 80, 40, 8);
          ctx.fill();
        } else {
          // Object hunt gradient
          grad.addColorStop(0, '#ea580c'); // Deep Orange
          grad.addColorStop(1, '#db2777'); // Pink
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 320, 240);
          
          // Draw target label or simulation card
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.beginPath();
          ctx.roundRect(40, 40, 240, 160, 12);
          ctx.fill();
          
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 15px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Target: ${targetObject}`, 160, 110);
          
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = '10px monospace';
          ctx.fillText('[Simulated Hunt Object]', 160, 140);
        }
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setScreenshot(dataUrl);
        
        // Fill heuristics for immediate local matching feedback
        setSkyAnalysis({
          success: true,
          reason: "Simulated morning sky verified (Mock Mode).",
          metrics: {
            brightness: 88,
            skyPixelsPercent: 78,
            averageR: 190,
            averageG: 215,
            averageB: 245
          }
        });
      }
      stopCamera();
    }
  };

  /* ==========================================
     MISSION 1: PUSH-UPS COUNTER
     ========================================== */
  const getRequiredReps = () => {
    if (alarm.difficulty === 'hard') return 20;
    if (alarm.difficulty === 'medium') return 12;
    return 5;
  };

  const [repsDone, setRepsDone] = useState(0);
  const requiredReps = getRequiredReps();

  const triggerPushupRep = () => {
    if (repsDone < requiredReps) {
      const nextRep = repsDone + 1;
      setRepsDone(nextRep);
      
      // Real Vocal audio feedback beep in browser
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(440 + nextRep * 25, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } catch {}

      if (nextRep >= requiredReps) {
        setTimeout(() => onCompleteMission(secondsElapsed), 1200);
      }
    }
  };

  /* ==========================================
     MISSION 2: SKY PHOTO VERIFICATION
     ========================================== */
  const [photoVerified, setPhotoVerified] = useState(false);

  const verifySkyPhoto = async () => {
    if (!screenshot) {
      alert("Please snap a sky photo first!");
      return;
    }
    setAiChecking(true);
    setAiAnalysis(null);
    try {
      const res = await fetch('/api/verify-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: screenshot,
          missionType: 'sky',
          clientHeuristicSuccess: skyAnalysis?.success,
          clientHeuristicReason: skyAnalysis?.reason,
          brightness: skyAnalysis?.metrics?.brightness
        })
      });
      const data = await res.json();
      setAiAnalysis(data);
      if (data.success) {
        setPhotoVerified(true);
        setTimeout(() => onCompleteMission(secondsElapsed), 2000);
      }
    } catch (err: any) {
      console.error(err);
      setAiAnalysis({ success: false, feedback: "Failed to connect to verification server.", error: err.message });
    } finally {
      setAiChecking(false);
    }
  };

  /* ==========================================
     MISSION 3: MAKE YOUR BED (PREMIUM BEFORE/AFTER)
     ========================================== */
  const [bedStage, setBedStage] = useState<'before' | 'after'>('before');
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);

  const captureBedPhoto = () => {
    if (bedStage === 'before') {
      setBeforePhoto(screenshot || 'mock-before-bed');
      setScreenshot(null);
      setBedStage('after');
      setAiAnalysis(null);
      startCamera();
    }
  };

  const verifyBedPhoto = async () => {
    if (!screenshot) {
      alert("Please capture your tidy after snapshot first!");
      return;
    }
    setAiChecking(true);
    setAiAnalysis(null);
    try {
      const res = await fetch('/api/verify-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: screenshot,
          missionType: 'bed',
          clientHeuristicSuccess: skyAnalysis ? (skyAnalysis.metrics ? skyAnalysis.metrics.brightness > 30 : true) : true,
          brightness: skyAnalysis?.metrics?.brightness
        })
      });
      const data = await res.json();
      setAiAnalysis(data);
      if (data.success) {
        setAfterPhoto(screenshot);
        stopCamera();
        setTimeout(() => onCompleteMission(secondsElapsed), 2500);
      }
    } catch (err: any) {
      console.error(err);
      setAiAnalysis({ success: false, feedback: "Error verifying bed arrangement.", error: err.message });
    } finally {
      setAiChecking(false);
    }
  };

  /* ==========================================
     MISSION 4: OBJECT HUNT
     ========================================== */
  const OBJECT_POOL = ['Book', 'Toothpaste', 'Coffee Mug', 'Toothbrush', 'Water Bottle', 'Spoon or Fork', 'Keys', 'Soap', 'Shoe'];

  useEffect(() => {
    if (alarm.missionType === 'object') {
      // Pick a random target from the household checklist
      const idx = Math.floor(Math.random() * OBJECT_POOL.length);
      setTargetObject(OBJECT_POOL[idx]);
    }
  }, [alarm.missionType]);

  const handleRerollTarget = () => {
    if (aiChecking) return;
    const current = targetObject;
    let next = current;
    while (next === current) {
      next = OBJECT_POOL[Math.floor(Math.random() * OBJECT_POOL.length)];
    }
    setTargetObject(next);
    setScreenshot(null);
    setAiAnalysis(null);
  };

  const verifyObjectPhoto = async () => {
    if (!screenshot) {
      alert("Please capture the target item first!");
      return;
    }
    setAiChecking(true);
    setAiAnalysis(null);
    try {
      const res = await fetch('/api/verify-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: screenshot,
          missionType: 'object',
          targetObject: targetObject,
          clientHeuristicSuccess: skyAnalysis ? (skyAnalysis.metrics ? skyAnalysis.metrics.brightness > 30 : true) : true,
          brightness: skyAnalysis?.metrics?.brightness
        })
      });
      const data = await res.json();
      setAiAnalysis(data);
      if (data.success) {
        setTimeout(() => onCompleteMission(secondsElapsed), 2500);
      }
    } catch (err: any) {
      console.error(err);
      setAiAnalysis({ success: false, feedback: "Could not scan the object.", error: err.message });
    } finally {
      setAiChecking(false);
    }
  };

  /* ==========================================
     MISSION 5: READING / VERSE MINDBOOSTER
     ========================================== */
  const quotesList = [
    {
      text: "Do not pray for an easy life, pray for the strength to endure a difficult one. The secret of health for both mind and body is not to mourn for the past, worry about the future, or anticipate troubles, but to live in the present moment wisely.",
      author: "Bruce Lee"
    },
    {
      text: "Successful mornings are built on intentional discipline. Your alarm is not an option; it is an appointment with your future. Focus on completing this singular moment, and your day will fall into alignment.",
      author: "Marcus Aurelius Morning Meditation"
    },
    {
      text: "The heights by great men reached and kept were not attained by sudden flight, but they, while their companions slept, were toiling upward in the night.",
      author: "Henry Wadsworth Longfellow"
    }
  ];

  const getQuote = () => {
    if (alarm.difficulty === 'hard') return quotesList[1];
    if (alarm.difficulty === 'medium') return quotesList[2];
    return quotesList[0];
  };

  const selectedQuote = getQuote();
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [hasHeldTime, setHasHeldTime] = useState(false);
  const [readingTimer, setReadingTimer] = useState(6);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (readingTimer > 0) {
      const countdown = setInterval(() => {
        setReadingTimer(prev => {
          if (prev <= 1) {
            setHasHeldTime(true);
            clearInterval(countdown);
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 25) {
      setScrolledToBottom(true);
    }
  };

  /* ==========================================
     MISSION 6: MATH / COGNITIVE equations
     ========================================== */
  const [mathNum1, setMathNum1] = useState(0);
  const [mathNum2, setMathNum2] = useState(0);
  const [mathNum3, setMathNum3] = useState(0);
  const [mathOperator, setMathOperator] = useState<'*' | '+' | '-'>('+');
  const [mathAnswerStr, setMathAnswerStr] = useState('');
  const [mathCorrectCount, setMathCorrectCount] = useState(0);
  const mathTargetNeeded = alarm.difficulty === 'hard' ? 5 : alarm.difficulty === 'medium' ? 3 : 2;

  const generateNewMath = () => {
    const diff = alarm.difficulty;
    let n1 = 0, n2 = 0, n3 = 0, op: '*' | '+' | '-' = '+';
    if (diff === 'easy') {
      n1 = Math.floor(Math.random() * 20) + 5;
      n2 = Math.floor(Math.random() * 15) + 3;
      op = Math.random() > 0.5 ? '+' : '-';
    } else if (diff === 'medium') {
      n1 = Math.floor(Math.random() * 12) + 5;
      n2 = Math.floor(Math.random() * 8) + 2;
      op = '*';
    } else {
      n1 = Math.floor(Math.random() * 20) + 10;
      n2 = Math.floor(Math.random() * 12) + 4;
      n3 = Math.floor(Math.random() * 30) + 5;
      op = '*'; // Equation: (n1 * n2) - n3
    }
    setMathNum1(n1);
    setMathNum2(n2);
    setMathNum3(n3);
    setMathOperator(op);
    setMathAnswerStr('');
  };

  useEffect(() => {
    generateNewMath();
  }, [alarm.difficulty]);

  const getMathSolution = () => {
    if (alarm.difficulty === 'hard') {
      return (mathNum1 * mathNum2) - mathNum3;
    }
    if (mathOperator === '*') {
      return mathNum1 * mathNum2;
    }
    if (mathOperator === '-') {
      return mathNum1 - mathNum2;
    }
    return mathNum1 + mathNum2;
  };

  const handleMathDial = (val: string) => {
    if (val === 'C') {
      setMathAnswerStr('');
    } else if (val === '-') {
      if (mathAnswerStr === '') {
        setMathAnswerStr('-');
      }
    } else {
      setMathAnswerStr(prev => prev + val);
    }
  };

  useEffect(() => {
    const activeSolution = getMathSolution();
    if (parseInt(mathAnswerStr) === activeSolution) {
      // success sound synth
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } catch {}

      const nextCount = mathCorrectCount + 1;
      setMathCorrectCount(nextCount);
      if (nextCount >= mathTargetNeeded) {
        setTimeout(() => onCompleteMission(secondsElapsed), 1000);
      } else {
        generateNewMath();
      }
    }
  }, [mathAnswerStr]);

  return (
    <div className="flex-1 bg-slate-950 flex flex-col justify-between p-6 select-none relative font-sans text-slate-100">
      
      {/* Top micro progress header */}
      <div className="flex items-center justify-between text-slate-400 text-xs border-b border-slate-900 pb-3 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
          <span className="font-mono text-[10px] text-orange-400">MISSION IN PROGESS</span>
        </div>
        <span className="text-[10px] font-mono tracking-wider">⏱ {secondsElapsed}s Taken</span>
      </div>

      <div className="flex-1 flex flex-col justify-center my-4 overflow-hidden">
        
        {/* =========================================================================
           PUSH-UPS MISSION RENDERING
           ========================================================================= */}
        {alarm.missionType === 'push-ups' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center flex flex-col items-center">
            <span className="text-5xl animate-bounce">💪</span>
            <h2 className="text-xl font-bold mt-4">Place Phone on the Floor</h2>
            <p className="text-slate-400 text-xs mt-1 px-4 leading-relaxed">
              Do chest-to-phone push-ups. Touch your nose/chest near the screen or press the pad below to register repetitions!
            </p>

            {/* Rep Counter circle */}
            <div className="relative w-44 h-44 rounded-full border-[10px] border-slate-900 flex flex-col items-center justify-center mt-8 shadow-inner bg-slate-900/10">
              <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-purple-500 font-mono">
                {repsDone}
              </span>
              <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase mt-1">OF {requiredReps} REPS</span>
            </div>

            {/* Press simulated proximity area */}
            <button
              onClick={triggerPushupRep}
              className="mt-8 bg-slate-900 hover:bg-slate-800 border border-slate-800 active:scale-95 py-6 px-10 rounded-2xl w-full text-center cursor-pointer flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold"
            >
              <span className="text-orange-400 text-base font-bold">PUSH-UP TOUCHTRIGGER</span>
              <span className="text-[10px] text-slate-500 font-mono">Click to simulate chest tap</span>
            </button>
          </motion.div>
        )}

        {/* =========================================================================
           SKY PHOTO MISSION RENDERING
           ========================================================================= */}
        {alarm.missionType === 'sky' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col text-left">
            <div className="text-center mb-4">
              <span className="text-4xl">🌤️</span>
              <h2 className="text-lg font-bold text-white mt-1">Natural Sky Verification</h2>
              <p className="text-[11px] text-slate-400 px-6 mt-1">Look out your window. Take a bright photo aligned with the sky to confirm early-morning natural lighting.</p>
            </div>

            {/* Viewport container */}
            <div className="relative aspect-video rounded-3xl bg-black border border-slate-900 overflow-hidden flex flex-col items-center justify-center shadow-2xl">
              {cameraStream ? (
                <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
              ) : screenshot ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <img src={screenshot} alt="Sky Snap" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                  {/* Neon Scanning Grid overlay */}
                  {aiChecking && (
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] top-0 animate-[bounce_2s_infinite] z-20" />
                  )}
                  <span className="absolute bottom-2 right-2 text-[8px] tracking-wider font-mono bg-black/60 backdrop-blur text-slate-300 py-0.5 px-2 rounded border border-white/10 uppercase">Captured snapshot</span>
                </div>
              ) : (
                <div className="text-center flex flex-col items-center p-6 text-slate-500">
                  <Camera className="w-8 h-8 text-indigo-500 animate-pulse mb-2" />
                  <span className="text-[10px] uppercase font-mono tracking-wider">Camera Viewfinder Ready</span>
                </div>
              )}

              {/* Viewfinder overlay reticle */}
              {!screenshot && (
                <div className="absolute inset-4 border border-white/10 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="w-6 h-6 border-t border-l border-white/40 absolute top-2 left-2" />
                  <div className="w-6 h-6 border-t border-r border-white/40 absolute top-2 right-2" />
                  <div className="w-6 h-6 border-b border-l border-white/40 absolute bottom-2 left-2" />
                  <div className="w-6 h-6 border-b border-r border-white/40 absolute bottom-2 right-2" />
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              {!cameraStream && !screenshot ? (
                <button
                  onClick={startCamera}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow"
                >
                  <Camera className="w-4 h-4" /> Start Camera Feed
                </button>
              ) : cameraStream ? (
                <button
                  onClick={capturePhoto}
                  className="w-full bg-gradient-to-r from-orange-400 to-pink-600 text-white font-bold text-xs py-3.5 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                >
                  📸 SNAP SKYLAND IMAGE
                </button>
              ) : (
                <div className="flex flex-col gap-2.5 w-full">
                  <div className="flex gap-2">
                    <button
                      onClick={startCamera}
                      disabled={aiChecking}
                      className="flex-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold text-[10.5px] py-2.5 rounded-lg cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Retake
                    </button>
                    <button
                      onClick={verifySkyPhoto}
                      disabled={aiChecking || photoVerified}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10.5px] py-2.5 rounded-lg cursor-pointer flex items-center justify-center gap-1 relative overflow-hidden disabled:bg-emerald-900"
                    >
                      {aiChecking ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying...
                        </>
                      ) : photoVerified ? (
                        'Done!'
                      ) : (
                        'Analyze Sky Light'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Scanning details / Report output */}
            {aiChecking && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center flex flex-col gap-1.5 items-center justify-center">
                <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
                <span className="text-[11px] font-mono text-purple-400 uppercase tracking-widest animate-pulse font-semibold">AI Light Spectrometer Analyzing daylight...</span>
              </div>
            )}

            {aiAnalysis && !aiChecking && (
              <div className={`mt-4 p-4 rounded-2xl border text-[11px] font-sans flex flex-col gap-2 ${aiAnalysis.success ? 'bg-emerald-950/20 border-emerald-900/60 text-slate-100' : 'bg-rose-950/20 border-rose-900/60 text-slate-100'}`}>
                <div className="flex justify-between items-center pb-1.5 border-b border-white/5">
                  <span className="font-mono text-[10px] tracking-wider text-slate-400">🔭 AI AGENT SCANNED REPORT:</span>
                  <span className={`font-black uppercase tracking-wider ${aiAnalysis.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {aiAnalysis.success ? 'Daylight Light Verified ✓' : 'Lighting Rejected 🗙'}
                  </span>
                </div>
                
                {aiAnalysis.confidence !== undefined && (
                  <div className="flex flex-col gap-1 mt-0.5">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Light Confidence matching:</span>
                      <span>{aiAnalysis.confidence}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/5">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${aiAnalysis.success ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                        style={{ width: `${aiAnalysis.confidence}%` }} 
                      />
                    </div>
                  </div>
                )}

                {aiAnalysis.description && (
                  <p className="text-[10.5px] text-slate-300 leading-normal font-sans">
                    <b>Identified:</b> {aiAnalysis.description}
                  </p>
                )}

                <p className={`p-2.5 rounded-xl text-[10.5px] font-medium leading-relaxed ${aiAnalysis.success ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                  <b>Feedback:</b> {aiAnalysis.feedback}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* =========================================================================
           MAKE YOUR BED MISSION RENDERING (PREMIUM)
           ========================================================================= */}
        {alarm.missionType === 'bed' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col text-left">
            <div className="text-center mb-3">
              <span className="text-3xl">🛌_🏆</span>
              <h2 className="text-lg font-bold text-orange-400 mt-1.5 flex items-center justify-center gap-1">
                Make Your Bed <span className="text-[9px] bg-orange-400/15 py-0.5 px-1.5 rounded uppercase font-mono">PRO</span>
              </h2>
              <p className="text-[10px] text-slate-400 px-6 mt-1">Double verification. Provide photos to confirm your bed has been neatly arranged.</p>
            </div>

            {/* Before / After stage flow display */}
            <div className="relative aspect-video rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col items-center justify-center relative">
              {cameraStream ? (
                <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
              ) : screenshot ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <img src={screenshot} alt="Bed snapshot" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                  {aiChecking && (
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] top-0 animate-[bounce_2s_infinite] z-20" />
                  )}
                  <div className="absolute bottom-2 right-2 text-[8px] bg-black/60 backdrop-blur text-emerald-400 py-0.5 px-2 rounded uppercase border border-white/10 font-mono">Snapshot Taken</div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col justify-center items-center gap-2 p-5 text-center">
                  <span className="text-purple-400 font-mono text-[10.5px] uppercase tracking-wider font-semibold">Step: {bedStage === 'before' ? 'BEFORE snapshot' : 'AFTER tidy snapshot'}</span>
                  <p className="text-[10px] text-slate-400 font-sans leading-relaxed px-4">
                    {bedStage === 'before' 
                      ? 'Photograph your bed before arranging. Prove the mess first.' 
                      : 'Photograph your finished neat bed to unlock the alarm.'}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {!cameraStream && !screenshot ? (
                <button
                  onClick={startCamera}
                  disabled={aiChecking}
                  className="w-full bg-gradient-to-r from-orange-400 to-purple-600 text-white font-bold text-xs py-3 rounded-xl cursor-pointer"
                >
                  Capture Bed {bedStage.toUpperCase()}
                </button>
              ) : cameraStream ? (
                <button
                  onClick={captureBedPhoto}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3.5 rounded-xl cursor-pointer"
                >
                  Save {bedStage === 'before' ? 'Before' : 'After'} Snapshot
                </button>
              ) : (
                <button
                  onClick={verifyBedPhoto}
                  disabled={aiChecking}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl cursor-pointer flex items-center justify-center gap-1"
                >
                  {aiChecking ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Neatness...
                    </>
                  ) : (
                    'Verify Made Bed'
                  )}
                </button>
              )}

              {/* Status checklist metrics */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className={`p-2 rounded-xl text-center border text-[9px] font-mono ${beforePhoto ? 'bg-indigo-950/20 border-indigo-900/60 text-slate-200' : 'bg-slate-950 border-slate-900 text-slate-600'}`}>
                  📷 Before photo: {beforePhoto ? 'Saved ✓' : 'Pending'}
                </div>
                <div className={`p-2 rounded-xl text-center border text-[9px] font-mono ${afterPhoto ? 'bg-emerald-950/20 border-emerald-900/60 text-slate-100' : 'bg-slate-950 border-slate-900 text-slate-600'}`}>
                  📷 After photo: {afterPhoto ? 'Saved ✓' : 'Pending'}
                </div>
              </div>
            </div>

            {/* Reports */}
            {aiChecking && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center flex flex-col gap-1.5 items-center justify-center">
                <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest animate-pulse">Running smart neatness comparison checks...</span>
              </div>
            )}

            {aiAnalysis && !aiChecking && (
              <div className={`mt-3 p-4 rounded-2xl border text-[11px] font-sans flex flex-col gap-2 ${aiAnalysis.success ? 'bg-emerald-950/20 border-emerald-900/60 text-slate-100' : 'bg-rose-950/20 border-rose-900/60 text-slate-100'}`}>
                <div className="flex justify-between items-center pb-1 border-b border-white/5">
                  <span className="font-mono text-[9px] tracking-wider text-slate-400">BED VERIFICATION MATRIX:</span>
                  <span className={`font-black uppercase tracking-wider ${aiAnalysis.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {aiAnalysis.success ? 'Neatness Confirmed ✓' : 'Bed Untidy 🗙'}
                  </span>
                </div>

                {aiAnalysis.confidence !== undefined && (
                  <div className="flex flex-col gap-1 mt-0.5">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Bed arrange score:</span>
                      <span>{aiAnalysis.confidence}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${aiAnalysis.success ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                        style={{ width: `${aiAnalysis.confidence}%` }} 
                      />
                    </div>
                  </div>
                )}

                {aiAnalysis.description && (
                  <p className="text-[10.5px] text-slate-300">
                    <b>Identified:</b> {aiAnalysis.description}
                  </p>
                )}

                <p className={`p-2 rounded-xl text-[10.5px] font-medium leading-relaxed bg-black/40 ${aiAnalysis.success ? 'text-emerald-300' : 'text-rose-300'}`}>
                  <b>Feedback:</b> {aiAnalysis.feedback}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* =========================================================================
           OBJECT HUNT MISSION RENDERING (PREMIUM)
           ========================================================================= */}
        {alarm.missionType === 'object' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col text-left">
            <div className="text-center mb-3">
              <span className="text-3xl">🔑_🔍</span>
              <h2 className="text-lg font-bold text-orange-400 mt-1.5 flex items-center justify-center gap-1">
                Morning Object Hunt <span className="text-[9px] bg-orange-400/15 py-0.5 px-1.5 rounded uppercase font-mono">PRO</span>
              </h2>
              <div className="mt-2.5 flex flex-wrap gap-2 items-center justify-center">
                <span className="text-[10px] text-slate-400">Locate and capture:</span>
                <span className="text-[11.5px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/35 font-mono px-3 py-1 rounded-full font-black animate-pulse flex items-center gap-1">
                  🎯 {targetObject}
                </span>
                <button
                  type="button"
                  onClick={handleRerollTarget}
                  disabled={aiChecking}
                  title="Cycle Target item"
                  className="p-1 px-2.5 rounded-xl text-[10px] bg-slate-900 hover:bg-slate-800 text-purple-400 border border-slate-800 transition-all font-mono select-all cursor-pointer disabled:opacity-50"
                >
                  🎲 Cycle target
                </button>
              </div>
            </div>

            {/* view camera lens */}
            <div className="relative aspect-video rounded-3xl bg-slate-950 border border-slate-900 overflow-hidden flex flex-col items-center justify-center shadow-2xl">
              {cameraStream ? (
                <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
              ) : screenshot ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <img src={screenshot} alt="Captured target Item" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                  {aiChecking && (
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-[0_0_12px_#f97316] top-0 animate-[bounce_2s_infinite] z-20" />
                  )}
                  <span className="absolute bottom-2 right-2 text-[8px] font-mono tracking-wider bg-black/60 backdrop-blur text-slate-300 py-0.5 px-2 rounded border border-white/10 uppercase">Captured hunting frame</span>
                </div>
              ) : (
                <div className="text-center flex flex-col items-center p-6 text-slate-600 border-2 border-dashed border-slate-900 rounded-2xl w-[90%]">
                  <Key className="w-5 h-5 text-indigo-400 animate-pulse mb-1" />
                  <span className="text-[9.5px] font-mono uppercase tracking-wider text-slate-400">Environment Target Locator ready</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              {!cameraStream && !screenshot ? (
                <button
                  onClick={startCamera}
                  disabled={aiChecking}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl cursor-pointer"
                >
                  Activate Object Lens
                </button>
              ) : cameraStream ? (
                <button
                  onClick={capturePhoto}
                  className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold text-xs py-3 rounded-xl cursor-pointer"
                >
                  Snap verify {targetObject}
                </button>
              ) : (
                <button
                  onClick={verifyObjectPhoto}
                  disabled={aiChecking}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {aiChecking ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Deep Vision Scanning...
                    </>
                  ) : (
                    `Authenticate Object`
                  )}
                </button>
              )}
            </div>

            {/* AI Analyzer Log */}
            {aiChecking && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center flex flex-col gap-1.5 items-center justify-center">
                <RefreshCw className="w-6 h-6 text-orange-400 animate-spin" />
                <span className="text-[11px] font-mono text-orange-400 uppercase tracking-widest animate-pulse font-semibold">Vision computer searching frame for {targetObject}...</span>
              </div>
            )}

            {aiAnalysis && !aiChecking && (
              <div className={`mt-4 p-4 rounded-2xl border text-[11px] font-sans flex flex-col gap-2 ${aiAnalysis.success ? 'bg-emerald-950/20 border-emerald-900/60 text-slate-100' : 'bg-rose-950/20 border-rose-900/60 text-slate-100'}`}>
                <div className="flex justify-between items-center pb-1 border-b border-white/5">
                  <span className="font-mono text-[9px] tracking-wider text-slate-400">OBJECT SCANNER RESPONSE:</span>
                  <span className={`font-black uppercase tracking-wider ${aiAnalysis.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {aiAnalysis.success ? 'Match Succeeded ✓' : 'Match Denied 🗙'}
                  </span>
                </div>

                {aiAnalysis.confidence !== undefined && (
                  <div className="flex flex-col gap-1 mt-0.5">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Target match probability:</span>
                      <span>{aiAnalysis.confidence}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${aiAnalysis.success ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                        style={{ width: `${aiAnalysis.confidence}%` }} 
                      />
                    </div>
                  </div>
                )}

                {aiAnalysis.description && (
                  <p className="text-[10.5px] text-slate-300">
                    <b>Identified in Sight:</b> {aiAnalysis.description}
                  </p>
                )}

                <p className={`p-2.5 rounded-xl text-[10.5px] font-medium leading-relaxed bg-black/40 ${aiAnalysis.success ? 'text-emerald-300' : 'text-rose-300'}`}>
                  <b>Feedback:</b> {aiAnalysis.feedback}
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* =========================================================================
           READING / VERSE MISSION RENDERING
           ========================================================================= */}
        {alarm.missionType === 'reading' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col text-left">
            <div className="text-center mb-3">
              <span className="text-4xl">📖</span>
              <h2 className="text-lg font-bold text-white mt-1">Focus Mind Booster</h2>
              <p className="text-[10.5px] text-slate-400 px-6 mt-1">Read the custom motivational verse. Slow scrolling builds early cognitive focus.</p>
            </div>

            {/* Scroll Lock Container */}
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-h-[180px] overflow-y-auto relative shadow-inner"
            >
              <p className="text-[#c1cadb] text-xs font-serif leading-relaxed italic select-text">
                “{selectedQuote.text}”
              </p>
              <div className="text-right mt-3 text-[10px] font-mono text-purple-400 font-bold">— {selectedQuote.author}</div>
            </div>

            {/* Verification checklist indicators */}
            <div className="mt-4 flex flex-col gap-2 bg-slate-950 text-[10.5px] p-4.5 rounded-2xl border border-slate-900 font-mono">
              <div className="flex justify-between items-center text-slate-400">
                <span>📖 Scroll to bottom check:</span>
                <span className={scrolledToBottom ? "text-emerald-400 font-extrabold" : "text-amber-500"}>
                  {scrolledToBottom ? "Completed ✓" : "Scroll down!"}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400 mt-2">
                <span>⏳ Cognitive read timer:</span>
                <span className={hasHeldTime ? "text-emerald-400 font-extrabold" : "text-amber-500 animate-pulse"}>
                  {hasHeldTime ? "Completed ✓" : `${readingTimer}s remaining`}
                </span>
              </div>
            </div>

            <button
              onClick={() => onCompleteMission(secondsElapsed)}
              disabled={!scrolledToBottom || !hasHeldTime}
              className={`mt-4 py-3.5 rounded-xl font-bold text-xs cursor-pointer text-center flex items-center justify-center gap-1 shadow transition-all ${
                scrolledToBottom && hasHeldTime 
                  ? 'bg-gradient-to-r from-orange-400 to-purple-600 text-white' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              🔐 I Have Read & Recited Quote
            </button>
          </motion.div>
        )}

        {/* =========================================================================
           MATH CALCULATOR MISSION RENDERING
           ========================================================================= */}
        {alarm.missionType === 'math' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col text-left">
            <div className="text-center mb-4">
              <span className="text-4xl">🖩</span>
              <h2 className="text-lg font-bold text-white mt-1">Neural Math Grid</h2>
              <p className="text-[11px] text-slate-400">Solve equations to turn off the alarm sound loop.</p>
            </div>

            {/* Equation Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4.5 flex flex-col text-center shadow">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">
                Task {mathCorrectCount + 1} of {mathTargetNeeded}
              </span>
              <div className="text-3xl font-black font-mono text-indigo-405 tracking-wider text-white mt-2 flex items-center justify-center gap-2">
                {alarm.difficulty === 'hard' ? (
                  <span>({mathNum1} × {mathNum2}) − {mathNum3}</span>
                ) : (
                  <span>{mathNum1} {mathOperator} {mathNum2}</span>
                )}
                <span>=</span>
                <span className="min-w-[70px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-orange-400">
                  {mathAnswerStr || '?'}
                </span>
              </div>
            </div>

            {/* Simulated calculator keypad dial for fast responsive taps */}
            <div className="grid grid-cols-4 gap-2 mt-4 select-none font-mono">
              {['1', '2', '3', '-'].map(k => (
                <button
                  key={k}
                  onClick={() => handleMathDial(k)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 py-3 rounded-xl font-extrabold text-base cursor-pointer text-white flex items-center justify-center transition-transform active:scale-95"
                >
                  {k}
                </button>
              ))}
              {['4', '5', '6', 'C'].map(k => (
                <button
                  key={k}
                  onClick={() => handleMathDial(k)}
                  className={`py-3 rounded-xl font-extrabold text-base cursor-pointer flex items-center justify-center transition-transform active:scale-95 ${
                    k === 'C' 
                      ? 'bg-rose-950/20 border border-rose-900/40 text-rose-450 hover:bg-rose-900/35 text-rose-400' 
                      : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white'
                  }`}
                >
                  {k}
                </button>
              ))}
              {['7', '8', '9', '0'].map(k => (
                <button
                  key={k}
                  onClick={() => handleMathDial(k)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 py-3 rounded-xl font-extrabold text-base cursor-pointer text-white flex items-center justify-center transition-transform active:scale-95"
                >
                  {k}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <div className="text-center font-mono text-[9px] text-slate-500 mb-2">
        <button
          onClick={onAbandon}
          className="text-slate-500 hover:text-rose-400 underline select-all cursor-pointer hover:font-bold"
        >
          🚨 Bypass Mission (Forfeit streak record & log miss)
        </button>
      </div>

    </div>
  );
}
