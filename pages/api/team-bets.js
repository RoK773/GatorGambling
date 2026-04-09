import dns from 'dns';
import { MongoClient, ServerApiVersion } from 'mongodb';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:admin1Password@cluster0.9uypigw.mongodb.net/?appName=Cluster0';
const dbName = process.env.MONGODB_SOCCER_DB || 'Soccer_Data';
const collectionName = process.env.MONGODB_TEAM_BETS_COLLECTION || 'Team_bets';

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

function mapTeamBetDocument(doc, index) {
    const country = String(doc?.country || '').trim() || 'Unknown Team';
    const record = String(doc?.record || '').trim() || '--';
    const payoutMultRaw = doc?.payout_mult;
    const payoutMultNum = Number(payoutMultRaw);
    const stake = Number.isFinite(payoutMultNum)
        ? `x${payoutMultNum}`
        : String(payoutMultRaw || '--');

    return {
        id: doc?._id ? String(doc._id) : `${country}-${record}-${index}`,
        name: country,
        record,
        stake,
        outcome: doc?.outcome,
        range: doc?.range,
        points: doc?.points,
        payout_mult: doc?.payout_mult,
    };
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const client = await clientPromise;
        const teamBets = client.db(dbName).collection(collectionName);

        const docs = await teamBets.find({}).toArray();

        return res.status(200).json({
            teams: docs.map(mapTeamBetDocument),
        });
    } catch (error) {
        console.error('Failed to fetch team bets:', error);
        return res.status(500).json({ error: 'Failed to fetch team bets.' });
    }
}
