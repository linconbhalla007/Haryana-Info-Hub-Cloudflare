import { getDatabase, getNextEmployeeProformaId } from '../db/mongodb';
import { EmployeeProforma } from '../types/employeeProforma';
import {
	cacheEmployeeProformas,
	employeeProformasCacheTtlSeconds,
	getCachedEmployeeProformas,
	invalidateEmployeeProformasCache,
} from '../cache/employeeProformas';
import { refreshLatestUpdatesCache } from '../cache/latestUpdates';

interface Env {
	MONGODB_URI: string;
	PDF_BUCKET: R2Bucket;
	R2_PUBLIC_URL: string;
}

function jsonResponse(data: unknown, status = 200, corsHeaders: Record<string, string> = {}): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...corsHeaders,
		},
	});
}

const collectionName = 'employee_proformas';
const basePath = '/api/proformas';
const defaultPage = 1;
const defaultLimit = 15;
const maximumLimit = 100;
const maximumPdfSizeBytes = 50 * 1024 * 1024;

class RequestValidationError extends Error {}

function isMultipartRequest(request: Request): boolean {
	return request.headers.get('Content-Type')?.toLowerCase().startsWith('multipart/form-data') ?? false;
}

function getRequiredFormText(formData: FormData, fieldName: string): string {
	const value = formData.get(fieldName);

	if (typeof value !== 'string' || !value.trim()) {
		throw new RequestValidationError(`${fieldName} is required`);
	}

	return value;
}

function getOptionalFormText(formData: FormData, fieldName: string): string | undefined {
	const value = formData.get(fieldName);

	if (value === null) {
		return undefined;
	}

	if (typeof value !== 'string') {
		throw new RequestValidationError(`${fieldName} must be text`);
	}

	return value;
}

function getPdfFile(value: File | string | null): File {
	if (!(value instanceof File) || value.size === 0) {
		throw new RequestValidationError('A PDF file is required');
	}

	if (value.type.toLowerCase() !== 'application/pdf') {
		throw new RequestValidationError('pdf must have MIME type application/pdf');
	}

	if (!value.name.toLowerCase().endsWith('.pdf')) {
		throw new RequestValidationError('pdf filename must end with .pdf');
	}

	if (value.size > maximumPdfSizeBytes) {
		throw new RequestValidationError('pdf must not exceed 50 MB');
	}

	return value;
}

function getPublicPdfUrl(env: Env, pdfKey: string): string {
	return `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${pdfKey}`;
}

function parsePositiveInteger(value: string | null, defaultValue: number, fieldName: string): number {
	if (value === null) {
		return defaultValue;
	}

	if (!/^\d+$/.test(value)) {
		throw new Error(`${fieldName} must be a positive integer`);
	}

	const parsedValue = Number(value);

	if (!Number.isSafeInteger(parsedValue) || parsedValue < 1) {
		throw new Error(`${fieldName} must be a positive integer`);
	}

	return parsedValue;
}

