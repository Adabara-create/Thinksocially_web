# Thinksocially — contact form backend (FastAPI → Formspree)

Your site's contact form posts to your own FastAPI backend at `/api/contact`.
The backend validates the submission, then forwards it server-side to
Formspree, which delivers the email. The visitor's browser never talks to
Formspree directly — only your server does.

## 1. Project layout

```
thinksocially-backend/
├── app/
│   ├── main.py              FastAPI app + the /api/contact route
│   ├── config.py             reads settings from environment variables
│   └── formspree_client.py   forwards the submission to Formspree's API
├── static/                    the whole site lives here
│   ├── contact.html
│   ├── css/style.css
│   ├── js/main.js
│   └── img/…
├── .env                       your real config (create this — see step 3)
├── .env.example
└── requirements.txt
```

Copy the rest of your existing pages (`index.html`, `about.html`, `css/`,
`img/`, etc.) into `static/` alongside `contact.html`.

## 2. Install dependencies

```bash
cd thinksocially-backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## 3. Configure your Formspree endpoint

```bash
cp .env.example .env
```

Edit `.env` and set `FORMSPREE_ENDPOINT` to your form's URL from the
Formspree dashboard (Forms → your form → Integration tab), e.g.:

```
FORMSPREE_ENDPOINT=https://formspree.io/f/mgavkgpv
ALLOWED_ORIGINS=*
```

## 4. Run it locally

```bash
uvicorn app.main:app --reload --port 8000
```

Open **http://localhost:8000/contact.html** (not a `file://` path) and
submit the form. You should see:

- the button change to "Sending…"
- a green confirmation message
- the terminal running `uvicorn` staying quiet (no errors)

## 5. Formspree's one-time confirmation step

The **very first** submission to a new Formspree endpoint is held until you
confirm it:

1. Submit the form once for real (from the running app, not the Formspree dashboard)
2. Check the inbox of the Gmail account you used to create the Formspree form
   — including Spam/Promotions — for an email asking you to confirm the form
3. Click confirm
4. Submit the form a second time to verify mail is now actually arriving

If it's still not arriving after that, log into formspree.io, open the
form, and check its **Submissions** tab:
- If your test messages show up there → Formspree received them fine;
  check the "send to" address in that form's Settings.
- If nothing shows up there at all → check the terminal running `uvicorn`
  for an error when you submit; that error is the real cause.

## 6. Deploy it

**Render / Railway (easiest)**
- Push this folder to a GitHub repo
- Create a new Web Service pointing at it
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Add `FORMSPREE_ENDPOINT` (and `ALLOWED_ORIGINS`) in the platform's
  "Environment" settings

**A plain VPS (DigitalOcean, Linode, etc.)**
- Install Python 3.12, clone the repo, repeat steps 2–3 on the server
- Run it under `systemd` or `pm2`/`supervisor` so it restarts on crash/reboot
- Put Nginx in front of it as a reverse proxy and point your domain + SSL at Nginx

Once deployed, update `ALLOWED_ORIGINS` in `.env` to your real domain(s).

## How the honeypot works

The hidden `_gotcha` field in `contact.html` is invisible to real visitors
(hidden via CSS) but simple spam bots fill in every field they see. If it
arrives non-empty, `/api/contact` returns `{"success": true}` immediately
without ever contacting Formspree — the bot thinks it worked and moves on.
