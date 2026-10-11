export const governmentOrdersCacheTtlSeconds = 3600; // 1 Hour

function getCacheKey(urlStr: string): Request {
	return new Request(urlStr, { method: 'GET' });
}

/**
 * Retrieve cached response from Cloudflare Edge Cache.
 */
export async function getCachedGovernmentOrders(urlStr: string): Promise<Response | undefined> {
	try {
		const cached = await caches.default.match(getCacheKey(urlStr));
		if (cached) {
			const res = new Response(cached.body, cached);
			res.headers.set('X-Cache', 'HIT');
			return res;
		}
		return undefined;
	} catch (error) {
		console.error('Government orders edge cache match error:', error);
		return undefined;
	}
}

/**
 * Store response in Cloudflare Edge Cache for 1 hour.
 */
export async function cacheGovernmentOrders(urlStr: string, response: Response): Promise<void> {
	try {
		await caches.default.put(getCacheKey(urlStr), response.clone());
	} catch (error) {
		console.error('Government orders edge cache put error:', error);
	}
}

/**
 * Invalidate cached lists and specific order details.
 */
export async function invalidateGovernmentOrdersCache(origin: string, orderId?: string): Promise<void> {
	const pathsToInvalidate = [
		'/api/government-orders',
		'/api/government-orders?page=1',
		'/api/government-orders?page=1&limit=15',
		'/api/government-orders?page=1&limit=10',
		'/api/government-orders?page=1&limit=20',
		'/api/government-orders?page=1&limit=100',
		'/api/government-orders?limit=15',
		'/api/government-orders?limit=10',
		'/api/government-orders?limit=100',
	];

	if (orderId) {
		pathsToInvalidate.push(`/api/government-orders/${orderId}`);
	}

	try {
		await Promise.allSettled(
			pathsToInvalidate.map((path) => caches.default.delete(getCacheKey(`${origin}${path}`))),
		);
		console.log('Government orders edge cache invalidated');
	} catch (error) {
		console.error('Government orders edge cache invalidation failed:', error);
	}
}
