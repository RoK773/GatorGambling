// permanently removes a proposal from pending_bets without moving it to any active collection
import dns from 'dns';
import {MongoClient, ServerApiVersion, ObjectId} from 'mongodb';
dns.setServers(['8.8.8.8', '8.8.4.4']);
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_SOCCER_DB || 'Soccer_Data';
const PENDING_COLLECTION = 'Pending_Bets';
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
        const pending = client.db(dbName).collection(PENDING_COLLECTION);
        const result = await pending.deleteOne({_id: objectId});

        // if proposal was already removed, return 200 anyway so it can be removed from the local state
        if (result.deletedCount === 0){
            return res.status(200).json({message: 'Proposal was already removed.'});
        }

        return res.status(200).json({message: 'Proposal declined and deleted.'});
    } catch (error){
        console.error('Decline failed:', error);
        return res.status(500).json({error: 'Failed to decline proposal.'});
    }
}
