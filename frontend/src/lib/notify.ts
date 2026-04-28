/**
 * Fire-and-forget call to the Discord notify endpoint.
 * Failures are swallowed — submission flow must not depend on this.
 */
export async function notifyMod(
	type: 'artist' | 'event' | 'edit' | 'removal',
	name: string,
	details?: string
): Promise<void> {
	try {
		await fetch('/api/notify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ type, name, details })
		});
	} catch {
		// Notify is best-effort — never block the user on it
	}
}
