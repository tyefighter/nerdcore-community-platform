<script lang="ts">
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

	const ROLES = ['vocalist', 'producer', 'band', 'visualist', 'other'];

	const AVAILABLE_TAGS = ['nerdcore', 'chiptune', 'vgm', 'visualist', 'other'];

	const COUNTRIES = [
		'United States', 'United Kingdom', 'Canada', 'Australia', 'New Zealand',
		'Ireland', 'Germany', 'France', 'Netherlands', 'Sweden', 'Norway', 'Denmark',
		'Finland', 'Belgium', 'Switzerland', 'Austria', 'Spain', 'Italy', 'Portugal',
		'Poland', 'Czech Republic', 'Hungary', 'Romania', 'Greece', 'Russia',
		'Japan', 'South Korea', 'China', 'India', 'Singapore', 'Philippines',
		'Brazil', 'Mexico', 'Argentina', 'Colombia', 'Chile', 'Peru',
		'South Africa', 'Nigeria', 'Kenya', 'Egypt',
		'Israel', 'Turkey', 'UAE', 'Saudi Arabia',
		'Other'
	];

	const LINK_PLATFORMS = [
		{ value: 'soundcloud', label: 'SoundCloud',     placeholder: 'soundcloud.com/yourname' },
		{ value: 'bandcamp',   label: 'Bandcamp',       placeholder: 'yourname.bandcamp.com' },
		{ value: 'twitter',    label: 'Twitter / X',    placeholder: 'twitter.com/yourname' },
		{ value: 'instagram',  label: 'Instagram',      placeholder: 'instagram.com/yourname' },
		{ value: 'website',    label: 'Website',        placeholder: 'yoursite.com' },
		{ value: 'facebook',   label: 'Facebook',       placeholder: 'facebook.com/yourpage' },
		{ value: 'bluesky',    label: 'BlueSky',        placeholder: 'bsky.app/profile/yourname' },
		{ value: 'mastodon',   label: 'Mastodon',       placeholder: 'mastodon.social/@yourname' },
		{ value: 'twitch',     label: 'Twitch',         placeholder: 'twitch.tv/yourname' },
		{ value: 'linktree',   label: 'Linktree',       placeholder: 'linktr.ee/yourname' },
		{ value: 'patreon',    label: 'Patreon',        placeholder: 'patreon.com/yourname' },
		{ value: 'youtube',    label: 'YouTube',        placeholder: 'youtube.com/@yourname' },
		{ value: 'discord',    label: 'Discord',        placeholder: 'discord.gg/yourinvite' },
		{ value: 'other',      label: 'Other',          placeholder: 'paste your URL here' }
	];

	interface LinkEntry { platform: string; url: string; label: string; }

	let display_name = $state('');
	let selectedRoles: string[] = $state([]);
	let city = $state('');
	let state_val = $state('');
	let country = $state('');
	let region = $state('');
	let bio = $state('');
	let links: LinkEntry[] = $state([{ platform: '', url: '', label: '' }]);
	let selectedTags: string[] = $state([]);
	let suggested_tag = $state('');

	let submitting = $state(false);
	let success = $state(false);
	let error = $state('');

	function toggleRole(role: string) {
		if (selectedRoles.includes(role)) {
			selectedRoles = selectedRoles.filter((r) => r !== role);
		} else {
			selectedRoles = [...selectedRoles, role];
		}
	}

	function toggleTag(tag: string) {
		if (selectedTags.includes(tag)) {
			selectedTags = selectedTags.filter((t) => t !== tag);
		} else {
			selectedTags = [...selectedTags, tag];
		}
	}

	function normalizeUrl(url: string): string | undefined {
		const trimmed = url.trim();
		if (!trimmed) return undefined;
		if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
		return `https://${trimmed}`;
	}

	function addLink() {
		links = [...links, { platform: '', url: '', label: '' }];
	}

	function removeLink(idx: number) {
		links = links.filter((_, i) => i !== idx);
		if (links.length === 0) addLink();
	}

	// Platforms already chosen on other rows — used to disable duplicates in dropdowns.
	// 'other' can be picked multiple times since each one is a custom platform.
	function platformTaken(platform: string, currentIdx: number): boolean {
		if (!platform || platform === 'other') return false;
		return links.some((l, i) => i !== currentIdx && l.platform === platform);
	}

	function buildLinkPayload() {
		const payload: Record<string, string | undefined> = {};
		const others: { label: string; url: string }[] = [];
		for (const entry of links) {
			const url = normalizeUrl(entry.url);
			if (!url || !entry.platform) continue;
			if (entry.platform === 'other') {
				const label = entry.label.trim();
				if (label) others.push({ label, url });
			} else {
				payload[`link_${entry.platform}`] = url;
			}
		}
		return { ...payload, links_other: others.length > 0 ? others : undefined };
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (selectedTags.length === 0) {
			error = 'Please select at least one tag.';
			return;
		}
		submitting = true;
		error = '';

		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/submissions/artist`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					display_name,
					roles: selectedRoles.length > 0 ? selectedRoles : undefined,
					city,
					state: state_val,
					country: country || undefined,
					region: region || undefined,
					bio: bio || undefined,
					...buildLinkPayload(),
					tags: selectedTags.length > 0 ? selectedTags : undefined,
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
	<title>Submit an Artist · Nerd Music</title>
</svelte:head>

<div class="page">
	<header>
		<h1>Submit an Artist</h1>
		<nav>
			<a href="/artists">← Artist Map</a>
			<a href="/contact">Contact</a>
				<a href="/">Home</a>
				<a href="https://ko-fi.com/nerdmusicmap" target="_blank" class="kofi">Support ♥</a>
		</nav>
	</header>

	{#if success}
		<div class="success-screen">
			<p class="success-icon">✓</p>
			<h2>Submission received</h2>
			<p>Your artist profile is in the moderation queue. A moderator will review it before it appears publicly.</p>
			<div class="success-actions">
				<a href="/submit/artist" onclick={() => { success = false; display_name = ''; selectedRoles = []; city = ''; state_val = ''; country = ''; region = ''; bio = ''; links = [{ platform: '', url: '', label: '' }]; selectedTags = []; suggested_tag = ''; }}>Submit another</a>
				<a href="/artists">View artist map</a>
			</div>
		</div>
	{:else}
		<form onsubmit={handleSubmit}>
			<p class="note">All submissions go into a moderation queue and won't appear publicly until approved.</p>

			<section>
				<h2>Required</h2>

				<label>
					Artist / Stage Name *
					<input type="text" bind:value={display_name} required placeholder="MC Example" />
				</label>

			</section>

			<section>
				<h2>Optional</h2>

				<div class="row">
					<label>
						City
						<input type="text" bind:value={city} placeholder="London" />
					</label>
					<label>
						State / Province / Region
						<input type="text" bind:value={state_val} placeholder="e.g. VA, Ontario, West Midlands" />
					</label>
				</div>

				<label>
					Country
					<select bind:value={country}>
						<option value="">— Select a country (optional) —</option>
						{#each COUNTRIES as c}
							<option value={c}>{c}</option>
						{/each}
					</select>
				</label>

				<label>
					Bio
					<textarea bind:value={bio} rows={4} placeholder="Tell the community about yourself..."></textarea>
				</label>

				<div class="links-section">
					<p class="tag-label">Links <span class="optional">(optional — add as many as you'd like)</span></p>
					{#each links as entry, idx}
						<div class="link-row">
							<select bind:value={entry.platform} class="link-platform">
								<option value="">— pick a platform —</option>
								{#each LINK_PLATFORMS as p}
									<option value={p.value} disabled={platformTaken(p.value, idx)}>{p.label}</option>
								{/each}
							</select>
							{#if entry.platform === 'other'}
								<input type="text" bind:value={entry.label} class="link-label" placeholder="Label (e.g. YouTube, Patreon)" maxlength={50} />
							{/if}
							<input
								type="text"
								bind:value={entry.url}
								class="link-url"
								placeholder={LINK_PLATFORMS.find((p) => p.value === entry.platform)?.placeholder ?? 'URL'}
							/>
							<button type="button" class="link-remove" onclick={() => removeLink(idx)} aria-label="Remove link">✕</button>
						</div>
					{/each}
					<button type="button" class="link-add" onclick={addLink}>+ Add another link</button>
				</div>

				<div class="tag-section">
					<p class="tag-label">Role <span class="optional">(optional — select all that apply)</span></p>
					<div class="tags">
						{#each ROLES as r}
							<button
								type="button"
								class="tag"
								class:active={selectedRoles.includes(r)}
								onclick={() => toggleRole(r)}
							>{r}</button>
						{/each}
					</div>
				</div>

				<div class="tag-section">
					<p class="tag-label">Tags <span class="required">*</span></p>
					<p class="tag-note">Please choose a tag that best fits your music. Untagged artists will appear under "Other" on the map and in filters.</p>
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
						Don't see your genre? Suggest one <span class="optional">(optional)</span>
						<input type="text" bind:value={suggested_tag} placeholder="e.g. comedy rap" maxlength={50} />
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
	}

	input[type='text']:focus,
	input[type='url']:focus,
	select:focus,
	textarea:focus {
		border-color: #983cba;
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
	}

	.row label:first-child {
		flex: 1;
	}

	.optional {
		font-size: 0.7rem;
		color: #555;
		font-weight: normal;
	}

	.tag-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.links-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.link-row {
		display: grid;
		grid-template-columns: 140px 1fr auto;
		gap: 0.5rem;
		align-items: center;
	}

	.link-row:has(.link-label) {
		grid-template-columns: 140px 160px 1fr auto;
	}

	.link-platform,
	.link-label,
	.link-url {
		font-size: 0.85rem;
		padding: 0.5rem 0.6rem;
	}

	.link-remove {
		background: none;
		border: 1px solid #2a2a2a;
		color: #666;
		font-family: inherit;
		font-size: 0.8rem;
		padding: 0.4rem 0.65rem;
		border-radius: 4px;
		cursor: pointer;
	}

	.link-remove:hover {
		border-color: #ff006e;
		color: #ff006e;
	}

	.link-add {
		background: none;
		border: 1px dashed #2a2a2a;
		color: #888;
		font-family: inherit;
		font-size: 0.8rem;
		padding: 0.55rem;
		border-radius: 4px;
		cursor: pointer;
		align-self: flex-start;
		margin-top: 0.25rem;
	}

	.link-add:hover {
		border-color: #983cba;
		color: #983cba;
	}

	@media (max-width: 600px) {
		.link-row {
			grid-template-columns: 1fr auto;
		}
		.link-row:has(.link-label) {
			grid-template-columns: 1fr auto;
		}
		.link-platform, .link-label, .link-url {
			grid-column: 1 / -1;
		}
		.link-remove {
			grid-column: 2;
			grid-row: 1;
		}
		.link-platform {
			grid-column: 1;
		}
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

	.tag-note {
		font-size: 0.72rem;
		color: #666;
		margin: 0;
		line-height: 1.5;
	}

	.required {
		color: #983cba;
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
	}

	.success-actions a {
		font-size: 0.85rem;
		color: #983cba;
		text-decoration: none;
	}

	.success-actions a:hover {
		text-decoration: underline;
	}
</style>
