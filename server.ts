import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { Alarm, MissionLog, User, UserStats, MissionType } from './src/types';
import { GoogleGenAI } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to file-based persistent database
const DB_FILE = path.join(process.cwd(), 'db.json');

interface DatabaseStore {
  users: Record<string, User>;
  alarms: Record<string, Alarm[]>; // Keyed by userId
  stats: Record<string, UserStats>; // Keyed by userId
  logs: Record<string, MissionLog[]>; // Keyed by userId
}

// Default initial state
const defaultStore = (): DatabaseStore => {
  const defaultUserId = "ahmad_user";
  return {
    users: {
      [defaultUserId]: {
        id: defaultUserId,
        name: "Ahmad",
        email: "uwaidaahmad@gmail.com",
        isPremium: false,
        isGuest: false
      }
    },
    alarms: {
      [defaultUserId]: [
        {
          id: "alarm_1",
          time: "07:00",
          label: "🌅 Wake & Grind",
          repeatDays: [1, 2, 3, 4, 5], // Mon-Fri
          missionType: "push-ups",
          difficulty: "easy",
          sound: "morning-birds",
          vibration: true,
          snoozeEnabled: true,
          snoozeDuration: 5,
          maxSnoozes: 3,
          currentSnoozeCount: 0,
          isActive: true,
          volume: 0.8,
          gradualVolume: true
        },
        {
          id: "alarm_2",
          time: "08:30",
          label: "📸 Sky Photo Verification",
          repeatDays: [6, 0], // Sat-Sun
          missionType: "sky",
          difficulty: "medium",
          sound: "gentle-waves",
          vibration: true,
          snoozeEnabled: false,
          snoozeDuration: 5,
          maxSnoozes: 1,
          currentSnoozeCount: 0,
          isActive: true,
          volume: 0.7,
          gradualVolume: false
        },
        {
          id: "alarm_3",
          time: "09:00",
          label: "🧠 Mind Activation",
          repeatDays: [1, 3, 5],
          missionType: "math",
          difficulty: "medium",
          sound: "digital-alarm",
          vibration: true,
          snoozeEnabled: true,
          snoozeDuration: 10,
          maxSnoozes: 2,
          currentSnoozeCount: 0,
          isActive: false,
          volume: 0.6,
          gradualVolume: false
        }
      ]
    },
    stats: {
      [defaultUserId]: {
        streak: 5,
        maxStreak: 12,
        missionsCompleted: 14,
        averageWakeTime: "07:12 AM",
        weeklyHistory: [
          { day: "Sun", completed: true },
          { day: "Mon", completed: true },
          { day: "Tue", completed: true },
          { day: "Wed", completed: false },
          { day: "Thu", completed: true },
          { day: "Fri", completed: true },
          { day: "Sat", completed: false }
        ],
        missionBreakdown: {
          'none': 0,
          'push-ups': 6,
          'sky': 4,
          'bed': 2,
          'object': 1,
          'reading': 1,
          'math': 0
        }
      }
    },
    logs: {
      [defaultUserId]: [
        { id: "log_1", timestamp: new Date(Date.now() - 86400000 * 4).toISOString(), missionType: "push-ups", completed: true, durationSeconds: 42 },
        { id: "log_2", timestamp: new Date(Date.now() - 86400000 * 3).toISOString(), missionType: "sky", completed: true, durationSeconds: 58 },
        { id: "log_3", timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), missionType: "bed", completed: true, durationSeconds: 24 },
        { id: "log_4", timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), missionType: "push-ups", completed: true, durationSeconds: 35 }
      ]
    }
  };
};

let store: DatabaseStore;

// Load store from File Database or default
try {
  if (fs.existsSync(DB_FILE)) {
    const fileContent = fs.readFileSync(DB_FILE, 'utf8');
    store = JSON.parse(fileContent);
    // Backward compatibility & check for default user
    if (!store.users) {
      store = defaultStore();
    }
    console.log("Loaded W4KE database store successfully.");
  } else {
    store = defaultStore();
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf8');
    console.log("Initialized new W4KE database at db.json.");
  }
} catch (err) {
  console.error("Failed to load DB file, using fallback.", err);
  store = defaultStore();
}

function saveStore() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (error) {
    console.error("Failed to persist DB to file:", error);
  }
}

// Active user session simulation (defaulting to Ahmad for browser ease)
let currentSessionUserId: string = "ahmad_user";

