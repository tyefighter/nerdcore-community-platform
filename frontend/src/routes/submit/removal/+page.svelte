<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';

	let artistName = $state('');
	let artistId: number | null = $state(null);
	let reason = $state('');
	let submitting = $state(false);
	let submitted = $state(false);
	let error = $state('');

	onMount(() => {
		const nameParam = $page.url.searchParams.get('name');
		const idParam = $page.url.searchParams.get('id');
		if (nameParam) artistName = nameParam;
		if (idParam) artistId = parseInt(idParam);
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		submitting = true;
		error = '';

		try {
			const res = await fetch(`${PUBLIC_API_BASE_URL}/submissions/removal`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					artist_name: artistName.trim(),
					...(artistId ? { artist_id: artistId } : {}),
					reason: reason.trim(),
					source: 'website'
				})
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
		artistName = '';
		reason = '';
		submitted = false;
		error = '';
	}
</script>

<svelte:head>
	<title>Request Removal · Nerd Music Community</title>
</svelte:head>

<div class="page">
	<header>
		<a href="/" class="back">← Home</a>
		<h1>Request Artist Removal</h1>
		<p class="subtitle">Ask a moderator to remove an artist from the directory.</p>
	</header>

	{#if submitted}
		<div class="success">
			<p class="success-msg">Request received. A moderator will review it shortly.</p>
			<div class="success-actions">
				<button onclick={reset}>Submit another</button>
				<a href="/">Back to home</a>
			</div>
		</div>
	{:else}
		<form onsubmit={handleSubmit}>
			<div class="field">
				<label for="artist_name">Artist name <span class="required">*</span></label>
				<input
					id="artist_name"
					type="text"
					bind:value={artistName}
					placeholder="Name as it appears in the directory"
					required
				/>
			</div>

			<div class="field">
				<label for="reason">Reason for removal <span class="optional">(optional)</span></label>
				<textarea
					id="reason"
					bind:value={reason}
					placeholder="Why should this artist be removed? (e.g. no longer active, duplicate listing, artist request, harmful content)"
					rows="5"
				></textarea>
			</div>

			{#if error}
				<p class="error">{error}</p>
			{/if}

			<button type="submit" disabled={submitting}>
				{submitting ? 'Submitting...' : 'Submit Removal Request'}
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

	form {
		max-width: 600px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	label {
		font-size: 0.75rem;
		color: #888;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.required { color: #983cba; }

	.optional {
		font-size: 0.7rem;
		color: #555;
		text-transform: none;
		letter-spacing: 0;
	}

	input, textarea {
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

	input:focus, textarea:focus {
		outline: none;
		border-color: #983cba;
	}

	input::placeholder, textarea::placeholder { color: #444; }

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
</style>
