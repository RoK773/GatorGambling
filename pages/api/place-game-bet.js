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

function normalizePayoutMultiplier(value) {
    const numeric = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
    return Number.isFinite(numeric) ? numeric : null;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const normalizedUsername = String(req.body?.username || '').trim();
    const amount = Number(req.body?.amount);
    const incomingPick = req.body?.pick || {};

    if (!normalizedUsername) {
        return res.status(400).json({ error: 'username is required' });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Bet amount must be greater than 0.' });
    }

    try {
        const client = await clientPromise;
        const users = client.db(dbName).collection(collectionName);

        const user = await users.findOne(
            { username: normalizedUsername },
            { projection: { credits: 1 } },
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const currentCredits = Number.isFinite(Number(user.credits)) ? Number(user.credits) : 0;

        if (amount > currentCredits) {
            return res.status(400).json({ error: 'Not enough credits. Deposit more credits to place this bet.' });
        }

        const nextCredits = Number((currentCredits - amount).toFixed(2));

        const normalizedPick = {
            gameId: String(incomingPick.gameId || '').trim() || null,
            away_team: String(incomingPick.away_team || incomingPick.away || '').trim() || 'Away Team',
            home_team: String(incomingPick.home_team || incomingPick.home || '').trim() || 'Home Team',
            time: String(incomingPick.time || '').trim() || '--:--',
            winner: String(incomingPick.winner || '').trim() || '--',
            odds: String(incomingPick.odds || incomingPick.spread || '').trim() || '--',
            payout_mult: normalizePayoutMultiplier(incomingPick.payout_mult),
            amount,
            createdAt: new Date(),
        };

        await users.updateOne(
            { username: normalizedUsername },
            {
                $set: { credits: nextCredits },
                $push: { game_picks: normalizedPick },
            },
        );

        return res.status(200).json({
            message: 'Bet successfully placed.',
            credits: nextCredits,
            placedPick: normalizedPick,
        });
    } catch (error) {
        console.error('Game bet placement failed:', error);
        return res.status(500).json({ error: 'Failed to place game bet.' });
    }
}
