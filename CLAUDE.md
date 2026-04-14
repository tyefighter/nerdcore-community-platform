# CLAUDE.md

## Project Overview

A community directory platform for the Nerdcore VPC (Vocalist Producer Challenge) scene.
Lets nerdcore artists list themselves on a map by location/region, and lets the community
browse upcoming shows, festivals, VPC rounds, and deadlines on a calendar.

Built as a standalone platform that feeds data to:
- Its own website (map + calendar + submission forms)
- The existing VPC website (jmynes/vpc8 — SvelteKit, Cloudflare Pages)
- A Discord bot (slash commands for querying and submitting)

**This is also a learning project.** The developer is a DevOps engineer learning
software development. Keep explanations clear, steps small, and avoid unnecessary
complexity. Prefer the simplest approach that solves the actual problem.

---

## Architecture

```
[PostgreSQL on AWS RDS]
         ↓
[AWS Lambda + API Gateway]  ← single source of truth
         ↓
    ┌────┴────┬──────────────┐
    ↓         ↓              ↓
[This site] [vpc8 site]  [Discord bot]
(SvelteKit)  (calls API)  (calls API)
```

All user submissions — whether from the website or Discord — go into a moderation
queue. Nothing appears publicly until a moderator approves it.

---

## Tech Stack

| Layer       | Technology                    | Notes |
|-------------|-------------------------------|-------|
| Frontend    | SvelteKit + TypeScript        | Matches vpc8 for future integration |
| Styling     | Tailwind CSS                  | |
| Map         | Mapbox GL JS                  | Artist locations (city/region only) |
| Calendar    | FullCalendar                  | Events, shows, VPC rounds |
| API         | AWS Lambda + API Gateway      | REST, called by site + Discord bot |
| Database    | PostgreSQL on AWS RDS         | Matches existing VPC bot infrastructure |
| Hosting     | Cloudflare Pages              | Auto-deploys from GitHub, matches vpc8 |
| Bot         | Discord slash commands        | Calls same Lambda API |

---

## Repository Structure

```
nerdcore-community-platform/
├── CLAUDE.md                  # This file
├── README.md                  # Public-facing project overview
├── .gitignore
├── docs/
│   ├── roadmap.md             # Phase-by-phase delivery plan
│   └── backlog.md             # Full task list with checkboxes
├── database/
│   └── schema.sql             # PostgreSQL schema — source of truth for data model
├── backend/                   # Express sandbox (local learning reference only)
│   ├── server.js              # Not production — used for learning API structure
│   └── routes/
│       ├── artists.js
│       └── events.js
├── frontend/                  # SvelteKit app (Phase 4 — not built yet)
└── bot/                       # Discord bot (Phase 5 — not built yet)
```

---

## Database Schema

Defined in `database/schema.sql`. Key tables:

| Table              | Purpose |
|--------------------|---------|
| `artists`          | Artist profiles — name, role, city, state, region, links, status |
| `events`           | Shows, festivals, deadlines — location, dates, URL, status |
| `submissions`      | Audit log of every submission (web or Discord), with raw payload |
| `regions`          | Lookup table — Northeast, Southeast, Midwest, etc. |
| `tags`             | Reusable labels (nerdcore, festival, vpc, online-event, etc.) |
| `artist_tags`      | Join table: artist ↔ tags |
| `event_tags`       | Join table: event ↔ tags |
| `event_performers` | Join table: event ↔ performing artists |

**Status values:** `pending` → `approved` / `rejected` / `hidden`

Only `approved` records are returned by public API endpoints.

---

## API Endpoints (planned)

### Base URL
```
https://kn2md859wl.execute-api.us-east-1.amazonaws.com
```

### Public
```
GET  /artists                  List approved artists (filters: state, region, role)
GET  /events                   List approved events (filters: state, month, tag)
POST /submissions/artist       Submit an artist (goes to pending queue)
POST /submissions/event        Submit an event (goes to pending queue)
```

### Admin (auth required)
```
GET   /admin/submissions       List pending submissions
PATCH /admin/submissions/:id   Approve or reject a submission
```

---

## Commands

### Backend sandbox (local learning only)
```bash
cd backend
npm run dev      # Start local Express server on http://localhost:3000
npm start        # Same but without auto-reload
```

### Frontend (SvelteKit — not built yet)
```bash
cd frontend
# Commands will go here when SvelteKit is scaffolded
```

---

## Key Design Decisions

**Privacy:** Artist locations are city + state + region only. No exact addresses are
stored or displayed. The map shows area markers, not pin-point home locations.

**Moderation:** Every submission goes to a `pending` queue regardless of source
(website form or Discord bot command). A moderator must approve before it appears
publicly. This is non-negotiable given past community behavior.

**Standalone first:** This platform is built independently before being integrated
into vpc8. This protects the live VPC website from instability during development
and removes the pressure of learning SvelteKit, Git collaboration, and AWS all at
the same time.

**One API, three consumers:** The website, vpc8, and Discord bot all call the same
Lambda endpoints. Data is never duplicated across systems.

**Security basics (baked in from the start):**
- Rate limiting on all POST endpoints
- Input validation and sanitization on all user-supplied fields
- CORS restricted to known origins
- Admin endpoints require JWT auth
- RDS not publicly accessible — Lambda connects via VPC
- Separate public vs. admin data views

---

## Related Repositories

| Repo | What it is |
|------|-----------|
| [jmynes/vpc8](https://github.com/jmynes/vpc8) | VPC8 competition website (SvelteKit + Cloudflare Pages) |
| VPC Discord bot | Hosted separately on AWS EC2 (Python, discord.py, RDS PostgreSQL) |

---

## Conventions

- Commit messages: plain English, describe what changed and why
- One small thing per commit — don't batch unrelated changes
- Nothing gets pushed to main that isn't tested locally first
- No auto-publishing of user data — moderation queue is always the gate
