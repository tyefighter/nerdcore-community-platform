-- =============================================================
-- Nerdcore Community Platform — Sample Data
-- =============================================================
-- Run this after schema.sql to load test data.
-- Local dev: psql -U postgres -d nerdcore -f database/seed.sql
-- =============================================================


-- -------------------------------------------------------------
-- SAMPLE ARTISTS
-- -------------------------------------------------------------
INSERT INTO artists (display_name, role, city, state, region_id, operates_in, bio, link_soundcloud, link_twitter, discord_handle, status)
VALUES
    (
        'MC Hadron',
        'vocalist',
        'Richmond',
        'VA',
        (SELECT id FROM regions WHERE name = 'Mid-Atlantic'),
        'Mid-Atlantic, Southeast',
        'Spitting bars about particle physics and pro wrestling since 2018.',
        'https://soundcloud.com/mchadron',
        'https://twitter.com/mchadron',
        'mchadron#1234',
        'approved'
    ),
    (
        'Professor BeatBox',
        'producer',
        'Atlanta',
        'GA',
        (SELECT id FROM regions WHERE name = 'Southeast'),
        'Southeast',
        'Chiptune-influenced beats with a nerdcore soul.',
        'https://soundcloud.com/professorbb',
        NULL,
        'profbb#5678',
        'approved'
    ),
    (
        'The Algorithm',
        'both',
        'Chicago',
        'IL',
        (SELECT id FROM regions WHERE name = 'Midwest'),
        'Midwest',
        'Vocalist and producer. Writes songs about recursion and regret.',
        'https://soundcloud.com/thealgorithm',
        'https://twitter.com/thealgorithm',
        'algorithm#9012',
        'approved'
    ),
    (
        'Pending Artist',
        'vocalist',
        'Seattle',
        'WA',
        (SELECT id FROM regions WHERE name = 'Pacific Northwest'),
        'Pacific Northwest, West Coast',
        'Submitted but not yet reviewed.',
        NULL,
        NULL,
        'pending_artist#0000',
        'pending'
    );


-- -------------------------------------------------------------
-- SAMPLE ARTIST TAGS
-- -------------------------------------------------------------
INSERT INTO artist_tags (artist_id, tag_id)
VALUES
    -- MC Hadron: nerdcore, hip-hop, vocalist
    ((SELECT id FROM artists WHERE display_name = 'MC Hadron'), (SELECT id FROM tags WHERE name = 'nerdcore')),
    ((SELECT id FROM artists WHERE display_name = 'MC Hadron'), (SELECT id FROM tags WHERE name = 'hip-hop')),
    ((SELECT id FROM artists WHERE display_name = 'MC Hadron'), (SELECT id FROM tags WHERE name = 'vocalist')),

    -- Professor BeatBox: nerdcore, chiptune, producer
    ((SELECT id FROM artists WHERE display_name = 'Professor BeatBox'), (SELECT id FROM tags WHERE name = 'nerdcore')),
    ((SELECT id FROM artists WHERE display_name = 'Professor BeatBox'), (SELECT id FROM tags WHERE name = 'chiptune')),
    ((SELECT id FROM artists WHERE display_name = 'Professor BeatBox'), (SELECT id FROM tags WHERE name = 'producer')),

    -- The Algorithm: nerdcore, hip-hop, duo
    ((SELECT id FROM artists WHERE display_name = 'The Algorithm'), (SELECT id FROM tags WHERE name = 'nerdcore')),
    ((SELECT id FROM artists WHERE display_name = 'The Algorithm'), (SELECT id FROM tags WHERE name = 'hip-hop')),
    ((SELECT id FROM artists WHERE display_name = 'The Algorithm'), (SELECT id FROM tags WHERE name = 'duo'));


