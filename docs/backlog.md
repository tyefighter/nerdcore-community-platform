# Backlog

## Phase 0 — Foundation
- [x] Create GitHub repository
- [x] Set up local development environment
- [x] Choose project language (Node.js / TypeScript)
- [x] Create README, roadmap, backlog
- [x] Build Express API sandbox (local reference — see backend/)

## Phase 1 — Database Schema
- [x] Install PostgreSQL locally for development
- [x] Write schema: artists table
- [x] Write schema: events table
- [x] Write schema: submissions table (moderation queue)
- [x] Write schema: regions lookup table
- [x] Write schema: tags lookup table
- [x] Apply schema to local database
- [x] Insert sample artist and event records for testing

## Phase 2 — AWS Infrastructure
- [x] Decide: new RDS instance (brand new AWS account, full free tier)
- [x] Create/configure RDS PostgreSQL instance (nerdcore-community-db, us-east-1)
- [x] Store DB credentials in Secrets Manager (nerdcore/db/credentials)
- [x] Create security groups (nerdcore-db-sg, nerdcore-lambda-sg)
- [x] Lock down RDS to only accept connections from nerdcore-lambda-sg
- [x] Create IAM role for Lambda (nerdcore-lambda-role)
- [x] Create Lambda function for artists (nerdcore-get-artists)
- [x] Create Lambda function for events (nerdcore-get-events)
- [x] Create Lambda function for submissions (nerdcore-submit-artist, nerdcore-submit-event)
- [x] Apply schema and seed data to RDS
- [x] Set up API Gateway (nerdcore-community-api)
- [x] Test endpoints from browser / curl

## Phase 3 — Backend API
- [ ] GET /artists (filters: state, region, role)
- [ ] GET /artists/:id
- [ ] GET /events (filters: state, month, tag)
- [ ] GET /events/:id
- [ ] POST /submissions/artist
- [ ] POST /submissions/event
- [ ] GET /admin/submissions (auth required)
- [ ] PATCH /admin/submissions/:id (auth required)
- [ ] Add input validation to all POST endpoints
- [ ] Add rate limiting to submission endpoints

## Phase 4 — Frontend (SvelteKit)
- [ ] Scaffold SvelteKit + TypeScript project in /frontend
- [ ] Install and configure Tailwind CSS
- [ ] Build layout and navigation
- [ ] Build /artists page with Mapbox map
- [ ] Build /events page with FullCalendar
- [ ] Build /submit/artist form page
- [ ] Build /submit/event form page
- [ ] Connect all pages to API
- [ ] Deploy to Cloudflare Pages

## Phase 5 — Discord Bot
- [ ] Set up bot project structure in /bot
- [ ] Register slash commands with Discord
- [ ] Implement /find-artist command
- [ ] Implement /find-event command
- [ ] Implement /submit-artist command
- [ ] Implement /submit-event command
- [ ] Handle moderation queue responses
- [ ] Deploy bot

## Phase 6 — Admin Dashboard
- [ ] Build admin login page
- [ ] Implement JWT auth
- [ ] Build submissions review queue
- [ ] Implement approve action
- [ ] Implement reject action
- [ ] (Optional) Discord notification on approval/rejection

## Phase 7 — Integration and Polish
- [ ] Coordinate embed/link with jmynes/vpc8
- [ ] Full security review (CORS, rate limits, data exposure)
- [ ] API documentation
- [ ] Load test submission endpoints
- [ ] Final data privacy check (no exact locations exposed)

---

## Security Checklist (reference)
- [ ] No exact home addresses stored or displayed — city/region only
- [ ] All submissions go to pending queue — nothing auto-publishes
- [ ] Rate limiting on all POST endpoints
- [ ] Input sanitization on all user-supplied fields
- [ ] CORS restricted to known origins
- [ ] Admin routes require JWT auth
- [ ] Separate public API view vs. admin API view
- [ ] RDS not publicly accessible — Lambda connects via VPC

---

## Improvements & Remaining Work

### Map / Artists
- [ ] Replace hardcoded city coordinates with Mapbox geocoding API (auto-lookup on approval)
- [ ] Add bandcamp and instagram URL fields to artist submission form
- [ ] Add edit and remove links to event detail panel on calendar (same as artist panel)

### Events / Calendar
- [ ] Add edit and remove links to event detail panel on calendar (same as artist panel)
  - Requires: submit-removal + submit-edit Lambdas to accept event_id
  - Requires: admin-review-submission to handle event removals/edits
  - Frontend: new /submit/edit?event_id= and /submit/removal?event_id= flows

### Submission Forms
- [ ] Make removal request reason field optional
- [ ] Add contact us / general feedback form
- [ ] Add "suggest a tag" free-text field to artist and event submission forms (stored in raw_data payload, visible to mods on review)
- [ ] Admin: "Suggested Tags" button that queries raw_data JSONB across all submissions and returns each suggested tag + how many times it's been submitted (new Lambda endpoint + admin UI panel)

### Security
- [ ] Fix SSL rejectUnauthorized: false in all Lambda DB connections (use proper cert bundle)

### Nice-to-Haves
- [ ] Discord notification to mod channel when a new submission arrives
- [ ] Discord notification to submitter when their submission is approved/rejected
- [ ] "Show nearby events" toggle on artist map — overlays upcoming event dots (next 30–60 days) on top of artist dots, off by default to keep the map clean
