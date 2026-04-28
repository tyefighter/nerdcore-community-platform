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
    // Parse the request body
    const body = JSON.parse(event.body || "{}");

    // Validate required fields
    if (!body.display_name) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "display_name is required" })
      };
    }

    // Validate roles if provided
    const validRoles = ["vocalist", "producer", "band", "visualist", "other"];
    if (body.roles && Array.isArray(body.roles)) {
      const invalid = body.roles.filter((r) => !validRoles.includes(r));
      if (invalid.length > 0) {
        return {
          statusCode: 400,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ error: `Invalid role(s): ${invalid.join(", ")}` })
        };
      }
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
        "artist",
        body.source || "website",
        body.discord_user_id || null,
        body.note || null,
        JSON.stringify(body)
      ]
    );

    // Filter links_other to keep only entries with both label and url
    const linksOther = Array.isArray(body.links_other)
      ? body.links_other
          .filter((l) => l && typeof l.label === "string" && typeof l.url === "string" && l.label.trim() && l.url.trim())
          .map((l) => ({ label: l.label.trim(), url: l.url.trim() }))
      : [];

    // Insert into artists table with pending status
    const result = await db.query(
      `INSERT INTO artists (
        display_name, role, city, state, country, region_id, operates_in, bio,
        link_soundcloud, link_bandcamp, link_twitter, link_instagram, link_website,
        link_facebook, link_bluesky, link_mastodon, link_twitch, link_linktree,
        link_patreon, link_youtube, link_discord, links_other,
        discord_handle, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,'pending')
      RETURNING id`,
      [
        body.display_name.trim(),
        body.roles?.length > 0 ? body.roles.join(", ") : null,
        body.city?.trim() || null,
        body.state?.trim() || null,
        body.country?.trim() || null,
        regionId,
        body.operates_in?.trim() || null,
        body.bio?.trim() || null,
        body.link_soundcloud?.trim() || null,
        body.link_bandcamp?.trim() || null,
        body.link_twitter?.trim() || null,
        body.link_instagram?.trim() || null,
        body.link_website?.trim() || null,
        body.link_facebook?.trim() || null,
        body.link_bluesky?.trim() || null,
        body.link_mastodon?.trim() || null,
        body.link_twitch?.trim() || null,
        body.link_linktree?.trim() || null,
        body.link_patreon?.trim() || null,
        body.link_youtube?.trim() || null,
        body.link_discord?.trim() || null,
        linksOther.length > 0 ? JSON.stringify(linksOther) : null,
        body.discord_handle?.trim() || null
      ]
    );

    return {
      statusCode: 201,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Artist submission received. It will appear on the map after moderator review.",
        id: result.rows[0].id
      })
    };

  } catch (error) {
    console.error("Error submitting artist:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to submit artist" })
    };

  } finally {
    if (db) await db.end();
  }
};
