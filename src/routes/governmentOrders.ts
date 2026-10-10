import { getDatabase, getNextGovernmentOrderId } from '../db/mongodb';
import { GovernmentOrder } from '../types/governmentOrder';
import { saveLatestUpdateAtWriteTime } from '../cache/latestUpdates';
import { LatestUpdateItem } from '../types/latestUpdate';

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

const collectionName = 'government_orders';
const basePath = '/api/government-orders';
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
		throw new RequestValidationError('pdf must not exceed 20 MB');
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

export async function handleGovernmentOrderRoutes(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>,
): Promise<Response | null> {
	const url = new URL(request.url);

	// ==================================================
	// GET ALL ORDERS
	// ==================================================

	if (url.pathname === basePath && request.method === 'GET') {
		try {
			const page = parsePositiveInteger(url.searchParams.get('page'), defaultPage, 'page');
			const requestedLimit = parsePositiveInteger(url.searchParams.get('limit'), defaultLimit, 'limit');
			const limit = Math.min(requestedLimit, maximumLimit);
			const skip = (page - 1) * limit;

			if (!Number.isSafeInteger(skip)) {
				throw new Error('page is too large');
			}

			const db = await getDatabase(env);
			const collection = db.collection<GovernmentOrder>(collectionName);

			const [orders, total] = await Promise.all([
				collection.find({}).sort({ _id: -1 }).skip(skip).limit(limit).toArray(),
				collection.countDocuments(),
			]);
			const totalPages = Math.ceil(total / limit);

			return jsonResponse(
				{
					success: true,
					count: orders.length,
					data: orders,
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
		} catch (error) {
			console.error('Get government orders error:', error);
			const message = error instanceof Error ? error.message : String(error);
			const isValidationError =
				message === 'page must be a positive integer' || message === 'limit must be a positive integer' || message === 'page is too large';

			return jsonResponse(
				{
					success: false,
					message: isValidationError ? 'Invalid pagination parameters' : 'Failed to fetch government orders',
					error: message,
				},
				isValidationError ? 400 : 500,
				corsHeaders,
			);
		}
	}

	// ==================================================
	// CREATE ORDER
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
			const orderNumber = getRequiredFormText(formData, 'orderNumber');
			const pdfFile = getPdfFile(formData.get('pdf'));

			const id = await getNextGovernmentOrderId(env);
			const pdfKey = `government-orders/${id}.pdf`;
			const pdf = getPublicPdfUrl(env, pdfKey);

			try {
				await env.PDF_BUCKET.put(pdfKey, pdfFile.stream(), {
					httpMetadata: {
						contentType: 'application/pdf',
					},
				});
			} catch (error) {
				console.error('Government order PDF upload failed:', error);
				return jsonResponse({ success: false, message: 'Failed to upload government order PDF' }, 500, corsHeaders);
			}

			const createdAt = new Date().toISOString();

			const order: GovernmentOrder = {
				id,
				title,
				date,
				department,
				departmentHindi,
				description,
				orderNumber,
				pdf,
				pdfKey,
				createdAt,
			};

			try {
				const db = await getDatabase(env);
				const collection = db.collection<GovernmentOrder>(collectionName);
				await collection.insertOne(order);
			} catch (error) {
				console.error('Government order database insert failed:', error);

				try {
					await env.PDF_BUCKET.delete(pdfKey);
				} catch (cleanupError) {
					console.error('Government order PDF cleanup failed:', cleanupError);
				}

				return jsonResponse({ success: false, message: 'Failed to create government order' }, 500, corsHeaders);
			}

			// Pre-aggregate & write-time cache for Latest Updates
			const latestUpdateItem: LatestUpdateItem = {
				id: `notification-${order.id}`,
				title: order.title,
				description: order.description,
				type: 'government_order',
				link: `/government-orders/${order.id}`,
				createdAt,
				enabled: true,
			};

			try {
				await saveLatestUpdateAtWriteTime(env, latestUpdateItem, url.origin);
			} catch (cacheError) {
				console.error('Latest updates write-time cache failed:', cacheError);
			}

			return jsonResponse(
				{
					success: true,
					message: 'Government order created successfully',
					data: order,
				},
				201,
				corsHeaders,
			);
		} catch (error) {
			console.error('Create government order error:', error);

			return jsonResponse(
				{
					success: false,
					message: error instanceof RequestValidationError ? error.message : 'Failed to create government order',
				},
				error instanceof RequestValidationError ? 400 : 500,
				corsHeaders,
			);
		}
	}

	// ==================================================
	// SINGLE ORDER
	// ==================================================

	if (url.pathname.startsWith(`${basePath}/`)) {
		const id = decodeURIComponent(url.pathname.substring(basePath.length + 1));

		if (!id) {
			return jsonResponse(
				{
					success: false,
					message: 'Government order id is required',
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
				const db = await getDatabase(env);

				const order = await db.collection<GovernmentOrder>(collectionName).findOne({ id });

				if (!order) {
					return jsonResponse(
						{
							success: false,
							message: 'Government order not found',
						},
						404,
						corsHeaders,
					);
				}

				return jsonResponse(
					{
						success: true,
						data: order,
					},
					200,
					corsHeaders,
				);
			} catch (error) {
				console.error('Get single government order error:', error);

				return jsonResponse(
					{
						success: false,
						message: 'Failed to fetch government order',
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
				const updateData: Partial<GovernmentOrder> = {};
				let pdfFile: File | null = null;

				if (isMultipartRequest(request)) {
					const formData = await request.formData();
					const fields: Array<keyof Omit<GovernmentOrder, 'id' | 'pdf' | 'pdfKey'>> = [
						'title',
						'date',
						'department',
						'departmentHindi',
						'description',
						'orderNumber',
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
					const body = (await request.json()) as Partial<Omit<GovernmentOrder, 'id' | 'pdf' | 'pdfKey'>>;

					for (const field of ['title', 'date', 'department', 'departmentHindi', 'description', 'orderNumber'] as const) {
						if (typeof body[field] === 'string') {
							updateData[field] = body[field];
						}
					}
				}

				if (Object.keys(updateData).length === 0 && !pdfFile) {
					throw new RequestValidationError('No valid fields or PDF provided for update');
				}

				const db = await getDatabase(env);
				const collection = db.collection<GovernmentOrder>(collectionName);
				const existingOrder = await collection.findOne({ id });

				if (!existingOrder) {
					return jsonResponse({ success: false, message: 'Government order not found' }, 404, corsHeaders);
				}

				if (pdfFile) {
					const pdfKey = `government-orders/${id}.pdf`;

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

				return jsonResponse(
					{
						success: true,
						message: 'Government order updated successfully',
						data: result,
					},
					200,
					corsHeaders,
				);
			} catch (error) {
				console.error('Update government order error:', error);

				return jsonResponse(
					{
						success: false,
						message: error instanceof RequestValidationError ? error.message : 'Failed to update government order',
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
				const collection = db.collection<GovernmentOrder>(collectionName);
				const order = await collection.findOne({ id });

				if (!order) {
					return jsonResponse(
						{
							success: false,
							message: 'Government order not found',
						},
						404,
						corsHeaders,
					);
				}

				if (order.pdfKey) {
					await env.PDF_BUCKET.delete(order.pdfKey);
				}

				const result = await collection.deleteOne({ id });

				if (result.deletedCount === 0) {
					return jsonResponse(
						{
							success: false,
							message: 'Government order not found',
						},
						404,
						corsHeaders,
					);
				}

				return jsonResponse(
					{
						success: true,
						message: 'Government order deleted successfully',
					},
					200,
					corsHeaders,
				);
			} catch (error) {
				console.error('Delete government order error:', error);

				return jsonResponse(
					{
						success: false,
						message: 'Failed to delete government order',
						error: error instanceof Error ? error.message : String(error),
					},
					500,
					corsHeaders,
				);
			}
		}
	}

	return null;
}
