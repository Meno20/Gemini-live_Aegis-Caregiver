# 🛡️ Aegis Caregiver

**AI Guardian for Dementia Care** - A 24/7 intelligent companion for dementia patients built with Google Gemini Live API.

## 🌟 Overview

Aegis Caregiver is a comprehensive dementia care platform that provides:
- **Proactive Memory Support** - Answers repeated questions with infinite patience
- **Wandering Prevention** - Gentle redirection before patients reach exits
- **Health Monitoring** - Tracks meals, hydration, medications
- **Pattern Learning** - Detects sundowning, identifies triggers
- **Life Story Preservation** - Uses biographical data for reminiscence therapy
- **Caregiver Support** - Real-time alerts and weekly insights

## 🎯 The Problem

- 6.7 million Americans live with dementia
- 11 million family caregivers are burning out
- 40% of caregivers suffer from depression
- No real-time monitoring solution exists

## 💡 Our Solution

Unlike reactive monitoring systems, Aegis **PREDICTS and PREVENTS** crises before they happen using AI-powered multimodal analysis.

## ✨ Features

### Core Capabilities
- 🔴 **Live Monitoring** - Real-time patient state tracking
- 🎙️ **Voice Interaction** - Natural conversation with AI companion
- 📊 **Behavioral Insights** - Pattern detection and trend analysis
- 📖 **Life Story Bank** - Reminiscence therapy support
- 🔔 **Smart Alerts** - Proactive caregiver notifications
- 📱 **Mobile Responsive** - Caregiver access anywhere

### Patient Profiles
- **Maggie** - 82yo, moderate dementia, former teacher
- **Bill** - 76yo, mild dementia, retired engineer

Each patient has a personalized AI companion that knows their history, preferences, and calming strategies.

## 🛠️ Technology Stack

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS
- **Package Manager**: Bun (recommended) or npm
- **Database**: Prisma ORM + SQLite
- **AI**: Gemini 2.0 Flash (Live API) + Vision Analysis
- **Servers**: 
  - Next.js Web: Port 3001
  - Live WebSocket: Port 8081
  - Signaling Server: Port 8082

## 🚀 Quick Start (Judge Testing)

To test the full suite, follow these steps:

```bash
# 1. Install dependencies
bun install   # or npm install

# 2. Configure Environment
# Ensure .env has: GEMINI_API_KEY=your_key

# 3. Initialize Database
npx prisma db push
npx tsx scripts/seed.ts

# 4. Start All Services
npm run dev:all
```

Once running, access the dashboard at: **[http://localhost:3001](http://localhost:3001)**

---

## ⚖️ Judge Testing Guide (Reproducible)

Follow these scenarios to experience the core value of Aegis.

### Scenario 1: The Caregiver Dashboard (First Look)
1. Login with **`susan@aegis.care / demo123`**.
2. **Observe the Live State**: Look at the "Live Health Monitor" (left column). You'll see real-time updates for Maggie's agitation, medication, and meal status.
3. **Verify Interactive UX**: Click through the tabs (**Conversation**, **Timeline**, **Insights**, **Stories**) to see the depth of data integration.

### Scenario 2: The Memory companion (Live WS)
1. Go to the **Conversation** tab.
2. **Standard Question**: Type or use voice to ask *"Where is Bob?"*.
3. **Observation**: Aegis identifies Bob is Maggie's deceased husband and redirects her to a fond memory of their wedding rather than simply saying "he's dead" (which causes distress in dementia patients).
4. **Repetition Logic**: Ask the same question again. Aegis will detect the repetition and adapt its tone to remain infinitely patient.

### Scenario 3: Behavioral Insights (VLM Analysis)
1. Go to the **Insights** tab.
2. **Pattern Detection**: View the "Hourly Agitation Level" chart. 
3. **The "Sundowning" Insight**: Look for the yellow highlight between 4 PM and 7 PM. This demonstrates the AI's ability to detect the "Sundowning" pattern common in Alzheimer's patients.
4. **Actionable Recommendations**: Read the "AI Recommendations" at the bottom of the page (e.g., "Schedule high-focus activities before 3 PM").

### Scenario 4: Cross-Device Signaling
1. Open [http://localhost:3001/camera-viewer](http://localhost:3001/camera-viewer) in a separate tab or window (simulating a camera in the patient's room).
2. Go back to the main Carer Dashboard.
3. Observe how the Signaling Server (Port 8082) bridges the two, enabling real-time status updates between the "Camera" and the "Caregiver Interface".

---

## 🔐 Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| susan@aegis.care | demo123 | Caregiver (Maggie) |
| jennifer@aegis.care | demo123 | Caregiver (Bill) |
| admin@aegis.care | admin123 | Administrator |

## 🎬 Demo Video & Slides
- **Impact Paper**: [DEMO_GUIDE.md](file:///c:/Meno/Gemini-live/Gemini-live-version2/DEMO_GUIDE.md)
- **Problem Space**: See the "The Problem" section above.

---

**Aegis Caregiver** - *It remembers when they can't* 🛡️
Built with ❤️ for the dementia care community.
