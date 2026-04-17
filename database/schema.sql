-- =============================================================
-- Nerdcore Community Platform — PostgreSQL Schema
-- =============================================================
-- Run this file against a PostgreSQL database to create all tables.
-- Local dev: psql -U postgres -d nerdcore -f schema.sql
-- =============================================================


-- -------------------------------------------------------------
-- REGIONS
-- A lookup table for broad geographic regions.
-- Artists can say where they're "based" and where they "operate."
-- We use region names, not exact coordinates, to protect privacy.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS regions (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE  -- e.g. "Southeast", "Midwest", "Northeast"
);

INSERT INTO regions (name) VALUES
    ('Northeast'),
    ('Southeast'),
    ('Midwest'),
    ('Southwest'),
    ('West Coast'),
    ('Pacific Northwest'),
    ('Mountain West'),
    ('Mid-Atlantic'),
    ('South'),
    ('Online / No Region')
ON CONFLICT (name) DO NOTHING;


-- -------------------------------------------------------------
-- TAGS
-- Reusable labels for both artists and events.
-- e.g. "nerdcore", "producer", "vocalist", "festival", "vpc", "online"
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO tags (name) VALUES
    ('nerdcore'),
    ('hip-hop'),
    ('chiptune'),
    ('vgm'),
    ('visualist'),
    ('producer'),
    ('vocalist'),
    ('duo'),
    ('festival'),
    ('local-show'),
    ('vpc'),
    ('online-event'),
    ('deadline')
ON CONFLICT (name) DO NOTHING;


-- -------------------------------------------------------------
-- ARTISTS
-- The main artist directory. Stores public-facing profile info.
-- Location is city + state + region only — never exact address.
-- status: 'pending' | 'approved' | 'rejected' | 'hidden'
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artists (
    id              SERIAL PRIMARY KEY,
    display_name    VARCHAR(150) NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('vocalist', 'producer', 'both')),
    city            VARCHAR(100),
    state           VARCHAR(50),
    region_id       INTEGER REFERENCES regions(id),
    operates_in     TEXT,                       -- free text, e.g. "East Coast, Southeast"
    bio             TEXT,
    link_soundcloud VARCHAR(300),
    link_bandcamp   VARCHAR(300),
    link_twitter    VARCHAR(300),
    link_instagram  VARCHAR(300),
    link_website    VARCHAR(300),
    discord_handle  VARCHAR(100),               -- stored but not displayed publicly
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at     TIMESTAMPTZ,
    reviewed_by     VARCHAR(100)                -- moderator username or ID
);


-- -------------------------------------------------------------
-- ARTIST TAGS (join table)
-- Many-to-many: one artist can have many tags.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artist_tags (
    artist_id   INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    tag_id      INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (artist_id, tag_id)
);


-- -------------------------------------------------------------
-- EVENTS
-- Shows, festivals, VPC rounds, deadlines, online events.
-- Location: city + state for in-person, "Online" for remote.
-- status: 'pending' | 'approved' | 'rejected' | 'hidden'
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    venue           VARCHAR(200),
    address         VARCHAR(300),
    city            VARCHAR(100),
    state           VARCHAR(50),
    region_id       INTEGER REFERENCES regions(id),
    is_online       BOOLEAN NOT NULL DEFAULT FALSE,
    start_date      DATE NOT NULL,
    end_date        DATE,                       -- NULL if single-day event
    start_time      TIME,                       -- NULL if time not known
    event_url       VARCHAR(300),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected', 'hidden')),
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at     TIMESTAMPTZ,
    reviewed_by     VARCHAR(100)
);


-- -------------------------------------------------------------
-- EVENT TAGS (join table)
-- Many-to-many: one event can have many tags.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_tags (
    event_id    INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tag_id      INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, tag_id)
);


-- -------------------------------------------------------------
-- EVENT PERFORMERS (join table)
-- Which artists are performing at which events.
-- Both sides must already exist in the database.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_performers (
    event_id    INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    artist_id   INTEGER NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, artist_id)
);


-- -------------------------------------------------------------
-- SUBMISSIONS
-- A log of every submission made via the website or Discord bot.
-- This is separate from the artists/events tables so we have a
-- full audit trail even after a record is approved or rejected.
-- source: 'website' | 'discord'
-- type: 'artist' | 'event'
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submissions (
    id              SERIAL PRIMARY KEY,
    type            VARCHAR(10) NOT NULL CHECK (type IN ('artist', 'event', 'removal', 'edit')),
    source          VARCHAR(10) NOT NULL CHECK (source IN ('website', 'discord')),
    discord_user_id VARCHAR(50),               -- Discord snowflake ID if submitted via bot
    submitter_note  TEXT,                      -- anything the submitter wrote
    raw_data        JSONB NOT NULL,            -- full submitted payload stored as JSON
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected')),
    artist_id       INTEGER REFERENCES artists(id),  -- set when approved
    event_id        INTEGER REFERENCES events(id),   -- set when approved
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at     TIMESTAMPTZ,
    reviewed_by     VARCHAR(100),
    moderator_note  TEXT                       -- internal note from the moderator
);


-- -------------------------------------------------------------
-- INDEXES
-- Speed up the most common query patterns.
-- -------------------------------------------------------------

-- Artists: filter by state, region, role, status
CREATE INDEX IF NOT EXISTS idx_artists_state       ON artists(state);
CREATE INDEX IF NOT EXISTS idx_artists_region      ON artists(region_id);
CREATE INDEX IF NOT EXISTS idx_artists_role        ON artists(role);
CREATE INDEX IF NOT EXISTS idx_artists_status      ON artists(status);

-- Events: filter by state, region, date range, status
CREATE INDEX IF NOT EXISTS idx_events_state        ON events(state);
CREATE INDEX IF NOT EXISTS idx_events_region       ON events(region_id);
CREATE INDEX IF NOT EXISTS idx_events_start_date   ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_status       ON events(status);

-- Submissions: filter by status for moderation queue
CREATE INDEX IF NOT EXISTS idx_submissions_status  ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_type    ON submissions(type);
