import {
	cacheLatestUpdatesResponse,
	getCachedLatestUpdatesResponse,
	getLatestUpdatesData,
	latestUpdatesCacheTtlSeconds,
} from '../cache/latestUpdates';

interface Env {
	MONGODB_URI: string;
	LATEST_UPDATES_KV?: {
		get(key: string, type: 'json'): Promise<unknown>;
		put(key: string, value: string): Promise<void>;
	};
}

const basePath = '/api/latest-updates';

function jsonResponse(data: unknown, status = 200, corsHeaders: Record<string, string> = {}): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...corsHeaders,
		},
	});
}

export async function handleLatestUpdatesRoutes(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>,
): Promise<Response | null> {
	const url = new URL(request.url);

	if (url.pathname === basePath && request.method === 'GET') {
		try {
			// 1. Check Cloudflare Workers edge cache
			const cachedResponse = await getCachedLatestUpdatesResponse(url.origin);
			if (cachedResponse) {
				console.log('Latest updates edge cache HIT');
				return cachedResponse;
			}

			console.log('Latest updates edge cache MISS');

			// 2. Ultra-fast lookup directly from KV or single point-lookup cache document
			const latestUpdates = await getLatestUpdatesData(env);

			const response = jsonResponse(
				{
					success: true,
					data: latestUpdates,
				},
				200,
				corsHeaders,
			);

			response.headers.set(
				'Cache-Control',
				`public, max-age=0, s-maxage=${latestUpdatesCacheTtlSeconds}, must-revalidate`,
			);

			// 3. Store response in edge cache
			await cacheLatestUpdatesResponse(url.origin, response);

			return response;
		} catch (error) {
			console.error('Get latest updates error:', error);
			return jsonResponse(
				{
					success: false,
					message: 'Failed to fetch latest updates',
					error: error instanceof Error ? error.message : String(error),
				},
				500,
				corsHeaders,
			);
		}
	}

	return null;
}
