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
			logo: {
				light: './src/assets/el-penon-rectangle-no-margins.png',
				dark: './src/assets/el-penon-rectangle-no-margins-dark.png',
				alt: 'El Peñón — Club de Vuelo Libre',
				replacesTitle: true,
			},
			routeMiddleware: './src/routeData.ts',
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{ slug: 'index', label: 'Home', translations: { es: 'Inicio' } },
				{
					label: 'Rules',
					translations: { es: 'Reglas' },
					items: [{ autogenerate: { directory: 'rules' } }],
				},
				{
					label: 'Emergencies',
					translations: { es: 'Emergencias' },
					items: [{ autogenerate: { directory: 'emergencies' } }],
				},
			],
		}),
	],
});
