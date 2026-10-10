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
export const latestUpdatesCacheTtlSeconds = 1800;
const collectionName = 'latest_updates';
const cacheDocId = 'latest_updates';

function getCacheKey(origin: string): Request {
	return new Request(`${origin}${latestUpdatesPath}`, { method: 'GET' });
}

export async function getCachedLatestUpdatesResponse(origin: string): Promise<Response | undefined> {
	try {
		return await caches.default.match(getCacheKey(origin));
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
		return await caches.default.delete(getCacheKey(origin));
	} catch (error) {
		console.error('Edge cache invalidation error:', error);
		return false;
	}
}

/**
 * Write-time caching hook:
 * Pre-aggregates and updates the dedicated cache document and KV/edge caches
 * immediately upon new order insertion.
 */
export async function saveLatestUpdateAtWriteTime(env: Env, item: LatestUpdateItem, origin?: string): Promise<void> {
	const db = await getDatabase(env);
	const collection = db.collection<LatestUpdatesDocument>(collectionName);

	const updateResult = await collection.findOneAndUpdate(
		{ _id: cacheDocId },
		{
			$push: {
				items: {
					$each: [item],
					$position: 0,
					$slice: 50,
				},
			},
			$set: {
				updatedAt: new Date().toISOString(),
			},
		},
		{
			upsert: true,
			returnDocument: 'after',
		},
	);

	const updatedItems = updateResult?.items ?? [item];

	// Update Cloudflare KV if bound
	if (env.LATEST_UPDATES_KV) {
		try {
			await env.LATEST_UPDATES_KV.put(cacheDocId, JSON.stringify(updatedItems));
		} catch (kvError) {
			console.error('Latest updates KV write failed:', kvError);
		}
	}

	// Invalidate Cloudflare Workers edge cache
	if (origin) {
		await invalidateLatestUpdatesCache(origin);
	}
}

/**
 * Read-time fast path:
 * Zero table scans or sorting. Fetches directly from KV or single point-lookup document.
 */
export async function getLatestUpdatesData(env: Env): Promise<LatestUpdateItem[]> {
	// 1. Fast path from KV if available
	if (env.LATEST_UPDATES_KV) {
		try {
			const kvItems = (await env.LATEST_UPDATES_KV.get(cacheDocId, 'json')) as LatestUpdateItem[] | null;
			if (Array.isArray(kvItems)) {
				return kvItems;
			}
		} catch (kvError) {
			console.error('Latest updates KV read failed:', kvError);
		}
	}

	// 2. Direct point lookup in MongoDB by primary key (_id)
	const db = await getDatabase(env);
	const collection = db.collection<LatestUpdatesDocument>(collectionName);
	const doc = await collection.findOne({ _id: cacheDocId });

	if (doc && Array.isArray(doc.items)) {
		return doc.items;
	}

	// 3. Fallback bootstrap if collection has not been populated yet
	const ordersCollection = db.collection<GovernmentOrder>('government_orders');
	const recentOrders = await ordersCollection.find({}).sort({ _id: -1 }).limit(15).toArray();

	const bootstrappedItems: LatestUpdateItem[] = recentOrders.map((order) => ({
		id: `notification-${order.id}`,
		title: order.title,
		description: order.description,
		type: 'government_order',
		link: `/government-orders/${order.id}`,
		createdAt: order.createdAt || order.date || new Date().toISOString(),
		enabled: true,
	}));

	if (bootstrappedItems.length > 0) {
		await collection.updateOne(
			{ _id: cacheDocId },
			{
				$set: {
					items: bootstrappedItems,
					updatedAt: new Date().toISOString(),
				},
			},
			{ upsert: true },
		);

		if (env.LATEST_UPDATES_KV) {
			try {
				await env.LATEST_UPDATES_KV.put(cacheDocId, JSON.stringify(bootstrappedItems));
			} catch (kvError) {
				console.error('Latest updates KV bootstrap put failed:', kvError);
			}
		}
	}

	return bootstrappedItems;
}
