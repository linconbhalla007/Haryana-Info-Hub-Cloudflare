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

export async function handleAuthRoutes(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response | null> {
	const url = new URL(request.url);

	if (url.pathname === '/api/login' && request.method === 'POST') {
		try {
			const body = (await request.json()) as {
				username?: unknown;
				password?: unknown;
			};

			const username = body.username;
			const password = body.password;

			if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
				return jsonResponse(
					{
						success: false,
						message: 'Username and password are required',
					},
					400,
					corsHeaders,
				);
			}

			const db = await getDatabase(env);

			const admin = await db.collection('admin_login').findOne({
				username: username.trim(),
			});

			if (!admin) {
				return jsonResponse(
					{
						success: false,
						message: 'Invalid username or password',
					},
					401,
					corsHeaders,
				);
			}

			if (admin.active !== true) {
				return jsonResponse(
					{
						success: false,
						message: 'Admin account is inactive',
					},
					403,
					corsHeaders,
				);
			}

			// POC ke liye plaintext comparison
			if (password !== admin.passwordHash) {
				return jsonResponse(
					{
						success: false,
						message: 'Invalid username or password',
					},
					401,
					corsHeaders,
				);
			}

			return jsonResponse(
				{
					success: true,
					message: 'Login successful',
					user: {
						username: admin.username,
						role: admin.role,
					},
				},
				200,
				corsHeaders,
			);
		} catch (error) {
			console.error('Login error:', error);

			return jsonResponse(
				{
					success: false,
					message: 'Login failed',
					error: error instanceof Error ? error.message : String(error),
				},
				500,
				corsHeaders,
			);
		}
	}

	return null;
}
