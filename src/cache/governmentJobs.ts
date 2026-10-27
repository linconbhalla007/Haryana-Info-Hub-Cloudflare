export const governmentJobsCacheTtlSeconds = 3600; // 1 Hour

function getCacheKey(urlStr: string): Request {
	return new Request(urlStr, { method: 'GET' });
}

/**
 * Retrieve cached response from Cloudflare Edge Cache.
 */
export async function getCachedGovernmentJobs(urlStr: string): Promise<Response | undefined> {
	try {
		const cached = await caches.default.match(getCacheKey(urlStr));
		if (cached) {
			const res = new Response(cached.body, cached);
			res.headers.set('X-Cache', 'HIT');
			return res;
		}
		return undefined;
	} catch (error) {
		console.error('Government jobs edge cache match error:', error);
		return undefined;
	}
}

/**
 * Store response in Cloudflare Edge Cache for 1 hour.
 */
export async function cacheGovernmentJobs(urlStr: string, response: Response): Promise<void> {
	try {
		await caches.default.put(getCacheKey(urlStr), response.clone());
	} catch (error) {
		console.error('Government jobs edge cache put error:', error);
	}
}

/**
 * Invalidate cached lists and specific job details.
 */
export async function invalidateGovernmentJobsCache(origin: string, jobId?: string): Promise<void> {
	const pathsToInvalidate = [
		'/api/jobs',
		'/api/jobs?page=1',
		'/api/jobs?page=1&limit=15',
		'/api/jobs?page=1&limit=10',
		'/api/jobs?page=1&limit=20',
		'/api/jobs?page=1&limit=100',
		'/api/jobs?limit=15',
		'/api/jobs?limit=10',
		'/api/jobs?limit=100',
	];

	if (jobId) {
		pathsToInvalidate.push(`/api/jobs/${jobId}`);
	}

	try {
		await Promise.allSettled(
			pathsToInvalidate.map((path) => caches.default.delete(getCacheKey(`${origin}${path}`))),
		);
		console.log('Government jobs edge cache invalidated');
	} catch (error) {
		console.error('Government jobs edge cache invalidation failed:', error);
	}
}
