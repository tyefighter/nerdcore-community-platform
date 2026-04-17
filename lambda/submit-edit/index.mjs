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

    // Require artist_id or event_id
    if (!body.artist_id && !body.event_id) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: "artist_id or event_id is required" })
      };
    }

    // Require at least one field to change
    const artistEditableFields = [
      "display_name", "role", "city", "state", "region_id", "operates_in",
      "bio", "link_soundcloud", "link_bandcamp", "link_twitter",
      "link_instagram", "link_website", "discord_handle", "tags"
    ];
    const eventEditableFields = [
      "title", "description", "venue", "address", "city", "state",
      "start_date", "end_date", "start_time", "event_url", "is_online", "tags"
    ];
    const editableFields = body.event_id ? eventEditableFields : artistEditableFields;
    const hasChanges = editableFields.some(f => body[f] !== undefined);
    if (!hasChanges) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: "At least one field to edit is required" })
      };
    }

    const credentials = await getCredentials();
    db = await connectToDatabase(credentials);

    let artistId = null;
    let eventId = null;

    if (body.event_id) {
      // Verify the event exists and is approved
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
      // Verify the artist exists and is approved
      const check = await db.query(
        "SELECT id FROM artists WHERE id = $1 AND status = 'approved'",
        [body.artist_id]
      );
      if (check.rows.length === 0) {
        return {
          statusCode: 404,
          headers: HEADERS,
          body: JSON.stringify({ error: "Artist not found" })
        };
      }
      artistId = body.artist_id;
    }

    await db.query(
      `INSERT INTO submissions (type, source, submitter_note, raw_data, status, artist_id, event_id)
       VALUES ('edit', $1, $2, $3, 'pending', $4, $5)`,
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
        message: "Edit request received. A moderator will review it shortly."
      })
    };

  } catch (error) {
    console.error("Error submitting edit:", error);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: "Failed to submit edit request" })
    };
  } finally {
    if (db) await db.end();
  }
};
