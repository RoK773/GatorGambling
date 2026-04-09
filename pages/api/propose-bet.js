// accepts a bet proposal submitted from proposalform and persists it to the PendingBets mongoDB collection
// this document will sit until either moderator approval or declination - no credits are deducted at proposal time
import dns from 'dns';
import {MongoClient, ServerApiVersion} from 'mongodb';

// force node's dns resolver to use google's public servers 
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:admin1Password@cluster0.9uypigq.mongodb.net/?appName=Cluster0';
const dbName = process.env.MONGODB_SOCCER_DB || 'Soccer_Data';

// collection that holds proposals
const PENDING_COLLECTION = 'Pending_Bets';
const options={
    serverApi:{
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
};

//reuse a mongoclient across reloads by caching collection on the node global object
let clientPromise;
if (!global._mongoClientPromise){
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export default async function handler(req, res){
    // only accept POST - proposals are write operations
    if (req.method !== 'POST'){
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({error: 'Method not allowed'});
    }

    const {category, username, playerData, teamData, gameData, condition} = req.body || {};

    // cat is required
    const normalizedCategory = String(category || '').trim();
    if (!['Player', 'Team', 'Game'].includes(normalizedCategory)){
        return res.status(405).json({error: 'category must be Player, Team, or Game.'});
    }

    const proposedBy = String(username || 'anonymous').trim();

    // build document to be stored. fields vary by cateogry, but should be consistent
    const document ={
        category: normalizedCategory,
        proposedBy,
        proposedAt: new Date(),
        status: 'pending',
        condition: condition || {},
    };

    // attach the cat-specific payload so handler can insert it directly
    if (normalizedCategory === 'Player'){
        if (!playerData?.playerId){
            return res.status(400).json({error: 'A player must be selected from the dropdown.'});
        }
        document.playerData={
            playerId: String(playerData.playerId).trim(),
            name: String(playerData.name || '').trim() || 'Unknown Player',
            number: String(playerData.number || '').trim() || '--',
            team: String(playerData.team || '').trim() || 'N/A',
            stat: String(condition?.statType || '').trim() || '--',
            range: String(condition?.comparator || '').trim() || '--',
            stat_num: condition?.condVal ?? null,
        };
    }

    if (normalizedCategory === 'Team'){
        if (!teamData?.teamId){
            return res.status(400).json({error: 'A team must be selected from the dropdown.'});
        }
        document.teamData ={
            teamId: String(teamData.teamId || '').trim(),
            country: String(teamData.country || '').trim() || 'Unknown Team',
            record: String(teamData.record || '').trim() || '--',
            outcome: String(condition?.result || '' ).trim() || '--',
            range: String(condition?.marginType || '').trim() || '--',
            points: condition?.condVal ?? null,
        };
    }
     if (normalizedCategory === 'Game'){
        if (!gameData?.homeTeam || !gameData?.awayTeam){
            return res.status(400).json({error: 'Home team and away team are required for a Game bet.'});
        }
        document.gameData ={
            home_team: String(gameData.homeTeam || '').trim(),
            away_team: String(gameData.awayTeam || '').trim(),
            time: String(gameData.gameTime || '').trim() || '--:--',
            odds: String(gameData.spread || '').trim() || '--',
            winner: String(condition?.outcome || '').trim() || '--',
        };
     }

     try {
        const client = await clientPromise;
        const pending = client.db(dbName).collection(PENDING_COLLECTION);
        const result = await pending.insertOne(document);
        return res.status(201).json({
            message: 'Proposal submitted successfully.',
            proposalId: String(result.insertedId),
        });
     } catch (error){
        console.error('Failed to save proposal:', error);
        return res.status(500).json({error: 'Failed to save proposal. Please try again.'});
     }
}