export async function handleEmployeeProformaRoutes(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>,
): Promise<Response | null> {
	const url = new URL(request.url);

	// ==================================================
	// GET ALL PROFORMAS
	// ==================================================

	if (url.pathname === basePath && request.method === 'GET') {
		try {
			// Check edge cache first
			const cachedResponse = await getCachedEmployeeProformas(request.url);
			if (cachedResponse) {
				return cachedResponse;
			}

			const page = parsePositiveInteger(url.searchParams.get('page'), defaultPage, 'page');
			const requestedLimit = parsePositiveInteger(url.searchParams.get('limit'), defaultLimit, 'limit');
			const limit = Math.min(requestedLimit, maximumLimit);
			const skip = (page - 1) * limit;

			if (!Number.isSafeInteger(skip)) {
				throw new Error('page is too large');
			}

			const db = await getDatabase(env);
			const collection = db.collection<EmployeeProforma>(collectionName);

			const [proformas, total] = await Promise.all([
				collection.find({}).sort({ _id: -1 }).skip(skip).limit(limit).toArray(),
				collection.countDocuments(),
			]);
			const totalPages = Math.ceil(total / limit);

			const response = jsonResponse(
				{
					success: true,
					count: proformas.length,
					data: proformas,
					pagination: {
						page,
						limit,
						total,
						totalPages,
						hasNextPage: page < totalPages,
						hasPreviousPage: page > 1,
					},
				},
				200,
				corsHeaders,
			);

			response.headers.set(
				'Cache-Control',
				`public, max-age=0, s-maxage=${employeeProformasCacheTtlSeconds}, must-revalidate`,
			);
			response.headers.set('X-Cache', 'MISS');

			await cacheEmployeeProformas(request.url, response);

			return response;
		} catch (error) {
			console.error('Get employee proformas error:', error);
			const message = error instanceof Error ? error.message : String(error);
			const isValidationError =
				message === 'page must be a positive integer' || message === 'limit must be a positive integer' || message === 'page is too large';

			return jsonResponse(
				{
					success: false,
					message: isValidationError ? 'Invalid pagination parameters' : 'Failed to fetch employee proformas',
					error: message,
				},
				isValidationError ? 400 : 500,
				corsHeaders,
			);
		}
	}

	// ==================================================
	// CREATE PROFORMA
	// ==================================================

	if (url.pathname === basePath && request.method === 'POST') {
		try {
			if (!isMultipartRequest(request)) {
				throw new RequestValidationError('Content-Type must be multipart/form-data');
			}

			const formData = await request.formData();
			const title = getRequiredFormText(formData, 'title');
			const date = getRequiredFormText(formData, 'date');
			const department = getRequiredFormText(formData, 'department');
			const departmentHindi = getRequiredFormText(formData, 'departmentHindi');
			const description = getRequiredFormText(formData, 'description');
			const proformaNumber = getRequiredFormText(formData, 'proformaNumber');
			const pdfFile = getPdfFile(formData.get('pdf'));

			const id = await getNextEmployeeProformaId(env);
			const pdfKey = `employee-proformas/${id}.pdf`;
			const pdf = getPublicPdfUrl(env, pdfKey);

			try {
				await env.PDF_BUCKET.put(pdfKey, pdfFile.stream(), {
					httpMetadata: {
						contentType: 'application/pdf',
					},
				});
			} catch (error) {
				console.error('Employee proforma PDF upload failed:', error);
				return jsonResponse({ success: false, message: 'Failed to upload employee proforma PDF' }, 500, corsHeaders);
			}

			const createdAt = new Date().toISOString();

			const proforma: EmployeeProforma = {
				id,
				title,
				date,
				department,
				departmentHindi,
				description,
				proformaNumber,
				pdf,
				pdfKey,
				createdAt,
			};

			try {
				const db = await getDatabase(env);
				const collection = db.collection<EmployeeProforma>(collectionName);
				await collection.insertOne(proforma);
			} catch (error) {
				console.error('Employee proforma database insert failed:', error);

				try {
					await env.PDF_BUCKET.delete(pdfKey);
				} catch (cleanupError) {
					console.error('Employee proforma PDF cleanup failed:', cleanupError);
				}

				return jsonResponse({ success: false, message: 'Failed to create employee proforma' }, 500, corsHeaders);
			}

			// Invalidate Employee Proformas Edge Cache
			try {
				await invalidateEmployeeProformasCache(url.origin);
			} catch (cacheError) {
				console.error('Employee proformas cache invalidation failed:', cacheError);
			}

			// Refresh Latest Updates cache to include this new proforma
			try {
				await refreshLatestUpdatesCache(env, url.origin);
			} catch (cacheError) {
				console.error('Latest updates cache refresh failed after proforma create:', cacheError);
			}

			return jsonResponse(
				{
					success: true,
					message: 'Employee proforma created successfully',
					data: proforma,
				},
				201,
				corsHeaders,
			);
		} catch (error) {
			console.error('Create employee proforma error:', error);

			return jsonResponse(
				{
					success: false,
					message: error instanceof RequestValidationError ? error.message : 'Failed to create employee proforma',
				},
				error instanceof RequestValidationError ? 400 : 500,
				corsHeaders,
			);
		}
	}

	// ==================================================
	// SINGLE PROFORMA
	// ==================================================

	if (url.pathname.startsWith(`${basePath}/`)) {
		const id = decodeURIComponent(url.pathname.substring(basePath.length + 1));

		if (!id) {
			return jsonResponse(
				{
					success: false,
					message: 'Employee proforma id is required',
				},
				400,
				corsHeaders,
			);
		}

		// ----------------------------------------------
		// GET SINGLE
		// ----------------------------------------------

		if (request.method === 'GET') {
			try {
				const cachedResponse = await getCachedEmployeeProformas(request.url);
				if (cachedResponse) {
					return cachedResponse;
				}

				const db = await getDatabase(env);
				const proforma = await db.collection<EmployeeProforma>(collectionName).findOne({ id });

				if (!proforma) {
					return jsonResponse(
						{
							success: false,
							message: 'Employee proforma not found',
						},
						404,
						corsHeaders,
					);
				}

				const response = jsonResponse(
					{
						success: true,
						data: proforma,
					},
					200,
					corsHeaders,
				);

				response.headers.set(
					'Cache-Control',
					`public, max-age=0, s-maxage=${employeeProformasCacheTtlSeconds}, must-revalidate`,
				);
				response.headers.set('X-Cache', 'MISS');

				await cacheEmployeeProformas(request.url, response);

				return response;
			} catch (error) {
				console.error('Get single employee proforma error:', error);

				return jsonResponse(
					{
						success: false,
						message: 'Failed to fetch employee proforma',
						error: error instanceof Error ? error.message : String(error),
					},
					500,
					corsHeaders,
				);
			}
		}

		// ----------------------------------------------
		// UPDATE
		// ----------------------------------------------

		if (request.method === 'PUT') {
			try {
				const updateData: Partial<EmployeeProforma> = {};
				let pdfFile: File | null = null;

				if (isMultipartRequest(request)) {
					const formData = await request.formData();
					const fields: Array<keyof Omit<EmployeeProforma, 'id' | 'pdf' | 'pdfKey'>> = [
						'title',
						'date',
						'department',
						'departmentHindi',
						'description',
						'proformaNumber',
					];

					for (const field of fields) {
						const value = getOptionalFormText(formData, field);

						if (value !== undefined) {
							updateData[field] = value;
						}
					}

					if (formData.has('pdf')) {
						pdfFile = getPdfFile(formData.get('pdf'));
					}
				} else {
					const body = (await request.json()) as Partial<Omit<EmployeeProforma, 'id' | 'pdf' | 'pdfKey'>>;

					for (const field of ['title', 'date', 'department', 'departmentHindi', 'description', 'proformaNumber'] as const) {
						if (typeof body[field] === 'string') {
							updateData[field] = body[field];
						}
					}
				}

				if (Object.keys(updateData).length === 0 && !pdfFile) {
					throw new RequestValidationError('No valid fields or PDF provided for update');
				}

				const db = await getDatabase(env);
				const collection = db.collection<EmployeeProforma>(collectionName);
				const existingProforma = await collection.findOne({ id });

				if (!existingProforma) {
					return jsonResponse({ success: false, message: 'Employee proforma not found' }, 404, corsHeaders);
				}

				if (pdfFile) {
					const pdfKey = `employee-proformas/${id}.pdf`;

					await env.PDF_BUCKET.put(pdfKey, pdfFile.stream(), {
						httpMetadata: {
							contentType: 'application/pdf',
						},
					});

					updateData.pdfKey = pdfKey;
					updateData.pdf = getPublicPdfUrl(env, pdfKey);
				}

				const result = await collection.findOneAndUpdate(
					{ id },
					{
						$set: updateData,
					},
					{
						returnDocument: 'after',
					},
				);

				try {
					await invalidateEmployeeProformasCache(url.origin, id);
				} catch (cacheError) {
					console.error('Employee proformas cache invalidation failed:', cacheError);
				}

				// Refresh Latest Updates cache to reflect the updated proforma
				try {
					await refreshLatestUpdatesCache(env, url.origin);
				} catch (cacheError) {
					console.error('Latest updates cache refresh failed after proforma update:', cacheError);
				}

				return jsonResponse(
					{
						success: true,
						message: 'Employee proforma updated successfully',
						data: result,
					},
					200,
					corsHeaders,
				);
			} catch (error) {
				console.error('Update employee proforma error:', error);

				return jsonResponse(
					{
						success: false,
						message: error instanceof RequestValidationError ? error.message : 'Failed to update employee proforma',
					},
					error instanceof RequestValidationError ? 400 : 500,
					corsHeaders,
				);
			}
		}

		// ----------------------------------------------
		// DELETE
		// ----------------------------------------------

		if (request.method === 'DELETE') {
			try {
				const db = await getDatabase(env);
				const collection = db.collection<EmployeeProforma>(collectionName);
				const proforma = await collection.findOne({ id });

				if (!proforma) {
					return jsonResponse(
						{
							success: false,
							message: 'Employee proforma not found',
						},
						404,
						corsHeaders,
					);
				}

				if (proforma.pdfKey) {
					await env.PDF_BUCKET.delete(proforma.pdfKey);
				}

				const result = await collection.deleteOne({ id });

				if (result.deletedCount === 0) {
					return jsonResponse(
						{
							success: false,
							message: 'Employee proforma not found',
						},
						404,
						corsHeaders,
					);
				}

				try {
					await invalidateEmployeeProformasCache(url.origin, id);
				} catch (cacheError) {
					console.error('Employee proformas cache invalidation failed:', cacheError);
				}

				// Refresh Latest Updates cache to remove the deleted proforma
				try {
					await refreshLatestUpdatesCache(env, url.origin);
				} catch (cacheError) {
					console.error('Latest updates cache refresh failed after proforma delete:', cacheError);
				}

				return jsonResponse(
					{
						success: true,
						message: 'Employee proforma deleted successfully',
					},
					200,
					corsHeaders,
				);
			} catch (error) {
				console.error('Delete employee proforma error:', error);

				return jsonResponse(
					{
						success: false,
						message: 'Failed to delete employee proforma',
						error: error instanceof Error ? error.message : String(error),
					},
					500,
					corsHeaders,
				);
			}
		}
	}

	// ==================================================
	// DIRECT PDF DOWNLOAD
	// ==================================================

	const downloadPrefix = '/api/download-proforma/';
	if (url.pathname.startsWith(downloadPrefix) && request.method === 'GET') {
		const id = decodeURIComponent(url.pathname.substring(downloadPrefix.length)).trim();

		if (!id) {
			return jsonResponse(
				{
					success: false,
					message: 'Employee proforma id is required',
				},
				400,
				corsHeaders,
			);
		}

		try {
			const db = await getDatabase(env);
			const proforma = await db.collection<EmployeeProforma>(collectionName).findOne({ id });

			if (!proforma) {
				return jsonResponse(
					{
						success: false,
						message: 'Employee proforma not found',
					},
					404,
					corsHeaders,
				);
			}

			const pdfKey = proforma.pdfKey || `employee-proformas/${id}.pdf`;
			let pdfStream: ReadableStream | null = null;
			let etag: string | undefined;

			const object = await env.PDF_BUCKET.get(pdfKey);
			if (object) {
				pdfStream = object.body;
				etag = object.httpEtag;
			} else {
				// Fallback to public R2 URL
				const publicUrl = proforma.pdf || getPublicPdfUrl(env, pdfKey);
				try {
					const remoteResponse = await fetch(publicUrl);
					if (remoteResponse.ok && remoteResponse.body) {
						pdfStream = remoteResponse.body;
						etag = remoteResponse.headers.get('ETag') || undefined;
					}
				} catch (fetchError) {
					console.error('Failed to fetch fallback public proforma PDF:', fetchError);
				}
			}

			if (!pdfStream) {
				return jsonResponse(
					{
						success: false,
						message: 'PDF file not found in storage',
					},
					404,
					corsHeaders,
				);
			}

			const rawTitle = (proforma.title || 'haryana-proforma').trim();
			const safeTitle = rawTitle.replace(/["\/\r\n\\]/g, '').trim() || 'haryana-proforma';
			const encodedTitle = encodeURIComponent(rawTitle);

			const headers = new Headers();
			headers.set('Content-Type', 'application/pdf');
			headers.set(
				'Content-Disposition',
				`attachment; filename="${safeTitle}.pdf"; filename*=UTF-8''${encodedTitle}.pdf`,
			);
			for (const [key, value] of Object.entries(corsHeaders)) {
				headers.set(key, value);
			}

			if (etag) {
				headers.set('ETag', etag);
			}

			return new Response(pdfStream, {
				status: 200,
				headers,
			});
		} catch (error) {
			console.error('Download employee proforma PDF error:', error);

			return jsonResponse(
				{
					success: false,
					message: 'Failed to download PDF',
					error: error instanceof Error ? error.message : String(error),
				},
				500,
				corsHeaders,
			);
		}
	}

	return null;
}
