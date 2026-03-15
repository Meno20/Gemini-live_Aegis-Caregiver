# 📋 Aegis Caregiver — Manual Setup Checklist

This file lists everything **you need to do manually** before the app works fully.
The AI has already migrated the backend from Prisma/Supabase to Firebase.

---

## 🔑 Required: Environment Variables

Open `.env` in the project root and fill in these values:

### 1. Gemini API Key *(required for all AI features)*
```
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```
➡️ Get it at: https://aistudio.google.com/apikey

### 2. Firebase Client Config *(public keys for the frontend)*
```
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="aegis-caregiver"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."
```
➡️ Get from: Firebase Console -> Project Settings -> General -> Your apps -> Web app.

### 3. Firebase Admin SDK *(PRIVATE keys for the backend)*
```
FIREBASE_ADMIN_PROJECT_ID="aegis-caregiver"
FIREBASE_ADMIN_CLIENT_EMAIL="..."
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```
➡️ **IMPORTANT**: If you created a new project, you MUST generate a new key:
1. Go to Firebase Console -> Project Settings -> **Service Accounts**.
2. Click **"Generate new private key"**.
3. Open the downloaded JSON and copy the values into `.env`.
4. *Note: Replace newlines in the private key with `\n` characters so it's a single line in `.env`.*

---

## 🚀 Running the App Locally

**Terminal 1 — Next.js web server:**
```bash
npm run dev
```
Opens at: http://localhost:3000

**Terminal 2 — Gemini Live WebSocket server:**
```bash
npm run dev:live
```

**Terminal 3 — Run Seed Script (Populate Maggie/Bill):**
```bash
npx tsx scripts/seed.ts
```

---

## 🗂️ Firebase Migration Highlights

| Task | Status | Note |
|---|---|---|
| Dependency Swap | ✅ Done | Removed Prisma/Supabase, added `firebase-admin`. |
| Auth Migration | ✅ Done | Now uses Firebase Session Cookies. |
| DB Migration | ✅ Done | Rewrote patients, alerts, interactions, and insights to use Firestore. |
| Seeding | ⚠️ Blocked | Failed with `403 Forbidden` because project `791669360184` is reported as deleted. |

> [!WARNING]
> **ACTION REQUIRED**: Your current `.env` credentials are linked to a deleted project number (`791669360184`). Please generate a fresh Service Account key in your newly created Firestore project to finalize the seeding!

---

## 🗂️ Files Created / Changed in This Session

| File | Action |
|---|---|
| `src/lib/db/index.ts` | **New** — Firestore CRUD operations |
| `src/lib/firebase/admin.ts` | **New** — Admin SDK setup |
| `src/app/api/auth/login/route.ts` | **New** — Login session handler |
| `scripts/seed.ts` | **New** — Database population script |
| `firestore.rules` | **New** — Security rules |
| `worklog.md` | Updated — Full technical log |
| `deploy.sh` | **New** — One-click Cloud Run deployment |
| `Dockerfile` | **New** — Unified container config |
| `Caddyfile` | **New** — Reverse proxy for WebSockets |

---

## 🐋 Cloud Run Deployment (New)

### 1. Pre-requisites
- [ ] Install `gcloud` CLI: `https://cloud.google.com/sdk/docs/install`
- [ ] Set your active project: `gcloud config set project aegis-caregiver-490310`

### 2. Store Secrets
Run this to safely upload your API key. **Do not use the standard .env for secrets on Cloud Run.**
```bash
printf "AIza... (your key)" | gcloud secrets create GEMINI_API_KEY --data-file=-
```

### 3. Deploy
```bash
chmod +x deploy.sh
./deploy.sh
```
🌍 Once finished, the script will output your public URL. The app will automatically handle both HTTPS and WSS (WebSockets).
