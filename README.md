# Peopulse

## Layout

- `frontend/` — static UI (serve this directory; set Vercel root to `frontend`)
- `backend/` — FastAPI API

## Local run

One-shot (frontend + backend):

```bash
# first-time setup
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add OPENROUTER_API_KEY
cd ..

./run
```

- UI → http://127.0.0.1:3456  
- API → http://127.0.0.1:8000  

### Vercel

Root `vercel.json` rewrites `/` → `frontend/` so deploys from the **repo root** keep working (no dashboard Root Directory change needed). Prefer excluding `backend/` from the Vercel project if you can; the rewrite already skips `/backend/*`.
