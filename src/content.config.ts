import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';
import { airtablePilotsLoader, pilotSchema } from './loaders/airtable-pilots';

export const collections = {
	docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
	authorizedPilots: defineCollection({ loader: airtablePilotsLoader(), schema: pilotSchema }),
};
