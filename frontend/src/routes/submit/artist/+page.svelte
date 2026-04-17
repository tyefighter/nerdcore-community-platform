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

	const AVAILABLE_TAGS = ['nerdcore', 'chiptune', 'vgm', 'visualist', 'hip-hop', 'producer', 'vocalist', 'duo'];

	let display_name = $state('');
	let selectedRoles: string[] = $state([]);
	let city = $state('');
	let state_val = $state('');
	let region = $state('');
	let bio = $state('');
	let link_soundcloud = $state('');
	let link_bandcamp = $state('');
	let link_twitter = $state('');
	let link_instagram = $state('');
	let link_website = $state('');
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

	async function handleSubmit(e: Event) {
		e.preventDefault();
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
					region: region || undefined,
					bio: bio || undefined,
					link_soundcloud: link_soundcloud || undefined,
					link_bandcamp: link_bandcamp || undefined,
					link_twitter: link_twitter || undefined,
					link_instagram: link_instagram || undefined,
					link_website: link_website || undefined,
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
				<a href="/submit/artist" onclick={() => { success = false; display_name = ''; selectedRoles = []; city = ''; state_val = ''; region = ''; bio = ''; link_soundcloud = ''; link_bandcamp = ''; link_twitter = ''; link_instagram = ''; link_website = ''; selectedTags = []; suggested_tag = ''; }}>Submit another</a>
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

				<div class="row">
					<label>
						City *
						<input type="text" bind:value={city} required placeholder="Richmond" />
					</label>
					<label>
						State *
						<input type="text" bind:value={state_val} required placeholder="VA" maxlength={2} class="short" />
					</label>
				</div>
			</section>

			<section>
				<h2>Optional</h2>

				<label>
					Bio
					<textarea bind:value={bio} rows={4} placeholder="Tell the community about yourself..."></textarea>
				</label>

				<label>
					SoundCloud URL
					<input type="url" bind:value={link_soundcloud} placeholder="https://soundcloud.com/..." />
				</label>

				<label>
					Bandcamp URL
					<input type="url" bind:value={link_bandcamp} placeholder="https://yourname.bandcamp.com" />
				</label>

				<label>
					Twitter / X URL
					<input type="url" bind:value={link_twitter} placeholder="https://twitter.com/..." />
				</label>

				<label>
					Instagram URL
					<input type="url" bind:value={link_instagram} placeholder="https://instagram.com/..." />
				</label>

				<label>
					Website URL
					<input type="url" bind:value={link_website} placeholder="https://..." />
				</label>

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
