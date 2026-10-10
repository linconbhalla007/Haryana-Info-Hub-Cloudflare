import { MongoClient, Db } from 'mongodb';

interface Env {
	MONGODB_URI: string;
}

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let mongoConnecting: Promise<Db> | null = null;

const databaseOperationTimeoutMs = 10_000;

function withTimeout<T>(
	operation: Promise<T>,
	timeoutMs: number,
	message: string,
	onTimeout?: () => void,
): Promise<T> {
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			try {
				onTimeout?.();
			} finally {
				reject(new Error(message));
			}
		}, timeoutMs);

		operation.then(
			(value) => {
				clearTimeout(timeout);
				resolve(value);
			},
			(error: unknown) => {
				clearTimeout(timeout);
				reject(error);
			},
		);
	});
}

function closeClient(client: MongoClient): void {
	// Do not wait for close(): a stalled network connection must not prevent a response.
	void client.close().catch(() => undefined);
}

interface GovernmentOrderCounter {
	_id: 'government_orders';
	sequence: number;
}

const governmentOrdersCollection = 'government_orders';

/**
 * Creates the unique ID index without modifying any existing documents.
 * MongoDB will reject this operation if duplicate IDs already exist, which
 * prevents the API from continuing without the required data integrity check.
 */
async function ensureGovernmentOrderIdIndex(db: Db): Promise<void> {
	const collection = db.collection(governmentOrdersCollection);
	const existingIdIndex = (await collection.listIndexes().toArray()).find(
		(index) => Object.keys(index.key).length === 1 && index.key.id === 1,
	);

	if (existingIdIndex) {
		if (existingIdIndex.unique) {
			return;
		}

		throw new Error(
			'government_orders.id has a non-unique index. Replace it with a unique index before creating orders.',
		);
	}

	await collection.createIndex(
		{ id: 1 },
		{
			unique: true,
		},
	);
}

export async function getDatabase(env: Env): Promise<Db> {
	if (!env.MONGODB_URI) {
		throw new Error('MONGODB_URI secret is not configured');
	}

	// Existing connection check
	if (mongoClient && mongoDb) {
		try {
			await withTimeout(
				mongoDb.command({ ping: 1 }),
				databaseOperationTimeoutMs,
				'MongoDB health check timed out',
				() => closeClient(mongoClient!),
			);
			return mongoDb;
		} catch (error) {
			console.error('Existing MongoDB connection is not healthy:', error);
			closeClient(mongoClient);

			mongoClient = null;
			mongoDb = null;
		}
	}

	// Prevent multiple simultaneous connections
	if (mongoConnecting) {
		return mongoConnecting;
	}

	mongoConnecting = (async () => {
		const client = new MongoClient(env.MONGODB_URI, {
			serverSelectionTimeoutMS: 8000,
			connectTimeoutMS: 8000,
			socketTimeoutMS: 10000,
			timeoutMS: databaseOperationTimeoutMs,
			maxPoolSize: 5,
			minPoolSize: 0,
			tls: true,
			maxIdleTimeMS: 30000,
		});

		try {
			await withTimeout(
				client.connect(),
				databaseOperationTimeoutMs,
				'MongoDB connection timed out',
				() => closeClient(client),
			);

			const db = client.db('Info_hub_db');

			await withTimeout(
				db.command({ ping: 1 }),
				databaseOperationTimeoutMs,
				'MongoDB health check timed out',
				() => closeClient(client),
			);

			mongoClient = client;
			mongoDb = db;

			console.log('MongoDB connection established');

			return db;
		} catch (error) {
			console.error('MongoDB connection failed:', error);
			closeClient(client);

			throw error;
		} finally {
			mongoConnecting = null;
		}
	})();

	return mongoConnecting;
}

/**
 * Atomically reserves the next government order ID using the counters
 * collection. The counter is intentionally never derived from document count.
 */
export async function getNextGovernmentOrderId(env: Env): Promise<string> {
	const db = await getDatabase(env);

	await ensureGovernmentOrderIdIndex(db);

	const counter = await db.collection<GovernmentOrderCounter>('counters').findOneAndUpdate(
		{ _id: 'government_orders' },
		{ $inc: { sequence: 1 } },
		{ returnDocument: 'after' },
	);

	if (!counter || !Number.isSafeInteger(counter.sequence) || counter.sequence < 1) {
		throw new Error('Government order counter is missing or invalid');
	}

	return `order-${String(counter.sequence).padStart(3, '0')}`;
}
