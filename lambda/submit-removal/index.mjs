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

const HEADERS = { "Content-Type": "application/json" };

export const handler = async (event) => {
  let db = null;

  try {
    const body = JSON.parse(event.body || "{}");

    // Validate required fields
    if (!body.artist_id && !body.artist_name) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: "artist_id or artist_name is required" })
      };
    }

    if (!body.reason) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: "reason is required" })
      };
    }

    const credentials = await getCredentials();
    db = await connectToDatabase(credentials);

    // If artist_id provided, verify the artist exists
    let artistId = body.artist_id || null;
    if (artistId) {
      const check = await db.query(
        "SELECT id FROM artists WHERE id = $1 AND status = 'approved'",
        [artistId]
      );
      if (check.rows.length === 0) {
        return {
          statusCode: 404,
          headers: HEADERS,
          body: JSON.stringify({ error: "Artist not found" })
        };
      }
    }

    await db.query(
      `INSERT INTO submissions (type, source, submitter_note, raw_data, status, artist_id)
       VALUES ('removal', $1, $2, $3, 'pending', $4)`,
      [
        body.source || "website",
        body.reason,
        JSON.stringify(body),
        artistId
      ]
    );

    return {
      statusCode: 201,
      headers: HEADERS,
      body: JSON.stringify({
        message: "Removal request received. A moderator will review it shortly."
      })
    };

  } catch (error) {
    console.error("Error submitting removal:", error);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: "Failed to submit removal request" })
    };
  } finally {
    if (db) await db.end();
  }
};