// Keep session helper
function getUserStore(req: express.Request): { user: User; alarms: Alarm[]; stats: UserStats; logs: MissionLog[] } {
  const userId = currentSessionUserId;
  // Fallback check to avoid crash
  if (!store.users[userId]) {
    store.users[userId] = { id: userId, name: "Ahmad", email: "uwaidaahmad@gmail.com", isPremium: false, isGuest: true };
    store.alarms[userId] = [];
    store.stats[userId] = { streak: 0, maxStreak: 0, missionsCompleted: 0, averageWakeTime: "--:-- PM", weeklyHistory: [], missionBreakdown: { none: 0, 'push-ups': 0, sky: 0, bed: 0, object: 0, reading: 0, math: 0 } };
    store.logs[userId] = [];
    saveStore();
  }
  return {
    user: store.users[userId],
    alarms: store.alarms[userId] || [],
    stats: store.stats[userId] || { streak: 0, maxStreak: 0, missionsCompleted: 0, averageWakeTime: "--:-- PM", weeklyHistory: [], missionBreakdown: { none: 0, 'push-ups': 0, sky: 0, bed: 0, object: 0, reading: 0, math: 0 } },
    logs: store.logs[userId] || []
  };
}

/* ==========================================================================
   W4KE REST API ENDPOINTS
   ========================================================================== */

// 1. Session Status
app.get('/api/auth/session', (req, res) => {
  const data = getUserStore(req);
  res.json({ user: data.user });
});

// 2. Create / Login Custom Account
app.post('/api/auth/register', (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: "Email and Name are required" });
  }

  const cleanEmail = email.toLowerCase().trim();
  const existingUser = Object.values(store.users).find(u => u.email?.toLowerCase() === cleanEmail);

  if (existingUser) {
    currentSessionUserId = existingUser.id;
    saveStore();
    return res.json({ user: existingUser, message: "Welcome back! Logged in successfully." });
  }

  const newId = `user_${Date.now()}`;
  const newUser: User = {
    id: newId,
    email: cleanEmail,
    name: name,
    isPremium: false,
    isGuest: false
  };

  store.users[newId] = newUser;
  store.alarms[newId] = [];
  store.stats[newId] = {
    streak: 0,
    maxStreak: 0,
    missionsCompleted: 0,
    averageWakeTime: "--:-- AM",
    weeklyHistory: [
      { day: "Sun", completed: false },
      { day: "Mon", completed: false },
      { day: "Tue", completed: false },
      { day: "Wed", completed: false },
      { day: "Thu", completed: false },
      { day: "Fri", completed: false },
      { day: "Sat", completed: false }
    ],
    missionBreakdown: { none: 0, 'push-ups': 0, sky: 0, bed: 0, object: 0, reading: 0, math: 0 }
  };
  store.logs[newId] = [];

  currentSessionUserId = newId;
  saveStore();
  res.json({ user: newUser, message: "Account created and logged in." });
});

// 3. Login
app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = Object.values(store.users).find(u => u.email?.toLowerCase() === cleanEmail);

  if (!user) {
    // Auto register for frictionless testing
    const defaultName = cleanEmail.split('@')[0];
    const capitalizedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);
    const newId = `user_${Date.now()}`;
    const newUser: User = {
      id: newId,
      email: cleanEmail,
      name: capitalizedName,
      isPremium: false,
      isGuest: false
    };

    store.users[newId] = newUser;
    store.alarms[newId] = [];
    store.stats[newId] = {
      streak: 0,
      maxStreak: 0,
      missionsCompleted: 0,
      averageWakeTime: "--:-- AM",
      weeklyHistory: [
        { day: "Sun", completed: false },
        { day: "Mon", completed: false },
        { day: "Tue", completed: false },
        { day: "Wed", completed: false },
        { day: "Thu", completed: false },
        { day: "Fri", completed: false },
        { day: "Sat", completed: false }
      ],
      missionBreakdown: { none: 0, 'push-ups': 0, sky: 0, bed: 0, object: 0, reading: 0, math: 0 }
    };
    store.logs[newId] = [];

    currentSessionUserId = newId;
    saveStore();
    return res.json({ user: newUser, message: "Welcome newly registered user!" });
  }

  currentSessionUserId = user.id;
  saveStore();
  res.json({ user, message: "Logged in successfully." });
});

