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

    const { username, cardNumber, cvv } = req.body || {};

    const normalizedUsername = String(username || '').trim();
    const normalizedCardNumber = String(cardNumber || '').replace(/\D/g, '');
    const normalizedCvv = String(cvv || '').replace(/\D/g, '');

    if (!normalizedUsername) {
        return res.status(400).json({ error: 'username is required' });
    }

    if (!/^\d{16}$/.test(normalizedCardNumber)) {
        return res.status(400).json({ error: 'Card number must be exactly 16 digits.' });
    }

    if (!/^\d{3}$/.test(normalizedCvv)) {
        return res.status(400).json({ error: 'CVV must be exactly 3 digits.' });
    }

    try {
        const client = await clientPromise;
        const users = client.db(dbName).collection(collectionName);

        const result = await users.updateOne(
            { username: normalizedUsername },
            { $set: { card: normalizedCardNumber } },
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        return res.status(200).json({
            message: 'Card updated successfully.',
            card: normalizedCardNumber,
        });
    } catch (error) {
        console.error('Card update failed:', error);
        return res.status(500).json({ error: 'Failed to update card.' });
    }
}
