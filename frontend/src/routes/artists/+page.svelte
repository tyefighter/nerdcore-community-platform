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
		link_bandcamp: string | null;
		link_twitter: string | null;
		link_instagram: string | null;
		link_website: string | null;
		lat: number | null;
		lng: number | null;
		tags: string[];
	}

	let mapContainer: HTMLDivElement;
	let map: mapboxgl.Map;
	let artists: Artist[] = $state([]);
	let selectedArtist: Artist | null = $state(null);
	let loading = $state(true);
	let error = $state('');
	let activeFilter: string | null = $state(null);
	let filterOpen = $state(false);
	let navOpen = $state(false);
	let viewportBounds: mapboxgl.LngLatBounds | null = $state(null);

	const GENRES = ['Nerdcore', 'VGM', 'Chiptune', 'Visualist', 'Other'];

	// Map marker elements keyed by artist id so we can show/hide them
	const markerElements: Map<number, HTMLElement> = new Map();

	function matchesTagFilter(a: Artist): boolean {
		if (!activeFilter) return true;
		if (activeFilter === 'other') return !a.tags.some(t => ['nerdcore','vgm','chiptune','visualist'].includes(t));
		return a.tags.includes(activeFilter);
	}

	let filteredArtists = $derived(
		artists.filter(a => {
			if (!matchesTagFilter(a)) return false;
			if (!viewportBounds) return true;
			if (!a.lat || !a.lng) return false;
			return viewportBounds.contains([a.lng, a.lat]);
		})
	);

	// Artists with no coords, shown below the main list when viewport filtering is active
	let noLocationArtists = $derived(
		viewportBounds
			? artists.filter(a => matchesTagFilter(a) && (!a.lat || !a.lng))
			: []
	);

	function setFilter(genre: string) {
		activeFilter = activeFilter === genre.toLowerCase() ? null : genre.toLowerCase();
		filterOpen = false;
		// Show/hide markers to match filter
		for (const [id, el] of markerElements) {
			const artist = artists.find(a => a.id === id);
			if (!artist) continue;
			const visible = !activeFilter || filteredArtists.includes(artist);
			el.style.display = visible ? 'block' : 'none';
		}
	}

	const GENRE_COLORS: Record<string, string> = {
		'nerdcore':  '#39ff14',   // neon green
		'vgm':       '#ff9900',   // orange
		'chiptune':  '#00f5ff',   // cyan
		'visualist': '#983cba',   // purple
		'other':     '#ffe566',   // yellow
	};

	function getGenreColor(tags: string[]): string {
		for (const tag of tags) {
			if (GENRE_COLORS[tag]) return GENRE_COLORS[tag];
		}
		return GENRE_COLORS['other'];
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

		map.on('moveend', () => {
			viewportBounds = map.getBounds();
		});

		map.on('load', () => {
			viewportBounds = map.getBounds();
			// Add a marker for each artist we have coordinates for
			artists.forEach((artist) => {
				if (!artist.lat || !artist.lng) return;
				const coords: [number, number] = [artist.lng, artist.lat];

				// Create a colored dot marker
				const color = getGenreColor(artist.tags);
				const el = document.createElement('div');
				el.className = 'artist-marker';
				el.style.cssText = `
					width: 14px;
					height: 14px;
					border-radius: 50%;
					background-color: ${color};
					border: 2px solid white;
					cursor: pointer;
					box-shadow: 0 0 6px ${color};
				`;

				new mapboxgl.Marker(el)
					.setLngLat(coords)
					.addTo(map);

				markerElements.set(artist.id, el);

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

<svelte:head>
	<title>Artist Map · Nerd Music</title>
</svelte:head>

<div class="page">
	<header>
		<div class="header-top">
			<a href="/" class="home-link"><h1>Nerd Music</h1></a>
			<nav class:open={navOpen}>
				<a href="/events" onclick={() => navOpen = false}>Events</a>
				<a href="/submit/artist" onclick={() => navOpen = false}>Submit Artist</a>
				<a href="/submit/event" onclick={() => navOpen = false}>Submit Event</a>
				<a href="/contact" onclick={() => navOpen = false}>Contact</a>
				<a href="https://ko-fi.com/nerdmusicmap" target="_blank" class="kofi" onclick={() => navOpen = false}>Support ♥</a>
			</nav>
			<button class="hamburger" onclick={() => navOpen = !navOpen} aria-label="Menu">
				{navOpen ? '✕' : '☰'}
			</button>
		</div>
		<div class="legend">
			<span class="legend-item"><span class="dot nerdcore"></span>Nerdcore</span>
			<span class="legend-item"><span class="dot vgm"></span>VGM</span>
			<span class="legend-item"><span class="dot chiptune"></span>Chiptune</span>
			<span class="legend-item"><span class="dot visualist"></span>Visualist</span>
			<span class="legend-item"><span class="dot other"></span>Other</span>
		</div>
	</header>

	<div class="layout">
		<!-- Map always rendered so Mapbox can bind to it -->
		<div class="map-container" bind:this={mapContainer}></div>
		{#if loading}
			<p class="map-status">Loading artists...</p>
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
						<div class="mod-links">
							<a href="/submit/edit?id={selectedArtist.id}">Request edit</a>
							<a href="/submit/removal?name={encodeURIComponent(selectedArtist.display_name)}&id={selectedArtist.id}">Request removal</a>
						</div>
					</div>
				{:else}
					<div class="panel-header">
						<span>Artists ({filteredArtists.length}{noLocationArtists.length > 0 ? ` + ${noLocationArtists.length} unlisted` : ''})</span>
						<div class="filter-wrap">
							<button class="filter-btn" class:active={activeFilter} onclick={() => filterOpen = !filterOpen}>
								{activeFilter ? activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1) : 'Filter'} ▾
							</button>
							{#if filterOpen}
								<div class="filter-dropdown">
									{#if activeFilter}
										<button class="filter-option clear" onclick={() => setFilter(activeFilter!.charAt(0).toUpperCase() + activeFilter!.slice(1))}>
											✕ Clear filter
										</button>
									{/if}
									{#each GENRES as genre}
										<button
											class="filter-option"
											class:selected={activeFilter === genre.toLowerCase()}
											onclick={() => setFilter(genre)}
										>
											<span class="dot {genre.toLowerCase()}"></span>
											{genre}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</div>
					<ul class="artist-list">
						{#each filteredArtists as artist}
							<li onclick={() => selectedArtist = artist}>
								<span class="dot" style="background:{getGenreColor(artist.tags)}; box-shadow: 0 0 4px {getGenreColor(artist.tags)}"></span>
								<div>
									<strong>{artist.display_name}</strong>
									<small>{artist.city}, {artist.state}</small>
								</div>
							</li>
						{/each}
					</ul>
					{#if noLocationArtists.length > 0}
						<p class="no-location-label">Not on map</p>
						<ul class="artist-list no-location">
							{#each noLocationArtists as artist}
								<li onclick={() => selectedArtist = artist}>
									<span class="dot" style="background:{getGenreColor(artist.tags)}; box-shadow: 0 0 4px {getGenreColor(artist.tags)}"></span>
									<div>
										<strong>{artist.display_name}</strong>
										<small>{artist.city}, {artist.state}</small>
									</div>
								</li>
							{/each}
						</ul>
					{/if}
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
		flex-direction: column;
		padding: 0.75rem 1.5rem;
		border-bottom: 1px solid #222;
		gap: 0.5rem;
		position: relative;
	}

	.header-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}

	h1 {
		font-size: 1.25rem;
		margin: 0;
		color: #983cba;
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		font-size: 0.75rem;
		color: #aaa;
		align-items: center;
	}

	.home-link {
		text-decoration: none;
	}

	.home-link:hover h1 {
		opacity: 0.8;
	}

	nav {
		display: flex;
		gap: 1.5rem;
	}

	.hamburger {
		display: none;
		background: none;
		border: none;
		color: #888;
		font-size: 1.2rem;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
		line-height: 1;
	}

	.hamburger:hover { color: #fff; }

	nav a {
		font-size: 0.8rem;
		color: #888;
		text-decoration: none;
	}

	nav a:hover { color: #fff; }
	nav a.kofi { color: #ff5e5b; }
	nav a.kofi:hover { color: #ff8a88; }

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

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
		font-size: 0.9rem;
		color: #aaa;
	}

	.filter-wrap {
		position: relative;
	}

	.filter-btn {
		background: #1a1a1a;
		border: 1px solid #333;
		color: #aaa;
		font-family: inherit;
		font-size: 0.72rem;
		padding: 0.3rem 0.65rem;
		border-radius: 4px;
		cursor: pointer;
	}

	.filter-btn:hover { border-color: #555; color: #fff; }

	.filter-btn.active {
		border-color: #983cba;
		color: #983cba;
	}

	.filter-dropdown {
		position: absolute;
		right: 0;
		top: calc(100% + 4px);
		background: #1a1a1a;
		border: 1px solid #333;
		border-radius: 6px;
		padding: 0.4rem;
		z-index: 10;
		min-width: 140px;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.filter-option {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		background: none;
		border: none;
		color: #aaa;
		font-family: inherit;
		font-size: 0.8rem;
		padding: 0.45rem 0.6rem;
		border-radius: 4px;
		cursor: pointer;
		text-align: left;
		width: 100%;
	}

	.filter-option:hover { background: #222; color: #fff; }

	.filter-option.selected { color: #fff; background: #2a1a35; }

	.filter-option.clear { color: #666; font-size: 0.72rem; }
	.filter-option.clear:hover { color: #ff006e; background: none; }

	.artist-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.no-location-label {
		font-size: 0.65rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #444;
		margin: 1rem 0 0.4rem;
		padding-top: 0.75rem;
		border-top: 1px solid #1a1a1a;
	}

	.artist-list.no-location li {
		opacity: 0.5;
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

	.dot.nerdcore  { background: #39ff14; box-shadow: 0 0 4px #39ff14; }
	.dot.vgm       { background: #ff9900; box-shadow: 0 0 4px #ff9900; }
	.dot.chiptune  { background: #00f5ff; box-shadow: 0 0 4px #00f5ff; }
	.dot.visualist { background: #983cba; box-shadow: 0 0 4px #983cba; }
	.dot.other     { background: #ffe566; box-shadow: 0 0 4px #ffe566; }

	.legend-item {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}

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

	.mod-links {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid #1e1e1e;
	}

	.mod-links a {
		font-size: 0.7rem;
		color: #444;
		text-decoration: none;
	}

	.mod-links a:hover { color: #888; }

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

	@media (max-width: 768px) {
		header {
			padding: 0.75rem 1rem;
		}

		h1 {
			font-size: 1rem;
		}

		.legend {
			font-size: 0.7rem;
			gap: 0.5rem;
		}

		.hamburger {
			display: block;
		}

		nav {
			display: none;
			position: absolute;
			top: 100%;
			right: 0;
			left: 0;
			background: #0f0f0f;
			border-bottom: 1px solid #222;
			flex-direction: column;
			gap: 0;
			z-index: 100;
		}

		nav.open {
			display: flex;
		}

		nav a {
			padding: 0.85rem 1.25rem;
			border-bottom: 1px solid #1a1a1a;
			font-size: 0.85rem;
		}

		nav a:last-child {
			border-bottom: none;
		}

		.page {
			height: auto;
			min-height: 100vh;
		}

		.layout {
			flex-direction: column;
			overflow: visible;
		}

		.map-container {
			height: 45vh;
			flex: none;
		}

		.panel {
			width: 100%;
			border-left: none;
			border-top: 1px solid #222;
			max-height: none;
			overflow-y: visible;
		}
	}
</style>