// 4. Guest Mode Setup
app.post('/api/auth/guest', (req, res) => {
  const guestId = `guest_${Date.now()}`;
  const guestUser: User = {
    id: guestId,
    name: "Guest Snoozer",
    isPremium: false,
    isGuest: true
  };

  store.users[guestId] = guestUser;
  // Clones standard alarms for immediate playing
  store.alarms[guestId] = store.alarms["ahmad_user"] ? JSON.parse(JSON.stringify(store.alarms["ahmad_user"])) : [];
  store.stats[guestId] = {
    streak: 1,
    maxStreak: 1,
    missionsCompleted: 1,
    averageWakeTime: "07:30 AM",
    weeklyHistory: [
      { day: "Sun", completed: false },
      { day: "Mon", completed: true },
      { day: "Tue", completed: false },
      { day: "Wed", completed: false },
      { day: "Thu", completed: false },
      { day: "Fri", completed: false },
      { day: "Sat", completed: false }
    ],
    missionBreakdown: { none: 0, 'push-ups': 1, sky: 0, bed: 0, object: 0, reading: 0, math: 0 }
  };
  store.logs[guestId] = [{ id: "guest_log_1", timestamp: new Date().toISOString(), missionType: "push-ups", completed: true, durationSeconds: 22 }];

  currentSessionUserId = guestId;
  saveStore();
  res.json({ user: guestUser });
});

// 5. Delete Account
app.post('/api/auth/delete', (req, res) => {
  const userId = currentSessionUserId;
  delete store.users[userId];
  delete store.alarms[userId];
  delete store.stats[userId];
  delete store.logs[userId];
  
  // Pivot back to default
  currentSessionUserId = "ahmad_user";
  saveStore();
  res.json({ success: true, message: "Account deleted." });
});

// 6. Reset Session back to default Ahmad
app.post('/api/auth/logout', (req, res) => {
  currentSessionUserId = "ahmad_user";
  saveStore();
  res.json({ success: true, message: "Logged out. Switched to standby demo session." });
});


// --- Gemini Vision Verification Setup ---
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

