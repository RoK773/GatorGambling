// returns all documents currently sitting in pending_bets collection sorted by submission time (chronological)
// only moddash will see this
import dns from 'dns';
import {MongoClient, ServerApiVersion, ObjectId} from 'mongodb';
dns.setServers(['8.8.8.8', '8.8.4.4']);
const uri = process.env.MONGODB_URI || 'mongodb+srv://admin:admin1Password@cluster0.9uypigw.mongodb.net/?appName=Cluster0';
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

// normalize a raw pending bets document into proposalcard shape
function mapPendingDocument(doc){
    const payload = 
        doc.category === 'Player' ? doc.playerData :
        doc.category === 'Team' ? doc.teamData :
        doc.category === 'Game' ? doc.gameData :
        {};

    return {
        // converd object ID to plan string for JSON serialization
        id: String(doc._id),
        category: doc.category || 'Unknown',
        proposedBy: doc.proposedBy || 'anonymous',
        proposedAt: doc.proposedAt ? new Date(doc.proposedAt).toISOString() : null,
        status: doc.status || 'pending',
        condition: doc.condition || {},

         // spread the payload at top level so detail-key loop is automatic 
         ...(payload || {}),
    };
}

export default async function handler(req, res){
    if (req.method !== 'GET'){
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({error: 'Method not allowed.'});
    }

    try{
        const client = await clientPromise;
        const pending = client.db(dbName).collection(PENDING_COLLECTION);

        // sort ascending for oldest first
        const docs = await pending.find({}).sort({proposedAt: 1}).toArray();
        return res.status(200).json({ proposals: docs.map(mapPendingDocument),});
    } catch (error){
        console.error('Failed to fetch pending bets:', error);
        return res.status(500).json({error: 'Failed to fetch pending bets.'});
    }
}