// implements the approval of user proposed bets
import dns from 'dns';
import {MongoClient, ServerApiVersion, ObjectId} from 'mongodb';
import { BETTING_PHASES, getCurrentBettingPhase } from './_lib/bettingLifecycle';
dns.setServers(['8.8.8.8', '8.8.4.4']);
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_SOCCER_DB || 'Soccer_Data';
const bracketCollectionName = process.env.MONGODB_BRACKET_COLLECTION || 'Bracket';
const PENDING_COLLECTION = 'Pending_Bets';
const ACTIVE_COLLECTIONS = {
    Player: process.env.MONGODB_PLAYER_BETS_COLLECTION || 'Player_bets',
    Team: process.env.MONGODB_TEAM_BETS_COLLECTION || 'Team_bets',
    Game: process.env.MONGODB_GAME_BETS_COLLECTION || 'Game_bets',
};

const options= {
    serverApi:{
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
};

let clientPromise;
if (!global._mongoClientPromise){
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

// convert a pending proposal into the active collection shape so it matches with index.js frontend
function buildActiveDocument(proposal){
    const {category, condition = {}, playerData, teamData, gameData, proposedBy} = proposal;
    const approvedAt = new Date();
    if (category === 'Player'){
        return {
            name: playerData?.name || 'Unknown Player',
            number: playerData?.number || '--',
            team: playerData?.team || 'N/A',
            stat: condition?.statType || playerData?.stat || '--',
            range: condition?.comparator || playerData?.range || '--',
            stat_num: condition?.condVal ?? playerData.stat_num ?? null,
            payout_mult: null,
            proposedBy,
            approvedAt,
        };
    }

    if (category === 'Team'){
        return {
            country: teamData?.country || 'Unknown Team',
            record: teamData?.record || '--',
            outcome: condition?.result || teamData?.outcome || '--',
            range: condition?.marginType || teamData?.range || '--',
            points: condition?.condVal ?? teamData?.points ?? null,
            payout_mult: null,
            proposedBy, 
            approvedAt,
        };
    }

    if (category === 'Game'){
        return {
            home_team: gameData?.home_team || '--',
            away_team: gameData?.away_team || '--',
            time: gameData?.time || '--:--',
            odds: gameData?.odds || '--',
            winner: condition?.outcome || gameData?.winner || '--',
            payout_mult: null,
            proposedBy,
            approvedAt,
        };
    }

    return null;
    
}

export default async function handler(req, res){
    if (req.method !== 'POST'){
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({error: 'Method not allowed.'});
    }
    const {proposalId} = req.body || {};
    if (!proposalId){
        return res.status(400).json({error: 'proposalId is required.'});
    }
    
    let objectId;
    try{
        objectId = new ObjectId(proposalId);
    } catch {
        return res.status(400).json({error: 'Invalid proposalId format.'});
    }

    try{
        const client = await clientPromise;
        const { phase } = await getCurrentBettingPhase(client, {
            dbName,
            bracketCollectionName,
        });

        if (phase !== BETTING_PHASES.SIMULATION_RUNNING) {
            return res.status(403).json({
                error: 'Proposal moderation is only available while a match simulation is running.',
            });
        }

        const db = client.db(dbName);
        const pending = db.collection(PENDING_COLLECTION);

        // fetch full proposal document
        const proposal = await pending.findOne({ _id: objectId});

        if (!proposal){
            return res.status(404).json({error: 'Proposal not found. It may have already been processed.'});
        }

        const targetCollectionName = ACTIVE_COLLECTIONS[proposal.category];
        if (!targetCollectionName){
            return res.status(400).json({error: `Unknown category: ${proposal.category}`});
        }

        const activeDoc = buildActiveDocument(proposal);
        if (!activeDoc){
            return res.status(500).json({error: 'Failed to build active bet document.'});
        }

        // insert into active pool. Once this is achieved, the bet is live.
        const insertResult = await db.collection(targetCollectionName).insertOne(activeDoc);

        // clean up the pending queue
        await pending.deleteOne({_id: objectId});

        return res.status(200).json({
            message: 'Proposal approved and moved to the active pool.',
            activeBetId: String(insertResult.insertedId),
            collection: targetCollectionName,
        });
    } catch (error){
        console.error('Approval failed:', error);
        return res.status(500).json({error: 'Failed to approve proposal.'});
    }
}