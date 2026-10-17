export const employeeProformasCacheTtlSeconds = 3600; // 1 Hour

function getCacheKey(urlStr: string): Request {
	return new Request(urlStr, { method: 'GET' });
}

/**
 * Retrieve cached response from Cloudflare Edge Cache.
 */
export async function getCachedEmployeeProformas(urlStr: string): Promise<Response | undefined> {
	try {
		const cached = await caches.default.match(getCacheKey(urlStr));
		if (cached) {
			const res = new Response(cached.body, cached);
			res.headers.set('X-Cache', 'HIT');
			return res;
		}
		return undefined;
	} catch (error) {
		console.error('Employee proformas edge cache match error:', error);
		return undefined;
	}
}

/**
 * Store response in Cloudflare Edge Cache for 1 hour.
 */
export async function cacheEmployeeProformas(urlStr: string, response: Response): Promise<void> {
	try {
		await caches.default.put(getCacheKey(urlStr), response.clone());
	} catch (error) {
		console.error('Employee proformas edge cache put error:', error);
	}
}

/**
 * Invalidate cached lists and specific proforma details.
 */
export async function invalidateEmployeeProformasCache(origin: string, proformaId?: string): Promise<void> {
	const pathsToInvalidate = [
		'/api/proformas',
		'/api/proformas?page=1',
		'/api/proformas?page=1&limit=15',
		'/api/proformas?page=1&limit=10',
		'/api/proformas?page=1&limit=20',
		'/api/proformas?page=1&limit=100',
		'/api/proformas?limit=15',
		'/api/proformas?limit=10',
		'/api/proformas?limit=100',
	];

	if (proformaId) {
		pathsToInvalidate.push(`/api/proformas/${proformaId}`);
	}

	try {
		await Promise.allSettled(
			pathsToInvalidate.map((path) => caches.default.delete(getCacheKey(`${origin}${path}`))),
		);
		console.log('Employee proformas edge cache invalidated');
	} catch (error) {
		console.error('Employee proformas edge cache invalidation failed:', error);
	}
}
