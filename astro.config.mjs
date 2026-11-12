// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://rules.clubpenon.org',
	integrations: [
		starlight({
			title: 'Club Peñón Rules',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/clubpenon/rules' }],
			sidebar: [{ label: 'Rules', items: [{ autogenerate: { directory: 'rules' } }] }],
		}),
	],
});
