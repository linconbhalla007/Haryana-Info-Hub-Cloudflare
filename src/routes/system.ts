import { getDatabase } from '../db/mongodb';

interface Env {
	MONGODB_URI: string;
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

export async function handleSystemRoutes(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response | null> {
	const url = new URL(request.url);

	// Health check
	if (url.pathname === '/api/health' && request.method === 'GET') {
		return jsonResponse(
			{
				success: true,
				message: 'Haryana Info API is working',
			},
			200,
			corsHeaders,
		);
	}

	// Database test
	if (url.pathname === '/api/db-test' && request.method === 'GET') {
		try {
			const db = await getDatabase(env);

			const admin = await db.collection('admin_login').findOne({
				username: 'bhalla_test',
			});

			return jsonResponse(
				{
					success: true,
					message: 'MongoDB connected successfully',
					adminFound: !!admin,
					username: admin?.username ?? null,
					role: admin?.role ?? null,
					active: admin?.active ?? null,
				},
				200,
				corsHeaders,
			);
		} catch (error) {
			console.error('MongoDB error:', error);

			return jsonResponse(
				{
					success: false,
					message: 'MongoDB connection failed',
					error: error instanceof Error ? error.message : String(error),
				},
				500,
				corsHeaders,
			);
		}
	}

	return null;
}
