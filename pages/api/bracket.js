import dns from 'dns';
import { MongoClient, ServerApiVersion } from 'mongodb';
import { BETTING_PHASES } from './_lib/bettingLifecycle';

dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_SOCCER_DB || 'Soccer_Data';
const collectionName = process.env.MONGODB_BRACKET_COLLECTION || 'Bracket';
const gameBetsCollectionName = process.env.MONGODB_GAME_BETS_COLLECTION || 'Game_bets';
const playerBetsCollectionName = process.env.MONGODB_PLAYER_BETS_COLLECTION || 'Player_bets';
const teamBetsCollectionName = process.env.MONGODB_TEAM_BETS_COLLECTION || 'Team_bets';
const currentGameDataCollectionName = process.env.MONGODB_CURRENT_GAME_DATA_COLLECTION || 'Current_game_data';
const pendingBetsCollectionName = process.env.MONGODB_PENDING_BETS_COLLECTION || 'Pending_Bets';
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

let clientPromise;

if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

function getNextPlayableBracketMatch(bracketState) {
    const rounds = Array.isArray(bracketState?.rounds) ? bracketState.rounds : [];
    for (let roundIndex = 0; roundIndex < rounds.length; roundIndex += 1) {
        const round = rounds[roundIndex];
        const matches = Array.isArray(round?.matches) ? round.matches : [];

        for (let matchIndex = 0; matchIndex < matches.length; matchIndex += 1) {
            const match = matches[matchIndex];
            if (match?.home && match?.away && !match?.winner) {
                return {
                    roundIndex,
                    matchIndex,
                    roundLabel: String(round?.label || `Round ${roundIndex + 1}`),
                    match,
                };
            }
        }
    }

    return null;
}

function normalizeUsernameList(values) {
    if (!Array.isArray(values)) {
        return [];
    }

    return Array.from(
        new Set(
            values
                .map(value => String(value || '').trim())
                .filter(Boolean),
        ),
    );
}

function buildCurrentMatchGameBets(nextPlayable) {
    if (!nextPlayable?.match?.home?.name || !nextPlayable?.match?.away?.name) {
        return [];
    }

    const homeTeam = String(nextPlayable.match.home.name).trim();
    const awayTeam = String(nextPlayable.match.away.name).trim();
    const timeLabel = `${nextPlayable.roundLabel} · Match ${nextPlayable.matchIndex + 1}`;
    const optionsLabel = `${homeTeam} or ${awayTeam}`;
    const bracketMatchId = String(nextPlayable.match?.id || `${nextPlayable.roundIndex}-${nextPlayable.matchIndex}`);

    const markets = [
        { winner: 'Match Winner', odds: optionsLabel, payout_mult: 2.0 },
        { winner: 'More Ball Possession', odds: optionsLabel, payout_mult: 1.8 },
        { winner: 'More Fouls', odds: optionsLabel, payout_mult: 1.8 },
    ];

    return markets.map(market => ({
        away_team: awayTeam,
        home_team: homeTeam,
        time: timeLabel,
        winner: market.winner,
        odds: market.odds,
        payout_mult: market.payout_mult,
        bracketMatchId,
        roundIndex: nextPlayable.roundIndex,
        matchIndex: nextPlayable.matchIndex,
        createdAt: new Date(),
    }));
}

function normalizeKey(value) {
    return String(value || '').trim().toLowerCase();
}

