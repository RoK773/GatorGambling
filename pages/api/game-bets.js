import dns from 'dns';
import { MongoClient, ServerApiVersion } from 'mongodb';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:admin1Password@cluster0.9uypigw.mongodb.net/?appName=Cluster0';
const dbName = process.env.MONGODB_SOCCER_DB || 'Soccer_Data';
const collectionName = process.env.MONGODB_GAME_BETS_COLLECTION || 'Game_bets';

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

function mapGameBetDocument(doc, index) {
    const away = String(doc?.away_team || '').trim() || 'Away Team';
    const home = String(doc?.home_team || '').trim() || 'Home Team';
    const time = String(doc?.time || '').trim() || '--:--';
    const winner = String(doc?.winner || '').trim() || '--';
    const odds = String(doc?.odds || '').trim() || '--';
    const payoutMultRaw = doc?.payout_mult;
    const payoutMultNum = Number(payoutMultRaw);
    const stake = Number.isFinite(payoutMultNum)
        ? `x${payoutMultNum}`
        : String(payoutMultRaw || '--');

    return {
        id: doc?._id ? String(doc._id) : `${away}-${home}-${time}-${index}`,
        away,
        home,
        time,
        winner,
        odds,
        spread: odds,
        payout_mult: doc?.payout_mult,
        stake,
    };
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const client = await clientPromise;
        const gameBets = client.db(dbName).collection(collectionName);

        const docs = await gameBets.find({}).toArray();

        return res.status(200).json({
            games: docs.map(mapGameBetDocument),
        });
    } catch (error) {
        console.error('Failed to fetch game bets:', error);
        return res.status(500).json({ error: 'Failed to fetch game bets.' });
    }
}
