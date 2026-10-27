import { MongoClient, Db } from 'mongodb';
import { EventEmitter } from 'node:events';

// Prevent EventEmitter memory leak warning during connection pooling in local development
try {
	EventEmitter.defaultMaxListeners = 30;
} catch {
	// Ignore if runtime restricts defaultMaxListeners
}

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

interface EmployeeProformaCounter {
	_id: 'employee_proformas';
	sequence: number;
}

interface GovernmentJobCounter {
	_id: 'government_jobs';
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
			client.setMaxListeners(30);
		} catch {
			// Safe fallback
		}

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

/**
 * Atomically reserves the next employee proforma ID using the counters
 * collection. Uses its own counter key 'employee_proformas'.
 */
export async function getNextEmployeeProformaId(env: Env): Promise<string> {
	const db = await getDatabase(env);

	const counter = await db.collection<EmployeeProformaCounter>('counters').findOneAndUpdate(
		{ _id: 'employee_proformas' },
		{ $inc: { sequence: 1 } },
		{ upsert: true, returnDocument: 'after' },
	);

	if (!counter || !Number.isSafeInteger(counter.sequence) || counter.sequence < 1) {
		throw new Error('Employee proforma counter is missing or invalid');
	}

	return `proforma-${String(counter.sequence).padStart(3, '0')}`;
}

/**
 * Atomically reserves the next government job ID using the counters
 * collection. Uses its own counter key 'government_jobs'.
 */
export async function getNextGovernmentJobId(env: Env): Promise<string> {
	const db = await getDatabase(env);

	const counter = await db.collection<GovernmentJobCounter>('counters').findOneAndUpdate(
		{ _id: 'government_jobs' },
		{ $inc: { sequence: 1 } },
		{ upsert: true, returnDocument: 'after' },
	);

	if (!counter || !Number.isSafeInteger(counter.sequence) || counter.sequence < 1) {
		throw new Error('Government job counter is missing or invalid');
	}

	return `job-${String(counter.sequence).padStart(3, '0')}`;
}

