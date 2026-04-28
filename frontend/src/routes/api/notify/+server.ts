import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

interface NotifyPayload {
	type: 'artist' | 'event' | 'edit' | 'removal';
	name: string;
	details?: string;
}

const TYPE_LABELS = {
	artist: { emoji: '🎤', label: 'New artist submission' },
	event: { emoji: '🗓️', label: 'New event submission' },
	edit: { emoji: '✏️', label: 'Edit request' },
	removal: { emoji: '🗑️', label: 'Removal request' }
} as const;

export const POST: RequestHandler = async ({ request, platform, url }) => {
	// Same-origin guard — keeps random callers from spamming the webhook
	const origin = request.headers.get('origin');
	if (origin && origin !== url.origin) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const webhookUrl = (platform as any)?.env?.DISCORD_WEBHOOK_URL;
	if (!webhookUrl) {
		return json({ error: 'Notifications not configured' }, { status: 500 });
	}

	let payload: NotifyPayload;
	try {
		payload = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	const meta = TYPE_LABELS[payload.type];
	if (!meta || !payload.name) {
		return json({ error: 'Bad payload' }, { status: 400 });
	}

	const lines = [
		`${meta.emoji} **${meta.label}**: ${payload.name}`,
		payload.details ? payload.details : null,
		`<${url.origin}/admin>`
	].filter(Boolean);

	const discordRes = await fetch(webhookUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ content: lines.join('\n') })
	});

	if (!discordRes.ok) {
		return json({ error: 'Webhook failed' }, { status: 502 });
	}

	return json({ ok: true });
};
