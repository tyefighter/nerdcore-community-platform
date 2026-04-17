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

    // Validate — need artist or event target
    const hasArtist = body.artist_id || body.artist_name;
    const hasEvent = body.event_id;
    if (!hasArtist && !hasEvent) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: "artist_id, artist_name, or event_id is required" })
      };
    }

    const credentials = await getCredentials();
    db = await connectToDatabase(credentials);

    let artistId = null;
    let eventId = null;

    if (hasEvent) {
      // Verify event exists and is approved
      const check = await db.query(
        "SELECT id FROM events WHERE id = $1 AND status = 'approved'",
        [body.event_id]
      );
      if (check.rows.length === 0) {
        return {
          statusCode: 404,
          headers: HEADERS,
          body: JSON.stringify({ error: "Event not found" })
        };
      }
      eventId = body.event_id;
    } else {
      // Verify artist exists if artist_id provided
      artistId = body.artist_id || null;
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
    }

    await db.query(
      `INSERT INTO submissions (type, source, submitter_note, raw_data, status, artist_id, event_id)
       VALUES ('removal', $1, $2, $3, 'pending', $4, $5)`,
      [
        body.source || "website",
        body.reason || null,
        JSON.stringify(body),
        artistId,
        eventId
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
