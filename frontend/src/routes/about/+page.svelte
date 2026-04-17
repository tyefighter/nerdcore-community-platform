<svelte:head>
	<title>About · Nerd Music</title>
</svelte:head>

<div class="page">
	<header>
		<a href="/" class="back">← Home</a>
	</header>

	<main>
		<h1>About</h1>

		<p class="mission">
			Nerd Music is a community directory for the nerdcore and VGM scene. Find artists near you,
			discover local shows, and connect with performers across the country. Built to close
			information gaps and help the scene grow — one city at a time.
		</p>

		<div class="sections">
			<section>
				<h2>Artist Map</h2>
				<p>Browse nerdcore, chiptune, VGM, and visualist artists by location. Find people in your city or region to collaborate with, perform alongside, or just connect with.</p>
				<a href="/artists">Open the map →</a>
			</section>

			<section>
				<h2>Event Calendar</h2>
				<p>Upcoming shows, festivals, VPC rounds, and deadlines — all in one place. No more missing out because you didn't see a post in time.</p>
				<a href="/events">View the calendar →</a>
			</section>

			<section>
				<h2>Get Listed</h2>
				<p>All submissions go through a moderation queue before appearing publicly. Submit your artist profile or an upcoming event and a moderator will review it.</p>
				<div class="submit-links">
					<a href="/submit/artist">Submit an artist →</a>
					<a href="/submit/event">Submit an event →</a>
				</div>
			</section>

			<section>
				<h2>Get in Touch</h2>
				<p>Questions, corrections, or feedback — we want to hear it.</p>
				<a href="/contact">Contact →</a>
			</section>
		</div>
	</main>
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
		max-width: 680px;
		margin: 0 auto 2.5rem;
	}

	.back {
		font-size: 0.75rem;
		color: #555;
		text-decoration: none;
	}

	.back:hover { color: #aaa; }

	main {
		max-width: 680px;
		margin: 0 auto;
	}

	h1 {
		font-family: 'Press Start 2P', monospace;
		font-size: 1.2rem;
		color: #983cba;
		margin: 0 0 1.5rem;
		line-height: 1.6;
	}

	.mission {
		font-size: 0.9rem;
		color: #ccc;
		line-height: 1.8;
		margin: 0 0 3rem;
		padding-left: 1rem;
		border-left: 3px solid #983cba;
	}

	.sections {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
	}

	section {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}

	h2 {
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #555;
		margin: 0;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #1a1a1a;
	}

	section p {
		font-size: 0.82rem;
		color: #aaa;
		line-height: 1.7;
		margin: 0;
	}

	section a {
		font-size: 0.8rem;
		color: #983cba;
		text-decoration: none;
		align-self: flex-start;
	}

	section a:hover { text-decoration: underline; }

	.submit-links {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
</style>
