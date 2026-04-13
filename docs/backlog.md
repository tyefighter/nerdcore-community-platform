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
- [ ] Decide: new RDS instance or connect to existing VPC bot RDS
- [ ] Create/configure RDS PostgreSQL instance
- [ ] Create Lambda function for artists
- [ ] Create Lambda function for events
- [ ] Create Lambda function for submissions
- [ ] Set up API Gateway routes
- [ ] Configure IAM roles (least privilege)
- [ ] Test endpoints from browser / curl

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
