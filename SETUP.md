# Leapboard — Setup Guide

## Step 1: Install Node.js (one-time)

Open Terminal and run:

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

Verify:
```bash
node --version   # Should show v18+ or v20+
npm --version
```

---

## Step 2: Install Dependencies

```bash
# From the leapboard/ folder:
cd /Users/mayanknarayan/leapboard

npm install                      # root (installs concurrently)
npm install --prefix server      # backend
npm install --prefix client      # frontend
```

---

## Step 3: Run Everything

```bash
npm run dev
```

This starts:
- **Server** on http://localhost:4000
- **Client** on http://localhost:3000

Open http://localhost:3000 in your browser.

---

## How the Demo Works

### Teacher
1. Go to http://localhost:3000 → click **"I'm a Teacher"**
2. Enter your name → click **"Create Class"**
3. A **6-letter session code** appears (e.g. `STAR42`) — share this with students/parents
4. The Jitsi video room opens + your control panel is on the right

### Student (Child)
1. Go to http://localhost:3000 → click **"I'm a Student"**
2. Enter name + the session code → click **"Let's Go!"**
3. Tap how you feel (Feeling Corner)
4. Jitsi video room opens

### Parent
1. Go to http://localhost:3000 → click **"I'm a Parent"**
2. Enter name, child's name, and session code
3. See the Calm-o-Meter for your child in real time

---

## Demo Features to Show

### 1. Auto Distress Detection
- The child's tab has a **"🎭 Simulate Cry"** button (bottom right of child's screen)
- Click it → balloons/stars/mascot appear on the CHILD's screen only
- Teacher's dashboard shows an alert dot instantly

### 2. Teacher Manual Trigger (Individual)
- In the right panel → **"Individual Magic"**
- Click a child's name → pick an overlay → click **"✨ Send Magic"**
- Only that child sees it

### 3. Teacher Broadcast
- In the right panel → **"Broadcast to All"**
- Click any broadcast button → ALL children see it simultaneously
- **⚡ Quick Energy Reset** — the big orange button — sends confetti to everyone

### 4. Parent Panic Button
- In the Parent view → tap **"🆘 Alert Teacher (Silent)"**
- Teacher sees a silent alert banner — no class disruption

### 5. Brave Points
- 8 seconds after a distress overlay fires, the child automatically earns a Brave Point
- Counter shows in the top-right of the child's screen

---

## Quick "Wow" Demo Script (10 minutes)

1. Open 3 browser windows/tabs:
   - Tab 1: Teacher → Create class (get code `ABCD12`)
   - Tab 2: Child → Join with code, name "Aryan"
   - Tab 3: Parent → Join with code, child name "Aryan"

2. Show: **Teacher sees "Aryan" appear in their class grid**

3. Go to child's tab → click **"🎭 Simulate Cry"**
   - 🎈 Balloons explode on CHILD's screen
   - Teacher tab shows alert in log
   - Parent tab shows Calm-o-Meter dip

4. Go to teacher tab → click "Aryan" → pick "Mascot" → click "✨ Send Magic"
   - 🚀 Mascot appears ONLY on Aryan's screen

5. Click **"⚡ Quick Energy Reset"** on teacher tab
   - 🎉 Confetti rains on EVERY child's screen simultaneously

6. Go to parent tab → click **"🆘 Alert Teacher"**
   - Teacher sees the panic alert banner instantly

---

## Deploying for Real Demo (Remote Access)

To let people join from different devices:

```bash
# Option A: Use ngrok (free, quick)
npx ngrok http 4000    # Exposes server
# Update client/.env: VITE_SERVER_URL=https://xxxx.ngrok.io
npx ngrok http 3000    # Exposes client (use this URL for all participants)

# Option B: Deploy to Railway (server) + Vercel (client)
# See Railway.app and Vercel.com — both have free tiers
```
