const homepageSectionsPath = '/api/homepage-sections';
export const homepageSectionsCacheTtlSeconds = 1800;

function getCacheKey(origin: string): Request {
	return new Request(`${origin}${homepageSectionsPath}`, { method: 'GET' });
}

export async function getCachedHomepageSections(origin: string): Promise<Response | undefined> {
	return caches.default.match(getCacheKey(origin));
}

export async function cacheHomepageSections(origin: string, response: Response): Promise<void> {
	await caches.default.put(getCacheKey(origin), response.clone());
}

export async function invalidateHomepageSectionsCache(origin: string): Promise<boolean> {
	return caches.default.delete(getCacheKey(origin));
}
