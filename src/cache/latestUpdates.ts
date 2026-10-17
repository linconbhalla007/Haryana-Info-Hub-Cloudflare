import { getDatabase } from '../db/mongodb';
import { GovernmentOrder } from '../types/governmentOrder';
import { LatestUpdateItem, LatestUpdatesDocument } from '../types/latestUpdate';

interface Env {
	MONGODB_URI: string;
	LATEST_UPDATES_KV?: {
		get(key: string, type: 'json'): Promise<unknown>;
		put(key: string, value: string): Promise<void>;
	};
}

const latestUpdatesPath = '/api/latest-updates';
export const latestUpdatesCacheTtlSeconds = 3600; // 1 Hour
const collectionName = 'latest_updates';
const cacheDocId = 'latest_updates';

function getCacheKey(origin: string): Request {
	return new Request(`${origin}${latestUpdatesPath}`, { method: 'GET' });
}

export async function getCachedLatestUpdatesResponse(origin: string): Promise<Response | undefined> {
	try {
		const cached = await caches.default.match(getCacheKey(origin));
		if (cached) {
			const res = new Response(cached.body, cached);
			res.headers.set('X-Cache', 'HIT');
			return res;
		}
		return undefined;
	} catch (error) {
		console.error('Edge cache match error:', error);
		return undefined;
	}
}

export async function cacheLatestUpdatesResponse(origin: string, response: Response): Promise<void> {
	try {
		await caches.default.put(getCacheKey(origin), response.clone());
	} catch (error) {
		console.error('Edge cache put error:', error);
	}
}

export async function invalidateLatestUpdatesCache(origin: string): Promise<boolean> {
	try {
		const deleted = await caches.default.delete(getCacheKey(origin));
		console.log('Latest updates edge cache invalidated:', deleted);
		return deleted;
	} catch (error) {
		console.error('Edge cache invalidation error:', error);
		return false;
	}
}

/**
 * Refreshes the latest 10 records from BOTH government_orders and employee_proformas,
 * merges them, sorts by createdAt descending, and returns only the top 10.
 * Stores the result in the latest_updates cache collection, KV, and invalidates edge cache.
 */
export async function refreshLatestUpdatesCache(env: Env, origin?: string): Promise<LatestUpdateItem[]> {
	const db = await getDatabase(env);

	// Fetch up to 20 recent records from both collections in parallel
	const [recentOrders, recentProformas] = await Promise.all([
		db.collection<GovernmentOrder>('government_orders').find({}).sort({ _id: -1 }).limit(20).toArray(),
		db
			.collection<{ id: string; title: string; description: string; createdAt?: string; date?: string }>(
				'employee_proformas',
			)
			.find({})
			.sort({ _id: -1 })
			.limit(20)
			.toArray(),
	]);

	// Map government orders → LatestUpdateItem
	const orderItems: LatestUpdateItem[] = recentOrders.map((order) => ({
		id: `notification-order-${order.id}`,
		title: order.title,
		description: order.description,
		type: 'government_order',
		link: `/government-orders/${order.id}`,
		createdAt: order.createdAt || order.date || new Date().toISOString(),
		enabled: true,
	}));

	// Map employee proformas → LatestUpdateItem
	// Frontend list route confirmed in Navbar.jsx: /proforma-files
	const proformaItems: LatestUpdateItem[] = recentProformas.map((proforma) => ({
		id: `notification-proforma-${proforma.id}`,
		title: proforma.title,
		description: proforma.description,
		type: 'employee_proforma',
		link: '/proforma-files',
		createdAt: proforma.createdAt || proforma.date || new Date().toISOString(),
		enabled: true,
	}));

	// Merge both lists, sort globally newest-first using real timestamps, keep top 10
	const latest10: LatestUpdateItem[] = [...orderItems, ...proformaItems]
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
		.slice(0, 10);

	// Persist to the latest_updates MongoDB collection (single point-lookup document)
	const collection = db.collection<LatestUpdatesDocument>(collectionName);
	await collection.updateOne(
		{ _id: cacheDocId },
		{
			$set: {
				items: latest10,
				updatedAt: new Date().toISOString(),
			},
		},
		{ upsert: true },
	);

	// Write to KV if binding is configured
	if (env.LATEST_UPDATES_KV) {
		try {
			await env.LATEST_UPDATES_KV.put(cacheDocId, JSON.stringify(latest10));
		} catch (kvError) {
			console.error('Latest updates KV write failed:', kvError);
		}
	}

	// Invalidate Cloudflare edge cache so next request re-fetches fresh data
	if (origin) {
		await invalidateLatestUpdatesCache(origin);
	}

	return latest10;
}

/**
 * Write-time caching hook:
 * Called on create/update/delete of any government order or employee proforma.
 * Immediately re-aggregates the latest 10 from both collections and refreshes all cache layers.
 */
export async function saveLatestUpdateAtWriteTime(env: Env, _item?: LatestUpdateItem, origin?: string): Promise<void> {
	await refreshLatestUpdatesCache(env, origin);
}

/**
 * Read-time fast path:
 * Directly fetches pre-aggregated latest 10 records from KV or the latest_updates document.
 */
export async function getLatestUpdatesData(env: Env): Promise<LatestUpdateItem[]> {
	// 1. Fast path from KV if available
	if (env.LATEST_UPDATES_KV) {
		try {
			const kvItems = (await env.LATEST_UPDATES_KV.get(cacheDocId, 'json')) as LatestUpdateItem[] | null;
			if (Array.isArray(kvItems)) {
				return kvItems.slice(0, 10);
			}
		} catch (kvError) {
			console.error('Latest updates KV read failed:', kvError);
		}
	}

	// 2. Direct point lookup in MongoDB by primary key (_id)
	const db = await getDatabase(env);
	const collection = db.collection<LatestUpdatesDocument>(collectionName);
	const doc = await collection.findOne({ _id: cacheDocId });

	if (doc && Array.isArray(doc.items) && doc.items.length > 0) {
		return doc.items.slice(0, 10);
	}

	// 3. Fallback: refresh from both collections if the cache document doesn't exist yet
	return refreshLatestUpdatesCache(env);
}
