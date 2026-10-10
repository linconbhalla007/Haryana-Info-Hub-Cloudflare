import { MongoServerError } from 'mongodb';
import {
	cacheHomepageSections,
	getCachedHomepageSections,
	homepageSectionsCacheTtlSeconds,
	invalidateHomepageSectionsCache,
} from '../cache/homepageSections';
import { getDatabase } from '../db/mongodb';
import { HomepageSection, HomepageSectionStatus, HomepageSectionWithStatus } from '../types/homepageSection';

interface Env {
	MONGODB_URI: string;
}

const collectionName = 'homepage_sections';
const basePath = '/api/homepage-sections';
let homepageSectionIndexPromise: Promise<void> | null = null;

class RequestValidationError extends Error {}

function jsonResponse(data: unknown, status = 200, corsHeaders: Record<string, string> = {}): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', ...corsHeaders },
	});
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredText(value: unknown, fieldName: string): string {
	if (typeof value !== 'string' || !value.trim()) throw new RequestValidationError(`${fieldName} is required`);
	return value.trim();
}

function displayOrder(value: unknown): number {
	if (typeof value !== 'number' || !Number.isFinite(value)) throw new RequestValidationError('displayOrder must be numeric');
	return value;
}

function optionalIsoDate(value: unknown, fieldName: string): string | null {
	if (value === null || value === undefined) return null;
	if (typeof value !== 'string' || !value.trim() || Number.isNaN(Date.parse(value))) {
		throw new RequestValidationError(`${fieldName} must be a valid ISO date`);
	}
	return value;
}

function validateDateRange(startAt: string | null, endAt: string | null): void {
	if (startAt && endAt && Date.parse(endAt) <= Date.parse(startAt)) throw new RequestValidationError('endAt must be after startAt');
}

function statusFor(section: HomepageSection, now = Date.now()): HomepageSectionStatus {
	if (!section.enabled) return 'DISABLED';
	if (section.startAt && now < Date.parse(section.startAt)) return 'SCHEDULED';
	if (section.endAt && now > Date.parse(section.endAt)) return 'EXPIRED';
	return 'ACTIVE';
}

function sectionWithStatus(section: HomepageSection): HomepageSectionWithStatus {
	return { ...section, status: statusFor(section) };
}

async function ensureKeyIndex(env: Env): Promise<void> {
	if (homepageSectionIndexPromise) return homepageSectionIndexPromise;

	homepageSectionIndexPromise = (async () => {
		const db = await getDatabase(env);
		const collection = db.collection<HomepageSection>(collectionName);
		const keyIndex = (await collection.listIndexes().toArray()).find(
			(index) => Object.keys(index.key).length === 1 && index.key.key === 1,
		);
		if (keyIndex) {
			if (keyIndex.unique) return;
			throw new Error('homepage_sections.key has a non-unique index');
		}
		await collection.createIndex({ key: 1 }, { unique: true });
	})();

	try {
		await homepageSectionIndexPromise;
	} catch (error) {
		homepageSectionIndexPromise = null;
		throw error;
	}
}

function duplicateKey(error: unknown): boolean {
	return error instanceof MongoServerError && error.code === 11000;
}

