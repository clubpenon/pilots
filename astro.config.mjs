// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://rules.clubpenon.org',
	redirects: { '/': '/en/' },
	integrations: [
		starlight({
			title: { en: 'Club Peñón Rules', es: 'Reglas del Club Peñón' },
			defaultLocale: 'en',
			locales: {
				en: { label: 'English', lang: 'en' },
				es: { label: 'Español', lang: 'es' },
			},
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{
					label: 'Rules',
					translations: { es: 'Reglas' },
					items: [{ autogenerate: { directory: 'rules' } }],
				},
			],
		}),
	],
});