function toFiniteNumber(value) {
    const parsed = Number(String(value ?? '').replace(/[^\d.+-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
}

function roundMoney(value) {
    return Number((Number.isFinite(Number(value)) ? Number(value) : 0).toFixed(2));
}

function toValidDateOrNull(value) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
}

function getReplayEndAt(liveReplay) {
    const startedAt = toValidDateOrNull(liveReplay?.startedAt);
    if (!startedAt) {
        return null;
    }

    const durationMs = Number.isFinite(Number(liveReplay?.durationMs))
        ? Number(liveReplay.durationMs)
        : 60000;

    return new Date(startedAt.getTime() + Math.max(0, durationMs));
}

function parseScorePair(scoreText) {
    const score = String(scoreText || '');
    const match = score.match(/(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)/);
    if (!match) {
        return null;
    }

    return {
        home: Number(match[1]),
        away: Number(match[2]),
    };
}

function parseMetricPair(metricText) {
    const parts = String(metricText || '').split('-').map(part => part.trim());
    if (parts.length !== 2) {
        return null;
    }

    const home = toFiniteNumber(parts[0]);
    const away = toFiniteNumber(parts[1]);
    if (!Number.isFinite(home) || !Number.isFinite(away)) {
        return null;
    }

    return { home, away };
}

function resolveTeamFromMetricPair(pair, homeTeam, awayTeam) {
    if (!pair) {
        return null;
    }
    if (pair.home > pair.away) {
        return homeTeam;
    }
    if (pair.away > pair.home) {
        return awayTeam;
    }
    return null;
}

function resolveCompletedMatchOutcomes(completedMatch) {
    const homeTeam = String(completedMatch?.homeTeam || '').trim();
    const awayTeam = String(completedMatch?.awayTeam || '').trim();
    const result = completedMatch?.result || {};

    let matchWinnerTeam = null;
    const winnerKey = normalizeKey(result?.winner);
    if (winnerKey === 'home') {
        matchWinnerTeam = homeTeam;
    } else if (winnerKey === 'away') {
        matchWinnerTeam = awayTeam;
    } else {
        const scorePair = parseScorePair(result?.score);
        matchWinnerTeam = resolveTeamFromMetricPair(scorePair, homeTeam, awayTeam);
    }

    const possessionPair = parseMetricPair(result?.ball_possession);
    const foulsPair = parseMetricPair(result?.fouls);

    return {
        homeTeam,
        awayTeam,
        matchWinnerTeam,
        possessionWinnerTeam: resolveTeamFromMetricPair(possessionPair, homeTeam, awayTeam),
        foulsWinnerTeam: resolveTeamFromMetricPair(foulsPair, homeTeam, awayTeam),
    };
}

function resolveExpectedTeamForMarket(marketName, outcomes) {
    const normalizedMarket = normalizeKey(marketName);
    if (normalizedMarket === 'match winner') {
        return outcomes.matchWinnerTeam;
    }
    if (normalizedMarket === 'more ball possession') {
        return outcomes.possessionWinnerTeam;
    }
    if (normalizedMarket === 'more fouls') {
        return outcomes.foulsWinnerTeam;
    }
    return null;
}

function isGamePickForCompletedMatch(pick, outcomes) {
    return normalizeKey(pick?.home_team) === normalizeKey(outcomes.homeTeam)
        && normalizeKey(pick?.away_team) === normalizeKey(outcomes.awayTeam)
        && ['match winner', 'more ball possession', 'more fouls'].includes(normalizeKey(pick?.winner));
}

function normalizeTeamReference(rawTeam, matchContext) {
    const normalized = normalizeKey(rawTeam);
    if (!normalized) {
        return null;
    }

    if (normalized === 'home') {
        return matchContext.homeTeam;
    }

    if (normalized === 'away') {
        return matchContext.awayTeam;
    }

    if (normalized === normalizeKey(matchContext.homeTeam)) {
        return matchContext.homeTeam;
    }

    if (normalized === normalizeKey(matchContext.awayTeam)) {
        return matchContext.awayTeam;
    }

    return null;
}

function getPlayerStatCount(matchContext, pick) {
    const playerName = String(pick?.name || '').trim();
    const statName = normalizeKey(pick?.stat);
    const betTeam = normalizeTeamReference(pick?.team, matchContext);

    if (!playerName || !statName || !betTeam) {
        return null;
    }

    const expectedEventType = statName === 'goals'
        ? 'goal'
        : (statName === 'fouls' ? 'foul' : null);

    if (!expectedEventType) {
        return null;
    }

    const events = Array.isArray(matchContext.match_events) ? matchContext.match_events : [];
    const playerKey = normalizeKey(playerName);

    return events.reduce((count, event) => {
        const eventType = normalizeKey(event?.event);
        if (eventType !== expectedEventType) {
            return count;
        }

        const eventPlayerKey = normalizeKey(event?.player);
        if (eventPlayerKey !== playerKey) {
            return count;
        }

        const eventTeam = normalizeTeamReference(event?.team, matchContext);
        if (eventTeam !== betTeam) {
            return count;
        }

        return count + 1;
    }, 0);
}

function doesPlayerPickWin(matchContext, pick) {
    const actualCount = getPlayerStatCount(matchContext, pick);
    if (!Number.isFinite(actualCount)) {
        return { didWin: false, actualCount: null, threshold: null, comparator: null };
    }

    const thresholdRaw = toFiniteNumber(pick?.stat_num);
    const threshold = Number.isFinite(thresholdRaw) ? thresholdRaw : null;
    const comparator = normalizeKey(pick?.range);

    if (!Number.isFinite(threshold) || !comparator) {
        return { didWin: false, actualCount, threshold, comparator };
    }

    if (comparator === 'over') {
        return { didWin: actualCount > threshold, actualCount, threshold, comparator };
    }

    if (comparator === 'under') {
        return { didWin: actualCount < threshold, actualCount, threshold, comparator };
    }

    if (comparator === 'exactly') {
        return { didWin: actualCount === threshold, actualCount, threshold, comparator };
    }

    return { didWin: false, actualCount, threshold, comparator };
}

function isPlayerPickForCompletedMatch(pick, matchContext) {
    const pickTeam = normalizeTeamReference(pick?.team, matchContext);
    return Boolean(pickTeam);
}

function getTeamMargin(matchContext, pick) {
    const teamName = normalizeTeamReference(pick?.country, matchContext);
    if (!teamName) {
        return null;
    }

    const scorePair = parseScorePair(matchContext?.score);
    if (!scorePair) {
        return null;
    }

    const isHome = normalizeKey(teamName) === normalizeKey(matchContext.homeTeam);
    const teamScore = isHome ? scorePair.home : scorePair.away;
    const opponentScore = isHome ? scorePair.away : scorePair.home;

    return {
        teamName,
        teamScore,
        opponentScore,
        winMargin: teamScore - opponentScore,
        lossMargin: opponentScore - teamScore,
    };
}

function doesTeamPickWin(matchContext, pick) {
    const marginInfo = getTeamMargin(matchContext, pick);
    if (!marginInfo) {
        return {
            didWin: false,
            teamName: null,
            outcome: null,
            rangeType: null,
            threshold: null,
            marginValue: null,
        };
    }

    const outcome = normalizeKey(pick?.outcome);
    const rangeType = normalizeKey(pick?.range);
    const thresholdRaw = toFiniteNumber(pick?.points);
    const threshold = Number.isFinite(thresholdRaw) ? thresholdRaw : null;

    if (!outcome || !rangeType || !Number.isFinite(threshold)) {
        return {
            didWin: false,
            teamName: marginInfo.teamName,
            outcome,
            rangeType,
            threshold,
            marginValue: null,
        };
    }

    const isWinsPick = outcome === 'wins';
    const isLosesPick = outcome === 'loses';
    if (!isWinsPick && !isLosesPick) {
        return {
            didWin: false,
            teamName: marginInfo.teamName,
            outcome,
            rangeType,
            threshold,
            marginValue: null,
        };
    }

    const baseMargin = isWinsPick ? marginInfo.winMargin : marginInfo.lossMargin;
    if (!(baseMargin > 0)) {
        return {
            didWin: false,
            teamName: marginInfo.teamName,
            outcome,
            rangeType,
            threshold,
            marginValue: baseMargin,
        };
    }

    if (rangeType === 'by more than') {
        return {
            didWin: baseMargin > threshold,
            teamName: marginInfo.teamName,
            outcome,
            rangeType,
            threshold,
            marginValue: baseMargin,
        };
    }

    if (rangeType === 'by less than') {
        return {
            didWin: baseMargin < threshold,
            teamName: marginInfo.teamName,
            outcome,
            rangeType,
            threshold,
            marginValue: baseMargin,
        };
    }

    if (rangeType === 'by exactly') {
        return {
            didWin: baseMargin === threshold,
            teamName: marginInfo.teamName,
            outcome,
            rangeType,
            threshold,
            marginValue: baseMargin,
        };
    }

    return {
        didWin: false,
        teamName: marginInfo.teamName,
        outcome,
        rangeType,
        threshold,
        marginValue: baseMargin,
    };
}

function isTeamPickForCompletedMatch(pick, matchContext) {
    return Boolean(normalizeTeamReference(pick?.country, matchContext));
}

async function settleCompletedMatchGameBets(client, completedMatch) {
    const outcomes = resolveCompletedMatchOutcomes(completedMatch);

    const currentGameDataCollection = client.db(dbName).collection(currentGameDataCollectionName);
    const latestCurrentGameData = await currentGameDataCollection
        .find({})
        .sort({ createdAt: -1, _id: -1 })
        .limit(1)
        .next();

    const currentMatchContext = {
        homeTeam: String(latestCurrentGameData?.homeTeam || outcomes.homeTeam || '').trim(),
        awayTeam: String(latestCurrentGameData?.awayTeam || outcomes.awayTeam || '').trim(),
        score: latestCurrentGameData?.score || completedMatch?.result?.score || null,
        match_events: Array.isArray(latestCurrentGameData?.match_events)
            ? latestCurrentGameData.match_events
            : [],
    };

    if (!currentMatchContext.homeTeam || !currentMatchContext.awayTeam) {
        return { settledPicks: 0, totalPayout: 0, unclaimedWins: 0, unclaimedPayout: 0 };
    }

    const gameOutcomes = {
        ...outcomes,
        homeTeam: currentMatchContext.homeTeam,
        awayTeam: currentMatchContext.awayTeam,
    };

    const usersCollection = client.db(userDbName).collection(usersCollectionName);
    const completedBetsCollection = client.db(userDbName).collection(completedBetsCollectionName);

    const candidateUsers = await usersCollection.find(
        {
            $or: [
                { game_picks: { $exists: true, $ne: [] } },
                { player_picks: { $exists: true, $ne: [] } },
                { team_picks: { $exists: true, $ne: [] } },
            ],
        },
        { projection: { username: 1, credits: 1, total_bets: 1, wins: 1, losses: 1, profit: 1, player_picks: 1, team_picks: 1, game_picks: 1 } },
    ).toArray();

    let settledPicks = 0;
    let totalPayout = 0;
    let unclaimedWins = 0;
    let unclaimedPayout = 0;

    for (const user of candidateUsers) {
        const playerPicks = Array.isArray(user.player_picks) ? user.player_picks : [];
        const teamPicks = Array.isArray(user.team_picks) ? user.team_picks : [];
        const gamePicks = Array.isArray(user.game_picks) ? user.game_picks : [];

        const playerPicksToSettle = playerPicks.filter(pick => isPlayerPickForCompletedMatch(pick, currentMatchContext));
        const teamPicksToSettle = teamPicks.filter(pick => isTeamPickForCompletedMatch(pick, currentMatchContext));
        const gamePicksToSettle = gamePicks.filter(pick => isGamePickForCompletedMatch(pick, gameOutcomes));

        const totalUserPicksToSettle = playerPicksToSettle.length + teamPicksToSettle.length + gamePicksToSettle.length;
        if (totalUserPicksToSettle === 0) {
            continue;
        }

        const remainingPlayerPicks = playerPicks.filter(pick => !isPlayerPickForCompletedMatch(pick, currentMatchContext));
        const remainingTeamPicks = teamPicks.filter(pick => !isTeamPickForCompletedMatch(pick, currentMatchContext));
        const untouchedGamePicks = gamePicks.filter(pick => !isGamePickForCompletedMatch(pick, gameOutcomes));
        const settledAt = new Date();

        // Player + team picks auto-credit; game picks hold in game_picks as won_unclaimed until claimed.
        let userPayout = 0;
        let userWins = 0;
        let userLosses = 0;
        let userProfitDelta = 0;

        const playerCompletedRecords = playerPicksToSettle.map(pick => {
            const playerResult = doesPlayerPickWin(currentMatchContext, pick);
            const didWin = playerResult.didWin;
            const amount = roundMoney(pick?.amount);
            const payoutMult = Number.isFinite(Number(pick?.payout_mult)) ? Number(pick.payout_mult) : 0;
            const payout = didWin ? roundMoney(amount * payoutMult) : 0;
            const net = roundMoney(payout - amount);

            userPayout += payout;
            userProfitDelta += net;
            if (didWin) {
                userWins += 1;
            } else {
                userLosses += 1;
            }

            return {
                username: user.username,
                category: 'Player',
                status: didWin ? 'won' : 'lost',
                amount,
                payout_mult: payoutMult,
                payout,
                net,
                player: String(pick?.name || '').trim() || null,
                stat: String(pick?.stat || '').trim() || null,
                comparator: playerResult.comparator,
                threshold: playerResult.threshold,
                actual: playerResult.actualCount,
                settledAt,
                pick,
                completedMatch: {
                    matchId: String(completedMatch?.matchId || '').trim() || null,
                    homeTeam: currentMatchContext.homeTeam,
                    awayTeam: currentMatchContext.awayTeam,
                },
            };
        });

        const teamCompletedRecords = teamPicksToSettle.map(pick => {
            const teamResult = doesTeamPickWin(currentMatchContext, pick);
            const didWin = teamResult.didWin;
            const amount = roundMoney(pick?.amount);
            const payoutMult = Number.isFinite(Number(pick?.payout_mult)) ? Number(pick.payout_mult) : 0;
            const payout = didWin ? roundMoney(amount * payoutMult) : 0;
            const net = roundMoney(payout - amount);

            userPayout += payout;
            userProfitDelta += net;
            if (didWin) {
                userWins += 1;
            } else {
                userLosses += 1;
            }

            return {
                username: user.username,
                category: 'Team',
                status: didWin ? 'won' : 'lost',
                amount,
                payout_mult: payoutMult,
                payout,
                net,
                team: teamResult.teamName || String(pick?.country || '').trim() || null,
                outcome: teamResult.outcome,
                range: teamResult.rangeType,
                threshold: teamResult.threshold,
                margin: teamResult.marginValue,
                settledAt,
                pick,
                completedMatch: {
                    matchId: String(completedMatch?.matchId || '').trim() || null,
                    homeTeam: currentMatchContext.homeTeam,
                    awayTeam: currentMatchContext.awayTeam,
                },
            };
        });

        const unclaimedWinPicks = [];
        const gameLostRecords = [];
        let userGamePendingPayout = 0;

        gamePicksToSettle.forEach(pick => {
            const expectedTeam = resolveExpectedTeamForMarket(pick?.winner, gameOutcomes);
            const selectedTeam = String(pick?.selected_team || '').trim();
            const didWin = Boolean(expectedTeam) && normalizeKey(selectedTeam) === normalizeKey(expectedTeam);
            const amount = roundMoney(pick?.amount);
            const payoutMult = Number.isFinite(Number(pick?.payout_mult)) ? Number(pick.payout_mult) : 0;
            const payout = didWin ? roundMoney(amount * payoutMult) : 0;

            if (didWin) {
                unclaimedWinPicks.push({
                    ...pick,
                    status: 'won_unclaimed',
                    payout,
                    amount,
                    payout_mult: payoutMult,
                    expected_team: expectedTeam,
                    selected_team: selectedTeam || null,
                    settledAt,
                    completedMatch: {
                        matchId: String(completedMatch?.matchId || '').trim() || null,
                        homeTeam: gameOutcomes.homeTeam,
                        awayTeam: gameOutcomes.awayTeam,
                    },
                });
                userGamePendingPayout += payout;
            } else {
                userLosses += 1;
                userProfitDelta -= amount;
                gameLostRecords.push({
                    username: user.username,
                    category: 'Game',
                    status: 'lost',
                    amount,
                    payout_mult: payoutMult,
                    payout: 0,
                    net: roundMoney(0 - amount),
                    selected_team: selectedTeam || null,
                    expected_team: expectedTeam,
                    market: String(pick?.winner || '').trim() || '--',
                    settledAt,
                    pick,
                    completedMatch: {
                        matchId: String(completedMatch?.matchId || '').trim() || null,
                        homeTeam: gameOutcomes.homeTeam,
                        awayTeam: gameOutcomes.awayTeam,
                    },
                });
            }
        });

        const completedRecords = [
            ...playerCompletedRecords,
            ...teamCompletedRecords,
            ...gameLostRecords,
        ];

        const currentCredits = Number.isFinite(Number(user.credits)) ? Number(user.credits) : 0;
        const currentWins = Number.isFinite(Number(user.wins)) ? Number(user.wins) : 0;
        const currentLosses = Number.isFinite(Number(user.losses)) ? Number(user.losses) : 0;
        const currentProfit = Number.isFinite(Number(user.profit)) ? Number(user.profit) : 0;
        const fallbackTotalBets =
            (Array.isArray(user.player_picks) ? user.player_picks.length : 0) +
            (Array.isArray(user.team_picks) ? user.team_picks.length : 0) +
            (Array.isArray(user.game_picks) ? user.game_picks.length : 0);
        const currentTotalBets = Number.isFinite(Number(user.total_bets)) ? Number(user.total_bets) : fallbackTotalBets;

        await usersCollection.updateOne(
            { _id: user._id },
            {
                $set: {
                    player_picks: remainingPlayerPicks,
                    team_picks: remainingTeamPicks,
                    game_picks: [...untouchedGamePicks, ...unclaimedWinPicks],
                    credits: roundMoney(currentCredits + userPayout),
                    wins: currentWins + userWins,
                    losses: currentLosses + userLosses,
                    profit: roundMoney(currentProfit + userProfitDelta),
                    // Keep total_bets cumulative; resolved picks should only affect wins/losses.
                    total_bets: currentTotalBets,
                },
            },
        );

        if (completedRecords.length > 0) {
            await completedBetsCollection.insertMany(completedRecords);
        }

        settledPicks += totalUserPicksToSettle;
        totalPayout += userPayout;
        unclaimedWins += unclaimedWinPicks.length;
        unclaimedPayout += userGamePendingPayout;
    }

    return {
        settledPicks,
        totalPayout: roundMoney(totalPayout),
        unclaimedWins,
        unclaimedPayout: roundMoney(unclaimedPayout),
    };
}

async function finalizeReplaySettlementIfReady(client, latestBracket, bracketCollection) {
    if (!latestBracket?._id) {
        return latestBracket;
    }

    const lifecycle = latestBracket.matchLifecycle || {};
    const isLocked = String(lifecycle.phase || '').trim().toUpperCase() === BETTING_PHASES.MODERATOR_LOCKED;
    if (!isLocked) {
        return latestBracket;
    }

    const completedMatch = lifecycle.pendingSettlementMatch;
    if (!completedMatch || typeof completedMatch !== 'object') {
        return latestBracket;
    }

    const replayEndAt = toValidDateOrNull(lifecycle.userReplayEndsAt) || getReplayEndAt(latestBracket.liveReplay);
    if (!replayEndAt || replayEndAt.getTime() > Date.now()) {
        return latestBracket;
    }

    const settlementSummary = await settleCompletedMatchGameBets(client, completedMatch);
    const settlementCompletedAt = new Date();

    await bracketCollection.updateOne(
        { _id: latestBracket._id },
        {
            $set: {
                matchLifecycle: {
                    phase: BETTING_PHASES.PROPOSALS_OPEN,
                    settlementCompletedAt,
                    lastSettledMatch: completedMatch,
                    lastSettlementSummary: settlementSummary,
                    simulationStartedAt: null,
                    moderatorFinishedAt: null,
                    userReplayEndsAt: null,
                    pendingSettlementMatch: null,
                },
                updatedAt: settlementCompletedAt,
            },
        },
    );

    return {
        ...latestBracket,
        matchLifecycle: {
            phase: BETTING_PHASES.PROPOSALS_OPEN,
            settlementCompletedAt,
            lastSettledMatch: completedMatch,
            lastSettlementSummary: settlementSummary,
            simulationStartedAt: null,
            moderatorFinishedAt: null,
            userReplayEndsAt: null,
            pendingSettlementMatch: null,
        },
        updatedAt: settlementCompletedAt,
    };
}

export default async function handler(req, res) {
    try {
        const client = await clientPromise;
        const bracketCollection = client.db(dbName).collection(collectionName);
        const gameBetsCollection = client.db(dbName).collection(gameBetsCollectionName);
        const playerBetsCollection = client.db(dbName).collection(playerBetsCollectionName);
        const teamBetsCollection = client.db(dbName).collection(teamBetsCollectionName);
        const pendingBetsCollection = client.db(dbName).collection(pendingBetsCollectionName);

        if (req.method === 'GET') {
            const latestBracket = await bracketCollection
                .find({})
                .sort({ updatedAt: -1, createdAt: -1 })
                .limit(1)
                .next();

            const normalizedBracket = await finalizeReplaySettlementIfReady(client, latestBracket, bracketCollection);

            return res.status(200).json({ bracket: normalizedBracket || null });
        }

        if (req.method === 'PUT') {
            const previousBracket = await bracketCollection
                .find({})
                .sort({ updatedAt: -1, createdAt: -1 })
                .limit(1)
                .next();

            const bracketState = req.body?.bracketState;
            const completedMatch = req.body?.completedMatch;
            const liveReplay = req.body?.liveReplay && typeof req.body.liveReplay === 'object'
                ? req.body.liveReplay
                : null;
            const bannedUsernames = normalizeUsernameList(req.body?.bannedUsernames);

            if (!bracketState || typeof bracketState !== 'object') {
                return res.status(400).json({ error: 'A valid bracketState object is required.' });
            }

            // Explicitly replace all stored bracket docs with this new first-generation bracket.
            await bracketCollection.deleteMany({});

            const previousLifecycle = previousBracket?.matchLifecycle && typeof previousBracket.matchLifecycle === 'object'
                ? previousBracket.matchLifecycle
                : null;

            let nextLifecycle = previousLifecycle || {
                phase: BETTING_PHASES.PROPOSALS_OPEN,
                simulationStartedAt: null,
                moderatorFinishedAt: null,
                userReplayEndsAt: null,
                pendingSettlementMatch: null,
            };

            if (completedMatch && typeof completedMatch === 'object') {
                const now = new Date();
                const replayEndAt = getReplayEndAt(liveReplay);
                nextLifecycle = {
                    ...nextLifecycle,
                    phase: BETTING_PHASES.MODERATOR_LOCKED,
                    moderatorFinishedAt: now,
                    userReplayEndsAt: replayEndAt,
                    pendingSettlementMatch: completedMatch,
                };
            }

            const insertResult = await bracketCollection.insertOne({
                bracketState,
                liveReplay,
                bannedUsernames,
                matchLifecycle: nextLifecycle,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            let settlementSummary = null;
            if (completedMatch && typeof completedMatch === 'object') {
                const [pendingClearResult, playerClearResult, teamClearResult] = await Promise.all([
                    pendingBetsCollection.deleteMany({}),
                    playerBetsCollection.deleteMany({}),
                    teamBetsCollection.deleteMany({}),
                ]);

                settlementSummary = {
                    pendingBetsCleared: true,
                    playerBetsCleared: true,
                    teamBetsCleared: true,
                    pendingBetsDeleted: pendingClearResult?.deletedCount || 0,
                    playerBetsDeleted: playerClearResult?.deletedCount || 0,
                    teamBetsDeleted: teamClearResult?.deletedCount || 0,
                    settledPicks: 0,
                    totalPayout: 0,
                };
            }

            // Keep Game_bets aligned to the current (next playable) bracket match.
            const nextPlayable = getNextPlayableBracketMatch(bracketState);
            const nextGameBets = buildCurrentMatchGameBets(nextPlayable);
            await gameBetsCollection.deleteMany({});
            if (nextGameBets.length > 0) {
                await gameBetsCollection.insertMany(nextGameBets);
            }

            return res.status(200).json({
                ok: true,
                insertedId: insertResult.insertedId,
                gameBetsCreated: nextGameBets.length,
                settlement: settlementSummary,
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Bracket API error:', error);
        return res.status(500).json({ error: 'Failed to process bracket request.' });
    }
}
