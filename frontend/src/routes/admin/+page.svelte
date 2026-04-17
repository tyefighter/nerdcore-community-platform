<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_API_BASE_URL, PUBLIC_ADMIN_KEY, PUBLIC_MAPBOX_TOKEN } from '$env/static/public';

	interface ArtistSubmission {
		id: number;
		display_name: string;
		role: string;
		city: string;
		state: string;
		region: string;
		bio: string;
		link_soundcloud: string | null;
		link_twitter: string | null;
		link_website: string | null;
		tags: string[];
	}

	interface EventSubmission {
		id: number;
		title: string;
		description: string | null;
		venue: string | null;
		city: string | null;
		state: string | null;
		region: string;
		is_online: boolean;
		start_date: string;
		end_date: string | null;
		event_url: string | null;
		tags: string[];
	}

	interface RemovalRequest {
		id: number;
		artist_id: number | null;
		artist_name: string | null;
		event_id: number | null;
		event_title: string | null;
		reason: string;
		submitted_at: string;
		raw_data: any;
	}

	interface EditRequest {
		id: number;
		artist_id: number | null;
		artist_name: string | null;
		reason: string;
		submitted_at: string;
		raw_data: any;
	}

	let artists: ArtistSubmission[] = $state([]);
	let events: EventSubmission[] = $state([]);
	let removals: RemovalRequest[] = $state([]);
	let edits: EditRequest[] = $state([]);
	let loading = $state(true);
	let error = $state('');
	let reviewing: string | null = $state(null);

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	async function loadSubmissions() {
		loading = true;
		error = '';
		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/admin/submissions`, {
				headers: { 'x-admin-key': PUBLIC_ADMIN_KEY }
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			artists = data.artists;
			events = data.events;
			removals = data.removals || [];
			edits = data.edits || [];
		} catch (e) {
			error = 'Failed to load submissions.';
		} finally {
			loading = false;
		}
	}

	async function geocode(city: string, state: string): Promise<{ lat: number, lng: number } | null> {
		try {
			const q = encodeURIComponent(`${city}, ${state}, USA`);
			const res = await fetch(
				`https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?types=place&limit=1&access_token=${PUBLIC_MAPBOX_TOKEN}`
			);
			const data = await res.json();
			const coords = data.features?.[0]?.center;
			if (coords) return { lng: coords[0], lat: coords[1] };
		} catch {
			console.error('Geocoding failed');
		}
		return null;
	}

	async function review(type: 'artist' | 'event' | 'removal' | 'edit', id: number, action: 'approved' | 'rejected', artist?: ArtistSubmission) {
		reviewing = `${type}-${id}`;
		try {
			let coords: { lat: number, lng: number } | null = null;
			if (type === 'artist' && action === 'approved' && artist?.city && artist?.state) {
				coords = await geocode(artist.city, artist.state);
			}

			const res = await fetch(`${PUBLIC_API_BASE_URL}/admin/review`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'x-admin-key': PUBLIC_ADMIN_KEY },
				body: JSON.stringify({ type, id, action, ...(coords ?? {}) })
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			if (type === 'artist') artists = artists.filter(a => a.id !== id);
			else if (type === 'event') events = events.filter(e => e.id !== id);
			else if (type === 'removal') removals = removals.filter(r => r.id !== id);
			else if (type === 'edit') edits = edits.filter(e => e.id !== id);
		} catch (e) {
			error = `Failed to ${action} submission.`;
		} finally {
			reviewing = null;
		}
	}

	onMount(loadSubmissions);
</script>

<svelte:head>
	<title>Moderation Queue · Nerd Music</title>
</svelte:head>

<div class="page">
	<header>
		<h1>Moderation Queue</h1>
		<nav>
			<button onclick={loadSubmissions} class="refresh">↻ Refresh</button>
			<a href="/">Home</a>
		</nav>
	</header>

	{#if loading}
		<p class="status">Loading submissions...</p>
	{:else if error}
		<p class="status error">{error}</p>
	{:else}
		<div class="content">

			<!-- Artists -->
			<section>
				<h2>Artist Submissions <span class="count">({artists.length})</span></h2>
				{#if artists.length === 0}
					<p class="empty">No pending artist submissions.</p>
				{:else}
					{#each artists as artist}
						<div class="card">
							<div class="card-header">
								<div>
									<strong>{artist.display_name}</strong>
									<span class="meta-sub">{artist.role}</span>
								</div>
								<div class="actions">
									<button
										class="approve"
										disabled={reviewing === `artist-${artist.id}`}
										onclick={() => review('artist', artist.id, 'approved', artist)}
									>Approve</button>
									<button
										class="reject"
										disabled={reviewing === `artist-${artist.id}`}
										onclick={() => review('artist', artist.id, 'rejected', artist)}
									>Reject</button>
								</div>
							</div>
							<div class="card-body">
								<p class="meta">{artist.city}, {artist.state} · {artist.region}</p>
								{#if artist.bio}<p class="bio">{artist.bio}</p>{/if}
								{#if artist.tags.length > 0}
									<div class="tags">
										{#each artist.tags as tag}<span class="tag">{tag}</span>{/each}
									</div>
								{/if}
								<div class="links">
									{#if artist.link_soundcloud}<a href={artist.link_soundcloud} target="_blank">SoundCloud</a>{/if}
									{#if artist.link_twitter}<a href={artist.link_twitter} target="_blank">Twitter</a>{/if}
									{#if artist.link_website}<a href={artist.link_website} target="_blank">Website</a>{/if}
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</section>

			<!-- Events -->
			<section>
				<h2>Event Submissions <span class="count">({events.length})</span></h2>
				{#if events.length === 0}
					<p class="empty">No pending event submissions.</p>
				{:else}
					{#each events as event}
						<div class="card">
							<div class="card-header">
								<div>
									<strong>{event.title}</strong>
									<span class="meta-sub">{formatDate(event.start_date)}</span>
								</div>
								<div class="actions">
									<button
										class="approve"
										disabled={reviewing === `event-${event.id}`}
										onclick={() => review('event', event.id, 'approved')}
									>Approve</button>
									<button
										class="reject"
										disabled={reviewing === `event-${event.id}`}
										onclick={() => review('event', event.id, 'rejected')}
									>Reject</button>
								</div>
							</div>
							<div class="card-body">
								<p class="meta">
									{#if event.is_online}
										Online
									{:else}
										{event.venue ? `${event.venue}, ` : ''}{event.city}{event.state ? `, ${event.state}` : ''}
									{/if}
									· {event.region}
								</p>
								{#if event.description}<p class="bio">{event.description}</p>{/if}
								{#if event.event_url}<a href={event.event_url} target="_blank" class="event-url">{event.event_url}</a>{/if}
								{#if event.tags.length > 0}
									<div class="tags">
										{#each event.tags as tag}<span class="tag">{tag}</span>{/each}
									</div>
								{/if}
							</div>
						</div>
					{/each}
				{/if}
			</section>

			<!-- Removal Requests -->
			<section>
				<h2>Removal Requests <span class="count">({removals.length})</span></h2>
				{#if removals.length === 0}
					<p class="empty">No pending removal requests.</p>
				{:else}
					{#each removals as removal}
						<div class="card removal-card">
							<div class="card-header">
								<div>
									{#if removal.event_id}
										<strong>{removal.event_title ?? removal.raw_data?.event_title ?? `Event #${removal.event_id}`}</strong>
										<span class="meta-sub">Event removal</span>
									{:else}
										<strong>{removal.artist_name ?? removal.raw_data?.artist_name ?? 'Unknown artist'}</strong>
										<span class="meta-sub">Artist removal</span>
									{/if}
								</div>
								<div class="actions">
									<button
										class="approve"
										disabled={reviewing === `removal-${removal.id}`}
										onclick={() => review('removal', removal.id, 'approved')}
									>{removal.event_id ? 'Hide Event' : 'Hide Artist'}</button>
									<button
										class="reject"
										disabled={reviewing === `removal-${removal.id}`}
										onclick={() => review('removal', removal.id, 'rejected')}
									>Dismiss</button>
								</div>
							</div>
							<div class="card-body">
								<p class="meta">Submitted {formatDate(removal.submitted_at)}</p>
								{#if removal.reason}<p class="bio">{removal.reason}</p>{/if}
							</div>
						</div>
					{/each}
				{/if}
			</section>

			<!-- Edit Requests -->
			<section>
				<h2>Edit Requests <span class="count">({edits.length})</span></h2>
				{#if edits.length === 0}
					<p class="empty">No pending edit requests.</p>
				{:else}
					{#each edits as edit}
						<div class="card edit-card">
							<div class="card-header">
								<div>
									<strong>{edit.artist_name ?? 'Unknown artist'}</strong>
									{#if edit.artist_id}
										<span class="meta-sub">Artist ID: {edit.artist_id}</span>
									{/if}
								</div>
								<div class="actions">
									<button
										class="approve"
										disabled={reviewing === `edit-${edit.id}`}
										onclick={() => review('edit', edit.id, 'approved')}
									>Apply</button>
									<button
										class="reject"
										disabled={reviewing === `edit-${edit.id}`}
										onclick={() => review('edit', edit.id, 'rejected')}
									>Dismiss</button>
								</div>
							</div>
							<div class="card-body">
								<p class="meta">Submitted {formatDate(edit.submitted_at)}</p>
								<p class="bio reason">Reason: {edit.reason}</p>
								<div class="diff">
									{#each Object.entries(edit.raw_data).filter(([k]) => !['artist_id','reason','source'].includes(k)) as [field, value]}
										<div class="diff-row">
											<span class="diff-field">{field}</span>
											<span class="diff-value">
												{#if Array.isArray(value)}
													{value.join(', ')}
												{:else}
													{value}
												{/if}
											</span>
										</div>
									{/each}
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</section>

		</div>
	{/if}
</div>

<style>
	.page {
		min-height: 100vh;
		background: #0a0a0a;
		color: #fff;
		font-family: 'JetBrains Mono', monospace, sans-serif;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #222;
	}

	h1 {
		font-size: 1.25rem;
		margin: 0;
		color: #39ff14;
	}

	nav {
		display: flex;
		gap: 1.5rem;
		align-items: center;
	}

	nav a {
		font-size: 0.8rem;
		color: #888;
		text-decoration: none;
	}

	nav a:hover { color: #fff; }

	.refresh {
		background: none;
		border: 1px solid #333;
		color: #888;
		font-family: inherit;
		font-size: 0.8rem;
		padding: 0.3rem 0.75rem;
		border-radius: 4px;
		cursor: pointer;
	}

	.refresh:hover { border-color: #555; color: #fff; }

	.content {
		max-width: 800px;
		margin: 2rem auto;
		padding: 0 1.5rem 3rem;
		display: flex;
		flex-direction: column;
		gap: 3rem;
	}

	section h2 {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #555;
		margin: 0 0 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #1a1a1a;
	}

	.count { color: #444; }

	.empty {
		font-size: 0.8rem;
		color: #444;
		margin: 0;
	}

	.card {
		border: 1px solid #222;
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 0.75rem;
	}

	.removal-card { border-color: #3a1a1a; }
	.edit-card { border-color: #1a2a3a; }

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: #111;
		gap: 1rem;
	}

	.removal-card .card-header { background: #130d0d; }
	.edit-card .card-header { background: #0d1320; }

	.card-header strong {
		font-size: 0.9rem;
		display: block;
	}

	.meta-sub {
		font-size: 0.7rem;
		color: #888;
		margin-top: 0.15rem;
		display: block;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.approve, .reject {
		font-family: inherit;
		font-size: 0.75rem;
		padding: 0.35rem 0.85rem;
		border-radius: 4px;
		cursor: pointer;
		border: none;
		font-weight: bold;
	}

	.approve { background: #39ff14; color: #000; }
	.approve:hover:not(:disabled) { opacity: 0.85; }

	.reject { background: #ff006e; color: #fff; }
	.reject:hover:not(:disabled) { opacity: 0.85; }

	.approve:disabled, .reject:disabled { opacity: 0.4; cursor: not-allowed; }

	.card-body {
		padding: 0.75rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.meta {
		font-size: 0.75rem;
		color: #888;
		margin: 0;
	}

	.bio {
		font-size: 0.8rem;
		color: #ccc;
		margin: 0;
		line-height: 1.5;
	}

	.reason { color: #aaa; font-style: italic; }

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.tag {
		font-size: 0.65rem;
		padding: 0.2rem 0.5rem;
		background: #222;
		border: 1px solid #333;
		border-radius: 3px;
		color: #aaa;
	}

	.links {
		display: flex;
		gap: 1rem;
	}

	.links a, .event-url {
		font-size: 0.75rem;
		color: #39ff14;
		text-decoration: none;
	}

	.links a:hover, .event-url:hover { text-decoration: underline; }

	.diff {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		margin-top: 0.25rem;
	}

	.diff-row {
		display: flex;
		gap: 0.75rem;
		font-size: 0.75rem;
	}

	.diff-field {
		color: #555;
		min-width: 130px;
		flex-shrink: 0;
	}

	.diff-value { color: #c8a7e0; }

	.status {
		padding: 3rem;
		text-align: center;
		color: #888;
		font-size: 0.85rem;
	}

	.error { color: #ff006e; }
</style>
