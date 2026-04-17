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
    if (!normalizedUsername) {
        return res.status(400).json({ error: 'username is required' });
    }

    try {
        const client = await clientPromise;
        const users = client.db(dbName).collection(collectionName);

        const user = await users.findOne(
            { username: normalizedUsername },
            {
                projection: {
                    username: 1,
                    email: 1,
                    card: 1,
                    credits: 1,
                    total_bets: 1,
                    wins: 1,
                    losses: 1,
                    profit: 1,
                    player_picks: 1,
                    team_picks: 1,
                    game_picks: 1,
                },
            },
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const fallbackTotalBets =
            (Array.isArray(user.player_picks) ? user.player_picks.length : 0) +
            (Array.isArray(user.team_picks) ? user.team_picks.length : 0) +
            (Array.isArray(user.game_picks) ? user.game_picks.length : 0);

        const totalBets = Number.isFinite(Number(user.total_bets))
            ? Number(user.total_bets)
            : fallbackTotalBets;

        return res.status(200).json({
            username: user.username,
            email: String(user.email || '').trim(),
            hasCardOnFile: Boolean(String(user.card || '').trim()),
            credits: Number.isFinite(Number(user.credits)) ? Number(user.credits) : 0,
            total_bets: totalBets,
            wins: Number.isFinite(Number(user.wins)) ? Number(user.wins) : 0,
            losses: Number.isFinite(Number(user.losses)) ? Number(user.losses) : 0,
            profit: Number.isFinite(Number(user.profit)) ? Number(user.profit) : 0,
            player_picks: Array.isArray(user.player_picks) ? user.player_picks : [],
            team_picks: Array.isArray(user.team_picks) ? user.team_picks : [],
            game_picks: Array.isArray(user.game_picks) ? user.game_picks : [],
        });
    } catch (error) {
        console.error('Failed to fetch user state:', error);
        return res.status(500).json({ error: 'Failed to fetch user state.' });
    }
}
