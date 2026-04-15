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
    const body = JSON.parse(event.body || "{}");

    // Validate required fields
    if (!body.title || !body.start_date) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "title and start_date are required" })
      };
    }

    const credentials = await getCredentials();
    db = await connectToDatabase(credentials);

    // Look up region ID if provided
    let regionId = null;
    if (body.region) {
      const regionResult = await db.query(
        "SELECT id FROM regions WHERE name = $1",
        [body.region]
      );
      if (regionResult.rows.length > 0) {
        regionId = regionResult.rows[0].id;
      }
    }

    // Insert into submissions table (audit log)
    await db.query(
      `INSERT INTO submissions (type, source, discord_user_id, submitter_note, raw_data, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')`,
      [
        "event",
        body.source || "website",
        body.discord_user_id || null,
        body.note || null,
        JSON.stringify(body)
      ]
    );

    // Insert into events table with pending status
    const result = await db.query(
      `INSERT INTO events (
        title, description, venue, city, state, region_id,
        is_online, start_date, end_date, start_time, event_url, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending')
      RETURNING id`,
      [
        body.title.trim(),
        body.description?.trim() || null,
        body.venue?.trim() || null,
        body.city?.trim() || null,
        body.state?.toUpperCase() || null,
        regionId,
        body.is_online || false,
        body.start_date,
        body.end_date || null,
        body.start_time || null,
        body.event_url?.trim() || null
      ]
    );

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Event submission received. It will appear on the calendar after moderator review.",
        id: result.rows[0].id
      })
    };

  } catch (error) {
    console.error("Error submitting event:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to submit event" })
    };

  } finally {
    if (db) await db.end();
  }
};
