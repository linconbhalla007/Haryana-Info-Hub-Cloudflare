export interface GovernmentOrder {
	id: string;
	title: string;
	date: string;
	department: string;
	departmentHindi: string;
	description: string;
	orderNumber: string;
	pdf: string;
	pdfKey?: string;
	createdAt?: string;
}
