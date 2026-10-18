import { OrderType } from '../constants/orderTypes';

export interface EmployeeProforma {
	id: string;
	orderType?: OrderType | string;
	title: string;
	date: string;
	department: string;
	departmentHindi: string;
	description: string;
	proformaNumber: string;
	pdf: string;
	pdfKey?: string;
	createdAt?: string;
}
