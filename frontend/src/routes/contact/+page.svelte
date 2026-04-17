<script lang="ts">
	import emailjs from '@emailjs/browser';

	const SERVICE_ID = 'service_enj058s';
	const TEMPLATE_ID = 'template_rajma7g';
	const PUBLIC_KEY = 'jPq4cADxA2YzbMNuV';

	let name = $state('');
	let email = $state('');
	let message = $state('');
	let submitting = $state(false);
	let success = $state(false);
	let error = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		submitting = true;
		error = '';

		try {
			await emailjs.send(
				SERVICE_ID,
				TEMPLATE_ID,
				{
					name: name.trim(),
					email: email.trim(),
					message: message.trim(),
					time: new Date().toLocaleString()
				},
				PUBLIC_KEY
			);
			success = true;
		} catch (err) {
			console.error(err);
			error = 'Failed to send message. Please try again.';
		} finally {
			submitting = false;
		}
	}

	function reset() {
		name = '';
		email = '';
		message = '';
		success = false;
		error = '';
	}
</script>

<svelte:head>
	<title>Contact · Nerd Music Space</title>
</svelte:head>

<div class="page">
	<header>
		<h1>Contact Us</h1>
		<nav>
			<a href="/artists">Artist Map</a>
			<a href="/events">Events</a>
			<a href="/">Home</a>
			<a href="https://ko-fi.com/nerdmusicmap" target="_blank" class="kofi">Support ♥</a>
		</nav>
	</header>

	<div class="content">
		{#if success}
			<div class="success-screen">
				<p class="success-icon">✓</p>
				<h2>Message sent</h2>
				<p>Thanks for reaching out. We'll get back to you if a reply is needed.</p>
				<button onclick={reset}>Send another</button>
			</div>
		{:else}
			<p class="intro">Have a question, suggestion, or just want to say hi? Drop us a message.</p>

			<form onsubmit={handleSubmit}>
				<label>
					Name <span class="required">*</span>
					<input type="text" bind:value={name} required placeholder="Your name or handle" />
				</label>

				<label>
					Email <span class="optional">(so we can reply)</span>
					<input type="email" bind:value={email} placeholder="you@example.com" />
				</label>

				<label>
					Message <span class="required">*</span>
					<textarea bind:value={message} required rows={6} placeholder="What's on your mind?"></textarea>
				</label>

				{#if error}
					<p class="error">{error}</p>
				{/if}

				<button type="submit" disabled={submitting}>
					{submitting ? 'Sending...' : 'Send Message'}
				</button>
			</form>
		{/if}
	</div>
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

	h1 {
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

	.content {
		max-width: 560px;
		width: 100%;
		margin: 2.5rem auto;
		padding: 0 1.5rem 4rem;
	}

	.intro {
		font-size: 0.85rem;
		color: #666;
		margin: 0 0 2rem;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		font-size: 0.8rem;
		color: #aaa;
	}

	input, textarea {
		background: #111;
		border: 1px solid #333;
		border-radius: 4px;
		color: #fff;
		font-family: inherit;
		font-size: 0.85rem;
		padding: 0.5rem 0.75rem;
		outline: none;
		transition: border-color 0.15s;
		width: 100%;
		box-sizing: border-box;
	}

	input:focus, textarea:focus {
		border-color: #983cba;
	}

	input::placeholder, textarea::placeholder { color: #444; }

	textarea { resize: vertical; }

	.required { color: #983cba; }

	.optional {
		font-size: 0.7rem;
		color: #555;
		font-weight: normal;
	}

	.error {
		font-size: 0.8rem;
		color: #ff4444;
		margin: 0;
	}

	button[type='submit'] {
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

	button[type='submit']:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	button[type='submit']:hover:not(:disabled) {
		opacity: 0.85;
	}

	.success-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 1rem;
		padding: 4rem 0;
	}

	.success-icon {
		font-size: 3rem;
		color: #983cba;
		margin: 0;
	}

	.success-screen h2 {
		font-size: 1.25rem;
		margin: 0;
	}

	.success-screen p {
		font-size: 0.85rem;
		color: #888;
		margin: 0;
		max-width: 360px;
	}

	.success-screen button {
		background: none;
		border: none;
		font-family: inherit;
		font-size: 0.85rem;
		color: #983cba;
		cursor: pointer;
		padding: 0;
		margin-top: 0.5rem;
	}

	.success-screen button:hover {
		text-decoration: underline;
	}
</style>
