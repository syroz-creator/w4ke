/**
 * Shared Type Definitions for W4KE
 */

export type MissionType = 'push-ups' | 'sky' | 'bed' | 'object' | 'reading' | 'math' | 'none';
export type DifficultySetting = 'easy' | 'medium' | 'hard';

export interface Alarm {
  id: string;
  time: string; // "HH:MM" e.g., "07:30"
  label: string;
  repeatDays: number[]; // Array of weekdays 0 (Sunday) to 6 (Saturday)
  missionType: MissionType;
  difficulty: DifficultySetting;
  sound: string; // e.g., "gentle-waves", "retro-beep", "laser-blast"
  vibration: boolean;
  snoozeEnabled: boolean;
  snoozeDuration: number; // in minutes
  maxSnoozes: number;
  currentSnoozeCount: number;
  isActive: boolean;
  volume: number; // 0.0 to 1.0
  gradualVolume: boolean;
}

export interface User {
  id: string;
  email?: string;
  name: string;
  isPremium: boolean;
  isGuest: boolean;
}

export interface MissionLog {
  id: string;
  timestamp: string; // ISO string
  alarmId?: string;
  alarmTime?: string;
  missionType: MissionType;
  completed: boolean;
  durationSeconds: number;
}

export interface UserStats {
  streak: number;
  maxStreak: number;
  missionsCompleted: number;
  averageWakeTime: string; // "07:12 AM" or similar
  weeklyHistory: { day: string; completed: boolean }[]; // representation of last 7 days from Sunday
  missionBreakdown: Record<MissionType, number>;
}

export const SOUND_PRESETS = [
  { id: 'gentle-waves', name: '🌊 Gentle Waves', url: 'gentle-waves', premium: false },
  { id: 'digital-alarm', name: '⏰ Classic Digital Beeps', url: 'digital-alarm', premium: false },
  { id: 'morning-birds', name: '🐦 Morning Chirps', url: 'morning-birds', premium: false },
  { id: 'energy-booster', name: '⚡ Cyber Synth Energy', url: 'energy-booster', premium: true },
  { id: 'heavy-metal', name: '🎸 Metal Megaphone Blast', url: 'heavy-metal', premium: true },
  { id: 'zen-flute', name: '🎋 Spiritual Zen Flute', url: 'zen-flute', premium: true }
];

export const MISSION_DETAILS: Record<MissionType, {
  name: string;
  icon: string;
  description: string;
  shortDesc: string;
  instructions: string;
  premium: boolean;
}> = {
  'none': {
    name: 'Normal Alarm',
    icon: 'bell',
    description: 'No requirements, straight-up alarm dismissal',
    shortDesc: 'Immediate turn off',
    instructions: 'Slide to dismiss.',
    premium: false
  },
  'push-ups': {
    name: 'Push-Ups Counter',
    icon: 'dumbbell',
    description: 'Forces blood circulation. Place device on floor under chest, do push-ups to trigger proximity/motion detection.',
    shortDesc: 'Do physical exercise',
    instructions: 'Place phone on floor. Do chest-to-phone push-ups.',
    premium: false
  },
  'sky': {
    name: 'Sky Photo Verification',
    icon: 'cloud-sun',
    description: 'Step outside or look out the window. Align camera with the sky to register outside natural lighting.',
    shortDesc: 'Photo of the morning sky',
    instructions: 'Capture a clear photo of the morning sky.',
    premium: false
  },
  'bed': {
    name: 'Make Your Bed',
    icon: 'bed',
    description: 'Kickstart neatness. Scan your tidy, nicely organized room and folded duvet to confirm you didn\'t snooze.',
    shortDesc: 'Photo of a made bed',
    instructions: 'Capture a nice photo of your made and tidy bed.',
    premium: true
  },
  'object': {
    name: 'Morning Object Hunt',
    icon: 'search',
    description: 'Scavenge your environment to find specific early-morning targets (e.g. coffee mug, bathroom tap, car keys).',
    shortDesc: 'Find an everyday object',
    instructions: 'Take a photo of a coffee mug, toothbrush, or keys.',
    premium: true
  },
  'reading': {
    name: 'Mind Booster Quotes',
    icon: 'book-open',
    description: 'Inspiring scripts, Quran verses, biblical lessons or motivational quotes. Scroll through and recite.',
    shortDesc: 'Recite or read motivational texts',
    instructions: 'Slowly read and scroll the text to build early focus.',
    premium: false
  },
  'math': {
    name: 'Cognitive Math Grid',
    icon: 'calculator',
    description: 'Fire up your neural pathways. Solve customized equations in varying difficulties.',
    shortDesc: 'Solve algebraic equations',
    instructions: 'Calculate the answers to complete your wake-up sequence.',
    premium: false
  }
};
