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

### Priority 1
- [x] **Edit form overhaul** — Edit form now matches the submission form: country dropdown, link dropdown UX with all platforms + custom "other", Roles section removed, current Tags list. submit-edit Lambda accepts new fields, admin-review-submission Lambda applies them on approval (with proper JSONB serialization for links_other).

### Map / Artists
- [x] Replace hardcoded city coordinates with Mapbox geocoding API (geocoding runs in admin browser on approval)
- [x] Add bandcamp and instagram URL fields to artist submission form
- [x] Role field changed to multi-select (vocalist, producer, band, visualist, other)
- [x] Remove region dropdown from artist submission form

### Events / Calendar
- [x] Add edit and remove links to event detail panel on calendar
- [x] Fix FullCalendar date display (exclusive end date + UTC timezone shift)
- [x] dateClick to pre-fill start date on event submission form

### Submission Forms
- [x] Make removal and edit request reason fields optional
- [x] Add contact us / feedback form (EmailJS)
- [x] Add "suggest a tag" free-text field to artist and event submission forms
- [x] Auto-prepend https:// to URL fields if missing
- [x] Ko-fi donation link in all navbars
- [ ] Admin: "Suggested Tags" panel — query raw_data JSONB across all submissions, show each unique suggested tag + count (new Lambda endpoint + admin UI section)
- [ ] Expand social media link support on artist submission form. Add columns for facebook, bluesky, mastodon, twitch, linktree (twitter and instagram already exist). Replace hardcoded link fields in UI with a dropdown-based pattern: pick a platform, URL field appears, "+ Add another" to add more, "X" to remove. Behind the scenes, dropdown choice maps to the corresponding column — no schema migration needed for existing data. Update submit-artist Lambda, get-artists Lambda, and artist detail panel on the map.

### Pages & Content
- [ ] About Us page — explain what the platform is, who runs it, how to get involved

### Security (Tech Debt)
- [ ] Fix SSL rejectUnauthorized: false in all Lambda DB connections (use proper cert bundle)
  - Low actual risk: Lambda runs inside VPC, RDS only accepts VPC connections — network is already private
  - Proper fix: bundle AWS RDS CA cert into each Lambda zip, adds complexity to every deploy
  - Revisit if compliance or audit requirements arise

### Artist Map — Future Ideas
- [ ] Add "musician liaison" category to the map — for community members who support artists (housing, equipment, logistics) but aren't performers themselves. Needs more design thought before building.
- [x] Add a friendly note above the tags section on the artist submission form and make at least one tag mandatory. Tags updated to: nerdcore, chiptune, vgm, visualist, hip-hop, other.

### Artist Map — Future Ideas
- [ ] Cluster map markers — group nearby artists into a count bubble using Mapbox's built-in clustering. Prevents markers stacking on top of each other in the same city. Gets more useful as the directory grows.
- [ ] Approximate location markers — artists who provide state but no city get a pink marker placed at the state capital. Artist detail panel shows "Location approximate — no city provided". Admin approval geocodes state capital as fallback when city is empty.
- [ ] Add Venue support — venues appear on the same map as artists in their own color. Submission flow uses the same form as artists with a dropdown to pick Artist vs Venue (form fields conditional on selection). Venue fields: name, address, website/social media. Anyone can submit. Goes through the moderation queue like artists. Implementation note: simplest path is a `type` column on the artists table (artist|venue) plus an `address` column for venues — keeps the same Lambda + map code with minimal branching. Map detail panel and filters need a "Venues" option added.

### Nice-to-Haves
- [x] Discord webhook notification to personal dev channel when a new submission arrives. SvelteKit /api/notify endpoint posts to a webhook stored in DISCORD_WEBHOOK_URL Cloudflare env var. Each submission flow (artist, event, edit, removal) calls notifyMod() after a successful submission.
- [ ] Discord notification to submitter when their submission is approved/rejected
- [ ] "Show nearby events" toggle on artist map — overlays upcoming event dots (next 30–60 days) on top of artist dots, off by default to keep the map clean
- [x] Artist list filters to only show artists visible in current map viewport — opt-in toggle button, off by default
- [ ] Collapsible/hideable map on mobile — lets users browse the artist list without the map taking up screen space
- [ ] Duplicate submission detection — fuzzy match submitted artist name against existing approved/pending records; warn submitter on form if match found; flag in admin queue with link to existing record for side-by-side comparison. Don't block submission — let admin make the final call.
