import dns from 'dns';
import { MongoClient, ServerApiVersion } from 'mongodb';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:admin1Password@cluster0.9uypigw.mongodb.net/?appName=Cluster0';
const userDbName = process.env.MONGODB_DB || 'User_Data';
const usersCollectionName = process.env.MONGODB_COLLECTION || 'Users';
const completedBetsCollectionName = process.env.MONGODB_COMPLETED_BETS_COLLECTION || 'Completed-bets';

const options = {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
};

if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
}

const clientPromise = global._mongoClientPromise;

function normalizeKey(value) {
    return String(value || '').trim().toLowerCase();
}

function roundMoney(value) {
    return Number((Number.isFinite(Number(value)) ? Number(value) : 0).toFixed(2));
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const username = String(req.body?.username || '').trim();
    const homeTeam = String(req.body?.home_team || '').trim();
    const awayTeam = String(req.body?.away_team || '').trim();
    const market = String(req.body?.winner || '').trim();

    if (!username || !homeTeam || !awayTeam || !market) {
        return res.status(400).json({ error: 'username, home_team, away_team, and winner are required.' });
    }

    try {
        const client = await clientPromise;
        const users = client.db(userDbName).collection(usersCollectionName);
        const completedBets = client.db(userDbName).collection(completedBetsCollectionName);

        const user = await users.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const gamePicks = Array.isArray(user.game_picks) ? user.game_picks : [];
        const matches = pick => (
            pick?.status === 'won_unclaimed'
            && normalizeKey(pick?.home_team) === normalizeKey(homeTeam)
            && normalizeKey(pick?.away_team) === normalizeKey(awayTeam)
            && normalizeKey(pick?.winner) === normalizeKey(market)
        );

        const claimedPick = gamePicks.find(matches);
        if (!claimedPick) {
            return res.status(404).json({ error: 'No unclaimed win matches that game pick.' });
        }

        const remainingPicks = gamePicks.filter(pick => !matches(pick));
        const payout = roundMoney(claimedPick?.payout);
        const amount = roundMoney(claimedPick?.amount);

        const currentCredits = Number.isFinite(Number(user.credits)) ? Number(user.credits) : 0;
        const currentWins = Number.isFinite(Number(user.wins)) ? Number(user.wins) : 0;
        const currentProfit = Number.isFinite(Number(user.profit)) ? Number(user.profit) : 0;
        const nextCredits = roundMoney(currentCredits + payout);
        const nextWins = currentWins + 1;
        const nextProfit = roundMoney(currentProfit + (payout - amount));

        await users.updateOne(
            { _id: user._id },
            {
                $set: {
                    game_picks: remainingPicks,
                    credits: nextCredits,
                    wins: nextWins,
                    profit: nextProfit,
                },
            },
        );

        await completedBets.insertOne({
            username,
            category: 'Game',
            status: 'won',
            amount,
            payout_mult: Number.isFinite(Number(claimedPick?.payout_mult)) ? Number(claimedPick.payout_mult) : 0,
            payout,
            net: roundMoney(payout - amount),
            selected_team: claimedPick?.selected_team || null,
            expected_team: claimedPick?.expected_team || null,
            market,
            settledAt: claimedPick?.settledAt || new Date(),
            claimedAt: new Date(),
            pick: claimedPick,
            completedMatch: claimedPick?.completedMatch || {
                matchId: null,
                homeTeam,
                awayTeam,
            },
        });

        return res.status(200).json({
            message: 'Winnings claimed successfully.',
            credits: nextCredits,
            wins: nextWins,
            profit: nextProfit,
            payout,
            game_picks: remainingPicks,
        });
    } catch (error) {
        console.error('Claim game bet failed:', error);
        return res.status(500).json({ error: 'Failed to claim winnings.' });
    }
}
