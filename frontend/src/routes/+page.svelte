<script lang="ts">
</script>

<div class="home">
	<h1>Nerd Music Community</h1>
	<p>A directory of nerd music artists and events across the country.</p>
	<nav>
		<a href="/artists">Artist Map</a>
		<a href="/events">Event Calendar</a>
		<a href="/submit/artist">Submit Artist</a>
		<a href="/submit/event">Submit Event</a>
	</nav>
</div>

<style>
	.home {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: #0a0a0a;
		color: #fff;
		font-family: monospace;
		text-align: center;
		gap: 1rem;
	}

	h1 {
		font-size: 2rem;
		color: #983cba;
		margin: 0;
	}

	p {
		color: #888;
		margin: 0;
	}

	nav {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem;
		margin-top: 1rem;
	}

	a {
		color: #00f5ff;
		text-decoration: none;
		font-size: 1rem;
		border: 1px solid #00f5ff;
		padding: 0.5rem 1.5rem;
		border-radius: 4px;
	}

	a:hover {
		background: #00f5ff;
		color: #000;
	}
</style>
