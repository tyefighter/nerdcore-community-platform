<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';

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

	let artists: ArtistSubmission[] = $state([]);
	let events: EventSubmission[] = $state([]);
	let loading = $state(true);
	let error = $state('');
	let reviewing: string | null = $state(null); // tracks which item is being actioned

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
			const res = await fetch(`${PUBLIC_API_BASE_URL}/admin/submissions`);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			artists = data.artists;
			events = data.events;
		} catch (e) {
			error = 'Failed to load submissions.';
		} finally {
			loading = false;
		}
	}

	async function review(type: 'artist' | 'event', id: number, action: 'approved' | 'rejected') {
		reviewing = `${type}-${id}`;
		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/admin/review`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ type, id, action })
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			// Remove from local list immediately
			if (type === 'artist') {
				artists = artists.filter(a => a.id !== id);
			} else {
				events = events.filter(e => e.id !== id);
			}
		} catch (e) {
			error = `Failed to ${action} submission.`;
		} finally {
			reviewing = null;
		}
	}

	onMount(loadSubmissions);
</script>

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
				<h2>Artists <span class="count">({artists.length})</span></h2>
				{#if artists.length === 0}
					<p class="empty">No pending artist submissions.</p>
				{:else}
					{#each artists as artist}
						<div class="card">
							<div class="card-header">
								<div>
									<strong>{artist.display_name}</strong>
									<span class="role">{artist.role}</span>
								</div>
								<div class="actions">
									<button
										class="approve"
										disabled={reviewing === `artist-${artist.id}`}
										onclick={() => review('artist', artist.id, 'approved')}
									>Approve</button>
									<button
										class="reject"
										disabled={reviewing === `artist-${artist.id}`}
										onclick={() => review('artist', artist.id, 'rejected')}
									>Reject</button>
								</div>
							</div>
							<div class="card-body">
								<p class="meta">{artist.city}, {artist.state} · {artist.region}</p>
								{#if artist.bio}
									<p class="bio">{artist.bio}</p>
								{/if}
								{#if artist.tags.length > 0}
									<div class="tags">
										{#each artist.tags as tag}
											<span class="tag">{tag}</span>
										{/each}
									</div>
								{/if}
								<div class="links">
									{#if artist.link_soundcloud}
										<a href={artist.link_soundcloud} target="_blank">SoundCloud</a>
									{/if}
									{#if artist.link_twitter}
										<a href={artist.link_twitter} target="_blank">Twitter</a>
									{/if}
									{#if artist.link_website}
										<a href={artist.link_website} target="_blank">Website</a>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</section>

			<!-- Events -->
			<section>
				<h2>Events <span class="count">({events.length})</span></h2>
				{#if events.length === 0}
					<p class="empty">No pending event submissions.</p>
				{:else}
					{#each events as event}
						<div class="card">
							<div class="card-header">
								<div>
									<strong>{event.title}</strong>
									<span class="date">{formatDate(event.start_date)}</span>
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
										🌐 Online
									{:else}
										📍 {event.venue ? `${event.venue}, ` : ''}{event.city}{event.state ? `, ${event.state}` : ''}
									{/if}
									· {event.region}
								</p>
								{#if event.description}
									<p class="bio">{event.description}</p>
								{/if}
								{#if event.event_url}
									<a href={event.event_url} target="_blank" class="event-url">{event.event_url}</a>
								{/if}
								{#if event.tags.length > 0}
									<div class="tags">
										{#each event.tags as tag}
											<span class="tag">{tag}</span>
										{/each}
									</div>
								{/if}
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

	.refresh:hover {
		border-color: #555;
		color: #fff;
	}

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

	.count {
		color: #444;
	}

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

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background: #111;
		gap: 1rem;
	}

	.card-header strong {
		font-size: 0.9rem;
		display: block;
	}

	.role, .date {
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

	.approve {
		background: #39ff14;
		color: #000;
	}

	.approve:hover:not(:disabled) {
		opacity: 0.85;
	}

	.reject {
		background: #ff006e;
		color: #fff;
	}

	.reject:hover:not(:disabled) {
		opacity: 0.85;
	}

	.approve:disabled, .reject:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

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

	.links a:hover, .event-url:hover {
		text-decoration: underline;
	}

	.status {
		padding: 3rem;
		text-align: center;
		color: #888;
		font-size: 0.85rem;
	}

	.error { color: #ff006e; }
</style>