export async function handleHomepageSectionRoutes(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>,
): Promise<Response | null> {
	const url = new URL(request.url);

	if (url.pathname === basePath && request.method === 'GET') {
		try {
			const cachedResponse = await getCachedHomepageSections(url.origin);

			if (cachedResponse) {
				console.log('Homepage sections cache HIT');
				return cachedResponse;
			}

			console.log('Homepage sections cache MISS');
			const db = await getDatabase(env);
			const sections = await db.collection<HomepageSection>(collectionName).find({ enabled: true }).toArray();
			const active = sections
				.filter((section) => statusFor(section) === 'ACTIVE')
				.sort((first, second) => first.displayOrder - second.displayOrder || first.key.localeCompare(second.key));
			const response = jsonResponse({ success: true, data: active }, 200, corsHeaders);
			response.headers.set('Cache-Control', `public, max-age=0, s-maxage=${homepageSectionsCacheTtlSeconds}, must-revalidate`);

			try {
				await cacheHomepageSections(url.origin, response);
				console.log('Homepage sections cache STORED');
			} catch (cacheError) {
				console.error('Homepage sections cache store failed:', cacheError);
			}

			return response;
		} catch (error) {
			console.error('Get active homepage sections error:', error);
			return jsonResponse({ success: false, message: 'Failed to fetch homepage sections' }, 500, corsHeaders);
		}
	}

	if (url.pathname === `${basePath}/all` && request.method === 'GET') {
		try {
			const db = await getDatabase(env);
			const sections = await db.collection<HomepageSection>(collectionName).find({}).sort({ displayOrder: 1, key: 1 }).toArray();
			return jsonResponse({ success: true, data: sections.map(sectionWithStatus) }, 200, corsHeaders);
		} catch (error) {
			console.error('Get all homepage sections error:', error);
			return jsonResponse({ success: false, message: 'Failed to fetch homepage sections' }, 500, corsHeaders);
		}
	}

	if (url.pathname === basePath && request.method === 'POST') {
		try {
			const body = (await request.json()) as Record<string, unknown>;
			const key = requiredText(body.key, 'key');
			const type = requiredText(body.type, 'type');
			if (typeof body.enabled !== 'boolean') throw new RequestValidationError('enabled must be boolean');
			if (!isRecord(body.config)) throw new RequestValidationError('config must be an object');
			const startAt = optionalIsoDate(body.startAt, 'startAt');
			const endAt = optionalIsoDate(body.endAt, 'endAt');
			validateDateRange(startAt, endAt);
			const now = new Date().toISOString();
			const section: HomepageSection = {
				_id: key, key, type, enabled: body.enabled, startAt, endAt,
				displayOrder: displayOrder(body.displayOrder), config: body.config, createdAt: now, updatedAt: now,
			};
			await ensureKeyIndex(env);
			const db = await getDatabase(env);
			await db.collection<HomepageSection>(collectionName).insertOne(section);
			try {
				await invalidateHomepageSectionsCache(url.origin);
				console.log('Homepage sections cache INVALIDATED after create');
			} catch (cacheError) {
				console.error('Homepage sections cache invalidation failed after create:', cacheError);
			}

			return jsonResponse({ success: true, message: 'Homepage section created successfully', data: sectionWithStatus(section) }, 201, corsHeaders);
		} catch (error) {
			console.error('Create homepage section error:', error);
			if (error instanceof RequestValidationError) return jsonResponse({ success: false, message: error.message }, 400, corsHeaders);
			if (duplicateKey(error)) return jsonResponse({ success: false, message: 'Homepage section with this key already exists' }, 409, corsHeaders);
			return jsonResponse({ success: false, message: 'Failed to create homepage section' }, 500, corsHeaders);
		}
	}

	if (!url.pathname.startsWith(`${basePath}/`)) return null;
	const key = decodeURIComponent(url.pathname.substring(basePath.length + 1));
	if (!key) return jsonResponse({ success: false, message: 'Homepage section key is required' }, 400, corsHeaders);
	if (request.method === 'DELETE') return jsonResponse({ success: false, message: 'Homepage sections cannot be deleted' }, 405, corsHeaders);
	if (request.method !== 'PUT') return null;

	try {
		const body = (await request.json()) as Record<string, unknown>;
		const db = await getDatabase(env);
		const collection = db.collection<HomepageSection>(collectionName);
		const existing = await collection.findOne({ key });
		if (!existing) return jsonResponse({ success: false, message: 'Homepage section not found' }, 404, corsHeaders);

		const update: Partial<HomepageSection> = { updatedAt: new Date().toISOString() };
		if ('type' in body) update.type = requiredText(body.type, 'type');
		if ('enabled' in body) {
			if (typeof body.enabled !== 'boolean') throw new RequestValidationError('enabled must be boolean');
			update.enabled = body.enabled;
		}
		if ('displayOrder' in body) update.displayOrder = displayOrder(body.displayOrder);
		if ('config' in body) {
			if (!isRecord(body.config)) throw new RequestValidationError('config must be an object');
			update.config = body.config;
		}
		const startAt = 'startAt' in body ? optionalIsoDate(body.startAt, 'startAt') : existing.startAt;
		const endAt = 'endAt' in body ? optionalIsoDate(body.endAt, 'endAt') : existing.endAt;
		validateDateRange(startAt, endAt);
		if ('startAt' in body) update.startAt = startAt;
		if ('endAt' in body) update.endAt = endAt;
		if (Object.keys(update).length === 1) throw new RequestValidationError('No valid fields provided for update');

		const updated = await collection.findOneAndUpdate({ key }, { $set: update }, { returnDocument: 'after' });
		try {
			await invalidateHomepageSectionsCache(url.origin);
			console.log('Homepage sections cache INVALIDATED after update');
		} catch (cacheError) {
			console.error('Homepage sections cache invalidation failed after update:', cacheError);
		}

		return jsonResponse({ success: true, message: 'Homepage section updated successfully', data: sectionWithStatus(updated!) }, 200, corsHeaders);
	} catch (error) {
		console.error('Update homepage section error:', error);
		if (error instanceof RequestValidationError) return jsonResponse({ success: false, message: error.message }, 400, corsHeaders);
		return jsonResponse({ success: false, message: 'Failed to update homepage section' }, 500, corsHeaders);
	}
}
