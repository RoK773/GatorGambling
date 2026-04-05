import dns from 'dns';
import { MongoClient, ServerApiVersion } from 'mongodb';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:admin1Password@cluster0.9uypigw.mongodb.net/?appName=Cluster0';
const dbName = process.env.MONGODB_SOCCER_DB || 'Soccer_Data';
const collectionName = process.env.MONGODB_PLAYER_BETS_COLLECTION || 'Player_bets';

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

function mapPlayerBetDocument(doc, index) {
    const name = String(doc?.name || '').trim() || 'Unknown Player';
    const number = String(doc?.number || '').trim() || '--';
    const team = String(doc?.team || '').trim() || 'N/A';
    const payoutMultRaw = doc?.payout_mult;
    const payoutMultNum = Number(payoutMultRaw);
    const stake = Number.isFinite(payoutMultNum)
        ? `x${payoutMultNum}`
        : String(payoutMultRaw || '--');

    return {
        id: doc?._id ? String(doc._id) : `${name}-${number}-${index}`,
        name,
        number,
        pos: team,
        stake,
        stat: doc?.stat,
        range: doc?.range,
        stat_num: doc?.stat_num ?? doc?.state_num,
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
        const playerBets = client.db(dbName).collection(collectionName);

        const docs = await playerBets.find({}).toArray();

        return res.status(200).json({
            players: docs.map(mapPlayerBetDocument),
        });
    } catch (error) {
        console.error('Failed to fetch player bets:', error);
        return res.status(500).json({ error: 'Failed to fetch player bets.' });
    }
}
