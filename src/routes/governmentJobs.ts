import { getDatabase, getNextGovernmentJobId } from '../db/mongodb';
import { GovernmentJob } from '../types/governmentJob';
import {
	cacheGovernmentJobs,
	governmentJobsCacheTtlSeconds,
	getCachedGovernmentJobs,
	invalidateGovernmentJobsCache,
} from '../cache/governmentJobs';

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

const collectionName = 'government_jobs';
const basePath = '/api/jobs';
const downloadPrefix = '/api/download-job/';
const defaultPage = 1;
const defaultLimit = 15;
const maximumLimit = 100;
const maximumPdfSizeBytes = 50 * 1024 * 1024; // 50 MB

class RequestValidationError extends Error {}

function isMultipartRequest(request: Request): boolean {
	return request.headers.get('Content-Type')?.toLowerCase().startsWith('multipart/form-data') ?? false;
}

function getRequiredFormText(formData: FormData, fieldName: string): string {
	const value = formData.get(fieldName);

	if (typeof value !== 'string' || !value.trim()) {
		throw new RequestValidationError(`${fieldName} is required`);
	}

	return value.trim();
}

function getOptionalFormText(formData: FormData, fieldName: string): string | undefined {
	const value = formData.get(fieldName);

	if (value === null) {
		return undefined;
	}

	if (typeof value !== 'string') {
		throw new RequestValidationError(`${fieldName} must be text`);
	}

	return value.trim();
}

function parseVacancies(value: unknown): number {
	if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) {
		return value;
	}

	if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
		const parsed = Number(value.trim());
		if (Number.isSafeInteger(parsed) && parsed >= 0) {
			return parsed;
		}
	}

	throw new RequestValidationError('vacancies must be a non-negative integer');
}