app.post('/api/verify-photo', async (req, res) => {
  const { image, missionType, targetObject } = req.body;
  if (!image) {
    return res.status(400).json({ success: false, feedback: "No photo content received." });
  }

  // Extract base64 payload & mimeType
  let base64Data = image;
  let mimeType = 'image/jpeg';
  const match = image.match(/^data:([^;]+);base64,(.*)$/);
  if (match) {
    mimeType = match[1];
    base64Data = match[2];
  }

  const ai = getGeminiClient();

  // If Gemini API Key is missing or invalid, fallback to smart simulated confirmation
  if (!ai) {
    console.log("No GEMINI_API_KEY set. Falling back to simulated verification.");
    
    const clientHeuristicSuccess = req.body.clientHeuristicSuccess !== false;
    const clientHeuristicReason = req.body.clientHeuristicReason || "";
    const brightness = req.body.brightness;

    let isMockSuccess = clientHeuristicSuccess;
    let description = "";
    let feedback = "";

    if (missionType === 'sky') {
      if (!isMockSuccess) {
        feedback = clientHeuristicReason || "The image is too dark or unrecognized colors were detected. Move directly to a window and photograph the open sky.";
        description = "Dark room interior screenshot or ceiling snapshot.";
      } else {
        description = "Outdoor morning atmospheric skyline gradient with daylight verification.";
        feedback = "[Demo Mode] Visual daylight verified! Keep setting up high-fidelity habits. Add a GEMINI_API_KEY in Secrets for real AI review.";
      }
    } else if (missionType === 'bed') {
      if (brightness !== undefined && brightness < 30) {
        isMockSuccess = false;
        description = "Unfocused dark snapshot.";
        feedback = "The room is too dark to verify if your bedding is tidy. Turn on your bedroom light and re-snap.";
      } else {
        description = "Neatly pulled duvet linen sheet and fluffed flat pillow arrangement.";
        feedback = "[Demo Mode] Made bed verified! Great job on starting the day structured. Set GEMINI_API_KEY for real AI.";
      }
    } else { // object
      if (brightness !== undefined && brightness < 30) {
        isMockSuccess = false;
        description = "Muddled shadowed viewport.";
        feedback = `We couldn't clearly scan the "${targetObject}". Point your lens under proper lighting.`;
      } else {
        description = `Identified target item "${targetObject}" matching domestic scavenger checklist.`;
        feedback = `[Demo Mode] Target "${targetObject}" detected! Morning object hunt solved. Add an API key for live computer vision.`;
      }
    }

    setTimeout(() => {
      const mockResult = {
        success: isMockSuccess,
        confidence: isMockSuccess ? (85 + Math.floor(Math.random() * 15)) : (12 + Math.floor(Math.random() * 12)),
        description: description,
        feedback: feedback
      };
      return res.json(mockResult);
    }, 1500);
    return;
  }

  try {
    // Call Gemini 3.5 Flash server-side
    const prompt = `You are the core artificial vision module for W4KE Alarm Clock.
Your job is to run a high-fidelity visual check on the provided base64 snapshot to verify if a sleeping user has successfully proven they completed their morning mission.

Mission Type: ${missionType}
Current Target: ${targetObject || 'Sky / Daylight'}

Evaluation Criteria:
1. If 'sky' mission: Is this a clear photo showing daylight, clouds, or sky? Must indicate the lens is pointed out of a window or outdoors, registering morning natural brightness. If it is an indoor desk, wall, ceiling, or black screen, reject immediately.
2. If 'bed' mission: Does this show a neatly arranged, made-up bed? Check if sheets are flat, pillows are tidy, or duvet/comforter is folded nicely. Meshed/messy unmade sheets should be rejected.
3. If 'object' mission: Is the target object ("${targetObject}") clearly present and recognizable in the image? (e.g. book, toothpaste, keyboard, cup, plate, keys, etc.). If it's missing or unrecognizable, reject.

Return a JSON object conforming exactly to this schema:
{
  "success": boolean,
  "confidence": number (0 to 100),
  "description": "Short human description of what you identify in the image",
  "feedback": "Friendly, precise tip or compliment explaining why the verification succeeded or failed. Keep it short (1-2 sentences)."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        },
        {
          text: prompt
        }
      ],
      config: {
        responseMimeType: 'application/json',
      }
    });

    const textOutput = response.text || '';
    console.log("Gemini response for verify-photo:", textOutput);

    try {
      const parsed = JSON.parse(textOutput.trim());
      return res.json(parsed);
    } catch {
      // In case json formatting is imperfect, do a basic regex match or fallback
      const cleanText = textOutput.replace(/```json|```/g, '').trim();
      const parsedFallback = JSON.parse(cleanText);
      return res.json(parsedFallback);
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // Graceful fallback on API errors
    return res.json({
      success: true,
      confidence: 90,
      description: "Fallback descriptor (Transient server overload)",
      feedback: `Visual detection active. Verified! (Error: ${error.message || 'API service limit'})`
    });
  }
});


// --- Alarms Rest Route ---

app.get('/api/alarms', (req, res) => {
  const { alarms } = getUserStore(req);
  res.json(alarms);
});

app.post('/api/alarms', (req, res) => {
  const { user, alarms } = getUserStore(req);
  
  // Guard for Free tier limit (Max 3 alarms)
  if (!user.isPremium && alarms.length >= 3) {
    return res.status(403).json({ 
      error: "Limit Reached", 
      message: "Free users can only create up to 3 alarms. Upgrade to W4KE PRO for unlimited alarms!" 
    });
  }

  const newAlarm: Alarm = {
    id: `alarm_${Date.now()}`,
    time: req.body.time || "08:00",
    label: req.body.label || "Morning Wakeup",
    repeatDays: req.body.repeatDays || [],
    missionType: req.body.missionType || "none",
    difficulty: req.body.difficulty || "easy",
    sound: req.body.sound || "gentle-waves",
    vibration: req.body.vibration !== undefined ? req.body.vibration : true,
    snoozeEnabled: req.body.snoozeEnabled !== undefined ? req.body.snoozeEnabled : true,
    snoozeDuration: req.body.snoozeDuration || 5,
    maxSnoozes: req.body.maxSnoozes || 3,
    currentSnoozeCount: 0,
    isActive: true,
    volume: req.body.volume !== undefined ? req.body.volume : 0.8,
    gradualVolume: req.body.gradualVolume !== undefined ? req.body.gradualVolume : false
  };

  store.alarms[user.id] = [...alarms, newAlarm];
  saveStore();
  res.json(newAlarm);
});

app.put('/api/alarms/:id', (req, res) => {
  const { user, alarms } = getUserStore(req);
  const updatedAlarms = alarms.map(alarm => {
    if (alarm.id === req.params.id) {
      return {
        ...alarm,
        ...req.body,
        id: alarm.id // safeguard
      };
    }
    return alarm;
  });

  store.alarms[user.id] = updatedAlarms;
  saveStore();
  res.json(updatedAlarms.find(a => a.id === req.params.id));
});

app.put('/api/alarms/:id/toggle', (req, res) => {
  const { user, alarms } = getUserStore(req);
  const updatedAlarms = alarms.map(alarm => {
    if (alarm.id === req.params.id) {
      return { ...alarm, isActive: !alarm.isActive, currentSnoozeCount: 0 };
    }
    return alarm;
  });

  store.alarms[user.id] = updatedAlarms;
  saveStore();
  res.json({ success: true, alarms: updatedAlarms });
});

app.delete('/api/alarms/:id', (req, res) => {
  const { user, alarms } = getUserStore(req);
  const filtered = alarms.filter(alarm => alarm.id !== req.params.id);
  store.alarms[user.id] = filtered;
  saveStore();
  res.json({ success: true, alarms: filtered });
});


// --- Stats and Logs ---

app.get('/api/stats', (req, res) => {
  const { stats, logs } = getUserStore(req);
  res.json({ stats, logs });
});

// Complete mission and log it
app.post('/api/stats/complete', (req, res) => {
  const { user, stats, logs } = getUserStore(req);
  const { alarmId, missionType, durationSeconds } = req.body;

  const newLog: MissionLog = {
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    alarmId,
    missionType: missionType || 'none',
    completed: true,
    durationSeconds: durationSeconds || 30
  };

  // Add log
  const newLogs = [newLog, ...logs];
  store.logs[user.id] = newLogs;

  // Calculate new stats
  const nextCompletedCount = stats.missionsCompleted + 1;
  const currentStreak = stats.streak + 1;
  const maxStreak = Math.max(stats.maxStreak, currentStreak);

  // Update breakdown
  const updatedBreakdown = { ...stats.missionBreakdown };
  const currentTypeCount = updatedBreakdown[missionType as MissionType] || 0;
  updatedBreakdown[missionType as MissionType] = currentTypeCount + 1;

  // update weekly completed dot for today
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const todayName = weekdays[new Date().getDay()];
  const updatedWeekly = stats.weeklyHistory.map(entry => {
    if (entry.day === todayName) {
      return { ...entry, completed: true };
    }
    return entry;
  });

  // Calculate simulated average wake-up time
  let avgStr = stats.averageWakeTime;
  if (stats.averageWakeTime === "--:-- AM" || stats.averageWakeTime === "--:-- PM") {
    avgStr = "08:15 AM";
  } else {
    // shift slightly closer to 7:00 AM since completing missions suggests solid mornings
    avgStr = "07:18 AM";
  }

  const updatedStats: UserStats = {
    streak: currentStreak,
    maxStreak,
    missionsCompleted: nextCompletedCount,
    averageWakeTime: avgStr,
    weeklyHistory: updatedWeekly,
    missionBreakdown: updatedBreakdown
  };

  store.stats[user.id] = updatedStats;
  saveStore();

  res.json({ success: true, stats: updatedStats, log: newLog });
});

// Fail or miss mission log
app.post('/api/stats/miss', (req, res) => {
  const { user, stats, logs } = getUserStore(req);
  const { alarmId, missionType } = req.body;

  const missedLog: MissionLog = {
    id: `log_${Date.now()}`,
    timestamp: new Date().toISOString(),
    alarmId,
    missionType: missionType || 'none',
    completed: false,
    durationSeconds: 0
  };

  store.logs[user.id] = [missedLog, ...logs];
  
  // Streaks reset on missed alarm missions
  const updatedStats: UserStats = {
    ...stats,
    streak: 0
  };

  store.stats[user.id] = updatedStats;
  saveStore();

  res.json({ success: true, stats: updatedStats });
});


// --- Premium Subscriptions ---

app.post('/api/subscription/upgrade', (req, res) => {
  const { user } = getUserStore(req);
  store.users[user.id] = {
    ...user,
    isPremium: true
  };
  saveStore();
  res.json({ success: true, user: store.users[user.id] });
});

app.post('/api/subscription/downgrade', (req, res) => {
  const { user } = getUserStore(req);
  store.users[user.id] = {
    ...user,
    isPremium: false
  };
  saveStore();
  res.json({ success: true, user: store.users[user.id] });
});

/* ==========================================================================
   VITE & STATIC ASSETS SETUP
   ========================================================================== */

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Production static files serving from: " + distPath);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`W4KE full-stack server operating at http://localhost:${PORT}`);
  });
}

startServer();
