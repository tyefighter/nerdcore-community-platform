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
    const { type, id, action } = body;

    // Validate inputs
    if (!type || !id || !action) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "type, id, and action are required" })
      };
    }

    if (!["artist", "event"].includes(type)) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "type must be artist or event" })
      };
    }

    if (!["approved", "rejected"].includes(action)) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "action must be approved or rejected" })
      };
    }

    const credentials = await getCredentials();
    db = await connectToDatabase(credentials);

    const table = type === "artist" ? "artists" : "events";

    const result = await db.query(
      `UPDATE ${table} SET status = $1 WHERE id = $2 AND status = 'pending' RETURNING id`,
      [action, id]
    );

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Submission not found or already reviewed" })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `${type} ${action} successfully`,
        id: result.rows[0].id
      })
    };

  } catch (error) {
    console.error("Error reviewing submission:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to review submission" })
    };
  } finally {
    if (db) await db.end();
  }
};
