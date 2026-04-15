<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	// mapbox-gl loaded via CDN in app.html to avoid import.meta bundling issues
	import { PUBLIC_MAPBOX_TOKEN, PUBLIC_API_BASE_URL } from '$env/static/public';

	interface Artist {
		id: number;
		display_name: string;
		role: string;
		city: string;
		state: string;
		region: string;
		operates_in: string;
		bio: string;
		link_soundcloud: string | null;
		link_twitter: string | null;
		link_website: string | null;
		tags: string[];
	}

	let mapContainer: HTMLDivElement;
	let map: mapboxgl.Map;
	let artists: Artist[] = $state([]);
	let selectedArtist: Artist | null = $state(null);
	let loading = $state(true);
	let error = $state('');

	// City coordinates for placing markers (approximate city centers)
	const cityCoordinates: Record<string, [number, number]> = {
		'Richmond, VA': [-77.4360, 37.5407],
		'Atlanta, GA': [-84.3880, 33.7490],
		'Chicago, IL': [-87.6298, 41.8781],
		'Nashville, TN': [-86.7816, 36.1627],
		'New York, NY': [-74.0060, 40.7128],
		'Los Angeles, CA': [-118.2437, 34.0522],
		'Seattle, WA': [-122.3321, 47.6062],
		'Austin, TX': [-97.7431, 30.2672],
		'Boston, MA': [-71.0589, 42.3601],
		'Portland, OR': [-122.6765, 45.5231],
	};

	function getCoordinates(city: string, state: string): [number, number] | null {
		const key = `${city}, ${state}`;
		return cityCoordinates[key] || null;
	}

	function getRoleColor(role: string): string {
		switch (role) {
			case 'vocalist': return '#39ff14';   // neon green
			case 'producer': return '#ff006e';   // neon pink
			case 'both':     return '#00f5ff';   // neon cyan
			default:         return '#ffffff';
		}
	}

	onMount(async () => {
		// Fetch artists from API
		try {
			const response = await fetch(`${PUBLIC_API_BASE_URL}/artists`);
			artists = await response.json();
		} catch (e) {
			error = 'Failed to load artists.';
			loading = false;
			return;
		}

		loading = false;

		// Initialize map
		mapboxgl.accessToken = PUBLIC_MAPBOX_TOKEN;
		map = new mapboxgl.Map({
			container: mapContainer,
			style: 'mapbox://styles/mapbox/dark-v11',
			center: [-95.7129, 37.0902],  // center of USA
			zoom: 3.5
		});

		map.addControl(new mapboxgl.NavigationControl());

		map.on('load', () => {
			// Add a marker for each artist we have coordinates for
			artists.forEach((artist) => {
				const coords = getCoordinates(artist.city, artist.state);
				if (!coords) return;

				// Create a colored dot marker
				const el = document.createElement('div');
				el.className = 'artist-marker';
				el.style.cssText = `
					width: 14px;
					height: 14px;
					border-radius: 50%;
					background-color: ${getRoleColor(artist.role)};
					border: 2px solid white;
					cursor: pointer;
					box-shadow: 0 0 6px ${getRoleColor(artist.role)};
				`;

				new mapboxgl.Marker(el)
					.setLngLat(coords)
					.addTo(map);

				el.addEventListener('click', () => {
					selectedArtist = artist;
				});
			});
		});
	});

	onDestroy(() => {
		if (map) map.remove();
	});
</script>

