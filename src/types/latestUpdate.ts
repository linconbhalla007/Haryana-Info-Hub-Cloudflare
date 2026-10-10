export interface LatestUpdateItem {
	id: string;
	title: string;
	description: string;
	type: string;
	link: string;
	createdAt: string;
	enabled: boolean;
}

export interface LatestUpdatesDocument {
	_id: string;
	items: LatestUpdateItem[];
	updatedAt: string;
}
