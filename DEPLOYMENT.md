# Deploying AI Interview Coach

The repository contains two deployable projects: `backend/` (FastAPI) and `frontend/` (Next.js). Keep `.env` values in each hosting dashboard; do not commit them.

## Push to GitHub

After creating an empty public repository named `ai-interview-coach` on GitHub, run this from the project root, replacing `<GITHUB_USERNAME>`:

```powershell
git remote add origin https://github.com/<GITHUB_USERNAME>/ai-interview-coach.git
git push -u origin main
```

## Deploy the backend on Render

Create a **Web Service** from the GitHub repository. Use these settings:

| Setting | Value |
| --- | --- |
| Branch | `main` |
| Root Directory | `backend` |
| Runtime | `Python 3` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/health` |
| Instance Type | Free |

Add these environment variables in Render:

| Key | Value |
| --- | --- |
| `GROQ_API_KEY` | Your Groq API key |
| `FRONTEND_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` initially; update after Vercel deploys |

Render reads `backend/.python-version` and installs Python 3.12.4. After deploy, copy the service's `https://...onrender.com` URL.

## Deploy the frontend on Vercel

Import the same GitHub repository as a Vercel project. Set **Root Directory** to `frontend`; keep the detected Next.js framework and default build settings. Add this environment variable for Production, Preview, and Development:

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | The Render service URL, for example `https://ai-interview-coach-api.onrender.com` (no trailing slash) |

Deploy. Copy the Vercel production domain, then update Render's `FRONTEND_ORIGINS` to that domain, for example `https://ai-interview-coach.vercel.app`. For additional frontend domains, use a comma-separated list. Save the Render environment change and redeploy/restart the service.

## Verify

- Open `https://<your-render-service>.onrender.com/health`; expect `{"status":"ok"}`.
- Open the Vercel domain, start an interview, and complete it to confirm the CORS origin and Groq key are configured.

For local development, `frontend/.env.local` should set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`. The tracked `.env.local.example` is a template only.