<div class="page">
	<header>
		<h1>Nerdcore Artists</h1>
		<div class="legend">
			<span class="dot vocalist"></span> Vocalist
			<span class="dot producer"></span> Producer
			<span class="dot both"></span> Both
		</div>
		<nav>
			<a href="/submit/artist">+ Submit Artist</a>
			<a href="/">Home</a>
		</nav>
	</header>

	<div class="layout">
		<!-- Map always rendered so Mapbox can bind to it -->
		<div class="map-container" bind:this={mapContainer}></div>
		{#if loading}
			<p class="map-status">Loading artists...</p>
		{:else if error}
			<p class="map-status error">{error}</p>
		{/if}

		<!-- Artist list / detail panel -->
		<div class="panel">
			{#if loading}
				<p class="status">Loading...</p>
			{:else if error}
				<p class="status error">{error}</p>
			{:else}
				{#if selectedArtist}
					<button class="back" onclick={() => selectedArtist = null}>← Back to list</button>
					<div class="artist-detail">
						<h2>{selectedArtist.display_name}</h2>
						<p class="role">{selectedArtist.role}</p>
						<p class="location">{selectedArtist.city}, {selectedArtist.state} · {selectedArtist.region}</p>
						{#if selectedArtist.bio}
							<p class="bio">{selectedArtist.bio}</p>
						{/if}
						{#if selectedArtist.tags.length > 0}
							<div class="tags">
								{#each selectedArtist.tags as tag}
									<span class="tag">{tag}</span>
								{/each}
							</div>
						{/if}
						<div class="links">
							{#if selectedArtist.link_soundcloud}
								<a href={selectedArtist.link_soundcloud} target="_blank">SoundCloud</a>
							{/if}
							{#if selectedArtist.link_twitter}
								<a href={selectedArtist.link_twitter} target="_blank">Twitter</a>
							{/if}
							{#if selectedArtist.link_website}
								<a href={selectedArtist.link_website} target="_blank">Website</a>
							{/if}
						</div>
					</div>
				{:else}
					<h2>Artists ({artists.length})</h2>
					<ul class="artist-list">
						{#each artists as artist}
							<li onclick={() => selectedArtist = artist}>
								<span class="dot" style="background:{getRoleColor(artist.role)}; box-shadow: 0 0 4px {getRoleColor(artist.role)}"></span>
								<div>
									<strong>{artist.display_name}</strong>
									<small>{artist.city}, {artist.state}</small>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			{/if}
		</div>
	</div>
</div>


<style>
	.page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #0a0a0a;
		color: #ffffff;
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

	.legend {
		display: flex;
		gap: 1rem;
		font-size: 0.75rem;
		color: #aaa;
		align-items: center;
		flex: 1;
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

	.layout {
		display: flex;
		flex: 1;
		overflow: hidden;
	}

	.map-container {
		flex: 1;
	}

	.panel {
		width: 300px;
		background: #111;
		border-left: 1px solid #222;
		overflow-y: auto;
		padding: 1rem;
	}

	.panel h2 {
		font-size: 0.9rem;
		color: #aaa;
		margin: 0 0 1rem;
	}

	.artist-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.artist-list li {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem;
		border-radius: 4px;
		cursor: pointer;
		border: 1px solid #222;
	}

	.artist-list li:hover {
		background: #1a1a1a;
		border-color: #39ff14;
	}

	.artist-list li div {
		display: flex;
		flex-direction: column;
	}

	.artist-list li strong {
		font-size: 0.85rem;
	}

	.artist-list li small {
		font-size: 0.7rem;
		color: #888;
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		display: inline-block;
		flex-shrink: 0;
	}

	.dot.vocalist { background: #39ff14; box-shadow: 0 0 4px #39ff14; }
	.dot.producer { background: #ff006e; box-shadow: 0 0 4px #ff006e; }
	.dot.both     { background: #00f5ff; box-shadow: 0 0 4px #00f5ff; }

	.artist-detail h2 {
		font-size: 1.1rem;
		color: #fff;
		margin: 0 0 0.25rem;
	}

	.role {
		font-size: 0.75rem;
		color: #39ff14;
		text-transform: uppercase;
		margin: 0 0 0.25rem;
	}

	.location {
		font-size: 0.75rem;
		color: #888;
		margin: 0 0 0.75rem;
	}

	.bio {
		font-size: 0.8rem;
		color: #ccc;
		line-height: 1.5;
		margin: 0 0 0.75rem;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-bottom: 0.75rem;
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
		flex-direction: column;
		gap: 0.4rem;
	}

	.links a {
		font-size: 0.8rem;
		color: #39ff14;
		text-decoration: none;
	}

	.links a:hover {
		text-decoration: underline;
	}

	.back {
		background: none;
		border: none;
		color: #888;
		font-size: 0.8rem;
		cursor: pointer;
		padding: 0;
		margin-bottom: 1rem;
		font-family: inherit;
	}

	.back:hover { color: #fff; }

	.status {
		padding: 2rem;
		text-align: center;
		color: #888;
	}

	.error { color: #ff006e; }

	.map-status {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: #888;
		font-family: monospace;
	}

	.map-container {
		position: relative;
	}
</style>
