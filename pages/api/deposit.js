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

    const normalizedUsername = String(req.body?.username || '').trim();
    const amount = Number(req.body?.amount);

    if (!normalizedUsername) {
        return res.status(400).json({ error: 'username is required' });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Deposit amount must be greater than 0.' });
    }

    try {
        const client = await clientPromise;
        const users = client.db(dbName).collection(collectionName);

        const user = await users.findOne(
            { username: normalizedUsername },
            { projection: { card: 1, credits: 1 } },
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        if (!String(user.card || '').trim()) {
            return res.status(400).json({ error: 'Add a card on file before making a deposit.' });
        }

        const currentCredits = Number.isFinite(Number(user.credits)) ? Number(user.credits) : 0;
        const nextCredits = Number((currentCredits + amount).toFixed(2));

        await users.updateOne(
            { username: normalizedUsername },
            { $set: { credits: nextCredits } },
        );

        return res.status(200).json({
            message: `Deposit successful. Added $${amount.toFixed(2)}.`,
            credits: nextCredits,
        });
    } catch (error) {
        console.error('Deposit failed:', error);
        return res.status(500).json({ error: 'Failed to process deposit.' });
    }
}
