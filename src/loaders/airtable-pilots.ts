import type { Loader } from 'astro/loaders';
import { z } from 'astro/zod';
import {
	AIRTABLE_BASE_ID,
	AIRTABLE_TABLE_ID,
	pilotLists,
	type PilotListDefinition,
} from '../lists/authorized-pilots';

const FIELDS = {
	name: 'Public Name',
	phone: 'Public Phone',
	email: 'Public Email',
	website: 'Public Website',
} as const;

export const pilotSchema = z.object({
	list: z.enum(pilotLists.map((l) => l.id) as [string, ...string[]]),
	name: z.string().min(1),
	phone: z.string().optional(),
	email: z.email().optional(),
	website: z.url().optional(),
});

const airtableResponse = z.object({
	records: z.array(z.object({ id: z.string(), fields: z.record(z.string(), z.unknown()) })),
	offset: z.string().optional(),
});

/** Airtable formula string literal. */
const str = (value: string) => JSON.stringify(value);

/**
 * True when a multiple-select or rollup field contains `value` as a whole item.
 * In formulas Airtable may expose such fields as a single "A, B, C" string rather than an array,
 * so both ", " and the ARRAYJOIN separator are normalized to "|" before matching.
 */
const contains = (field: string, value: string) =>
	`FIND(${str(`|${value}|`)}, "|" & SUBSTITUTE(ARRAYJOIN({${field}}, "|"), ", ", "|") & "|")`;

function formulaFor(list: PilotListDefinition): string {
	const conditions = [contains('Ratings', list.rating), '{Public}'];
	if (list.clubMember) conditions.push('{Club Member}');
	if (list.membershipTypes?.length) {
		conditions.push(`OR(${list.membershipTypes.map((t) => contains('Membership Type', t)).join(', ')})`);
	}
	if (list.paid) conditions.push(`{Membership Status} = ${str('Pagado')}`);
	return `AND(${conditions.join(', ')})`;
}

async function fetchList(token: string, list: PilotListDefinition) {
	const records: z.infer<typeof airtableResponse>['records'] = [];
	let offset: string | undefined;
	do {
		const params = new URLSearchParams({ filterByFormula: formulaFor(list) });
		for (const field of Object.values(FIELDS)) params.append('fields[]', field);
		if (offset) params.set('offset', offset);

		const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}?${params}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		if (!res.ok) throw new Error(`Airtable ${res.status} for list "${list.id}": ${await res.text()}`);

		const page = airtableResponse.parse(await res.json());
		records.push(...page.records);
		offset = page.offset;
	} while (offset);
	return records;
}

/** Loads the Authorized Pilots lists from Airtable. Only matching, public records are fetched. */
export function airtablePilotsLoader(): Loader {
	return {
		name: 'airtable-pilots',
		load: async ({ store, logger, parseData }) => {
			const token = process.env.AIRTABLE_TOKEN ?? import.meta.env.AIRTABLE_TOKEN;
			if (!token) {
				const message = 'AIRTABLE_TOKEN is not set; the Authorized Pilots lists will be empty.';
				if (process.env.CI) throw new Error(message);
				logger.warn(message);
				store.clear();
				return;
			}

			const results = await Promise.all(pilotLists.map(async (list) => ({ list, records: await fetchList(token, list) })));

			store.clear();
			for (const { list, records } of results) {
				for (const record of records) {
					const id = `${list.id}/${record.id}`;
					const f = record.fields;
					const text = (field: string) => (typeof f[field] === 'string' ? f[field].trim() : '');
					if (!text(FIELDS.name)) {
						logger.warn(`${list.id}: skipping Public record ${record.id} with no "${FIELDS.name}"`);
						continue;
					}
					/** Drops an invalid optional field with a warning instead of failing the whole build. */
					const valid = (field: string, value: string | undefined, schema: z.ZodType) => {
						if (!value || schema.safeParse(value).success) return value;
						logger.warn(`${list.id}: ignoring invalid "${field}" on record ${record.id}: ${JSON.stringify(value)}`);
						return undefined;
					};
					const website = text(FIELDS.website);
					const data = await parseData({
						id,
						data: {
							list: list.id,
							name: text(FIELDS.name),
							phone: text(FIELDS.phone) || undefined,
							email: valid(FIELDS.email, text(FIELDS.email) || undefined, z.email()),
							// Accept bare domains such as "www.example.com".
							website: valid(
								FIELDS.website,
								website && (/^[a-z][a-z\d+.-]*:\/\//i.test(website) ? website : `https://${website}`),
								z.url({ protocol: /^https?$/ }),
							),
						},
					});
					store.set({ id, data });
				}
				logger.info(`${list.id}: ${store.values().filter((e) => e.data.list === list.id).length}`);
			}
		},
	};
}
