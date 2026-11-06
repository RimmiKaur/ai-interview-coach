# AI Interview Coach

A Next.js frontend and stateless FastAPI backend. The frontend can call the API helpers in `frontend/src/lib/api.ts`; the backend receives the current conversation with each answer and report request, so no database is needed.

## Prerequisites

- Node.js 20.9 or newer
- Python 3.10 or newer

## Start the frontend (PowerShell, terminal 1)

```powershell
cd C:\Users\Lenovo\Desktop\AI\frontend
if (!(Test-Path .env.local)) { Copy-Item .env.local.example .env.local }
npm.cmd install
npm.cmd run dev
```

Open http://localhost:3000. The API client defaults to `http://localhost:8000`; set `NEXT_PUBLIC_API_BASE_URL` if the backend uses a different address.

## Start the backend (PowerShell, terminal 2)

```powershell
cd C:\Users\Lenovo\Desktop\AI\backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
if (!(Test-Path .env)) { Copy-Item .env.example .env }
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

Set `GROQ_API_KEY` in `backend/.env`. The backend loads it at startup. Health check: http://localhost:8000/health. Interactive API docs: http://localhost:8000/docs.

## API actions

- `POST /interviews/start` — JSON `{ "topic": "...", "difficulty": "Easy|Medium|Hard" }`; returns `{ "message": "...", "ended": false }`.
- `POST /interviews/answer` — same topic and difficulty plus `conversation`, an array of `{ "role": "interviewer|candidate", "content": "..." }` turns. Send the transcript ending with the candidate's latest answer. Returns the next interviewer message and `ended` flag.
- `POST /reports` — topic, difficulty, and the full transcript, including the final interviewer closing message when present. Returns `score` (0–100), evidence-backed `strengths` and `weaknesses`, `topics_to_revise`, `overall_verdict`, and `pass_fail`. Pass starts at 70; the verdict bands are Excellent (85+), Good (70–84), Adequate (55–69), and Weak (below 55).

The Groq model is set in `backend/main.py`. The frontend includes the topic and difficulty start screen, an interview flow, and the scored report view. See [DEPLOYMENT.md](DEPLOYMENT.md) for GitHub, Render, and Vercel settings.
