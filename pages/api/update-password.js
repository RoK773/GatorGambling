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

    const username = String(req.body?.username || '').trim();
    const currentPassword = String(req.body?.currentPassword || '').trim();
    const newPassword = String(req.body?.newPassword || '').trim();

    if (!username) {
        return res.status(400).json({ error: 'Username is required.' });
    }

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password are required.' });
    }

    if (newPassword === currentPassword) {
        return res.status(400).json({ error: 'New password must be different from your current password.' });
    }

    try {
        const client = await clientPromise;
        const users = client.db(dbName).collection(collectionName);

        const user = await users.findOne({ username }, { projection: { _id: 1, password: 1, passwordHash: 1 } });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const currentPasswordMatches = currentPassword === String(user.password || '') || currentPassword === String(user.passwordHash || '');
        if (!currentPasswordMatches) {
            return res.status(401).json({ error: 'Current password is incorrect.' });
        }

        await users.updateOne(
            { username },
            { $set: { password: newPassword } },
        );

        return res.status(200).json({
            message: 'Password updated successfully.',
        });
    } catch (error) {
        console.error('Password update failed:', error);
        return res.status(500).json({ error: 'Failed to update password.' });
    }
}