function parseOptionalBoolean(value: unknown, defaultValue = true): boolean {
	if (value === undefined || value === null) {
		return defaultValue;
	}
	if (typeof value === 'boolean') {
		return value;
	}
	if (typeof value === 'string') {
		const lower = value.trim().toLowerCase();
		if (lower === 'true' || lower === '1') return true;
		if (lower === 'false' || lower === '0') return false;
	}
	return defaultValue;
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

export async function handleGovernmentJobRoutes(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>,
): Promise<Response | null> {
	const url = new URL(request.url);

	// ==================================================
	// GET ALL JOBS
	// ==================================================

	if (url.pathname === basePath && request.method === 'GET') {
		try {
			// Check edge cache first
			const cachedResponse = await getCachedGovernmentJobs(request.url);
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

			// Filter query support
			const query: Record<string, unknown> = {};
			const enabledParam = url.searchParams.get('enabled');
			if (enabledParam !== null) {
				query.enabled = enabledParam === 'true' || enabledParam === '1';
			}

			const db = await getDatabase(env);
			const collection = db.collection<GovernmentJob>(collectionName);

			const [jobs, total] = await Promise.all([
				collection.find(query).sort({ _id: -1 }).skip(skip).limit(limit).toArray(),
				collection.countDocuments(query),
			]);
			const totalPages = Math.ceil(total / limit) || 1;

			const response = jsonResponse(
				{
					success: true,
					count: jobs.length,
					data: jobs,
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
				`public, max-age=0, s-maxage=${governmentJobsCacheTtlSeconds}, must-revalidate`,
			);
			response.headers.set('X-Cache', 'MISS');

			await cacheGovernmentJobs(request.url, response);

			return response;
		} catch (error) {
			console.error('Get government jobs error:', error);
			const message = error instanceof Error ? error.message : String(error);
			const isValidationError =
				message === 'page must be a positive integer' || message === 'limit must be a positive integer' || message === 'page is too large';

			return jsonResponse(
				{
					success: false,
					message: isValidationError ? 'Invalid pagination parameters' : 'Failed to fetch government jobs',
					error: message,
				},
				isValidationError ? 400 : 500,
				corsHeaders,
			);
		}
	}

	// ==================================================
	// CREATE JOB
	// ==================================================

	if (url.pathname === basePath && request.method === 'POST') {
		try {
			if (!isMultipartRequest(request)) {
				throw new RequestValidationError('Content-Type must be multipart/form-data');
			}

			const formData = await request.formData();
			const title = getRequiredFormText(formData, 'title');
			const titleHindi = getOptionalFormText(formData, 'titleHindi') || title;
			const department = getRequiredFormText(formData, 'department');
			const departmentHindi = getOptionalFormText(formData, 'departmentHindi') || department;
			const publishedDate = getRequiredFormText(formData, 'publishedDate');
			const lastDate = getRequiredFormText(formData, 'lastDate');
			const vacancies = parseVacancies(formData.get('vacancies'));
			const description = getRequiredFormText(formData, 'description');
			const enabled = parseOptionalBoolean(formData.get('enabled'), true);
			const pdfFile = getPdfFile(formData.get('pdf'));

			const id = await getNextGovernmentJobId(env);
			const pdfKey = `government-jobs/${id}.pdf`;
			const pdf = getPublicPdfUrl(env, pdfKey);

			try {
				await env.PDF_BUCKET.put(pdfKey, pdfFile.stream(), {
					httpMetadata: {
						contentType: 'application/pdf',
					},
				});
			} catch (error) {
				console.error('Government job PDF upload failed:', error);
				return jsonResponse({ success: false, message: 'Failed to upload government job PDF' }, 500, corsHeaders);
			}

			const createdAt = new Date().toISOString();

			const job: GovernmentJob = {
				id,
				title,
				titleHindi,
				department,
				departmentHindi,
				publishedDate,
				lastDate,
				vacancies,
				description,
				pdf,
				pdfKey,
				enabled,
				createdAt,
			};

			try {
				const db = await getDatabase(env);
				const collection = db.collection<GovernmentJob>(collectionName);
				await collection.insertOne(job);
			} catch (error) {
				console.error('Government job database insert failed:', error);

				try {
					await env.PDF_BUCKET.delete(pdfKey);
				} catch (cleanupError) {
					console.error('Government job PDF cleanup failed:', cleanupError);
				}

				return jsonResponse({ success: false, message: 'Failed to create government job' }, 500, corsHeaders);
			}

			// Invalidate Government Jobs Edge Cache
			try {
				await invalidateGovernmentJobsCache(url.origin);
			} catch (cacheError) {
				console.error('Government jobs cache invalidation failed:', cacheError);
			}

			return jsonResponse(
				{
					success: true,
					message: 'Government job created successfully',
					data: job,
				},
				201,
				corsHeaders,
			);
		} catch (error) {
			console.error('Create government job error:', error);

			return jsonResponse(
				{
					success: false,
					message: error instanceof RequestValidationError ? error.message : 'Failed to create government job',
				},
				error instanceof RequestValidationError ? 400 : 500,
				corsHeaders,
			);
		}
	}

	// ==================================================
	// SINGLE JOB OPERATIONS (GET, PUT, DELETE)
	// ==================================================

	if (url.pathname.startsWith(`${basePath}/`)) {
		const id = decodeURIComponent(url.pathname.substring(basePath.length + 1)).trim();

		if (!id) {
			return jsonResponse(
				{
					success: false,
					message: 'Government job id is required',
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
				const cachedResponse = await getCachedGovernmentJobs(request.url);
				if (cachedResponse) {
					return cachedResponse;
				}

				const db = await getDatabase(env);
				const job = await db.collection<GovernmentJob>(collectionName).findOne({ id });

				if (!job) {
					return jsonResponse(
						{
							success: false,
							message: 'Government job not found',
						},
						404,
						corsHeaders,
					);
				}

				const response = jsonResponse(
					{
						success: true,
						data: job,
					},
					200,
					corsHeaders,
				);

				response.headers.set(
					'Cache-Control',
					`public, max-age=0, s-maxage=${governmentJobsCacheTtlSeconds}, must-revalidate`,
				);
				response.headers.set('X-Cache', 'MISS');

				await cacheGovernmentJobs(request.url, response);

				return response;
			} catch (error) {
				console.error('Get single government job error:', error);

				return jsonResponse(
					{
						success: false,
						message: 'Failed to fetch government job',
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
				const updateData: Partial<GovernmentJob> = {};
				let pdfFile: File | null = null;

				if (isMultipartRequest(request)) {
					const formData = await request.formData();

					const textFields: Array<keyof Omit<GovernmentJob, 'id' | 'pdf' | 'pdfKey' | 'vacancies' | 'enabled' | 'createdAt' | 'updatedAt'>> = [
						'title',
						'titleHindi',
						'department',
						'departmentHindi',
						'publishedDate',
						'lastDate',
						'description',
					];

					for (const field of textFields) {
						const value = getOptionalFormText(formData, field);
						if (value !== undefined) {
							updateData[field] = value;
						}
					}

					const vacanciesVal = formData.get('vacancies');
					if (vacanciesVal !== null) {
						updateData.vacancies = parseVacancies(vacanciesVal);
					}

					const enabledVal = formData.get('enabled');
					if (enabledVal !== null) {
						updateData.enabled = parseOptionalBoolean(enabledVal);
					}

					if (formData.has('pdf')) {
						pdfFile = getPdfFile(formData.get('pdf'));
					}
				} else {
					const body = (await request.json()) as Record<string, unknown>;

					for (const field of ['title', 'titleHindi', 'department', 'departmentHindi', 'publishedDate', 'lastDate', 'description'] as const) {
						if (typeof body[field] === 'string') {
							updateData[field] = (body[field] as string).trim();
						}
					}

					if ('vacancies' in body && body.vacancies !== undefined) {
						updateData.vacancies = parseVacancies(body.vacancies);
					}

					if ('enabled' in body && body.enabled !== undefined) {
						updateData.enabled = parseOptionalBoolean(body.enabled);
					}
				}

				if (Object.keys(updateData).length === 0 && !pdfFile) {
					throw new RequestValidationError('No valid fields or PDF provided for update');
				}

				const db = await getDatabase(env);
				const collection = db.collection<GovernmentJob>(collectionName);
				const existingJob = await collection.findOne({ id });

				if (!existingJob) {
					return jsonResponse({ success: false, message: 'Government job not found' }, 404, corsHeaders);
				}

				if (pdfFile) {
					const pdfKey = `government-jobs/${id}.pdf`;

					await env.PDF_BUCKET.put(pdfKey, pdfFile.stream(), {
						httpMetadata: {
							contentType: 'application/pdf',
						},
					});

					updateData.pdfKey = pdfKey;
					updateData.pdf = getPublicPdfUrl(env, pdfKey);
				}

				updateData.updatedAt = new Date().toISOString();

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
					await invalidateGovernmentJobsCache(url.origin, id);
				} catch (cacheError) {
					console.error('Government jobs cache invalidation failed:', cacheError);
				}

				return jsonResponse(
					{
						success: true,
						message: 'Government job updated successfully',
						data: result,
					},
					200,
					corsHeaders,
				);
			} catch (error) {
				console.error('Update government job error:', error);

				return jsonResponse(
					{
						success: false,
						message: error instanceof RequestValidationError ? error.message : 'Failed to update government job',
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
				const collection = db.collection<GovernmentJob>(collectionName);
				const job = await collection.findOne({ id });

				if (!job) {
					return jsonResponse(
						{
							success: false,
							message: 'Government job not found',
						},
						404,
						corsHeaders,
					);
				}

				// Only delete PDF if it strictly belongs to government-jobs/
				if (job.pdfKey && job.pdfKey.startsWith('government-jobs/')) {
					try {
						await env.PDF_BUCKET.delete(job.pdfKey);
					} catch (storageError) {
						console.error('Failed to delete job PDF from R2:', storageError);
					}
				}

				const result = await collection.deleteOne({ id });

				if (result.deletedCount === 0) {
					return jsonResponse(
						{
							success: false,
							message: 'Government job not found',
						},
						404,
						corsHeaders,
					);
				}

				try {
					await invalidateGovernmentJobsCache(url.origin, id);
				} catch (cacheError) {
					console.error('Government jobs cache invalidation failed:', cacheError);
				}

				return jsonResponse(
					{
						success: true,
						message: 'Government job deleted successfully',
					},
					200,
					corsHeaders,
				);
			} catch (error) {
				console.error('Delete government job error:', error);

				return jsonResponse(
					{
						success: false,
						message: 'Failed to delete government job',
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

	if (url.pathname.startsWith(downloadPrefix) && request.method === 'GET') {
		const id = decodeURIComponent(url.pathname.substring(downloadPrefix.length)).trim();

		if (!id) {
			return jsonResponse(
				{
					success: false,
					message: 'Government job id is required',
				},
				400,
				corsHeaders,
			);
		}

		try {
			const db = await getDatabase(env);
			const job = await db.collection<GovernmentJob>(collectionName).findOne({ id });

			if (!job) {
				return jsonResponse(
					{
						success: false,
						message: 'Government job not found',
					},
					404,
					corsHeaders,
				);
			}

			const pdfKey = job.pdfKey || `government-jobs/${id}.pdf`;
			let pdfStream: ReadableStream | null = null;
			let etag: string | undefined;

			const object = await env.PDF_BUCKET.get(pdfKey);
			if (object) {
				pdfStream = object.body;
				etag = object.httpEtag;
			} else {
				// Fallback to public R2 URL (essential during local development or when R2 bucket is remote)
				const publicUrl = job.pdf || getPublicPdfUrl(env, pdfKey);
				try {
					const remoteResponse = await fetch(publicUrl);
					if (remoteResponse.ok && remoteResponse.body) {
						pdfStream = remoteResponse.body;
						etag = remoteResponse.headers.get('ETag') || undefined;
					}
				} catch (fetchError) {
					console.error('Failed to fetch fallback public job PDF:', fetchError);
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

			const rawTitle = (job.title || 'haryana-job').trim();
			const safeTitle = rawTitle.replace(/["\/\r\n\\]/g, '').trim() || 'haryana-job';
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
			console.error('Download government job PDF error:', error);

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
