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
- **UI Components**: shadcn/ui (New York style)
- **Database**: Prisma ORM + SQLite
- **Authentication**: NextAuth.js
- **AI**: Gemini Live API (LLM + VLM + TTS + ASR)
- **Charts**: Recharts
- **State**: Zustand + TanStack Query

## 🚀 Quick Start

```bash
# Install dependencies
bun install

# Set up database
bun run db:push

# Start development server
bun run dev
```

Open your browser to see the application running.

## 🔐 Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| susan@aegis.care | demo123 | Caregiver (Maggie) |
| jennifer@aegis.care | demo123 | Caregiver (Bill) |
| admin@aegis.care | admin123 | Administrator |

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/          # NextAuth.js handlers
│   │   ├── monitor/       # Main monitoring API
│   │   └── insights/      # Analytics API
│   └── page.tsx           # Main dashboard
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── dashboard/        # Dashboard widgets
│   ├── patient/          # Patient-specific components
│   └── insights/         # Analytics components
├── hooks/                # Custom React hooks
└── lib/                  # Core libraries
    ├── gemini/           # Gemini AI integration
    ├── monitoring/       # Vision/audio analyzers
    └── interventions/    # Intervention coordinator
```

## 🎬 Demo Video

Watch our 4-minute demo showcasing:
1. Voice interaction with memory prosthetic
2. Patient profile switching
3. Behavioral insights and pattern detection
4. Life story preservation
5. Real-time alerts

## 🏆 Impact

- **For Patients**: Preserved dignity, reduced agitation, maintained identity
- **For Caregivers**: Reduced stress, proactive support, peace of mind
- **For Healthcare**: Fewer hospitalizations, better outcomes, lower costs

One prevented hospitalization = $15,000 saved.  
Aegis costs $50/month.  
That's **300x ROI**.

## 📄 License

MIT License - Built with ❤️ for the dementia care community.

---

**Aegis Caregiver** - *It remembers when they can't* 🛡️
