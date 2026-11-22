/**
 * Lists on the "Authorized Pilots" page, pulled from the Airtable `Customers` table at build time.
 *
 * Every list requires `Public` to be checked, plus the given `Ratings` value.
 * When `clubMember` is set, `Club Member` must be checked.
 * When `membershipTypes` is set, `Membership Type` (a rollup, so an array) must contain one of them.
 * When `paid` is set, `Membership Status` must be "Pagado".
 */
export interface PilotListDefinition {
	id: string;
	/** A value of the `Ratings` multiple-select field. */
	rating: string;
	clubMember?: boolean;
	membershipTypes?: string[];
	paid?: boolean;
}

export const AIRTABLE_BASE_ID = 'appJzV4qiHbIYm11r'; // syncbase
export const AIRTABLE_TABLE_ID = 'tbl79ynGtHHtXAqxg'; // Customers

export const pilotLists = [
	{ id: 'instructors-paragliding', rating: 'Instructor de Parapente', clubMember: true, membershipTypes: ['Instructor', 'Tandem'] },
	{ id: 'instructors-hang-gliding', rating: 'Instructor de Ala Delta', clubMember: true, membershipTypes: ['Instructor', 'Tandem'] },
	{ id: 'assistants-paragliding', rating: 'Asistente Instructor de Parapente', clubMember: true, membershipTypes: ['Instructor', 'Tandem'] },
	{ id: 'assistants-hang-gliding', rating: 'Asistente Instructor de Ala Delta', clubMember: true, membershipTypes: ['Instructor', 'Tandem'] },
	{ id: 'guides-paragliding', rating: 'Guía de Parapente' },
	{ id: 'guides-hang-gliding', rating: 'Guía de Ala Delta' },
	{ id: 'tandem-paragliding', rating: 'Piloto Tandem de Parapente', clubMember: true, paid: true },
	{ id: 'tandem-hang-gliding', rating: 'Piloto Tandem de Ala Delta', clubMember: true, paid: true },
] as const satisfies readonly PilotListDefinition[];

export type PilotListId = (typeof pilotLists)[number]['id'];
