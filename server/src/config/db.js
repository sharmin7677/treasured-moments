import dns from 'node:dns';
import { MongoClient, ServerApiVersion } from 'mongodb';

// Use reliable public DNS servers for MongoDB SRV resolution.
dns.setServers(['8.8.8.8', '1.1.1.1']);

let client = null;
let db = null;

export async function connectDatabase() {
  if (client && db) {
    return { client, db };
  }

  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    throw new Error(
      'MONGODB_URI is missing. Please check server/.env'
    );
  }

  try {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });

    await client.connect();

    db = client.db();

    await db.command({ ping: 1 });

    console.log('✅ MongoDB connected successfully');
    console.log(`📦 Database: ${db.databaseName}`);

    return { client, db };
  } catch (error) {
    client = null;
    db = null;

    console.error(
      '❌ MongoDB connection failed:',
      error.message
    );

    throw error;
  }
}

export function getMongoClient() {
  if (!client) {
    throw new Error(
      'MongoDB client is not initialized. Call connectDatabase() first.'
    );
  }

  return client;
}

export function getDb() {
  if (!db) {
    throw new Error(
      'MongoDB database is not initialized. Call connectDatabase() first.'
    );
  }

  return db;
}

export async function closeDatabase() {
  if (!client) {
    return;
  }

  await client.close();

  client = null;
  db = null;

  console.log('🔌 MongoDB connection closed');
}