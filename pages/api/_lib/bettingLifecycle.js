export const BETTING_PHASES = {
    PROPOSALS_OPEN: 'PROPOSALS_OPEN',
    SIMULATION_RUNNING: 'SIMULATION_RUNNING',
    MODERATOR_LOCKED: 'MODERATOR_LOCKED',
};

function normalizePhase(rawPhase) {
    const phase = String(rawPhase || '').trim().toUpperCase();
    if (Object.values(BETTING_PHASES).includes(phase)) {
        return phase;
    }

    return BETTING_PHASES.PROPOSALS_OPEN;
}

export async function getLatestBracketDocument(client, {
    dbName,
    bracketCollectionName,
}) {
    return client
        .db(dbName)
        .collection(bracketCollectionName)
        .find({})
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(1)
        .next();
}

export async function getCurrentBettingPhase(client, {
    dbName,
    bracketCollectionName,
}) {
    const latestBracket = await getLatestBracketDocument(client, {
        dbName,
        bracketCollectionName,
    });

    const phase = normalizePhase(latestBracket?.matchLifecycle?.phase);
    return {
        phase,
        latestBracket,
    };
}
