# Social Media Post Management Dashboard

Client-facing dashboard for managing Social Media posts with previews, approvals, and publish toggles. Built with FastAPI (backend) and React (frontend). Integration queues validated post configs for the OpenClaw Social Media auto-poster skill.

## Structure

```
social-dashboard/
  backend/
    app/
      main.py
      models.py
      schemas.py
      database.py
      social.py
    outbox/
    requirements.txt
  frontend/
```

## Backend Setup

```bash
cd /home/user/GitRepos/social-dashboard/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Environment Variables

- `LINKEDIN_SKILL_PATH` (default: `/home/user/GitRepos/openclaw-skill-social-auto-poster`)
- `LINKEDIN_OUTBOX` (default: `/home/user/GitRepos/social-dashboard/backend/outbox`)

When publishing, the API validates the post config using the OpenClaw skill `validate_config.py` and writes a JSON file to the outbox for automation.

## Frontend Setup

```bash
cd /home/user/GitRepos/social-dashboard/frontend
npm install
npm run dev
```

Configure the API base URL via `VITE_API_URL` if needed (defaults to `http://localhost:8000`).

## Notes

- Posts must be approved before publishing.
- `POST /api/posts/{id}/publish` will queue the post (dry run optional).
- Use the OpenClaw Social Media skill to process outbox configs and publish in the browser relay.
