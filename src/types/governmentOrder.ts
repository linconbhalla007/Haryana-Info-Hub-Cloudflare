import { OrderType } from '../constants/orderTypes';

export interface GovernmentOrder {
	id: string;
	orderType?: OrderType | string;
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
