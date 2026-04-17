<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';

	const REGIONS = [
		'Northeast',
		'Southeast',
		'Midwest',
		'Southwest',
		'West',
		'Northwest',
		'International'
	];

	const AVAILABLE_TAGS = ['nerdcore', 'chiptune', 'vgm', 'visualist', 'hip-hop', 'festival', 'vpc', 'online-event', 'deadline', 'local-show'];

	let title = $state('');
	let description = $state('');
	let start_date = $state('');
	let end_date = $state('');
	let start_time = $state('');
	let is_online = $state(false);
	let venue = $state('');
	let address = $state('');
	let city = $state('');
	let state_val = $state('');
	let region = $state('');
	let event_url = $state('');
	let performers_raw = $state('');
	let selectedTags: string[] = $state([]);
	let suggested_tag = $state('');

	let submitting = $state(false);
	let success = $state(false);
	let error = $state('');

	onMount(() => {
		const dateParam = $page.url.searchParams.get('date');
		if (dateParam) start_date = dateParam;
	});

	function toggleTag(tag: string) {
		if (selectedTags.includes(tag)) {
			selectedTags = selectedTags.filter((t) => t !== tag);
		} else {
			selectedTags = [...selectedTags, tag];
		}
	}

	function resetForm() {
		title = '';
		description = '';
		start_date = '';
		end_date = '';
		start_time = '';
		is_online = false;
		venue = '';
		address = '';
		city = '';
		state_val = '';
		region = '';
		event_url = '';
		performers_raw = '';
		selectedTags = [];
		suggested_tag = '';
		success = false;
	}

	function normalizeUrl(url: string): string | undefined {
		const trimmed = url.trim();
		if (!trimmed) return undefined;
		if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
		return `https://${trimmed}`;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		submitting = true;
		error = '';

		const performers = performers_raw
			.split(',')
			.map((p) => p.trim())
			.filter(Boolean);

		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/submissions/event`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title,
					description: description || undefined,
					start_date,
					end_date: end_date || undefined,
					start_time: start_time || undefined,
					is_online,
					venue: venue || undefined,
					address: is_online ? undefined : address || undefined,
					city: is_online ? undefined : city || undefined,
					state: is_online ? undefined : state_val || undefined,
					region: region || undefined,
					event_url: normalizeUrl(event_url),
					tags: selectedTags.length > 0 ? selectedTags : undefined,
					performers: performers.length > 0 ? performers : undefined,
					suggested_tag: suggested_tag.trim() || undefined
				})
			});

			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				error = body.error || `Submission failed (${res.status})`;
				return;
			}

			success = true;
		} catch {
			error = 'Could not reach the server. Please try again.';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Submit an Event · Nerd Music</title>
</svelte:head>

<div class="page">
	<header>
		<h1>Submit an Event</h1>
		<nav>
			<a href="/events">← Event Calendar</a>
			<a href="/contact">Contact</a>
				<a href="/">Home</a>
				<a href="https://ko-fi.com/nerdmusicmap" target="_blank" class="kofi">Support ♥</a>
		</nav>
	</header>

	{#if success}
		<div class="success-screen">
			<p class="success-icon">✓</p>
			<h2>Submission received</h2>
			<p>Your event is in the moderation queue. A moderator will review it before it appears publicly.</p>
			<div class="success-actions">
				<button type="button" onclick={resetForm}>Submit another</button>
				<a href="/events">View calendar</a>
			</div>
		</div>
	{:else}
		<form onsubmit={handleSubmit}>
			<p class="note">All submissions go into a moderation queue and won't appear publicly until approved.</p>

			<section>
				<h2>Required</h2>

				<label>
					Event Title *
					<input type="text" bind:value={title} required placeholder="Nerdcore Night at The Venue" />
				</label>

				<div class="row">
					<label>
						Start Date *
						<input type="date" bind:value={start_date} required />
					</label>
					<label>
						End Date
						<input type="date" bind:value={end_date} />
					</label>
					<label>
						Start Time
						<input type="time" bind:value={start_time} />
					</label>
				</div>
			</section>

			<section>
				<h2>Location</h2>

				<label class="checkbox-label">
					<input type="checkbox" bind:checked={is_online} />
					This is an online event
				</label>

				{#if !is_online}
					<label>
						Venue
						<input type="text" bind:value={venue} placeholder="The Broadberry" />
					</label>
					<label>
						Full address <span class="optional">(optional)</span>
						<input type="text" bind:value={address} placeholder="123 Main St, Richmond, VA 23220" />
					</label>
					<div class="row">
						<label>
							City
							<input type="text" bind:value={city} placeholder="Richmond" />
						</label>
						<label>
							State
							<input type="text" bind:value={state_val} placeholder="VA" maxlength={2} class="short" />
						</label>
					</div>
				{/if}

				<label>
					Region
					<select bind:value={region}>
						<option value="">— select —</option>
						{#each REGIONS as r}
							<option value={r}>{r}</option>
						{/each}
					</select>
				</label>
			</section>

			<section>
				<h2>Details</h2>

				<label>
					Description
					<textarea bind:value={description} rows={4} placeholder="What's going down..."></textarea>
				</label>

				<label>
					Event URL
					<input type="text" bind:value={event_url} placeholder="facebook.com/events/..." />
				</label>

				<label>
					Performers <span class="hint">(comma-separated)</span>
					<input type="text" bind:value={performers_raw} placeholder="MC Hadron, Professor BeatBox" />
				</label>

				<div class="tag-section">
					<p class="tag-label">Tags</p>
					<div class="tags">
						{#each AVAILABLE_TAGS as tag}
							<button
								type="button"
								class="tag"
								class:active={selectedTags.includes(tag)}
								onclick={() => toggleTag(tag)}
							>{tag}</button>
						{/each}
					</div>
					<label class="suggest-label">
						Don't see the right tag? Suggest one <span class="optional">(optional)</span>
						<input type="text" bind:value={suggested_tag} placeholder="e.g. album release" maxlength={50} />
					</label>
				</div>
			</section>

			{#if error}
				<p class="error">{error}</p>
			{/if}

			<button type="submit" class="submit-btn" disabled={submitting}>
				{submitting ? 'Submitting...' : 'Submit for Review'}
			</button>
		</form>
	{/if}
</div>

<style>
	.page {
		min-height: 100vh;
		background: #0a0a0a;
		color: #fff;
		font-family: 'JetBrains Mono', monospace, sans-serif;
		display: flex;
		flex-direction: column;
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #222;
	}

	header h1 {
		font-size: 1.25rem;
		margin: 0;
		color: #983cba;
	}

	nav {
		display: flex;
		gap: 1.5rem;
	}

	nav a {
		font-size: 0.8rem;
		color: #888;
		text-decoration: none;
	}

	nav a:hover { color: #fff; }
	nav a.kofi { color: #ff5e5b; }
	nav a.kofi:hover { color: #ff8a88; }

	form {
		max-width: 600px;
		width: 100%;
		margin: 2rem auto;
		padding: 0 1.5rem 3rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.note {
		font-size: 0.75rem;
		color: #666;
		margin: 0;
		padding: 0.75rem 1rem;
		border: 1px solid #222;
		border-left: 3px solid #983cba;
		border-radius: 3px;
	}

	section {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	section h2 {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #555;
		margin: 0;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #1a1a1a;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		font-size: 0.8rem;
		color: #aaa;
	}

	input[type='text'],
	input[type='url'],
	input[type='date'],
	input[type='time'],
	select,
	textarea {
		background: #111;
		border: 1px solid #333;
		border-radius: 4px;
		color: #fff;
		font-family: inherit;
		font-size: 0.85rem;
		padding: 0.5rem 0.75rem;
		outline: none;
		transition: border-color 0.15s;
		color-scheme: dark;
	}

	input[type='text']:focus,
	input[type='url']:focus,
	input[type='date']:focus,
	input[type='time']:focus,
	select:focus,
	textarea:focus {
		border-color: #983cba;
	}

	.optional {
		font-size: 0.7rem;
		color: #555;
		font-weight: normal;
		text-transform: none;
		letter-spacing: 0;
	}

	input.short {
		width: 80px;
	}

	textarea {
		resize: vertical;
	}

	select option {
		background: #111;
	}

	.row {
		display: flex;
		gap: 1rem;
		align-items: flex-end;
		flex-wrap: wrap;
	}

	.checkbox-label {
		flex-direction: row;
		align-items: center;
		gap: 0.6rem;
		color: #ccc;
		cursor: pointer;
	}

	.checkbox-label input {
		accent-color: #983cba;
		width: 16px;
		height: 16px;
	}

	.hint {
		font-size: 0.7rem;
		color: #555;
	}

	.tag-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.suggest-label {
		margin-top: 0.25rem;
		font-size: 0.75rem;
		color: #666;
	}

	.tag-label {
		font-size: 0.8rem;
		color: #aaa;
		margin: 0;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag {
		font-size: 0.7rem;
		padding: 0.3rem 0.75rem;
		background: #111;
		border: 1px solid #333;
		border-radius: 3px;
		color: #888;
		cursor: pointer;
		font-family: inherit;
		transition: all 0.15s;
	}

	.tag:hover {
		border-color: #555;
		color: #ccc;
	}

	.tag.active {
		background: #1e0f2e;
		border-color: #983cba;
		color: #983cba;
	}

	.submit-btn {
		background: #983cba;
		color: #fff;
		border: none;
		border-radius: 4px;
		font-family: inherit;
		font-size: 0.9rem;
		font-weight: bold;
		padding: 0.75rem 2rem;
		cursor: pointer;
		align-self: flex-start;
		transition: opacity 0.15s;
	}

	.submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.submit-btn:hover:not(:disabled) {
		opacity: 0.85;
	}

	.error {
		color: #ff4444;
		font-size: 0.8rem;
		margin: 0;
	}

	.success-screen {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		text-align: center;
		padding: 2rem;
	}

	.success-icon {
		font-size: 3rem;
		color: #983cba;
		margin: 0;
	}

	.success-screen h2 {
		font-size: 1.25rem;
		color: #fff;
		margin: 0;
	}

	.success-screen p {
		color: #888;
		font-size: 0.85rem;
		max-width: 400px;
		margin: 0;
	}

	.success-actions {
		display: flex;
		gap: 1.5rem;
		margin-top: 0.5rem;
		align-items: center;
	}

	.success-actions button {
		background: none;
		border: none;
		font-family: inherit;
		font-size: 0.85rem;
		color: #983cba;
		cursor: pointer;
		padding: 0;
	}

	.success-actions button:hover,
	.success-actions a:hover {
		text-decoration: underline;
	}

	.success-actions a {
		font-size: 0.85rem;
		color: #983cba;
		text-decoration: none;
	}
</style>
