# Roadmap

## Stack Decision (finalized)

| Layer | Technology | Why |
|---|---|---|
| Frontend | SvelteKit + TypeScript | Matches vpc8 website — easy integration later |
| API | AWS Lambda + API Gateway | Serverless, AWS-native, called by site + bot |
| Database | PostgreSQL on AWS RDS | Matches existing VPC bot infrastructure, better for relational queries |
| Map | Mapbox GL JS | Free tier, customizable, works in SvelteKit |
| Calendar | FullCalendar | Standard for this use case, reads from JSON |
| Hosting | Cloudflare Pages | Matches vpc8, auto-deploys from GitHub |

All three surfaces (website, vpc8 site, Discord bot) call the same API.
Nothing user-submitted goes live without moderator approval.

---

## Architecture

```
[PostgreSQL on RDS]
        ↓
[AWS Lambda + API Gateway]  ← source of truth
        ↓
   ┌────┴────┬──────────────┐
   ↓         ↓              ↓
[This site] [vpc8 website] [Discord bot]
```

---

## Phase 0 — Foundation ✅
- [x] Create GitHub repository
- [x] Define project scope
- [x] Create initial documentation
- [x] Build Express API sandbox (local learning — kept as reference)

## Phase 1 — Database Schema
Define and create the PostgreSQL tables that everything else will read from.

- [ ] Design artists table
- [ ] Design events table
- [ ] Design submissions table (moderation queue)
- [ ] Design regions/tags reference tables
- [ ] Set up local PostgreSQL for development
- [ ] Apply schema locally and verify

## Phase 2 — AWS Infrastructure
Set up the AWS services the API will run on.

- [ ] Create RDS PostgreSQL instance (or connect to existing VPC bot instance)
- [ ] Set up AWS Lambda functions
- [ ] Set up API Gateway
- [ ] Configure IAM roles and permissions
- [ ] Deploy and smoke test endpoints

## Phase 3 — Backend API Endpoints
Build the Lambda functions that handle data.

- [ ] GET /artists — list approved artists (with optional filters)
- [ ] GET /artists/:id — single artist
- [ ] GET /events — list approved events (with optional filters)
- [ ] GET /events/:id — single event
- [ ] POST /submissions/artist — submit artist (goes to pending queue)
- [ ] POST /submissions/event — submit event (goes to pending queue)
- [ ] GET /admin/submissions — list pending submissions (auth required)
- [ ] PATCH /admin/submissions/:id — approve or reject (auth required)

## Phase 4 — Frontend (SvelteKit)
Build the standalone community map and calendar site.

- [ ] Scaffold SvelteKit project in /frontend
- [ ] Set up Tailwind CSS
- [ ] Build artist map page (Mapbox GL JS)
- [ ] Build event calendar page (FullCalendar)
- [ ] Build artist submission form
- [ ] Build event submission form
- [ ] Connect all pages to live API
- [ ] Deploy to Cloudflare Pages

## Phase 5 — Discord Bot Integration
Add slash commands that call the same API.

- [ ] Set up bot project in /bot
- [ ] /find-artist — search by name, state, or role
- [ ] /find-event — search by state or month
- [ ] /submit-artist — submit an artist to the moderation queue
- [ ] /submit-event — submit an event to the moderation queue
- [ ] Test all commands end-to-end

## Phase 6 — Admin Moderation Dashboard
Give moderators a way to review and approve submissions.

- [ ] Build admin login (JWT auth)
- [ ] Build pending submissions queue view
- [ ] Approve / reject actions
- [ ] Optionally notify submitter on Discord

## Phase 7 — Integration and Polish
Wire everything together and make it production-ready.

- [ ] Coordinate with jmynes to embed or link from vpc8 site
- [ ] Add rate limiting to submission endpoints
- [ ] Add input validation and sanitization
- [ ] Add logging
- [ ] Document the API for the bot owner
- [ ] Final review of what personal data is and isn't exposed
