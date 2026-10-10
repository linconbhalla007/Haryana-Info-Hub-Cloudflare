import { handleSystemRoutes } from './routes/system';
import { handleAuthRoutes } from './routes/auth';
import { handleGovernmentOrderRoutes } from './routes/governmentOrders';
import { handleHomepageSectionRoutes } from './routes/homepageSections';
import { handleLatestUpdatesRoutes } from './routes/latestUpdates';

interface Env {
	MONGODB_URI: string;
	PDF_BUCKET: R2Bucket;
	R2_PUBLIC_URL: string;
	LATEST_UPDATES_KV?: any;
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

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const corsHeaders = {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		};

		// CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 204,
				headers: corsHeaders,
			});
		}

		// System routes
		const systemResponse = await handleSystemRoutes(request, env, corsHeaders);

		if (systemResponse) {
			return systemResponse;
		}

		// Authentication routes
		const authResponse = await handleAuthRoutes(request, env, corsHeaders);

		if (authResponse) {
			return authResponse;
		}

		// Government Orders routes
		const governmentOrderResponse = await handleGovernmentOrderRoutes(request, env, corsHeaders);

		if (governmentOrderResponse) {
			return governmentOrderResponse;
		}

		// Homepage sections routes
		const homepageSectionResponse = await handleHomepageSectionRoutes(request, env, corsHeaders);

		if (homepageSectionResponse) {
			return homepageSectionResponse;
		}

		// Latest updates routes
		const latestUpdatesResponse = await handleLatestUpdatesRoutes(request, env, corsHeaders);

		if (latestUpdatesResponse) {
			return latestUpdatesResponse;
		}

		// Default response
		return jsonResponse(
			{
				success: true,
				message: 'Haryana Info API',
			},
			200,
			corsHeaders,
		);
	},
};
