import dns from 'dns';
import { MongoClient, ServerApiVersion } from 'mongodb';
import { BETTING_PHASES, getCurrentBettingPhase } from './_lib/bettingLifecycle';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:admin1Password@cluster0.9uypigw.mongodb.net/?appName=Cluster0';
const dbName = process.env.MONGODB_DB || 'User_Data';
const collectionName = process.env.MONGODB_COLLECTION || 'Users';
const soccerDbName = process.env.MONGODB_SOCCER_DB || 'Soccer_Data';
const bracketCollectionName = process.env.MONGODB_BRACKET_COLLECTION || 'Bracket';

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
        const { phase } = await getCurrentBettingPhase(client, {
            dbName: soccerDbName,
            bracketCollectionName,
        });

        if (phase !== BETTING_PHASES.SIMULATION_RUNNING) {
            return res.status(403).json({
                error: 'Bet placement is closed. Bets can only be placed while a match simulation is running.',
            });
        }

        const users = client.db(dbName).collection(collectionName);

        const user = await users.findOne(
            { username: normalizedUsername },
            { projection: { credits: 1, total_bets: 1, player_picks: 1, team_picks: 1, game_picks: 1 } },
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const currentCredits = Number.isFinite(Number(user.credits)) ? Number(user.credits) : 0;
        const currentTotalBets = Number.isFinite(Number(user.total_bets))
            ? Number(user.total_bets)
            : (
                (Array.isArray(user.player_picks) ? user.player_picks.length : 0) +
                (Array.isArray(user.team_picks) ? user.team_picks.length : 0) +
                (Array.isArray(user.game_picks) ? user.game_picks.length : 0)
            );

        if (amount > currentCredits) {
            return res.status(400).json({ error: 'Not enough credits. Deposit more credits to place this bet.' });
        }

        const nextCredits = Number((currentCredits - amount).toFixed(2));
        const nextTotalBets = currentTotalBets + 1;

        const normalizedPick = {
            playerId: String(incomingPick.playerId || '').trim() || null,
            name: String(incomingPick.name || '').trim() || 'Unknown Player',
            number: String(incomingPick.number || '').trim() || '--',
            team: String(incomingPick.team || '').trim() || 'N/A',
            stat: String(incomingPick.stat || '').trim() || '--',
            range: String(incomingPick.range || '').trim() || '--',
            stat_num: incomingPick.stat_num ?? null,
            payout_mult: normalizePayoutMultiplier(incomingPick.payout_mult),
            amount,
            createdAt: new Date(),
        };

        await users.updateOne(
            { username: normalizedUsername },
            {
                $set: { credits: nextCredits, total_bets: nextTotalBets },
                $push: { player_picks: normalizedPick },
            },
        );

        return res.status(200).json({
            message: 'Bet successfully placed.',
            credits: nextCredits,
            total_bets: nextTotalBets,
            placedPick: normalizedPick,
        });
    } catch (error) {
        console.error('Player bet placement failed:', error);
        return res.status(500).json({ error: 'Failed to place player bet.' });
    }
}
