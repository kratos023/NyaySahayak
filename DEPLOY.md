# 🚀 Nyay-Sahayak — Complete Deployment Guide
## From VSCode terminal to live on Render + Vercel

---

## PART 1 — GitHub (run all commands in VSCode Terminal)

### One-time setup
```bash
# Check git installed
git --version
# If missing: winget install Git.Git  (or download from git-scm.com)

# Set your identity (once ever)
git config --global user.name "Deepanshu"
git config --global user.email "your@email.com"
```

### Create the repo on GitHub first
```
1. github.com → + → New repository
2. Name: nyayshakti
3. Public, NO readme/gitignore
4. Create → copy the URL (https://github.com/yourname/nyayshakti.git)
```

### Push your code
```bash
# Open VSCode terminal, navigate to project
cd C:\Users\Deepanshu\Desktop\nyayshakti

# Create .gitignore
echo "__pycache__/
*.pyc
venv/
*.db
*.sqlite3
performance_data/
backend/.env
frontend/.env.local
node_modules/
.next/
.DS_Store" > .gitignore

# Initialize, commit, push
git init
git add .
git commit -m "Nyay-Sahayak v3 initial commit"
git remote add origin https://github.com/yourname/nyayshakti.git
git branch -M main
git push -u origin main
```

### Future updates (every time you change something)
```bash
git add .
git commit -m "what you changed"
git push
# Render + Vercel auto-redeploy in 2-3 min
```

---

## PART 2 — Backend on Render (free)

```
1. render.com → sign up with GitHub
2. New → Web Service → connect nyayshakti repo
3. Settings:
   Root Directory:   backend
   Runtime:          Python 3
   Build Command:    pip install -r requirements.txt
   Start Command:    uvicorn main:app --host 0.0.0.0 --port $PORT
   Plan:             Free

4. Advanced → Add Disk:
   Name:       nyayshakti-db
   Mount Path: /data
   Size:       1 GB

5. Environment Variables (add all of these):
   GEMINI_API_KEY      = your-gemini-key-here
   BHASHINI_API_KEY    = your-bhashini-key-here
   BHASHINI_USER_ID    = 35871fa8bb-ef2e-4f02-bb81-7803d809583d
   JWT_SECRET          = any-long-random-string-change-this
   ADMIN_EMAIL         = admin@nyayshakti.com
   ADMIN_PASSWORD      = your-admin-password
   DB_DIR              = /data

6. Create Web Service → wait 3-5 min
   Your URL: https://nyayshakti-backend.onrender.com
   Test: open that URL → should show {"name":"Nyay-Sahayak API",...}
```

⚠️ Free tier sleeps after 15 min. First request takes ~30s to wake up.

---

## PART 3 — Frontend on Vercel (free)

```
1. vercel.com → sign up with GitHub
2. New Project → import nyayshakti repo
3. Settings:
   Root Directory:   frontend   ← click Edit to change this
   Framework:        Next.js    (auto detected)

4. Environment Variables:
   NEXT_PUBLIC_API_URL = https://nyayshakti-backend.onrender.com
   (use YOUR actual Render URL)

5. Deploy → 2-3 min
   Your URL: https://nyayshakti-xyz.vercel.app
   Share this with friends!
```

---

## PART 4 — Mobile

Works on phone out of the box:
- Open Vercel URL in Chrome/Safari on phone
- Tap Share → "Add to Home Screen" for app-like experience
- Microphone + camera work for voice input and OCR
- Sidebar is a slide-in drawer on small screens (tap ☰)

---

## PART 5 — Troubleshooting

| Problem | Fix |
|---------|-----|
| Render build fails | Check logs for missing package → add to requirements.txt |
| Database resets | Make sure DB_DIR=/data is in Render env vars |
| CORS error | Check NEXT_PUBLIC_API_URL on Vercel matches Render URL exactly |
| Admin login fails | Render Shell → rm /data/legal_ai_chat.db → restart service |
| Vercel build fails | Run npm run build locally first, fix TypeScript errors, push again |
