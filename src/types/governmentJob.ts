export interface GovernmentJob {
	id: string;
	title: string;
	titleHindi?: string;
	department: string;
	departmentHindi?: string;
	publishedDate: string;
	lastDate: string;
	vacancies: number;
	description: string;
	pdf: string;
	pdfKey?: string;
	enabled: boolean;
	createdAt?: string;
	updatedAt?: string;
}
