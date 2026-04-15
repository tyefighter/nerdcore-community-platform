import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import pg from "pg";

const { Client } = pg;

let cachedCredentials = null;

async function getCredentials() {
  if (cachedCredentials) return cachedCredentials;
  const client = new SecretsManagerClient({ region: "us-east-1" });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: "nerdcore/db/credentials" })
  );
  cachedCredentials = JSON.parse(response.SecretString);
  return cachedCredentials;
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
    const credentials = await getCredentials();
    db = await connectToDatabase(credentials);

    // Get pending artists
    const artistsResult = await db.query(`
      SELECT
        a.id,
        a.display_name,
        a.role,
        a.city,
        a.state,
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

    // Get pending events
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

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artists: artistsResult.rows,
        events: eventsResult.rows
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