-- -------------------------------------------------------------
-- SAMPLE EVENTS
-- -------------------------------------------------------------
INSERT INTO events (title, description, venue, city, state, region_id, is_online, start_date, end_date, start_time, event_url, status)
VALUES
    (
        'Nerdcore Night at The Broadberry',
        'Local nerdcore showcase. Three acts, one night.',
        'The Broadberry',
        'Richmond',
        'VA',
        (SELECT id FROM regions WHERE name = 'Mid-Atlantic'),
        FALSE,
        '2026-05-15',
        NULL,
        '20:00',
        'https://thebroadberry.com',
        'approved'
    ),
    (
        'MAGFest Nerdcore Stage',
        'Annual nerdcore performances at MAGFest. Multiple artists across the weekend.',
        'Gaylord National Resort',
        'National Harbor',
        'MD',
        (SELECT id FROM regions WHERE name = 'Mid-Atlantic'),
        FALSE,
        '2027-01-02',
        '2027-01-05',
        NULL,
        'https://magfest.org',
        'approved'
    ),
    (
        'VPC Round 8 Submission Deadline',
        'Deadline to submit your entry for VPC Round 8.',
        NULL,
        'Online',
        NULL,
        (SELECT id FROM regions WHERE name = 'Online / No Region'),
        TRUE,
        '2026-06-01',
        NULL,
        '23:59',
        'https://discord.gg/vpc',
        'approved'
    ),
    (
        'Pending Event Example',
        'This event is in the moderation queue and should not appear publicly.',
        'Some Venue',
        'Portland',
        'OR',
        (SELECT id FROM regions WHERE name = 'Pacific Northwest'),
        FALSE,
        '2026-07-04',
        NULL,
        '19:00',
        NULL,
        'pending'
    );


-- -------------------------------------------------------------
-- SAMPLE EVENT TAGS
-- -------------------------------------------------------------
INSERT INTO event_tags (event_id, tag_id)
VALUES
    -- Nerdcore Night: local-show, nerdcore
    ((SELECT id FROM events WHERE title = 'Nerdcore Night at The Broadberry'), (SELECT id FROM tags WHERE name = 'local-show')),
    ((SELECT id FROM events WHERE title = 'Nerdcore Night at The Broadberry'), (SELECT id FROM tags WHERE name = 'nerdcore')),

    -- MAGFest: festival, nerdcore
    ((SELECT id FROM events WHERE title = 'MAGFest Nerdcore Stage'), (SELECT id FROM tags WHERE name = 'festival')),
    ((SELECT id FROM events WHERE title = 'MAGFest Nerdcore Stage'), (SELECT id FROM tags WHERE name = 'nerdcore')),

    -- VPC Deadline: vpc, online-event, deadline
    ((SELECT id FROM events WHERE title = 'VPC Round 8 Submission Deadline'), (SELECT id FROM tags WHERE name = 'vpc')),
    ((SELECT id FROM events WHERE title = 'VPC Round 8 Submission Deadline'), (SELECT id FROM tags WHERE name = 'online-event')),
    ((SELECT id FROM events WHERE title = 'VPC Round 8 Submission Deadline'), (SELECT id FROM tags WHERE name = 'deadline'));


-- -------------------------------------------------------------
-- SAMPLE EVENT PERFORMERS
-- -------------------------------------------------------------
INSERT INTO event_performers (event_id, artist_id)
VALUES
    -- Nerdcore Night: MC Hadron
    (
        (SELECT id FROM events WHERE title = 'Nerdcore Night at The Broadberry'),
        (SELECT id FROM artists WHERE display_name = 'MC Hadron')
    ),
    -- MAGFest: MC Hadron + The Algorithm
    (
        (SELECT id FROM events WHERE title = 'MAGFest Nerdcore Stage'),
        (SELECT id FROM artists WHERE display_name = 'MC Hadron')
    ),
    (
        (SELECT id FROM events WHERE title = 'MAGFest Nerdcore Stage'),
        (SELECT id FROM artists WHERE display_name = 'The Algorithm')
    );
