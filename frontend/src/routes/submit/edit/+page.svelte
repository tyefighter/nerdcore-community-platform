<script lang="ts">
	import { PUBLIC_API_BASE_URL } from '$env/static/public';

	const REGIONS = [
		'Northeast', 'Southeast', 'Midwest', 'Southwest', 'West Coast',
		'Pacific Northwest', 'Mountain West', 'Mid-Atlantic', 'South', 'Online / No Region'
	];

	const ALL_TAGS = [
		'nerdcore', 'hip-hop', 'chiptune', 'producer', 'vocalist',
		'duo', 'festival', 'local-show', 'vpc', 'online-event', 'deadline'
	];

	// Step 1: lookup
	let searchName = $state('');
	let searching = $state(false);
	let searchError = $state('');
	let searchResults: any[] = $state([]);

	// Step 2: edit form
	let artist: any = $state(null);
	let displayName = $state('');
	let role = $state('');
	let city = $state('');
	let state_ = $state('');
	let region = $state('');
	let bio = $state('');
	let linkSoundcloud = $state('');
	let linkBandcamp = $state('');
	let linkTwitter = $state('');
	let linkInstagram = $state('');
	let linkWebsite = $state('');
	let selectedTags: string[] = $state([]);
	let reason = $state('');

	let submitting = $state(false);
	let submitted = $state(false);
	let error = $state('');

	async function search(e: Event) {
		e.preventDefault();
		searching = true;
		searchError = '';
		searchResults = [];

		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/artists`);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			const q = searchName.trim().toLowerCase();
			searchResults = data.filter((a: any) =>
				a.display_name.toLowerCase().includes(q)
			);
			if (searchResults.length === 0) {
				searchError = 'No artists found matching that name.';
			}
		} catch (e: any) {
			searchError = 'Failed to search artists.';
		} finally {
			searching = false;
		}
	}

	function selectArtist(a: any) {
		artist = a;
		displayName = a.display_name || '';
		role = a.role || '';
		city = a.city || '';
		state_ = a.state || '';
		region = a.region || '';
		bio = a.bio || '';
		linkSoundcloud = a.link_soundcloud || '';
		linkBandcamp = a.link_bandcamp || '';
		linkTwitter = a.link_twitter || '';
		linkInstagram = a.link_instagram || '';
		linkWebsite = a.link_website || '';
		selectedTags = a.tags ? [...a.tags] : [];
		searchResults = [];
	}

	function toggleTag(tag: string) {
		if (selectedTags.includes(tag)) {
			selectedTags = selectedTags.filter(t => t !== tag);
		} else {
			selectedTags = [...selectedTags, tag];
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		submitting = true;
		error = '';

		try {
			const payload: any = {
				artist_id: artist.id,
				reason: reason.trim(),
				source: 'website'
			};

			// Only include fields that changed
			if (displayName.trim() !== (artist.display_name || '')) payload.display_name = displayName.trim();
			if (role !== (artist.role || '')) payload.role = role;
			if (city.trim() !== (artist.city || '')) payload.city = city.trim();
			if (state_.trim() !== (artist.state || '')) payload.state = state_.trim();
			if (region !== (artist.region || '')) payload.region = region;
			if (bio.trim() !== (artist.bio || '')) payload.bio = bio.trim();
			if (linkSoundcloud.trim() !== (artist.link_soundcloud || '')) payload.link_soundcloud = linkSoundcloud.trim();
			if (linkBandcamp.trim() !== (artist.link_bandcamp || '')) payload.link_bandcamp = linkBandcamp.trim();
			if (linkTwitter.trim() !== (artist.link_twitter || '')) payload.link_twitter = linkTwitter.trim();
			if (linkInstagram.trim() !== (artist.link_instagram || '')) payload.link_instagram = linkInstagram.trim();
			if (linkWebsite.trim() !== (artist.link_website || '')) payload.link_website = linkWebsite.trim();

			const origTags = (artist.tags || []).slice().sort().join(',');
			const newTags = selectedTags.slice().sort().join(',');
			if (origTags !== newTags) payload.tags = selectedTags;

			const res = await fetch(`${PUBLIC_API_BASE_URL}/submissions/edit`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || `HTTP ${res.status}`);
			}

			submitted = true;
		} catch (e: any) {
			error = e.message || 'Submission failed. Please try again.';
		} finally {
			submitting = false;
		}
	}

	function reset() {
		artist = null;
		searchName = '';
		submitted = false;
		error = '';
		reason = '';
	}
</script>

<svelte:head>
	<title>Request Edit · Nerd Music Community</title>
</svelte:head>

<div class="page">
	<header>
		<a href="/" class="back">← Home</a>
		<h1>Request Artist Edit</h1>
		<p class="subtitle">Suggest a correction or update to an artist's listing.</p>
	</header>

	{#if submitted}
		<div class="success">
			<p class="success-msg">Edit request received. A moderator will review it shortly.</p>
			<div class="success-actions">
				<button onclick={reset}>Submit another</button>
				<a href="/">Back to home</a>
			</div>
		</div>

	{:else if !artist}
		<!-- Step 1: Search -->
		<form onsubmit={search} class="search-form">
			<div class="field">
				<label for="search">Artist name <span class="required">*</span></label>
				<div class="search-row">
					<input
						id="search"
						type="text"
						bind:value={searchName}
						placeholder="Search by artist name"
						required
					/>
					<button type="submit" disabled={searching}>
						{searching ? 'Searching...' : 'Search'}
					</button>
				</div>
			</div>

			{#if searchError}
				<p class="error">{searchError}</p>
			{/if}
		</form>

		{#if searchResults.length > 0}
			<div class="results">
				{#each searchResults as result}
					<button class="result-card" onclick={() => selectArtist(result)}>
						<strong>{result.display_name}</strong>
						<span>{result.role} · {result.city || ''}{result.city && result.state ? ', ' : ''}{result.state || ''}</span>
					</button>
				{/each}
			</div>
		{/if}

	{:else}
		<!-- Step 2: Edit form -->
		<div class="selected-banner">
			Editing: <strong>{artist.display_name}</strong>
			<button class="change-artist" onclick={() => { artist = null; searchResults = []; }}>
				Change artist
			</button>
		</div>

		<form onsubmit={handleSubmit}>
			<div class="field">
				<label for="display_name">Artist / Stage Name</label>
				<input id="display_name" type="text" bind:value={displayName} />
			</div>

			<div class="field">
				<label>Role</label>
				<div class="radio-group">
					{#each ['vocalist', 'producer', 'both'] as r}
						<label class="radio">
							<input type="radio" bind:group={role} value={r} />
							{r}
						</label>
					{/each}
				</div>
			</div>

			<div class="field-row">
				<div class="field">
					<label for="city">City</label>
					<input id="city" type="text" bind:value={city} placeholder="Optional" />
				</div>
				<div class="field">
					<label for="state">State / Province</label>
					<input id="state" type="text" bind:value={state_} placeholder="Optional" />
				</div>
			</div>

			<div class="field">
				<label for="region">Region</label>
				<select id="region" bind:value={region}>
					<option value="">— Select region —</option>
					{#each REGIONS as r}
						<option value={r}>{r}</option>
					{/each}
				</select>
			</div>

			<div class="field">
				<label for="bio">Bio</label>
				<textarea id="bio" bind:value={bio} rows="4" placeholder="Short bio"></textarea>
			</div>

			<div class="field">
				<label>Tags</label>
				<div class="tag-group">
					{#each ALL_TAGS as tag}
						<button
							type="button"
							class="tag-btn"
							class:active={selectedTags.includes(tag)}
							onclick={() => toggleTag(tag)}
						>{tag}</button>
					{/each}
				</div>
			</div>

			<div class="field">
				<label>Links</label>
				<div class="links-group">
					<input type="url" bind:value={linkSoundcloud} placeholder="SoundCloud URL" />
					<input type="url" bind:value={linkBandcamp} placeholder="Bandcamp URL" />
					<input type="url" bind:value={linkTwitter} placeholder="Twitter / X URL" />
					<input type="url" bind:value={linkInstagram} placeholder="Instagram URL" />
					<input type="url" bind:value={linkWebsite} placeholder="Website URL" />
				</div>
			</div>

			<div class="field">
				<label for="reason">Reason for edit <span class="required">*</span></label>
				<textarea
					id="reason"
					bind:value={reason}
					placeholder="What needs to be updated and why?"
					rows="3"
					required
				></textarea>
			</div>

			{#if error}
				<p class="error">{error}</p>
			{/if}

			<button type="submit" disabled={submitting}>
				{submitting ? 'Submitting...' : 'Submit Edit Request'}
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
		padding: 2rem 1.5rem 4rem;
	}

	header {
		max-width: 600px;
		margin: 0 auto 2.5rem;
	}

	.back {
		font-size: 0.75rem;
		color: #555;
		text-decoration: none;
		display: inline-block;
		margin-bottom: 1.5rem;
	}

	.back:hover { color: #aaa; }

	h1 {
		font-size: 1.4rem;
		margin: 0 0 0.5rem;
		color: #983cba;
	}

	.subtitle {
		font-size: 0.8rem;
		color: #666;
		margin: 0;
	}

	.search-form, form {
		max-width: 600px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.search-row {
		display: flex;
		gap: 0.75rem;
	}

	.search-row input { flex: 1; }

	.search-row button {
		background: #983cba;
		color: #fff;
		border: none;
		font-family: inherit;
		font-size: 0.8rem;
		padding: 0.65rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		white-space: nowrap;
	}

	.search-row button:disabled { opacity: 0.4; cursor: not-allowed; }

	.results {
		max-width: 600px;
		margin: 1rem auto 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.result-card {
		background: #111;
		border: 1px solid #2a2a2a;
		border-radius: 4px;
		padding: 0.75rem 1rem;
		text-align: left;
		cursor: pointer;
		font-family: inherit;
		color: #fff;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.result-card:hover { border-color: #983cba; }

	.result-card strong { font-size: 0.85rem; }

	.result-card span { font-size: 0.75rem; color: #888; }

	.selected-banner {
		max-width: 600px;
		margin: 0 auto 1.5rem;
		font-size: 0.8rem;
		color: #888;
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.selected-banner strong { color: #fff; }

	.change-artist {
		background: none;
		border: 1px solid #333;
		color: #666;
		font-family: inherit;
		font-size: 0.75rem;
		padding: 0.2rem 0.6rem;
		border-radius: 3px;
		cursor: pointer;
	}

	.change-artist:hover { color: #aaa; border-color: #555; }

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.field-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	label {
		font-size: 0.75rem;
		color: #888;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	label.radio {
		font-size: 0.8rem;
		text-transform: none;
		letter-spacing: 0;
		color: #ccc;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		cursor: pointer;
	}

	.required { color: #983cba; }

	input[type="text"],
	input[type="url"],
	textarea,
	select {
		background: #111;
		border: 1px solid #2a2a2a;
		color: #fff;
		font-family: inherit;
		font-size: 0.85rem;
		padding: 0.65rem 0.75rem;
		border-radius: 4px;
		width: 100%;
		box-sizing: border-box;
		resize: vertical;
	}

	input:focus, textarea:focus, select:focus {
		outline: none;
		border-color: #983cba;
	}

	input::placeholder, textarea::placeholder { color: #444; }

	select option { background: #111; }

	.radio-group {
		display: flex;
		gap: 1.5rem;
	}

	.tag-group {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.tag-btn {
		font-family: inherit;
		font-size: 0.7rem;
		padding: 0.25rem 0.6rem;
		border-radius: 3px;
		border: 1px solid #2a2a2a;
		background: #111;
		color: #666;
		cursor: pointer;
	}

	.tag-btn.active {
		border-color: #983cba;
		color: #983cba;
		background: #1a0e22;
	}

	.links-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	button[type="submit"] {
		background: #983cba;
		color: #fff;
		border: none;
		font-family: inherit;
		font-size: 0.85rem;
		font-weight: bold;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		align-self: flex-start;
	}

	button[type="submit"]:hover:not(:disabled) { opacity: 0.85; }
	button[type="submit"]:disabled { opacity: 0.4; cursor: not-allowed; }

	.error {
		font-size: 0.8rem;
		color: #ff006e;
		margin: 0;
	}

	.success {
		max-width: 600px;
		margin: 0 auto;
		text-align: center;
		padding: 3rem 0;
	}

	.success-msg {
		font-size: 0.9rem;
		color: #39ff14;
		margin-bottom: 2rem;
	}

	.success-actions {
		display: flex;
		gap: 1.5rem;
		justify-content: center;
		align-items: center;
	}

	.success-actions button {
		background: #983cba;
		color: #fff;
		border: none;
		font-family: inherit;
		font-size: 0.8rem;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
	}

	.success-actions a {
		font-size: 0.8rem;
		color: #555;
		text-decoration: none;
	}

	.success-actions a:hover { color: #aaa; }

	@media (max-width: 600px) {
		.field-row { grid-template-columns: 1fr; }
		.radio-group { flex-wrap: wrap; gap: 0.75rem; }
	}
</style>
