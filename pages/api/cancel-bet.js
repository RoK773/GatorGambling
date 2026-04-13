// permanently deletes an active bet from the live pools (player, team, game). Called by moderators. 
// Does NOT currently refund users who have alredy placed wagers on the deleted stake
import dns from 'dns';
import {MongoClient, ServerApiVersion, ObjectId} from 'mongodb';
dns.setServers(['8.8.8.8', '8.8.4.4']);
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_SOCCER_DB || 'Soccer_Data';
const COLLECTION_MAP = {
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

export default async function handler(req, res){
    if (req.method !== 'POST'){
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({error: 'Method not allowed.'});
    }

    // type is player, team, game, passed from handleCancelStake, and 'betId' is the mongodb _id string of the active bet document
    const {type, betId} = req.body || {};
    const normalizedType = String(type || '').trim().toLowerCase();
    const collectionName = COLLECTION_MAP[normalizedType];

    if (!collectionName){
        return res.status(400).json({error: `Type must be one of ${Object.keys(COLLECTION_MAP).join(', ')}`});
    }

    if (!betId){
        return res.status(400).json({error: 'betId is required.'});
    }

    let objectId;
    try{
        objectId = new ObjectId(betId);
    } catch {
        return res.status(400).json({error: 'Invalid betId format.'});
    }

    try{
        const client = await clientPromise;
        const collection = client.db(dbName).collection(collectionName);
        const result = await collection.deleteOne({_id: objectId});
        if (result.deletedCount === 0){
            // say 200 anway so local ui still removes the card
            return res.status(200).json({message: 'Bet was already removed from the pool.'});
        }

        return res.status(200).json({message: 'Active bet cancelled and removed from the pool.'});
    } catch (error){
        console.error('Cancel bet failed:', error);
        return res.status(500).json({error: 'Failed to cancel bet.'});
    }
}