// permanently deletes an active bet from the live pools (player, team, game). Called by moderators.
import dns from 'dns';
import {MongoClient, ServerApiVersion, ObjectId} from 'mongodb';
dns.setServers(['8.8.8.8', '8.8.4.4']);
const uri = process.env.MONGODB_URI;
const soccerDbName = process.env.MONGODB_SOCCER_DB || 'Soccer_Data';
const userDbName = process.env.MONGODB_DB || 'User_Data';
const userCollectionName = process.env.MONGODB_COLLECTION || 'Users';
const canceledBetsCollectionName = process.env.MONGODB_CANCELED_BETS_COLLECTION || 'Canceled-bets';
const COLLECTION_MAP = {
    player: process.env.MONGODB_PLAYER_BETS_COLLECTION || 'Player_bets',
    team: process.env.MONGODB_TEAM_BETS_COLLECTION || 'Team_bets',
    game: process.env.MONGODB_GAME_BETS_COLLECTION || 'Game_bets',
};

const PICK_CONFIG = {
    player: {
        pickField: 'player_picks',
        idField: 'playerId',
    },
    team: {
        pickField: 'team_picks',
        idField: 'teamId',
    },
    game: {
        pickField: 'game_picks',
        idField: 'gameId',
    },
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

function normalizeNumber(value){
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function roundCredits(value){
    return Number((normalizeNumber(value)).toFixed(2));
}

function buildPickMatcher(type, betId, cancelledBetDoc){
    if (type === 'player'){
        return (pick) => {
            const byId = String(pick?.playerId || '').trim() === betId;
            if (byId){
                return true;
            }

            return (
                String(pick?.name || '').trim().toLowerCase() === String(cancelledBetDoc?.name || '').trim().toLowerCase() &&
                String(pick?.number || '').trim() === String(cancelledBetDoc?.number || '').trim() &&
                String(pick?.team || '').trim().toLowerCase() === String(cancelledBetDoc?.team || '').trim().toLowerCase() &&
                String(pick?.stat || '').trim().toLowerCase() === String(cancelledBetDoc?.stat || '').trim().toLowerCase() &&
                String(pick?.range || '').trim().toLowerCase() === String(cancelledBetDoc?.range || '').trim().toLowerCase() &&
                String(pick?.stat_num ?? '').trim() === String(cancelledBetDoc?.stat_num ?? '').trim()
            );
        };
    }

    if (type === 'team'){
        return (pick) => {
            const byId = String(pick?.teamId || '').trim() === betId;
            if (byId){
                return true;
            }

            return (
                String(pick?.country || '').trim().toLowerCase() === String(cancelledBetDoc?.country || '').trim().toLowerCase() &&
                String(pick?.record || '').trim().toLowerCase() === String(cancelledBetDoc?.record || '').trim().toLowerCase() &&
                String(pick?.outcome || '').trim().toLowerCase() === String(cancelledBetDoc?.outcome || '').trim().toLowerCase() &&
                String(pick?.range || '').trim().toLowerCase() === String(cancelledBetDoc?.range || '').trim().toLowerCase() &&
                String(pick?.points ?? '').trim() === String(cancelledBetDoc?.points ?? '').trim()
            );
        };
    }

    return (pick) => {
        const byId = String(pick?.gameId || '').trim() === betId;
        if (byId){
            return true;
        }

        return (
            String(pick?.away_team || '').trim().toLowerCase() === String(cancelledBetDoc?.away_team || '').trim().toLowerCase() &&
            String(pick?.home_team || '').trim().toLowerCase() === String(cancelledBetDoc?.home_team || '').trim().toLowerCase() &&
            String(pick?.time || '').trim().toLowerCase() === String(cancelledBetDoc?.time || '').trim().toLowerCase() &&
            String(pick?.winner || '').trim().toLowerCase() === String(cancelledBetDoc?.winner || '').trim().toLowerCase() &&
            String(pick?.odds || '').trim().toLowerCase() === String(cancelledBetDoc?.odds || '').trim().toLowerCase()
        );
    };
}

export default async function handler(req, res){
    if (req.method !== 'POST'){
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({error: 'Method not allowed.'});
    }

    // type is player, team, game, passed from handleCancelStake, and 'betId' is the mongodb _id string of the active bet document
    const {type, betId, canceledBy} = req.body || {};
    const normalizedType = String(type || '').trim().toLowerCase();
    const normalizedCanceledBy = String(canceledBy || '').trim() || 'unknown-moderator';
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
        const soccerDb = client.db(soccerDbName);
        const users = client.db(userDbName).collection(userCollectionName);
        const canceledBets = client.db(userDbName).collection(canceledBetsCollectionName);
        const activeBets = soccerDb.collection(collectionName);
        const pickConfig = PICK_CONFIG[normalizedType];

        const cancelledBetDoc = await activeBets.findOne({_id: objectId});
        if (!cancelledBetDoc){
            // say 200 anway so local ui still removes the card
            return res.status(200).json({message: 'Bet was already removed from the pool.'});
        }

        const deleteResult = await activeBets.deleteOne({_id: objectId});
        if (deleteResult.deletedCount === 0){
            return res.status(200).json({message: 'Bet was already removed from the pool.'});
        }

        const cancelledBetId = String(objectId);
        const pickMatcher = buildPickMatcher(normalizedType, cancelledBetId, cancelledBetDoc);
        const candidateUsers = await users.find(
            { [`${pickConfig.pickField}.${pickConfig.idField}`]: cancelledBetId },
            { projection: { credits: 1, total_bets: 1, player_picks: 1, team_picks: 1, game_picks: 1 } },
        ).toArray();

        const updatedUserIds = [];
        let refundedCredits = 0;
        let removedPicks = 0;

        for (const user of candidateUsers){
            const picks = Array.isArray(user[pickConfig.pickField]) ? user[pickConfig.pickField] : [];
            const removed = picks.filter(pickMatcher);
            if (removed.length === 0){
                continue;
            }

            const refund = removed.reduce((sum, pick) => sum + normalizeNumber(pick?.amount), 0);
            const nextPicks = picks.filter(pick => !pickMatcher(pick));
            const nextCredits = roundCredits(normalizeNumber(user.credits) + refund);

            const currentTotalBets = Number.isFinite(Number(user.total_bets))
                ? Number(user.total_bets)
                : (
                    (Array.isArray(user.player_picks) ? user.player_picks.length : 0) +
                    (Array.isArray(user.team_picks) ? user.team_picks.length : 0) +
                    (Array.isArray(user.game_picks) ? user.game_picks.length : 0)
                );

            const nextTotalBets = Math.max(0, currentTotalBets - removed.length);

            await users.updateOne(
                { _id: user._id },
                {
                    $set: {
                        credits: nextCredits,
                        total_bets: nextTotalBets,
                        [pickConfig.pickField]: nextPicks,
                    },
                },
            );

            refundedCredits += refund;
            removedPicks += removed.length;
            updatedUserIds.push(user._id);
        }

        // Fallback pass: handle any legacy picks missing id fields by matching on bet metadata.
        const metadataCandidates = await users.find(
            { _id: { $nin: updatedUserIds } },
            { projection: { credits: 1, total_bets: 1, player_picks: 1, team_picks: 1, game_picks: 1 } },
        ).toArray();

        for (const user of metadataCandidates){
            const picks = Array.isArray(user[pickConfig.pickField]) ? user[pickConfig.pickField] : [];
            const removed = picks.filter(pickMatcher);
            if (removed.length === 0){
                continue;
            }

            const refund = removed.reduce((sum, pick) => sum + normalizeNumber(pick?.amount), 0);
            const nextPicks = picks.filter(pick => !pickMatcher(pick));
            const nextCredits = roundCredits(normalizeNumber(user.credits) + refund);

            const currentTotalBets = Number.isFinite(Number(user.total_bets))
                ? Number(user.total_bets)
                : (
                    (Array.isArray(user.player_picks) ? user.player_picks.length : 0) +
                    (Array.isArray(user.team_picks) ? user.team_picks.length : 0) +
                    (Array.isArray(user.game_picks) ? user.game_picks.length : 0)
                );

            const nextTotalBets = Math.max(0, currentTotalBets - removed.length);

            await users.updateOne(
                { _id: user._id },
                {
                    $set: {
                        credits: nextCredits,
                        total_bets: nextTotalBets,
                        [pickConfig.pickField]: nextPicks,
                    },
                },
            );

            refundedCredits += refund;
            removedPicks += removed.length;
        }

        await canceledBets.insertOne({
            canceledBy: normalizedCanceledBy,
            canceledAt: new Date(),
            betType: normalizedType,
            betId: cancelledBetId,
            refundedCredits: roundCredits(refundedCredits),
            removedPicks,
            canceledBet: cancelledBetDoc,
        });

        return res.status(200).json({
            message: 'Active bet cancelled. Impacted user picks were removed and credits refunded.',
            refundedCredits: roundCredits(refundedCredits),
            removedPicks,
        });
    } catch (error){
        console.error('Cancel bet failed:', error);
        return res.status(500).json({error: 'Failed to cancel bet.'});
    }
}