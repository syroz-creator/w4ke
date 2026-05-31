# W4KE — High-Fidelity Mission Alarm Clock ☀️

**W4KE** is an interactive, mobile-focused, mission-based alarm clock designed to jumpstart heavy snoozers. It replaces standard low-intensity wake warnings with cognitive, athletic, and ambient checkouts that guarantee you wake up energized and stay awake.

This suite compiles both the **complete Node.js Express sync database backend** and the **high-fidelity React-Vite visual mobile emulator**.

---

## 🚀 Key Deliverables Implemented

1. **W4KE Reactive Mobile App**: 
   - Authentic iOS/Android device frame wrapper featuring a customized Dynamic Status Bar (cellular signals, device clock, battery levels, volume indicators).
   - Dynamic greetings checking the real-world local hour of the browser (*Good Morning*, *Good Afternoon*, *Good Evening*).
   - Bottom Tabbed Navigation: **Alarms**, **Missions**, **Stats**, and **Profile Settings**.
   - Create/Edit Alarm sliding drawer offering deep parameters: time scheduling, Smart wake templates, customized weekday repeat presets, volume, Snooze allowed switches, limits, and custom labels.
2. **REST Sync Backend API**:
   - Persistent database sync operated via an automated JSON database file (`db.json`) ensuring configuration profiles are preserved through sandbox container restarts.
   - User Accounts: Registration, email logins, Google/Apple mock integrations, and Guest profiles.
   - Real-time updates for alarms, strengths, history wake logs, and badges.
3. **Sound-Synthesizer Technology**:
   - Real browser sound synthesis using the Web Audio API. It plays custom waveforms corresponding with selected ringtone presets:
     - *Gentle Waves* (warm low sine wave swells)
     - *Digital Alarm* (intense square wave high-pitch beeps)
     - *Morning Birds* (cute triangle wave chirps)
     - *Cyber Synth* (energetic tech arpeggiator)
     - *Metal Blast* (heavy distorted feedback)
     - *Zen Flute* (meditative harmonic triangle sweeps)
4. **Interactive Mission Suite**:
   - **Push-Ups Counter**: Exercises blood flow. Places phone under chest, utilizing proximity/click triggers with vocal count bleeps.
   - **Sky Photo Verification**: Snaps a camera capture (with real-time webcam inputs) and analyzes Daylight index.
   - **Make Your Bed (PRO)**: Features Before/After comparison slots.
   - **Morning Object Hunt (PRO)**: Prompts user to find teeth brushes, coffee mugs, or keys using mock AI visual scan reticles.
   - **Reading Quotes**: Scroll-locked motivational quotes tracker verifying full cognitive comprehension.
   - **Math Calculations**: Generates maths problems on three difficulty steps with numeric calculator dial-pads.
5. **Motivational Analytics**:
   - Tracks current streaks, record max streaks, average speed, weekly success charts, and lists of morning wake logs.

---

## 🛠️ Port Setup & Development Execution

Port **3000** is the designated gateway routed to your container preview.

### Prerequisites & Dependencies
All modern dependencies are pre-configured:
```json
"dependencies": {
  "express": "^4.21.2",
  "vite": "^6.2.3",
  "tsx": "^4.21.0",
  "motion": "^12.23.24"
}
```

### Local Dev Launch
Launch the application dev server locally:
```bash
npm run dev
```
The application will boot using `tsx` rendering the Express API endpoints on port `3000`, while simultaneously routing SPA visual assets.

### Compiles & Bundling
Create production bundles safely to bypass CJS ES path dependencies at Node runtime:
```bash
npm run build
```
This triggers `vite build` for client visual components and packages `server.ts` into a fast, combined, self-contained `dist/server.cjs` via `esbuild`.

To start the compiled production server:
```bash
npm start
```

---

## ⚙️ Core Technical Workflows

### 1. Alarm Triggers & Notification Simulation
Due to browser iframe background sleep limitations, W4KE simulates background triggers uniquely:
- Clicking **"Simulate Ringing"** inside any active alarm edit menu simulates locking the device and enters a 3-second countdown.
- An **iOS-style alert notification banner** slides down onto your desktop.
- Clicking the notification triggers the full-screen looping synthesizer alarm screen, complete with physical cabinet vibrations.

### 2. Premium Purchases Billing Integration (W4KE Pro)
- Free tier profiles are capped at **3 active alarms**. Selecting locked presets alerts user of active limits and slides up a W4KE PRO paywall overlay.
- Upgrading to W4KE PRO unlocks:
  - Custom *Make Your Bed* and *Object Hunt* scanning missions.
  - Premium *flute* and *heavy metal* synthesizers.
  - High-performance multi-device cloud synchronization.
  - Unlimited active alarms.

### 3. Adding New Morning Missions
Adding a mission is engineered to be modular:
1. Open `/src/types.ts` and append your mission literal key to `MissionType` (e.g. `type MissionType = ... | 'voice-sing'`).
2. Add the metadata info to `MISSION_DETAILS` dictionary:
   ```typescript
   'voice-sing': {
     name: "Vocal Singing Tuner",
     icon: "music",
     description: "Wake your vocal cords. Sing a high-note template to dismiss.",
     shortDesc: "Sing to unlock",
     instructions: "Sing a continuous tone inside your media microphone.",
     premium: true
   }
   ```
3. Open `/src/components/MissionsScreen.tsx` and register its visual layout inside the main render column, defining verification callbacks on completing the task.
