import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import pg from "pg";

const { Client } = pg;

// We cache the credentials so we don't call Secrets Manager on every request
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

    // Build query with optional filters from query string parameters
    const filters = [];
    const values = [];
    let paramIndex = 1;

    // Always filter to only approved artists
    filters.push(`a.status = 'approved'`);

    // Optional: filter by state (?state=VA)
    if (event.queryStringParameters?.state) {
      filters.push(`a.state = $${paramIndex}`);
      values.push(event.queryStringParameters.state.toUpperCase());
      paramIndex++;
    }

    // Optional: filter by role (?role=vocalist)
    if (event.queryStringParameters?.role) {
      filters.push(`a.role = $${paramIndex}`);
      values.push(event.queryStringParameters.role.toLowerCase());
      paramIndex++;
    }

    // Optional: filter by region (?region=Southeast)
    if (event.queryStringParameters?.region) {
      filters.push(`r.name = $${paramIndex}`);
      values.push(event.queryStringParameters.region);
      paramIndex++;
    }

    const whereClause = filters.join(" AND ");

    const query = `
      SELECT
        a.id,
        a.display_name,
        a.role,
        a.city,
        a.state,
        r.name AS region,
        a.operates_in,
        a.bio,
        a.link_soundcloud,
        a.link_bandcamp,
        a.link_twitter,
        a.link_instagram,
        a.link_website,
        COALESCE(
          json_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL),
          '[]'
        ) AS tags
      FROM artists a
      LEFT JOIN regions r ON a.region_id = r.id
      LEFT JOIN artist_tags at ON a.id = at.artist_id
      LEFT JOIN tags t ON at.tag_id = t.id
      WHERE ${whereClause}
      GROUP BY a.id, r.name
      ORDER BY a.display_name ASC
    `;

    const result = await db.query(query, values);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(result.rows)
    };

  } catch (error) {
    console.error("Error fetching artists:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to fetch artists" })
    };

  } finally {
    if (db) await db.end();
  }
};
