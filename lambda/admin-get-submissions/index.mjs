import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import pg from "pg";

const { Client } = pg;

let cachedCredentials = null;
let cachedAdminKey = null;

async function getCredentials() {
  if (cachedCredentials) return cachedCredentials;
  const client = new SecretsManagerClient({ region: "us-east-1" });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: "nerdcore/db/credentials" })
  );
  cachedCredentials = JSON.parse(response.SecretString);
  return cachedCredentials;
}

async function getAdminKey() {
  if (cachedAdminKey) return cachedAdminKey;
  const client = new SecretsManagerClient({ region: "us-east-1" });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: "nerdcore/admin/api-key" })
  );
  cachedAdminKey = JSON.parse(response.SecretString).admin_api_key;
  return cachedAdminKey;
}

async function connectToDatabase(credentials) {
  const client = new Client({
    host: credentials.host,
    port: credentials.port,
    database: "nerdcore",
    user: credentials.username,
    password: credentials.password,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  return client;
}

export const handler = async (event) => {
  let db = null;

  try {
    // Validate admin API key
    const adminKey = await getAdminKey();
    const providedKey = event.headers?.["x-admin-key"] || event.headers?.["X-Admin-Key"];
    if (!providedKey || providedKey !== adminKey) {
      return {
        statusCode: 401,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Unauthorized" })
      };
    }

    const credentials = await getCredentials();
    db = await connectToDatabase(credentials);

    // Pending artist submissions
    const artistsResult = await db.query(`
      SELECT
        a.id,
        a.display_name,
        a.role,
        a.city,
        a.state,
        a.country,
        r.name AS region,
        a.bio,
        a.link_soundcloud,
        a.link_twitter,
        a.link_website,
        COALESCE(
          json_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL),
          '[]'
        ) AS tags
      FROM artists a
      LEFT JOIN regions r ON a.region_id = r.id
      LEFT JOIN artist_tags at ON a.id = at.artist_id
      LEFT JOIN tags t ON at.tag_id = t.id
      WHERE a.status = 'pending'
      GROUP BY a.id, r.name
      ORDER BY a.id ASC
    `);

    // Pending event submissions
    const eventsResult = await db.query(`
      SELECT
        e.id,
        e.title,
        e.description,
        e.venue,
        e.city,
        e.state,
        r.name AS region,
        e.is_online,
        e.start_date,
        e.end_date,
        e.event_url,
        COALESCE(
          json_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL),
          '[]'
        ) AS tags
      FROM events e
      LEFT JOIN regions r ON e.region_id = r.id
      LEFT JOIN event_tags et ON e.id = et.event_id
      LEFT JOIN tags t ON et.tag_id = t.id
      WHERE e.status = 'pending'
      GROUP BY e.id, r.name
      ORDER BY e.id ASC
    `);

    // Pending removal requests
    const removalsResult = await db.query(`
      SELECT
        s.id,
        s.submitter_note AS reason,
        s.submitted_at,
        s.raw_data,
        a.id AS artist_id,
        a.display_name AS artist_name,
        e.id AS event_id,
        e.title AS event_title
      FROM submissions s
      LEFT JOIN artists a ON s.artist_id = a.id
      LEFT JOIN events e ON s.event_id = e.id
      WHERE s.type = 'removal' AND s.status = 'pending'
      ORDER BY s.id ASC
    `);

    // Pending edit requests
    const editsResult = await db.query(`
      SELECT
        s.id,
        s.submitter_note AS reason,
        s.submitted_at,
        s.raw_data,
        a.id AS artist_id,
        a.display_name AS artist_name,
        e.id AS event_id,
        e.title AS event_title
      FROM submissions s
      LEFT JOIN artists a ON s.artist_id = a.id
      LEFT JOIN events e ON s.event_id = e.id
      WHERE s.type = 'edit' AND s.status = 'pending'
      ORDER BY s.id ASC
    `);

    // Recent approvals (last 10 across artists and events)
    const recentResult = await db.query(`
      SELECT name, type, reviewed_at FROM (
        SELECT display_name AS name, 'artist' AS type, reviewed_at FROM artists WHERE status = 'approved' AND reviewed_at IS NOT NULL
        UNION ALL
        SELECT title AS name, 'event' AS type, reviewed_at FROM events WHERE status = 'approved' AND reviewed_at IS NOT NULL
      ) combined
      ORDER BY reviewed_at DESC
      LIMIT 10
    `);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artists: artistsResult.rows,
        events: eventsResult.rows,
        removals: removalsResult.rows,
        edits: editsResult.rows,
        recentApprovals: recentResult.rows
      })
    };

  } catch (error) {
    console.error("Error fetching submissions:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to fetch submissions" })
    };
  } finally {
    if (db) await db.end();
  }
};
