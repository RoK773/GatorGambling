// checks if username and password match an existing user in MongoDB and returns success or failure
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

    const { username, password } = req.body || {};

    if (!username || !password) {
        return res.status(400).json({ error: 'username and password are required' });
    }

    try {
        const client = await clientPromise;
        const users = client.db(dbName).collection(collectionName);

        const user = await users.findOne({
            username,
            $or: [{ password }, { passwordHash: password }],
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        return res.status(200).json({ message: 'Login successful', username: user.username });
    } catch (error) {
        console.error('Login check failed:', error);
        return res.status(500).json({ error: 'Failed to log in' });
    }
}
