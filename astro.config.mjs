// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.simpletrackers.io',
	integrations: [tailwind(), sitemap()],
	adapter: vercel(),
	output: 'server',
});
