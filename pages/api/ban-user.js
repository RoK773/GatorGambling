import dns from 'dns';
import { MongoClient, ServerApiVersion } from 'mongodb';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'User_Data';
const collectionName = process.env.MONGODB_COLLECTION || 'Users';

const options = {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
};

let clientPromise;

if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const username = String(req.body?.username || '').trim();
    if (!username) {
        return res.status(400).json({ error: 'username is required' });
    }

    try {
        const client = await clientPromise;
        const users = client.db(dbName).collection(collectionName);
        const result = await users.deleteOne({ username });

        return res.status(200).json({
            ok: true,
            deletedCount: Number(result?.deletedCount || 0),
        });
    } catch (error) {
        console.error('Failed to ban user:', error);
        return res.status(500).json({ error: 'Failed to ban user.' });
    }
}
