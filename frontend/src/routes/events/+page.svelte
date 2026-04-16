<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { Calendar } from '@fullcalendar/core';
	import dayGridPlugin from '@fullcalendar/daygrid';
	import listPlugin from '@fullcalendar/list';
	import { PUBLIC_API_BASE_URL } from '$env/static/public';

	interface Event {
		id: number;
		title: string;
		description: string;
		venue: string | null;
		city: string;
		state: string | null;
		region: string;
		is_online: boolean;
		start_date: string;
		end_date: string | null;
		start_time: string | null;
		event_url: string | null;
		tags: string[];
		performers: string[];
	}

	let calendarEl: HTMLDivElement;
	let calendar: Calendar;
	let events: Event[] = $state([]);
	let selectedEvent: Event | null = $state(null);
	let loading = $state(true);
	let error = $state('');

	function getTagColor(tags: string[]): string {
		if (tags.includes('vpc')) return '#ffe600';
		if (tags.includes('festival')) return '#ff006e';
		if (tags.includes('deadline')) return '#ff4444';
		if (tags.includes('online-event')) return '#00f5ff';
		return '#39ff14';
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	onMount(async () => {
		// Fetch events from API
		try {
			const response = await fetch(`${PUBLIC_API_BASE_URL}/events`);
			events = await response.json();
		} catch (e) {
			error = 'Failed to load events.';
			loading = false;
			return;
		}

		loading = false;

		// Initialize FullCalendar
		calendar = new Calendar(calendarEl, {
			plugins: [dayGridPlugin, listPlugin],
			initialView: 'dayGridMonth',
			headerToolbar: {
				left: 'prev,next today',
				center: 'title',
				right: 'dayGridMonth,listMonth'
			},
			events: events.map((e) => ({
				id: String(e.id),
				title: e.title,
				start: e.start_date,
				end: e.end_date || undefined,
				backgroundColor: getTagColor(e.tags),
				borderColor: getTagColor(e.tags),
				textColor: '#000000'
			})),
			eventClick: ({ event }) => {
				const found = events.find((e) => String(e.id) === event.id);
				if (found) selectedEvent = found;
			},
			height: '100%'
		});

		calendar.render();
	});

	onDestroy(() => {
		if (calendar) calendar.destroy();
	});
</script>

<div class="page">
	<header>
		<h1>Nerd Music Events</h1>
		<div class="legend">
			<span class="dot" style="background:#39ff14"></span> Show
			<span class="dot" style="background:#ff006e"></span> Festival
			<span class="dot" style="background:#ffe600"></span> VPC
			<span class="dot" style="background:#ff4444"></span> Deadline
			<span class="dot" style="background:#00f5ff"></span> Online
		</div>
		<nav>
			<a href="/artists">Artist Map</a>
			<a href="/submit/artist">Submit Artist</a>
			<a href="/submit/event">Submit Event</a>
			<a href="/">Home</a>
		</nav>
	</header>

	{#if error}
		<p class="status error">{error}</p>
	{:else}
		<div class="layout">
			<!-- Calendar -->
			<div class="calendar-container" bind:this={calendarEl}></div>

			<!-- Event detail panel -->
			<div class="panel">
				{#if loading}
					<p class="status">Loading events...</p>
				{:else if selectedEvent}
					<button class="back" onclick={() => selectedEvent = null}>← Back</button>
					<div class="event-detail">
						<h2>{selectedEvent.title}</h2>
						<p class="date">{formatDate(selectedEvent.start_date)}
							{#if selectedEvent.end_date}
								→ {formatDate(selectedEvent.end_date)}
							{/if}
						</p>
						<p class="location">
							{#if selectedEvent.is_online}
								🌐 Online
							{:else}
								📍 {selectedEvent.venue ? `${selectedEvent.venue}, ` : ''}{selectedEvent.city}{selectedEvent.state ? `, ${selectedEvent.state}` : ''}
							{/if}
						</p>
						{#if selectedEvent.description}
							<p class="description">{selectedEvent.description}</p>
						{/if}
						{#if selectedEvent.performers.length > 0}
							<div class="performers">
								<h3>Performers</h3>
								<ul>
									{#each selectedEvent.performers as performer}
										<li>{performer}</li>
									{/each}
								</ul>
							</div>
						{/if}
						{#if selectedEvent.tags.length > 0}
							<div class="tags">
								{#each selectedEvent.tags as tag}
									<span class="tag">{tag}</span>
								{/each}
							</div>
						{/if}
						{#if selectedEvent.event_url}
							<a href={selectedEvent.event_url} target="_blank" class="event-link">More info →</a>
						{/if}
					</div>
				{:else}
					<div class="instructions">
						<p>Click an event on the calendar to see details.</p>
						<h3>Upcoming ({events.length})</h3>
						<ul class="event-list">
							{#each events as event}
								<li onclick={() => selectedEvent = event}>
									<span class="dot" style="background:{getTagColor(event.tags)}; box-shadow: 0 0 4px {getTagColor(event.tags)}"></span>
									<div>
										<strong>{event.title}</strong>
										<small>{formatDate(event.start_date)}</small>
										<small>{event.is_online ? 'Online' : `${event.city}${event.state ? ', ' + event.state : ''}`}</small>
									</div>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	:global(.fc) {
		font-family: 'JetBrains Mono', monospace, sans-serif !important;
		color: #fff !important;
	}

	:global(.fc-theme-standard td),
	:global(.fc-theme-standard th),
	:global(.fc-theme-standard .fc-scrollgrid) {
		border-color: #333 !important;
	}

	:global(.fc .fc-daygrid-day-number),
	:global(.fc .fc-col-header-cell-cushion) {
		color: #aaa !important;
	}

	:global(.fc .fc-day-today) {
		background: #1a1a1a !important;
	}

	:global(.fc .fc-button) {
		background: #222 !important;
		border-color: #444 !important;
		color: #fff !important;
	}

	:global(.fc .fc-button:hover) {
		background: #333 !important;
	}

	:global(.fc .fc-button-primary:not(:disabled).fc-button-active) {
		background: #39ff14 !important;
		border-color: #39ff14 !important;
		color: #000 !important;
	}

	:global(.fc .fc-toolbar-title) {
		color: #fff !important;
		font-size: 1rem !important;
	}

	:global(.fc-list-event:hover td) {
		background: #1a1a1a !important;
	}

	:global(.fc-list-day-cushion) {
		background: #111 !important;
	}

	.page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #0a0a0a;
		color: #fff;
		font-family: 'JetBrains Mono', monospace, sans-serif;
	}

	header {
		display: flex;
		align-items: center;
		gap: 1.5rem;
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
		gap: 0.75rem;
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

	.calendar-container {
		flex: 1;
		padding: 1rem;
		background: #0a0a0a;
		overflow: auto;
	}

	.panel {
		width: 300px;
		background: #111;
		border-left: 1px solid #222;
		overflow-y: auto;
		padding: 1rem;
	}

	.instructions p {
		font-size: 0.75rem;
		color: #666;
		margin: 0 0 1rem;
	}

	.instructions h3 {
		font-size: 0.8rem;
		color: #aaa;
		margin: 0 0 0.75rem;
	}

	.event-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.event-list li {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.6rem;
		border-radius: 4px;
		cursor: pointer;
		border: 1px solid #222;
	}

	.event-list li:hover {
		background: #1a1a1a;
		border-color: #39ff14;
	}

	.event-list li div {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.event-list li strong {
		font-size: 0.8rem;
	}

	.event-list li small {
		font-size: 0.7rem;
		color: #888;
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		display: inline-block;
		flex-shrink: 0;
		margin-top: 3px;
	}

	.event-detail h2 {
		font-size: 1rem;
		color: #fff;
		margin: 0 0 0.5rem;
	}

	.date {
		font-size: 0.75rem;
		color: #39ff14;
		margin: 0 0 0.25rem;
	}

	.location {
		font-size: 0.75rem;
		color: #888;
		margin: 0 0 0.75rem;
	}

	.description {
		font-size: 0.8rem;
		color: #ccc;
		line-height: 1.5;
		margin: 0 0 0.75rem;
	}

	.performers h3 {
		font-size: 0.75rem;
		color: #aaa;
		margin: 0 0 0.4rem;
	}

	.performers ul {
		list-style: none;
		padding: 0;
		margin: 0 0 0.75rem;
	}

	.performers li {
		font-size: 0.8rem;
		color: #fff;
		padding: 0.2rem 0;
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

	.event-link {
		display: inline-block;
		font-size: 0.8rem;
		color: #39ff14;
		text-decoration: none;
	}

	.event-link:hover { text-decoration: underline; }

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

	@media (max-width: 768px) {
		header {
			flex-wrap: wrap;
			gap: 0.5rem;
			padding: 0.75rem 1rem;
		}

		h1 {
			font-size: 1rem;
		}

		.legend {
			flex: none;
			width: 100%;
			font-size: 0.7rem;
			gap: 0.5rem;
			flex-wrap: wrap;
		}

		nav {
			gap: 1rem;
		}

		.page {
			height: auto;
			min-height: 100vh;
		}

		.layout {
			flex-direction: column;
			overflow: visible;
		}

		.calendar-container {
			min-height: 60vh;
			overflow: visible;
		}

		.panel {
			width: 100%;
			border-left: none;
			border-top: 1px solid #222;
			max-height: none;
			overflow-y: visible;
		}

		:global(.fc .fc-toolbar) {
			flex-wrap: wrap !important;
			gap: 0.5rem !important;
		}

		:global(.fc .fc-toolbar-title) {
			font-size: 0.85rem !important;
		}
	}
</style>
