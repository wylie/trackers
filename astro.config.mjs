// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.simpletrackers.io',
	integrations: [tailwind()],
	adapter: vercel(),
	output: 'server',
});
