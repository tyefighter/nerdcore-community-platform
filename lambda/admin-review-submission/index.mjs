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

const HEADERS = { "Content-Type": "application/json" };

export const handler = async (event) => {
  let db = null;

  try {
    // Validate admin API key
    const adminKey = await getAdminKey();
    const providedKey = event.headers?.["x-admin-key"] || event.headers?.["X-Admin-Key"];
    if (!providedKey || providedKey !== adminKey) {
      return {
        statusCode: 401,
        headers: HEADERS,
        body: JSON.stringify({ error: "Unauthorized" })
      };
    }

    const body = JSON.parse(event.body || "{}");
    const { type, id, action } = body;

    if (!type || !id || !action) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: "type, id, and action are required" })
      };
    }

    if (!["artist", "event", "removal", "edit"].includes(type)) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: "type must be artist, event, removal, or edit" })
      };
    }

    if (!["approved", "rejected"].includes(action)) {
      return {
        statusCode: 400,
        headers: HEADERS,
        body: JSON.stringify({ error: "action must be approved or rejected" })
      };
    }

    const credentials = await getCredentials();
    db = await connectToDatabase(credentials);

    // --- Artist / Event: update the record's status ---
    if (type === "artist" || type === "event") {
      const table = type === "artist" ? "artists" : "events";
      const result = await db.query(
        `UPDATE ${table} SET status = $1, reviewed_at = NOW() WHERE id = $2 AND status = 'pending' RETURNING id, city, state`,
        [action, id]
      );
      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers: HEADERS,
          body: JSON.stringify({ error: "Submission not found or already reviewed" })
        };
      }

      // Save coordinates if provided (geocoded by the admin frontend)
      if (type === "artist" && action === "approved" && body.lat && body.lng) {
        await db.query(
          `UPDATE artists SET lat = $1, lng = $2 WHERE id = $3`,
          [body.lat, body.lng, result.rows[0].id]
        );
      }

      return {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({ message: `${type} ${action} successfully`, id: result.rows[0].id })
      };
    }

    // --- Removal: mark submission reviewed; if approved, hide the artist or event ---
    if (type === "removal") {
      const subResult = await db.query(
        `UPDATE submissions SET status = $1, reviewed_at = NOW()
         WHERE id = $2 AND type = 'removal' AND status = 'pending'
         RETURNING id, artist_id, event_id`,
        [action, id]
      );
      if (subResult.rows.length === 0) {
        return {
          statusCode: 404,
          headers: HEADERS,
          body: JSON.stringify({ error: "Removal request not found or already reviewed" })
        };
      }
      if (action === "approved") {
        if (subResult.rows[0].artist_id) {
          await db.query(
            `UPDATE artists SET status = 'hidden', reviewed_at = NOW() WHERE id = $1`,
            [subResult.rows[0].artist_id]
          );
        } else if (subResult.rows[0].event_id) {
          await db.query(
            `UPDATE events SET status = 'hidden', reviewed_at = NOW() WHERE id = $1`,
            [subResult.rows[0].event_id]
          );
        }
      }
      return {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({ message: `Removal request ${action}`, id: subResult.rows[0].id })
      };
    }

    // --- Edit: mark submission reviewed; if approved, apply changes to artist or event ---
    if (type === "edit") {
      const subResult = await db.query(
        `UPDATE submissions SET status = $1, reviewed_at = NOW()
         WHERE id = $2 AND type = 'edit' AND status = 'pending'
         RETURNING id, artist_id, event_id, raw_data`,
        [action, id]
      );
      if (subResult.rows.length === 0) {
        return {
          statusCode: 404,
          headers: HEADERS,
          body: JSON.stringify({ error: "Edit request not found or already reviewed" })
        };
      }

      if (action === "approved") {
        const data = subResult.rows[0].raw_data;

        if (subResult.rows[0].artist_id) {
          const artistId = subResult.rows[0].artist_id;
          const fieldMap = {
            display_name: "display_name", role: "role", city: "city", state: "state",
            country: "country", bio: "bio", operates_in: "operates_in",
            link_soundcloud: "link_soundcloud", link_bandcamp: "link_bandcamp",
            link_twitter: "link_twitter", link_instagram: "link_instagram",
            link_website: "link_website", discord_handle: "discord_handle"
          };
          const setClauses = [];
          const values = [];
          let idx = 1;
          for (const [field, col] of Object.entries(fieldMap)) {
            if (data[field] !== undefined) {
              setClauses.push(`${col} = $${idx}`);
              values.push(data[field]);
              idx++;
            }
          }
          if (setClauses.length > 0) {
            setClauses.push(`reviewed_at = NOW()`);
            values.push(artistId);
            await db.query(`UPDATE artists SET ${setClauses.join(", ")} WHERE id = $${idx}`, values);
          }
          if (Array.isArray(data.tags)) {
            const tagRows = await db.query(`SELECT id FROM tags WHERE name = ANY($1)`, [data.tags]);
            const tagIds = tagRows.rows.map(r => r.id);
            await db.query(`DELETE FROM artist_tags WHERE artist_id = $1`, [artistId]);
            for (const tagId of tagIds) {
              await db.query(`INSERT INTO artist_tags (artist_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [artistId, tagId]);
            }
          }
        } else if (subResult.rows[0].event_id) {
          const eventId = subResult.rows[0].event_id;
          const fieldMap = {
            title: "title", description: "description", venue: "venue", address: "address",
            city: "city", state: "state", start_date: "start_date", end_date: "end_date",
            start_time: "start_time", event_url: "event_url", is_online: "is_online"
          };
          const setClauses = [];
          const values = [];
          let idx = 1;
          for (const [field, col] of Object.entries(fieldMap)) {
            if (data[field] !== undefined) {
              setClauses.push(`${col} = $${idx}`);
              values.push(data[field]);
              idx++;
            }
          }
          if (setClauses.length > 0) {
            setClauses.push(`reviewed_at = NOW()`);
            values.push(eventId);
            await db.query(`UPDATE events SET ${setClauses.join(", ")} WHERE id = $${idx}`, values);
          }
          if (Array.isArray(data.tags)) {
            const tagRows = await db.query(`SELECT id FROM tags WHERE name = ANY($1)`, [data.tags]);
            const tagIds = tagRows.rows.map(r => r.id);
            await db.query(`DELETE FROM event_tags WHERE event_id = $1`, [eventId]);
            for (const tagId of tagIds) {
              await db.query(`INSERT INTO event_tags (event_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [eventId, tagId]);
            }
          }
        }
      }

      return {
        statusCode: 200,
        headers: HEADERS,
        body: JSON.stringify({ message: `Edit request ${action}`, id: subResult.rows[0].id })
      };
    }

  } catch (error) {
    console.error("Error reviewing submission:", error);
    return {
      statusCode: 500,
      headers: HEADERS,
      body: JSON.stringify({ error: "Failed to review submission" })
    };
  } finally {
    if (db) await db.end();
  }
};
