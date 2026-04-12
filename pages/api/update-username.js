import dns from 'dns';
import { MongoClient, ServerApiVersion } from 'mongodb';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:admin1Password@cluster0.9uypigw.mongodb.net/?appName=Cluster0';
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

    const currentUsername = String(req.body?.currentUsername || '').trim();
    const newUsername = String(req.body?.newUsername || '').trim();

    if (!currentUsername) {
        return res.status(400).json({ error: 'Current username is required.' });
    }

    if (!newUsername) {
        return res.status(400).json({ error: 'New username is required.' });
    }

    if (newUsername === currentUsername) {
        return res.status(400).json({ error: 'New username must be different from your current username.' });
    }

    try {
        const client = await clientPromise;
        const users = client.db(dbName).collection(collectionName);

        const existingUser = await users.findOne({ username: newUsername }, { projection: { _id: 1 } });
        if (existingUser) {
            return res.status(409).json({ error: 'That username is already taken.' });
        }

        const result = await users.updateOne(
            { username: currentUsername },
            { $set: { username: newUsername } },
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        return res.status(200).json({
            message: 'Username updated successfully.',
            username: newUsername,
        });
    } catch (error) {
        console.error('Username update failed:', error);
        return res.status(500).json({ error: 'Failed to update username.' });
    }
}
