# Aegis Caregiver - Demo Guide

## 🚀 Quick Start

### Services Running
- **Dashboard**: Port 3000 (Next.js)
- **WebSocket Service**: Port 3003 (AI Backend)

### Access the Demo
1. Open the **Preview Panel** on the right side of the interface
2. Click **"Open in New Tab"** for full-screen experience

---

## 📊 Demo Flow (4 Minutes)

### [0:00-0:30] The Hook

**Narration:**
> "Margaret has Alzheimer's. Every day, she asks about her deceased husband 40 times. Every night, she tries to leave the house looking for work she retired from 20 years ago. Her daughter is exhausted, burned out, and feels like a failure.
> 
> This is dementia care in America. Until now.
> 
> **Aegis Caregiver. The AI that remembers when they can't.**"

---

### [0:30-1:00] The Tech

**Show the Dashboard Architecture:**

1. Point to the **Real-time State Panel** (left column)
   - Current location
   - Agitation level
   - Last meal/hydration times

2. Explain **Proactive AI**:
   > "Powered by Google's Gemini Live API, Aegis provides 24/7 multimodal monitoring. But here's what makes it different: It doesn't wait for you to ask. It interrupts BEFORE the crisis happens."

---

### [1:00-2:30] Live Demo

#### Demo 1: Start Monitoring
1. Click **"Start Monitoring"** button
2. Watch the connection status turn green
3. Observe the live state panel populate

#### Demo 2: Memory Loop (Navigate to Conversation tab)
1. Type: "Where's my husband?" in the text input
2. Click Send
3. Watch Aegis respond with validation
4. Type again: "Where's Bob?"
5. Observe the repeated question detection

**Key Point:**
> "Same question. Different response. Aegis adapts to prevent emotional distress from repeated correction."

#### Demo 3: Wandering Detection
1. Navigate to **Insights** tab
2. Show the **Sundowning Pattern** chart
3. Explain: "Agitation increases between 4-7 PM"
4. Show the **Wandering Risk** insight

**Key Point:**
> "Crisis averted. No locks. No alarms. Just gentle redirection."

#### Demo 4: Health Monitoring
1. Navigate to **Timeline** tab
2. Show daily schedule with meal/medication tracking
3. Point out compliance tracking

**Key Point:**
> "One intervention just prevented a hospitalization. Dehydration and malnutrition are leading causes of ER visits for dementia patients."

---

### [2:30-3:30] Pattern Recognition

#### Navigate to Insights Tab

1. **Hourly Agitation Chart**
   - Shows sundowning pattern (4-7 PM spike)
   - Orange indicator shows detected pattern

2. **Weekly Overview**
   - Daily agitation comparison
   - Alert distribution pie chart

3. **Behavioral Insights**
   - Sundowning detection (85% confidence)
   - Wandering pattern analysis
   - Recommendations

**Key Points:**
> "Aegis detected that Margaret becomes anxious every Tuesday at 2 PM. Why? That's when her daughter goes grocery shopping.
> 
> Simple insight. Massive impact.
> 
> Aegis also caught early UTI symptoms—three days before a hospitalization would have occurred.
> 
> Cost of ER visit: $15,000
> Cost of Aegis: $50/month
> **ROI: 300x in one intervention.**"

---

### [3:30-4:00] Emotional Close

#### Show the Stories Tab
1. Click on "Wedding Day" story
2. Show the emotion tags (❤️ love, 🥹 nostalgic)
3. Explain how stories are used for reminiscence therapy

#### Show the Profile Tab
1. Quick scroll through patient profile
2. Show communication tips
3. Show family information

**Final Narration:**
> "Aegis Caregiver. Powered by Gemini Live API.
> 
> It remembers when they can't.
> It's patient when you can't be.
> It's always watching. Always caring.
> 
> Because dementia steals memory.
> But it doesn't have to steal dignity."

---

## 🎯 Key Features to Highlight

### 1. Real-time Monitoring
- Patient location tracking
- Agitation level monitoring
- Health timers (meals, hydration, medication)

### 2. Proactive Intervention
- AI detects issues before they become crises
- Gentle voice redirection
- No physical restraints or alarms

### 3. Behavioral Learning
- Pattern recognition (sundowning, wandering triggers)
- Personalized recommendations
- Gets smarter over time

### 4. Caregiver Support
- Real-time alerts with urgency levels
- Pattern insights dashboard
- ROI tracking

---

## 💡 Answering Q&A

### Q: "How accurate is behavior detection?"
> "Current prototype uses Gemini's vision capabilities. In production, we'd add MediaPipe for pose estimation (99% accuracy). For this hackathon, we showcase the intervention logic and UX—detection models are plug-and-play."

### Q: "What about privacy?"
> "All video processing can happen locally on edge devices. Only metadata sent to cloud. Full HIPAA compliance roadmap includes end-to-end encryption."

### Q: "How do you prevent alert fatigue?"
> "Smart thresholds and cooldowns. Aegis only alerts for significant events and learns what's normal. Most interventions happen directly with the patient—caregivers only alerted when truly needed."

### Q: "What's your business model?"
> "B2C: $50/month for families. B2B: $30/resident/month for assisted living facilities. We're also pursuing Medicare reimbursement as Remote Patient Monitoring—which could make it free for families."

---

## 🏆 Why This Will Win

1. **Perfect use case for Gemini Live's proactive audio**
2. **Emotionally devastating problem with massive market**
3. **Technically sophisticated (multimodal + temporal reasoning)**
4. **Working demo (not just slides)**
5. **Clear path to revenue**
6. **Social good angle**

---

## 📱 Demo Patient Profile

**Margaret "Maggie" Johnson**
- Age: 84
- Diagnosis: Moderate Alzheimer's
- Career: Elementary school teacher (32 years)
- Family: Husband Bob (deceased 2014), 3 children, 4 grandchildren
- Triggers: Loud noises, being corrected, feeling rushed
- Calming activities: Photo albums, Glenn Miller music, folding towels

---

## 🎬 Recording Tips

1. **Use OBS Studio** or QuickTime for screen recording
2. **Position windows:**
   - Left: Live camera feed (your webcam)
   - Right: Dashboard
   - Bottom: Terminal logs (optional)
3. **Record in 1080p minimum**
4. **Keep demo under 4 minutes**

---

## ✅ Pre-Demo Checklist

- [ ] Both services running (ports 3000, 3003)
- [ ] Connection status shows green
- [ ] Sample data loaded
- [ ] Audio working (test voice playback)
- [ ] Browser cache cleared
- [ ] Demo script rehearsed

---

## 🆘 Troubleshooting

### Dashboard not loading?
```bash
# Check if Next.js is running
curl http://localhost:3000

# Restart if needed
bun run dev
```

### WebSocket not connecting?
```bash
# Check WebSocket service
cat /tmp/aegis-ws.log

# Restart if needed
cd mini-services/aegis-ws && bun run dev
```

### Charts not showing?
- Clear browser cache
- Check console for errors
- Ensure Recharts is installed

---

**Built with ❤️ for the 6.7 million Americans living with dementia**
