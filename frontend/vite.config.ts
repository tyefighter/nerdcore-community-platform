import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	optimizeDeps: {
		exclude: ['mapbox-gl']
	},
	ssr: {
		noExternal: ['mapbox-gl', '@fullcalendar/core', '@fullcalendar/daygrid', '@fullcalendar/list', '@fullcalendar/interaction']
	}
});
