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

    const filters = [];
    const values = [];
    let paramIndex = 1;

    // Always filter to approved events only
    filters.push(`e.status = 'approved'`);

    // Optional: filter by state (?state=VA)
    if (event.queryStringParameters?.state) {
      filters.push(`e.state = $${paramIndex}`);
      values.push(event.queryStringParameters.state.toUpperCase());
      paramIndex++;
    }

    // Optional: filter by month (?month=5 for May)
    if (event.queryStringParameters?.month) {
      filters.push(`EXTRACT(MONTH FROM e.start_date) = $${paramIndex}`);
      values.push(parseInt(event.queryStringParameters.month));
      paramIndex++;
    }

    // Optional: filter by tag (?tag=festival)
    if (event.queryStringParameters?.tag) {
      filters.push(`EXISTS (
        SELECT 1 FROM event_tags et
        JOIN tags t ON et.tag_id = t.id
        WHERE et.event_id = e.id AND t.name = $${paramIndex}
      )`);
      values.push(event.queryStringParameters.tag.toLowerCase());
      paramIndex++;
    }

    const whereClause = filters.join(" AND ");

    const query = `
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
        e.start_time,
        e.event_url,
        COALESCE(
          json_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL),
          '[]'
        ) AS tags,
        COALESCE(
          json_agg(DISTINCT a.display_name) FILTER (WHERE a.display_name IS NOT NULL),
          '[]'
        ) AS performers
      FROM events e
      LEFT JOIN regions r ON e.region_id = r.id
      LEFT JOIN event_tags et ON e.id = et.event_id
      LEFT JOIN tags t ON et.tag_id = t.id
      LEFT JOIN event_performers ep ON e.id = ep.event_id
      LEFT JOIN artists a ON ep.artist_id = a.id
      WHERE ${whereClause}
      GROUP BY e.id, r.name
      ORDER BY e.start_date ASC
    `;

    const result = await db.query(query, values);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.rows)
    };

  } catch (error) {
    console.error("Error fetching events:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to fetch events" })
    };

  } finally {
    if (db) await db.end();
  }
};
