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

function isValidEmail(emailValue) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const username = String(req.body?.username || '').trim();
    const newEmail = String(req.body?.newEmail || '').trim();

    if (!username) {
        return res.status(400).json({ error: 'Username is required.' });
    }

    if (!newEmail) {
        return res.status(400).json({ error: 'Email is required.' });
    }

    if (!isValidEmail(newEmail)) {
        return res.status(400).json({ error: 'Invalid email: use format name@domain.domain.' });
    }

    try {
        const client = await clientPromise;
        const users = client.db(dbName).collection(collectionName);

        const user = await users.findOne({ username }, { projection: { _id: 1, email: 1 } });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const existingEmailOwner = await users.findOne(
            {
                email: { $regex: `^${newEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
                username: { $ne: username },
            },
            { projection: { _id: 1 } },
        );

        if (existingEmailOwner) {
            return res.status(409).json({ error: 'That email address is already in use.' });
        }

        if (String(user.email || '').trim().toLowerCase() === newEmail.toLowerCase()) {
            return res.status(400).json({ error: 'New email must be different from your current email.' });
        }

        await users.updateOne(
            { username },
            { $set: { email: newEmail } },
        );

        return res.status(200).json({
            message: 'Email updated successfully.',
            email: newEmail,
        });
    } catch (error) {
        console.error('Email update failed:', error);
        return res.status(500).json({ error: 'Failed to update email.' });
    }
}
