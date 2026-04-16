<script lang="ts">
</script>

<div class="home">
	<svg class="wave-bg" viewBox="0 0 1200 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
		<defs>
			<linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
				<stop offset="0%"   stop-color="#39ff14" />
				<stop offset="25%"  stop-color="#00f5ff" />
				<stop offset="50%"  stop-color="#983cba" />
				<stop offset="75%"  stop-color="#ff9900" />
				<stop offset="100%" stop-color="#ffe566" />
			</linearGradient>
		</defs>

		<!-- Background bars (equalizer style) -->
		{#each Array(60) as _, i}
			{@const x = (i / 60) * 1200}
			{@const h = 20 + Math.sin(i * 0.4) * 15 + Math.sin(i * 0.9 + 1) * 25 + Math.sin(i * 0.2 + 2) * 20}
			<rect
				x={x + 2}
				y={100 - h / 2}
				width="14"
				height={h}
				rx="3"
				fill="url(#wave-gradient)"
				opacity="0.18"
			/>
		{/each}

		<!-- Main wave line -->
		<polyline
			points={Array.from({ length: 121 }, (_, i) => {
				const x = (i / 120) * 1200;
				const y = 100
					+ Math.sin(i * 0.25) * 28
					+ Math.sin(i * 0.6 + 0.8) * 18
					+ Math.sin(i * 0.12 + 1.5) * 14;
				return `${x},${y}`;
			}).join(' ')}
			fill="none"
			stroke="url(#wave-gradient)"
			stroke-width="2.5"
			opacity="0.55"
		/>

		<!-- Mirror wave line -->
		<polyline
			points={Array.from({ length: 121 }, (_, i) => {
				const x = (i / 120) * 1200;
				const y = 100
					- Math.sin(i * 0.25) * 18
					- Math.sin(i * 0.6 + 0.8) * 12
					- Math.sin(i * 0.12 + 1.5) * 9;
				return `${x},${y}`;
			}).join(' ')}
			fill="none"
			stroke="url(#wave-gradient)"
			stroke-width="1.5"
			opacity="0.3"
		/>
	</svg>

	<div class="content">
		<h1>Nerd Music Community</h1>
		<p>A directory of nerd music artists and events across the country.</p>
		<nav>
			<a href="/artists">Artist Map</a>
			<a href="/events">Event Calendar</a>
			<a href="/submit/artist">Submit Artist</a>
			<a href="/submit/event">Submit Event</a>
		</nav>
	</div>
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
		font-family: 'JetBrains Mono', monospace, sans-serif;
		text-align: center;
		position: relative;
		overflow: hidden;
	}

	.wave-bg {
		position: absolute;
		width: 100%;
		height: 200px;
		top: 50%;
		left: 0;
		transform: translateY(-50%);
		pointer-events: none;
	}

	.content {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	h1 {
		font-size: 2.2rem;
		color: #983cba;
		margin: 0;
		text-shadow: 0 0 30px rgba(152, 60, 186, 0.4);
	}

	p {
		color: #888;
		margin: 0;
		font-size: 0.9rem;
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
		font-size: 0.9rem;
		border: 1px solid #00f5ff;
		padding: 0.5rem 1.5rem;
		border-radius: 4px;
	}

	a:hover {
		background: #00f5ff;
		color: #000;
	}

	@media (max-width: 600px) {
		h1 { font-size: 1.5rem; }
		a { font-size: 0.8rem; padding: 0.4rem 1rem; }
	}
</style>
