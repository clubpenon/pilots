import type { Loader } from 'astro/loaders';
import { z } from 'astro/zod';
import {
	AIRTABLE_BASE_ID,
	AIRTABLE_TABLE_ID,
	pilotLists,
	type PilotListDefinition,
} from '../lists/authorized-pilots';

const FIELDS = {
	name: 'Full Name',
	phone: 'Public Phone',
	website: 'Public Website',
} as const;

export const pilotSchema = z.object({
	list: z.enum(pilotLists.map((l) => l.id) as [string, ...string[]]),
	name: z.string().min(1),
	phone: z.string().optional(),
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
		const params = new URLSearchParams({ filterByFormula: formulaFor(list), 'sort[0][field]': FIELDS.name });
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
					const data = await parseData({
						id,
						data: {
							list: list.id,
							name: typeof f[FIELDS.name] === 'string' ? f[FIELDS.name].trim() : '',
							phone: f[FIELDS.phone] || undefined,
							website: f[FIELDS.website] || undefined,
						},
					});
					store.set({ id, data });
				}
				logger.info(`${list.id}: ${records.length}`);
			}
		},
	};
}
