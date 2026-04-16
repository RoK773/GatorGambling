import dns from 'dns';
import { MongoClient, ServerApiVersion } from 'mongodb';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:admin1Password@cluster0.9uypigw.mongodb.net/?appName=Cluster0';
const dbName = process.env.MONGODB_SOCCER_DB || 'Soccer_Data';
const collectionName = process.env.MONGODB_BRACKET_COLLECTION || 'Bracket';

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
    try {
        const client = await clientPromise;
        const bracketCollection = client.db(dbName).collection(collectionName);

        if (req.method === 'GET') {
            const latestBracket = await bracketCollection
                .find({})
                .sort({ updatedAt: -1, createdAt: -1 })
                .limit(1)
                .next();

            return res.status(200).json({ bracket: latestBracket || null });
        }

        if (req.method === 'PUT') {
            const bracketState = req.body?.bracketState;

            if (!bracketState || typeof bracketState !== 'object') {
                return res.status(400).json({ error: 'A valid bracketState object is required.' });
            }

            // Explicitly replace all stored bracket docs with this new first-generation bracket.
            await bracketCollection.deleteMany({});
            const insertResult = await bracketCollection.insertOne({
                bracketState,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            return res.status(200).json({
                ok: true,
                insertedId: insertResult.insertedId,
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Bracket API error:', error);
        return res.status(500).json({ error: 'Failed to process bracket request.' });
    }
}
