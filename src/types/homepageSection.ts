export type HomepageSectionStatus = 'ACTIVE' | 'SCHEDULED' | 'DISABLED' | 'EXPIRED';

export interface HomepageSection {
	_id: string;
	key: string;
	type: string;
	enabled: boolean;
	startAt: string | null;
	endAt: string | null;
	displayOrder: number;
	config: Record<string, unknown>;
	createdAt: string;
	updatedAt: string;
}

export interface HomepageSectionWithStatus extends HomepageSection {
	status: HomepageSectionStatus;
}
