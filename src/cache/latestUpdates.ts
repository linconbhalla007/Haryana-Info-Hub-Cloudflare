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
 * Refreshes the latest 10 records from MongoDB, stores in cache collection & KV,
 * and invalidates the edge cache.
 */
export async function refreshLatestUpdatesCache(env: Env, origin?: string): Promise<LatestUpdateItem[]> {
	const db = await getDatabase(env);
	const ordersCollection = db.collection<GovernmentOrder>('government_orders');
	const recentOrders = await ordersCollection.find({}).sort({ _id: -1 }).limit(10).toArray();

	const latest10: LatestUpdateItem[] = recentOrders.map((order) => ({
		id: `notification-${order.id}`,
		title: order.title,
		description: order.description,
		type: 'government_order',
		link: `/government-orders/${order.id}`,
		createdAt: order.createdAt || order.date || new Date().toISOString(),
		enabled: true,
	}));

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

	if (env.LATEST_UPDATES_KV) {
		try {
			await env.LATEST_UPDATES_KV.put(cacheDocId, JSON.stringify(latest10));
		} catch (kvError) {
			console.error('Latest updates KV write failed:', kvError);
		}
	}

	if (origin) {
		await invalidateLatestUpdatesCache(origin);
	}

	return latest10;
}

/**
 * Write-time caching hook:
 * Immediately updates the pre-aggregated latest 10 items upon new order insertion, update, or deletion.
 */
export async function saveLatestUpdateAtWriteTime(env: Env, _item?: LatestUpdateItem, origin?: string): Promise<void> {
	await refreshLatestUpdatesCache(env, origin);
}

/**
 * Read-time fast path:
 * Directly fetches pre-aggregated latest 10 records from KV or single point-lookup document.
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

	// 3. Fallback refresh if collection has not been populated yet
	return refreshLatestUpdatesCache(env);
}
