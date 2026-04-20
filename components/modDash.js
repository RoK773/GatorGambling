// sets up the moderator dashboard - will be rendered in place of the standard dashboard when the user role is set to moderator
import {useEffect, useState} from 'react';
import ConfirmModal from './confirmModal';
import MatchSimulationPanel from './matchSimulationPanel';
import worldcupData from '../data/worldcup2022.json';

// drawing icons - style only 
const Icon = {
    // used on the approve button (checkmark)
    Check: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
        </svg>
    ),
    // x / close - used on decline
    X: ({size = 14}) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
    ),
    // trashcan - used on the delete chat message button
    Trash: () => (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 61-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
    ),
    // ban / circle slash - used on cancel stake buttons and banning users
    Ban: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
    ),
    // used in the moderator status banner and empty-state
    Shield: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V51-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
    ),
    // used in the empty-proposals state
    Inbox: () => (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2 v-61-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
        </svg>
    ),
};

// tab configuration (constTabs)
const MOD_TABS = {
    PROPOSALS: 'proposals',
    PLAYERS: 'players',
    TEAMS: 'teams',
    GAMES: 'games',
    BRACKET: 'bracket',
    LIVE: 'live',
};

// assign keys to tabs / tabConfig
const MOD_TAB_CONFIG = [
    {key: MOD_TABS.PROPOSALS, label: 'User Proposals', badge: true},
    {key: MOD_TABS.PLAYERS, label: 'Players'},
    {key: MOD_TABS.TEAMS, label: 'Teams'},
    {key: MOD_TABS.GAMES, label: 'Games'},
    {key: MOD_TABS.BRACKET, label: 'Bracket'},
    {key: MOD_TABS.LIVE, label: 'Live', live: true},
];

const BRACKET_ROUND_LABELS = ['Round of 16', 'Quarterfinals', 'Semifinals', 'Final'];
const BRACKET_SESSION_STORAGE_KEY = 'gatorgambling:moderator-bracket-session:v1';
const BRACKET_TEAMS = Array.isArray(worldcupData?.teams)
    ? worldcupData.teams
        .slice(0, 16)
        .map((team, index) => ({
            id: String(team?.id ?? team?.name ?? index).trim() || `team-${index}`,
            name: String(team?.name || '').trim() || 'Unknown Team',
            code: String(team?.fifa_code || '').trim() || '---',
            group: String(team?.group || '').trim() || '-',
            placement: Number.isFinite(Number(team?.placement)) ? Number(team.placement) : null,
        }))
    : [];

function shuffleItems(items) {
    const next = [...items];
    for (let index = next.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    }
    return next;
}

function loadBracketSession() {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const rawSession = window.localStorage.getItem(BRACKET_SESSION_STORAGE_KEY);
        if (!rawSession) {
            return null;
        }

        const parsedSession = JSON.parse(rawSession);
        if (!parsedSession || typeof parsedSession !== 'object') {
            return null;
        }

        return parsedSession;
    } catch {
        return null;
    }
}

function saveBracketSession(session) {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        window.localStorage.setItem(BRACKET_SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
        // ignore storage errors
    }
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

async function loadStoredBracket() {
    try {
        const response = await fetch('/api/bracket');
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            return null;
        }

        return data?.bracket || null;
    } catch {
        return null;
    }
}

async function replaceStoredBracket(bracketState, {
    completedMatch = null,
    liveReplay = null,
    bannedUsernames = [],
} = {}) {
    try {
        await fetch('/api/bracket', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                bracketState,
                completedMatch,
                liveReplay,
                bannedUsernames: normalizeUsernameList(bannedUsernames),
            }),
        });
    } catch {
        // ignore persistence errors so moderator flow keeps working
    }
}

function createBracketMatch(roundIndex, matchIndex, home = null, away = null) {
    return {
        id: `${roundIndex}-${matchIndex}`,
        roundIndex,
        matchIndex,
        home,
        away,
        winner: null,
        result: null,
        played: false,
    };
}

function createBracketState(teams) {
    const seededTeams = shuffleItems(teams).slice(0, 16);
    const rounds = BRACKET_ROUND_LABELS.map((label, roundIndex) => {
        const matchCount = 2 ** (3 - roundIndex);
        const matches = Array.from({length: matchCount}, (_, matchIndex) => {
            if (roundIndex !== 0) {
                return createBracketMatch(roundIndex, matchIndex);
            }

            const home = seededTeams[matchIndex * 2] || null;
            const away = seededTeams[matchIndex * 2 + 1] || null;
            return createBracketMatch(roundIndex, matchIndex, home, away);
        });

        return {label, matches};
    });

    return {
        seededTeams,
        rounds,
    };
}

function cloneBracketState(bracketState) {
    return {
        seededTeams: Array.isArray(bracketState?.seededTeams) ? bracketState.seededTeams.map(team => ({...team})) : [],
        rounds: Array.isArray(bracketState?.rounds)
            ? bracketState.rounds.map(round => ({
                label: round.label,
                matches: Array.isArray(round.matches)
                    ? round.matches.map(match => ({
                        ...match,
                        home: match.home ? {...match.home} : null,
                        away: match.away ? {...match.away} : null,
                        winner: match.winner ? {...match.winner} : null,
                        result: match.result ? {...match.result, match_events: Array.isArray(match.result.match_events) ? match.result.match_events.map(event => ({...event})) : []} : null,
                    }))
                    : [],
            }))
            : [],
    };
}

function resolveBracketWinner(home, away, result) {
    const winner = String(result?.winner || '').trim().toLowerCase();
    if (winner === 'home') {
        return home;
    }
    if (winner === 'away') {
        return away;
    }

    const homeGoals = Number(home?.total_goals ?? 0);
    const awayGoals = Number(away?.total_goals ?? 0);
    if (homeGoals !== awayGoals) {
        return homeGoals > awayGoals ? home : away;
    }

    const homePlacement = Number(home?.placement ?? Number.POSITIVE_INFINITY);
    const awayPlacement = Number(away?.placement ?? Number.POSITIVE_INFINITY);
    if (homePlacement !== awayPlacement) {
        return homePlacement < awayPlacement ? home : away;
    }

    return home;
}

function advanceBracketState(bracketState, selection, result) {
    if (!selection || !result) {
        return bracketState;
    }

    const next = cloneBracketState(bracketState);
    const currentRound = next.rounds[selection.roundIndex];
    const currentMatch = currentRound?.matches?.[selection.matchIndex];
    if (!currentMatch || !currentMatch.home || !currentMatch.away) {
        return bracketState;
    }

    const winner = resolveBracketWinner(currentMatch.home, currentMatch.away, result);
    currentMatch.result = result;
    currentMatch.winner = winner;
    currentMatch.played = true;

    const nextRound = next.rounds[selection.roundIndex + 1];
    if (nextRound) {
        const nextMatchIndex = Math.floor(selection.matchIndex / 2);
        const nextSlot = selection.matchIndex % 2 === 0 ? 'home' : 'away';
        const nextMatch = nextRound.matches[nextMatchIndex];
        if (nextMatch) {
            nextMatch[nextSlot] = winner;
        }
    }

    return next;
}

function getBracketChampion(bracketState) {
    const finalRound = bracketState?.rounds?.[BRACKET_ROUND_LABELS.length - 1];
    return finalRound?.matches?.[0]?.winner || null;
}

function getNextPlayableBracketMatch(bracketState) {
    if (!Array.isArray(bracketState?.rounds)) {
        return null;
    }

    for (let roundIndex = 0; roundIndex < bracketState.rounds.length; roundIndex += 1) {
        const round = bracketState.rounds[roundIndex];
        const matches = Array.isArray(round?.matches) ? round.matches : [];

        for (let matchIndex = 0; matchIndex < matches.length; matchIndex += 1) {
            const match = matches[matchIndex];
            if (match?.home && match?.away && !match?.winner) {
                return {
                    roundIndex,
                    matchIndex,
                    matchId: match.id,
                    homeTeam: match.home.name,
                    awayTeam: match.away.name,
                };
            }
        }
    }

    return null;
}

function getReplayCountdownSeconds(liveReplay, nowMs = Date.now()) {
    const startedAtMs = new Date(liveReplay?.startedAt).getTime();
    if (!Number.isFinite(startedAtMs)) {
        return null;
    }

    const diffMs = startedAtMs - nowMs;
    if (diffMs <= 0) {
        return null;
    }

    return Math.ceil(diffMs / 1000);
}

// triggers the confirmmodal and resolves to true or false for the action
function useConfirm() {
    const [state, setState] = useState(null);
    const confirm = ({title, message, confirmLabel = 'CONFIRM', confirmDanger = false}) =>
        new Promise(resolve => {
            setState({
                title, message, confirmLabel, confirmDanger, resolve,
            });
        });
        // confirm
    const handleConfirm = () => {
        state?.resolve(true);
        setState(null);
    };
    // cancel
    const handleCancel = () => {
        state?.resolve(false);
        setState(null);
    };
    // set up the modal - if cancel, do nothing. otherwise, react to the command
    const modal = state ? (
        <ConfirmModal title={state.title} message={state.message} confirmLabel={state.confirmLabel} confirmDanger={state.confirmDanger} onConfirm={handleConfirm} onCancel={handleCancel} />
    ) : null;
    return {confirm, modal};
}

// a helper to render a condition summary
function condSummary(category, condition){
    if (!condition || Object.keys(condition).length === 0) {
        return null;
    }

    // player condition summary 
    if (category === 'Player'){
        const {statType, comparator, condVal} = condition;
        if (!condVal){
            return null;
        }
        return `${statType || 'Goals'} - ${comparator || 'Over'} ${condVal}`;
    }

    // team condition summary
    if (category === 'Team'){
        const {result, marginType, condVal} = condition;
        if (!result){
            return null;
        }
        if (result === 'Draws'){
            return 'Draws';
        }
        if (!condVal){
            return null;
        }
        return `${result} - ${marginType || 'By More Than'} ${condVal}`;
    }
    
    // game condition summary
    if (category === 'Game'){
        const {outcome, homeScore, awayScore, showScore} = condition;
        if (!outcome){
            return null;
        }
        const label = outcome === 'Home Team Wins' ? 'Home wins' : outcome === 'Away Team Wins' ? 'Away wins' : 'Draw';
        if (showScore && homeScore !== '' && awayScore !== ''){
            return `${label} - ${homeScore} : ${awayScore}`;
        }
        return label;
    }
    return null;
}

// proposals tab
function ProposalsTab({proposals, onApprove, onDecline, isLoading }){
    if (isLoading){
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: 400, gap: 16, animation: 'fadeIn 0.4s ease',
            }}>
                <div style={{
                    color: 'var(--text-muted)', opacity: 0.5,
                }}>
                    <Icon.Inbox/>
                </div>
                <p style={{
                    fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)'
                }}>
                    Loading Proposals...
                </p>
            </div>
        );
    }
    if (proposals.length === 0){
        return (
            // if no proposals, provide 'empty' screen (style only)
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: 400, gap: 16, animation: 'fadeIn 0.4s ease',
            }}>
                <div style={{
                    color: 'var(--text-muted)', opacity: 0.5,
                }}>
                    <Icon.Inbox/>
                </div>
                <h3 style={{
                    fontFamily: 'var(--font-display)', fontSize: 26, letterSpacing: '0.06em', color: 'var(--text-muted)',
                }}>NO PENDING PROPOSALS</h3>
                <p style={{
                    fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 260,
                }}>User-submitted bet proposals will appear here for review.</p>
            </div>
        );
    }
    return (
        // otherwise, if proposals, display proposals and set up approval / decline conditions
        <div style={{
            display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeIn 0.4s ease',
        }}>
            {proposals.map((p, i) => (
                <ProposalCard key={p.id} proposal={p} index={i} onApprove={onApprove} onDecline={onDecline} />
            ))}
        </div>
    );
}

// build the proposal card (propCard)
function ProposalCard({ proposal, index, onApprove, onDecline}) {
    // constants for the proposal card
    const submittedAt = proposal.proposedAt ? new Date(proposal.proposedAt).toLocaleString() : 'Unknown';
    const detailKeys = Object.entries(proposal).filter(
        ([k]) => !['id', 'category', 'proposedAt', 'status', 'condition'].includes(k)
    );
    return (
        // style elements + general card setup
        <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', animation: 'fadeIn 0.4s ease both', animationDelay: `${index * 0.05}s`,
        }}>
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 14, flexWrap: 'wrap', gap: 10,
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    <div style={{
                        background: 'rgba(198, 241, 53, 0.1)', border: '1px solid rgba(198, 241, 53, 0.25)',
                        color: 'var(--accent)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', 
                        padding: '3px 10px', borderRadius: 6,
                    }}>
                        {proposal.category.toUpperCase()}
                    </div>
                    <span style={{
                        fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                    }}>Submitted {submittedAt}</span>
                </div>
                <div style={{
                    display: 'flex', gap: 8,
                }}>
                    {/* approval button / aprvBet + settings */}
                    <button onClick={() => onApprove(proposal.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
                        background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)',
                        color: 'var(--success)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)'}>
                        <Icon.Check />APPROVE
                    </button>

                    {/* decline button / decBet + settings */}
                    <button onClick={() => onDecline(proposal.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
                        background: 'rgba(255, 71, 87, 0.08)', border: '1px solid rgba(255, 71, 87, 0.25)',
                        color: 'var(--danger)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.08)'}>
                        <Icon.X />DECLINE
                    </button>
                </div>
            </div>
            <div style={{
                display: 'flex', flexWrap: 'wrap', gap: '10px 24px', background: 'var(--bg-secondary)',
                borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border)',
            }}>
                {/* actual bet setup for the card - betConfig */}
                {detailKeys.map(([key, val]) => (
                    <div key={key}>
                        <div style={{
                            fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3,
                        }}>{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                        <div style={{
                            fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 500,
                        }}>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</div>
                    </div>
                ))}
            </div>

            {(() => {
                const summary = condSummary(proposal.category, proposal.condition);
                if (!summary){
                    return null;
                }
                return (
                    <div style={{
                        marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(198, 241, 53, 0.07)',
                        border: '1px solid rgba(198, 241, 53, 0.22)', borderRadius: 8, padding: '6px 12px', fontSize: 11,
                        fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.05em',
                    }}>
                        - CONDITION: {summary}
                    </div>
                );
            })()}
        </div>
    );
}

// players tab for mod
function ModPlayersTab({ players, onCancelStake}) {
    return(
        <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, animation: 'fadeIn 0.4s ease',
        }}>
            {players.map((p, i) => (
                <ModItemCard key={p.id} title={p.name} subtitle={`#${p.number}`} meta={p.pos} stake={p.stake} index={i} onCancel={() => onCancelStake('player', p.id)} />
            ))}
        </div>
    );
}

// teams tab for mod
function ModTeamsTab({ teams, onCancelStake}) {
    return (
        <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, animation: 'fadeIn 0.4s ease',
        }}>
            {teams.map((t, i) => (
                <ModItemCard key={t.id} title={t.name} subtitle={t.record} stake={t.stake} index={i} onCancel={() => onCancelStake('team', t.id)} />
            ))}
        </div>
    );
}

// games tab for mod
function ModGamesTab({games, onCancelStake}) {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeIn 0.4s ease',
        }}>
            {games.map((g, i) => (
                <ModGameRow key={g.id} g={g} i={i} onCancel={() => onCancelStake('game', g.id)} />
            ))}
        </div>
    );
}

// bracket tab for mod
function ModBracketTab({bracket, selectedMatch, nextPlayableMatch, onSelectMatch}) {
    const champion = getBracketChampion(bracket);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            animation: 'fadeIn 0.4s ease',
        }}>
            {champion && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(198, 241, 53, 0.16), rgba(20, 24, 32, 0.92))',
                    border: '1px solid rgba(198, 241, 53, 0.28)',
                    borderRadius: 14,
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                }}>
                    <div>
                        <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            color: 'var(--accent)',
                            letterSpacing: '0.12em',
                            marginBottom: 4,
                        }}>
                            ULTIMATE WINNER
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 28,
                            letterSpacing: '0.06em',
                            color: 'var(--text-primary)',
                        }}>
                            {champion.name}
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            color: 'var(--text-secondary)',
                            letterSpacing: '0.08em',
                        }}>
                            {champion.code} · GROUP {champion.group}
                        </div>
                    </div>
                    <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: '#080A0F',
                        background: 'var(--accent)',
                        padding: '8px 12px',
                        borderRadius: 999,
                    }}>
                        CHAMPION
                    </div>
                </div>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 16,
            }}>
                {bracket.rounds.map((round, roundIndex) => (
                    <div key={round.label} style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 14,
                        padding: 16,
                        minHeight: 240,
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                            marginBottom: 14,
                            flexWrap: 'wrap',
                        }}>
                            <div style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: 18,
                                letterSpacing: '0.06em',
                                color: 'var(--text-primary)',
                            }}>
                                {round.label}
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 10,
                                color: 'var(--text-muted)',
                                letterSpacing: '0.08em',
                            }}>
                                {round.matches.length} {round.matches.length === 1 ? 'MATCH' : 'MATCHES'}
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 12,
                        }}>
                            {round.matches.map((match, matchIndex) => (
                                (() => {
                                    const isNextPlayable = Boolean(
                                        nextPlayableMatch
                                        && nextPlayableMatch.roundIndex === roundIndex
                                        && nextPlayableMatch.matchIndex === matchIndex,
                                    );

                                    return (
                                <div key={match.id} style={{
                                    border: '1px solid var(--border)',
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    background: selectedMatch?.matchId === match.id ? 'rgba(198, 241, 53, 0.06)' : 'var(--bg-secondary)',
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 10,
                                        padding: '10px 12px',
                                        borderBottom: '1px solid var(--border)',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                    }}>
                                        <div style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: 10,
                                            color: 'var(--text-muted)',
                                            letterSpacing: '0.08em',
                                        }}>
                                            MATCH {matchIndex + 1}
                                        </div>
                                        <div style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontSize: 10,
                                            color: match.played ? 'var(--accent)' : 'var(--danger)',
                                            letterSpacing: '0.08em',
                                        }}>
                                            {match.played ? `RESULT: ${match.result?.score || `${match.result?.home_score ?? 0} - ${match.result?.away_score ?? 0}`}` : 'Not Played'}
                                        </div>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 12,
                                        padding: '11px 12px',
                                        background: match.home && match.winner?.id === match.home.id ? 'rgba(198, 241, 53, 0.10)' : 'transparent',
                                        borderLeft: match.home && match.winner?.id === match.home.id ? '3px solid var(--accent)' : '3px solid transparent',
                                    }}>
                                        {match.home ? (
                                            <div>
                                                <div style={{
                                                    fontFamily: 'var(--font-display)',
                                                    fontSize: 16,
                                                    letterSpacing: '0.04em',
                                                    color: 'var(--text-primary)',
                                                }}>
                                                    {match.home.name}
                                                </div>
                                                <div style={{
                                                    fontFamily: 'var(--font-mono)',
                                                    fontSize: 10,
                                                    color: 'var(--text-muted)',
                                                    letterSpacing: '0.08em',
                                                }}>
                                                    {match.home.code} · GROUP {match.home.group}
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: 10,
                                                color: 'var(--text-muted)',
                                                letterSpacing: '0.08em',
                                            }}>
                                                HOME SLOT PENDING
                                            </div>
                                        )}
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 12,
                                        padding: '11px 12px',
                                        background: match.away && match.winner?.id === match.away.id ? 'rgba(198, 241, 53, 0.10)' : 'transparent',
                                        borderTop: '1px solid var(--border)',
                                        borderLeft: match.away && match.winner?.id === match.away.id ? '3px solid var(--accent)' : '3px solid transparent',
                                    }}>
                                        {match.away ? (
                                            <div>
                                                <div style={{
                                                    fontFamily: 'var(--font-display)',
                                                    fontSize: 16,
                                                    letterSpacing: '0.04em',
                                                    color: 'var(--text-primary)',
                                                }}>
                                                    {match.away.name}
                                                </div>
                                                <div style={{
                                                    fontFamily: 'var(--font-mono)',
                                                    fontSize: 10,
                                                    color: 'var(--text-muted)',
                                                    letterSpacing: '0.08em',
                                                }}>
                                                    {match.away.code} · GROUP {match.away.group}
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: 10,
                                                color: 'var(--text-muted)',
                                                letterSpacing: '0.08em',
                                            }}>
                                                AWAY SLOT PENDING
                                            </div>
                                        )}
                                    </div>
                                    {!match.home || !match.away ? (
                                        <div style={{
                                            padding: '12px',
                                            fontSize: 11,
                                            color: 'var(--text-muted)',
                                            fontFamily: 'var(--font-mono)',
                                            letterSpacing: '0.06em',
                                        }}>
                                            Waiting for prior winners.
                                        </div>
                                    ) : !match.winner ? (
                                        <button onClick={() => onSelectMatch({roundIndex, matchIndex, match})} disabled={!isNextPlayable} style={{
                                            width: '100%',
                                            background: isNextPlayable ? 'rgba(198, 241, 53, 0.10)' : 'rgba(255, 255, 255, 0.04)',
                                            borderTop: '1px solid var(--border)',
                                            color: isNextPlayable ? 'var(--accent)' : 'var(--text-muted)',
                                            fontSize: 11,
                                            fontWeight: 800,
                                            letterSpacing: '0.08em',
                                            padding: '11px 12px',
                                            cursor: isNextPlayable ? 'pointer' : 'not-allowed',
                                        }}>
                                            {isNextPlayable ? 'SIMULATE THIS MATCH' : 'PLAY PREVIOUS MATCHES FIRST'}
                                        </button>
                                    ) : (
                                        <div style={{
                                            padding: '12px',
                                            fontSize: 11,
                                            color: 'var(--accent)',
                                            fontFamily: 'var(--font-mono)',
                                            letterSpacing: '0.06em',
                                            borderTop: '1px solid var(--border)',
                                        }}>
                                            {match.winner.name} {roundIndex === bracket.rounds.length - 1 ? 'WINS' : 'ADVANCES'}
                                        </div>
                                    )}
                                </div>
                                    );
                                })()
                            ))}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}

// game row for mod and cancellation
function ModGameRow({g, i, onCancel}) {
    const [hover, setHover] = useState(false);
    return (
        <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
            background: hover ? 'var(--bg-card-hover)' : 'var(--bg-card)', 
            border: `1px solid ${hover ? 'var(--border-bright)' : 'var(--border)'}`,
            borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'all 0.2s', animation: 'fadeIn 0.4s ease both', animationDelay: `${i * 0.05}s`, flexWrap: 'wrap', gap: 16,
        }}>
            <div style={{
                display: 'flex', gap: 16, alignItems: 'center',
            }}>
                <div style={{
                    background: 'rgba(198, 241, 53, 0.1)', color: 'var(--accent)', fontSize: 11, fontWeight: 700,
                    padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(198, 241, 53, 0.2)', fontFamily: 'var(--font-mono)',
                }}>
                    {g.spread}
                </div>
                <div>
                    <div style={{
                        fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--text-primary)',
                    }}>
                        {g.home} <span style={{
                            color: 'var(--text-muted)',
                        }}>vs</span> {g.away}
                    </div>
                    <div style={{
                        fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: 4,
                    }}>{g.time}</div>
                </div>
            </div>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 24,
            }}>
                <div style={{
                    textAlign: 'right',
                }}>
                    <div style={{
                        fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
                    }}>STAKE</div>
                    <div style={{
                        fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--accent)', fontWeight: 500,
                    }}>{g.stake}</div>
                </div>

                {/* cancel gameStake button */}
                <button onClick={onCancel} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 8,
                    border: '1px solid rgba(255, 71, 87, 0.3)', color: 'var(--danger)', fontSize: 12, fontWeight: 700,
                    letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.2s', background: 'transparent',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    <Icon.Ban /> CANCEL STAKE
                </button>
            </div>
        </div>
    );
}

// reusable card for player and team stakes in their respective tabs
function ModItemCard({title, subtitle, meta, stake, index, onCancel}) {
    const [hover, setHover] = useState(false);
    return (
        <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
            background: hover ? 'var(--bg-card-hover)' : 'var(--bg-card)', border: `1px solid ${hover ? 'var(--border-bright)' : 'var(--border)'}`,
            borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', transition: 'all 0.2s',
            animation: 'fadeIn 0.4s ease both', animationDelay: `${index * 0.05}s`,
        }}>
            {meta && ( <div style={{
                display: 'inline-flex', alignSelf: 'flex-start', background: 'rgba(198, 241, 53, 0.1)', color: 'var(--accent)', fontSize: 10,
                fontWeight: 700, letterSpacing: '0.08em', padding: '3px 8px', borderRadius: 6, marginBottom: 12, borderRadius: 6,
                marginBottom: 12, border: '1px solid rgba(198, 241, 53, 0.2)',
            }}>{meta}</div>
            )}
            <div style={{
                fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.04em', color: 'var(--text-primary)', marginBottom: 4,
            }}>{title}</div>
            <div style={{
                fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginBottom: 16,
            }}>{subtitle}</div>
            <div style={{
                height: 1, background: 'var(--border)', marginBottom: 14,
            }}/>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
                }}>
                    <div>
                        <div style={{
                            fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3,
                        }}>STAKE</div>
                        <div style={{
                            fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, color: 'var(--accent)',
                        }}>{stake}</div>
                    </div>
                </div>
                <button onClick={onCancel} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '10px',
                    borderRadius: 8, border: '1px solid rgba(255, 71, 87, 0.3)', color: 'var(--danger)', fontSize: 12,
                    fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.2s', background: 'transparent',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                <Icon.Ban/>CANCEL STAKE 
            </button>
        </div>
    );
}

// live tab for mod **global chat
function ModLiveTab({chatMessages, onDeleteMessage, onBanUser, onNewMessage, username, selectedMatch, simulationState, onSimulationComplete}) {
    // general constants for global chat
    const [inputText, setInputText] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const normalizedSearch = userSearch.trim().toLowerCase();
    // messages after trim with filter (cancellations) applied 
    const filteredMessages = normalizedSearch
        ? chatMessages.filter(msg => String(msg.user || '').toLowerCase().includes(normalizedSearch))
        : chatMessages;
    
    // handle sending 
    const handleSend = () => {
        const trimmed = inputText.trim();
        if (!trimmed || typeof onNewMessage !== 'function') {
            return;
        }

        onNewMessage({
            user: username || 'MOD',
            initials: (username || 'MD').slice(0, 2).toUpperCase(),
            color: 'var(--accent)',
            text: trimmed,
        });
        setInputText('');
    };

    return (
        // general page setup for mod (simulation + global chat moderation)
        <div style={{
            display: 'flex',  flexDirection: 'row', gap: 16, alignItems: 'flex-start', animation: 'fadeIn 0.4s ease',
        }}>
            <div style={{
                flex: '0 0 58%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
                minHeight: 520, gap: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14,
                padding: 24, overflowY: 'auto',
            }}>
                <div style={{
                    width: '100%', maxWidth: 520,
                    background: 'linear-gradient(135deg, rgba(198, 241, 53, 0.12), rgba(20, 24, 32, 0.92))',
                    border: '1px solid rgba(198, 241, 53, 0.3)',
                    borderRadius: 14, padding: '16px 18px',
                    display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                    }}>
                        <div style={{
                            fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '0.06em',
                            color: 'var(--accent)',
                        }}>MODERATOR PLAYBOOK</div>
                        <div style={{
                            background: 'rgba(198, 241, 53, 0.16)', border: '1px solid rgba(198, 241, 53, 0.28)',
                            borderRadius: 999, padding: '2px 8px', fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
                            color: 'var(--accent)', fontFamily: 'var(--font-mono)',
                        }}>MOD ONLY</div>
                    </div>
                    <div style={{
                        fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5,
                    }}>Keep the wheels greased. The degens are watching.</div>
                    <ol style={{
                        margin: 0, padding: '4px 0 0 18px',
                        display: 'flex', flexDirection: 'column', gap: 6,
                        color: 'var(--text-primary)', fontSize: 13, lineHeight: 1.55,
                    }}>
                        <li>Lock the matchup, hit SIMULATE MATCH. One shot per bracket slot — no mulligans.</li>
                        <li>Every goal, foul, and card streams live to every bettor. Let the drama cook.</li>
                        <li>When the whistle blows, winners see a CLAIM button. Losses auto-sweep into the history book.</li>
                        <li>Wait the 30-second buffer before the next kickoff so the action stays tight.</li>
                    </ol>
                </div>
                <MatchSimulationPanel
                    key={selectedMatch?.matchId || simulationState?.matchId || 'manual-sim'}
                    homeTeam={selectedMatch?.homeTeam || simulationState?.homeTeam || ''}
                    awayTeam={selectedMatch?.awayTeam || simulationState?.awayTeam || ''}
                    initialResult={selectedMatch ? null : simulationState?.result || null}
                    onSimulated={onSimulationComplete}
                />
            </div>
            <div style={{
                flex: '0 0 40%', minWidth: 400, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 14, overflow: 'hidden', height: 520,
            }}>
                <div style={{
                    padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                }}>
                    <div style={{
                        width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', animation: 'live-dot 1.2s ease-in-out infinite',
                    }}/>
                    <span style={{
                        fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '0.08em', color: 'var(--text-primary)',
                    }}>GLOBAL CHAT</span>
                    <span style={{
                        marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)', 
                        letterSpacing: '0.01em', background: 'rgba(198, 241, 53, 0.1)', border: '1px solid rgba(198, 241, 53, 0.25)',
                        padding: '3px 8px', borderRadius: 5,
                    }}>MODERATOR MODE</span>
                </div>
                <div style={{
                    padding: '8px 10px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)',
                    display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
                }}>
                    {/* allows moderator text input for global chat */}
                    <input
                        type="text"
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        placeholder="Search user..."
                        style={{
                            flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8,
                            padding: '7px 10px', fontSize: 12, color: 'var(--text-primary)', outline: 'none',
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                    {userSearch && (
                        <button
                            onClick={() => setUserSearch('')}
                            style={{
                                padding: '7px 9px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-card)',
                                color: 'var(--text-secondary)', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer',
                            }}
                        >
                            CLEAR
                        </button>
                    )}
                </div>
                {/* allows mods to delete messages msgDel implementation */}
                <div style={{
                    flex: 1, overflowY: 'auto', padding: '12px 12px 8px', display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                    {filteredMessages.map(msg => (
                        <div key={msg.id} style={{
                            display: 'grid', gridTemplateColumns: '28px minmax(0, 1fr) 92px', gap: 10, alignItems: 'flex-start',
                            padding: '4px 10px 4px 6px', borderRadius: 8, transition: 'background 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <div style={{
                                width: 28, height: 28, borderRadius: '50%', background: msg.color, display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#080A0F', flexShrink: 0, fontFamily: 'var(--font-display)', letterSpacing: '0.04em',
                            }}>{msg.initials}</div>
                            <div style={{
                                flex: 1, minWidth: 0,
                            }}>
                                <span style={{
                                    fontSize: 10, fontWeight: 700, color: msg.color, fontFamily: 'var(--font-mono)', display: 'block',
                                }}>{msg.user}{''}</span>
                                <span style={{
                                    fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, display: 'block',
                                }}>{msg.text}</span>
                            </div>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                alignItems: 'flex-end',
                                justifySelf: 'end',
                                paddingTop: 1,
                            }}>
                                <button onClick={() => onDeleteMessage(msg.id)} title="Delete message" style={{
                                    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: 0, borderRadius: 8,
                                    background: 'rgba(255, 71, 87, 0.08)', border: '1px solid rgba(255, 71, 87, 0.2)', color: 'var(--danger)',
                                    fontSize: 0, cursor: 'pointer', transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.2)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.08)'}>
                                    <Icon.Trash />
                                </button>
                                <button onClick={() => onBanUser(msg.user)} title="Ban user" style={{
                                    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: 0, borderRadius: 8,
                                    background: 'rgba(250, 204, 21, 0.08)', border: '1px solid rgba(250, 204, 21, 0.25)', color: '#FACC15',
                                    fontSize: 0, cursor: 'pointer', transition: 'all 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(250, 204, 21, 0.18)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(250, 204, 21, 0.08)'}>
                                    <Icon.Ban />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredMessages.length === 0 && (
                        <div style={{
                            padding: '18px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12,
                            fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
                        }}>
                            No users match "{userSearch}".
                        </div>
                    )}
                </div>
                {/* moderators can send messages / msgSend */}
                <div style={{
                    padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center',
                    flexShrink: 0, background: 'var(--bg-secondary)',
                }}>
                    <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Moderator message..." style={{
                        flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: 'var(--text-primary)', outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                    <button onClick={handleSend} style={{
                        background: 'var(--accent)', color: '#080A0F', fontWeight: 700, fontSize: 11, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', letterSpacing: '0.06em',
                    }}>SEND</button>
                </div>
            </div>
        </div>
    );
}

// main export / make the mod dashboard a thing
export default function ModDash({
    username, proposals, onApprove, onDecline, chatMessages, onNewMessage, onDeleteMessage, onBanUser, players, teams, games, onCancelStake, bannedUsernames = [], isLoadingProposals = false,
}) {
    // constants
    const [activeTab, setActiveTab] = useState(MOD_TABS.PROPOSALS);
    const [bracketState, setBracketState] = useState(() => createBracketState(BRACKET_TEAMS));
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [simulationState, setSimulationState] = useState(null);
    const [liveReplay, setLiveReplay] = useState(null);
    const [liveNowMs, setLiveNowMs] = useState(() => Date.now());
    const [hasLoadedBracketSession, setHasLoadedBracketSession] = useState(false);
    const {confirm, modal} = useConfirm();
    const nextPlayableMatch = getNextPlayableBracketMatch(bracketState);
    const nextMatchLabel = nextPlayableMatch?.homeTeam && nextPlayableMatch?.awayTeam
        ? `${nextPlayableMatch.homeTeam} vs ${nextPlayableMatch.awayTeam}`
        : 'TBD vs TBD';
    const liveTabCountdownSeconds = getReplayCountdownSeconds(liveReplay, liveNowMs);

    useEffect(() => {
        let isMounted = true;

        const initializeBracket = async () => {
            const session = loadBracketSession();
            const storedBracket = await loadStoredBracket();

            if (storedBracket?.bracketState) {
                if (!isMounted) {
                    return;
                }

                setBracketState(storedBracket.bracketState);
                setSelectedMatch(null);
                setSimulationState(storedBracket.liveReplay?.result ? {
                    matchId: storedBracket.liveReplay.matchId,
                    homeTeam: storedBracket.liveReplay.homeTeam,
                    awayTeam: storedBracket.liveReplay.awayTeam,
                    result: storedBracket.liveReplay.result,
                } : session?.simulationState || null);
                setLiveReplay(storedBracket.liveReplay || null);
                setHasLoadedBracketSession(true);
                return;
            }

            if (session?.bracketState) {
                if (!isMounted) {
                    return;
                }

                setBracketState(session.bracketState);
                setSelectedMatch(session.selectedMatch || null);
                setSimulationState(session.simulationState || null);
                setLiveReplay(session.liveReplay || null);
                setHasLoadedBracketSession(true);
                return;
            }

            const generatedBracket = createBracketState(BRACKET_TEAMS);
            if (!isMounted) {
                return;
            }

            setBracketState(generatedBracket);
            setLiveReplay(null);
            void replaceStoredBracket(generatedBracket, { bannedUsernames });

            setSelectedMatch(session?.selectedMatch || null);
            setSimulationState(session?.simulationState || null);
            setHasLoadedBracketSession(true);
        };

        void initializeBracket();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!hasLoadedBracketSession) {
            return;
        }

        saveBracketSession({
            bracketState,
            selectedMatch,
            simulationState,
            liveReplay,
        });
    }, [bracketState, hasLoadedBracketSession, liveReplay, selectedMatch, simulationState]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setLiveNowMs(Date.now());
        }, 250);

        return () => clearInterval(intervalId);
    }, []);

    const handleShuffleBracket = () => {
        const generatedBracket = createBracketState(BRACKET_TEAMS);
        setBracketState(generatedBracket);
        setSelectedMatch(null);
        setSimulationState(null);
        setLiveReplay(null);
        setActiveTab(MOD_TABS.BRACKET);
        void replaceStoredBracket(generatedBracket, {
            liveReplay: null,
            bannedUsernames,
        });
    };

    const handleSelectBracketMatch = ({roundIndex, matchIndex, match}) => {
        if (!match?.home || !match?.away || match.winner) {
            return;
        }

        if (!nextPlayableMatch
            || nextPlayableMatch.roundIndex !== roundIndex
            || nextPlayableMatch.matchIndex !== matchIndex) {
            return;
        }

        setSelectedMatch({
            matchId: match.id,
            roundIndex,
            matchIndex,
            homeTeam: match.home.name,
            awayTeam: match.away.name,
        });
        setSimulationState(null);
        setActiveTab(MOD_TABS.LIVE);
    };

    const handleBracketSimulationComplete = ({homeTeam, awayTeam, result}) => {
        if (!selectedMatch || !result) {
            return;
        }

        const nextLiveReplay = {
            matchId: selectedMatch.matchId,
            roundIndex: selectedMatch.roundIndex,
            matchIndex: selectedMatch.matchIndex,
            homeTeam,
            awayTeam,
            startedAt: new Date(Date.now() + 30000).toISOString(),
            durationMs: 60000,
            status: 'pending',
            result,
        };

        setBracketState(prev => {
            const nextBracketState = advanceBracketState(prev, selectedMatch, result);
            if (nextBracketState !== prev) {
                void replaceStoredBracket(nextBracketState, {
                    completedMatch: {
                        matchId: selectedMatch.matchId,
                        homeTeam,
                        awayTeam,
                        result,
                    },
                    liveReplay: nextLiveReplay,
                    bannedUsernames,
                });
            }
            return nextBracketState;
        });
        setLiveReplay(nextLiveReplay);
        setSimulationState({
            matchId: selectedMatch.matchId,
            homeTeam,
            awayTeam,
            result,
        });
        setSelectedMatch(null);
    };

    // handle stake approval
    const handleApprove = async (id) => {
        const proposal = proposals.find(p => p.id === id);
        const ok = await confirm({
            title: 'APPROVE PROPOSAL', message: `Approve this ${proposal?.category} bet and move it to the live pool?`, confirmLabel: 'APPROVE',
        });
        if (ok){
            onApprove(id);
        }
    };

    // handle stake decline
    const handleDecline = async (id) => {
        const ok = await confirm({
            title: 'DECLINE PROPOSAL', message: 'Decline and permanently delete this proposal? This cannot be undone.', confirmLabel: 'DECLINE', confirmDanger: true,
        });
        if (ok) {
            onDecline(id);
        }
    };

    // handle stake cancellation
    const handleCancelStake = async (type, id) => {
        const ok = await confirm({
            title: 'CANCEL STAKE', message: `Remove this ${type} stake from the active pool? All associated bets will be voided.`, confirmLabel: 'CANCEL STAKE', confirmDanger: true,
        });
        if (ok){
            onCancelStake(type, id);
        }
    };

    // handle message deletion
    const handleDeleteMessage = async (msgId) => {
        const ok = await confirm({
            title: 'DELETE MESSAGE', message: 'Permanently delete this chat message? This action cannot be undone.', confirmLabel: 'DELETE', confirmDanger: true,
        });
        if (ok) {
            onDeleteMessage(msgId); // THIS IS NOT MSG DELETE DEF - continute to onDeleteMessage (this could be optimized)
        }
    };

    const handleBanUser = async (bannedUsername) => {
        const normalizedUsername = String(bannedUsername || '').trim();
        if (!normalizedUsername) {
            return;
        }

        const ok = await confirm({
            title: 'BAN USER',
            message: `Delete ${normalizedUsername}'s account and remove them from chat immediately?`,
            confirmLabel: 'BAN',
            confirmDanger: true,
        });
        if (!ok) {
            return;
        }

        const nextBannedUsernames = normalizeUsernameList([...bannedUsernames, normalizedUsername]);
        await onBanUser(normalizedUsername);
        void replaceStoredBracket(bracketState, {
            liveReplay,
            bannedUsernames: nextBannedUsernames,
        });
    };

    // make things visible <3 / tabRender
    const renderContent = () => {
        switch(activeTab) {
            case MOD_TABS.PROPOSALS:
                return (
                    <ProposalsTab proposals={proposals} onApprove={handleApprove} onDecline={handleDecline} isLoading={isLoadingProposals}/>
                );
            case MOD_TABS.PLAYERS: 
                return(
                    <ModPlayersTab players={players} onCancelStake={handleCancelStake} />
                );
            case MOD_TABS.TEAMS:
                return(
                    <ModTeamsTab teams={teams} onCancelStake={handleCancelStake} />
                );
            case MOD_TABS.GAMES: 
                return(
                    <ModGamesTab games={games} onCancelStake={handleCancelStake} />
                );
            case MOD_TABS.BRACKET:
                return(
                    <ModBracketTab
                        bracket={bracketState}
                        selectedMatch={selectedMatch}
                        nextPlayableMatch={nextPlayableMatch}
                        onSelectMatch={handleSelectBracketMatch}
                    />
                );
            case MOD_TABS.LIVE: 
                return(
                    <ModLiveTab chatMessages={chatMessages} onDeleteMessage={handleDeleteMessage} onBanUser={handleBanUser} onNewMessage={onNewMessage} username={username} selectedMatch={selectedMatch} simulationState={simulationState} onSimulationComplete={handleBracketSimulationComplete} />
                );
            default: 
                return null;
            
        }
    };

    // highlights the current tab label with the tab's contents displayed
    const currentTabLabel = MOD_TAB_CONFIG.findLast(t => t.key === activeTab)?.label || '';
    return(
        <>
            {modal}
            <div style={{
                paddingTop: 'var(--header-height)',
            }}>
                <div style={{
                    position: 'sticky', top: 'var(--header-height)', background: 'rgba(8, 10, 15, 0.92)', backdropFilter: 'blur(20px)',
                    borderBottom: '1px solid var(--border)', zIndex: 90, overflowX: 'auto',
                }}>
                    <div style={{
                        background: 'rgba(198, 241, 53, 0.05)', borderBottom: '1px solid rgba(198, 241, 53, 0.12)', padding: '6px 20px',
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <Icon.Shield />
                        <span style={{
                            fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.12em', fontFamily: 'var(--font-mono)',
                        }}>MODERATOR MODE - ELEVATED PERMISSIONS ACTIVE</span>
                    </div>
                    <div style={{
                        display: 'flex', padding: '0 20px', minWidth: 'max-content',
                    }}>
                        {/* tabline */}
                        {MOD_TAB_CONFIG.map(tab => {
                            const isActive = activeTab === tab.key;
                            const pendingCount = tab.badge ? proposals.length : 0;
                            return (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                                    display: 'flex', alignItems: 'center', gap: 7, padding: '0 16px', height: 'var(--tab-height)', background: 'none', 
                                    color: isActive ? 'var(--accent)' : 'var(--text-muted)', letterSpacing: '0.04em', fontSize: 13,
                                    borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent', transition: 'all 0.2s', flexShrink: 0,
                                    cursor: 'pointer', border: 'none', borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                                }}
                                onMouseEnter={e => {if (!isActive){
                                    e.currentTarget.style.color = 'var(--text-secondary)';
                                }}}
                                onMouseLeave={e => {if (!isActive) {
                                    e.currentTarget.style.color = 'var(--text-muted)';
                                }}}>
                                    {tab.label}
                                    {tab.badge && pendingCount > 0 && (<span style={{
                                        background: 'var(--accent)', color: '#080A0F', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 20, lineHeight: 1,
                                    }}>{pendingCount}</span>
                                )}
                                {tab.live && ( <div style={{
                                    width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)', animation: 'live-dot 1.2s ease-in-out infinite',
                                }} />
                                )}
                                {tab.live && liveTabCountdownSeconds !== null && (
                                    <span style={{
                                        fontSize: 10,
                                        fontFamily: 'var(--font-mono)',
                                        color: 'var(--danger)',
                                        marginTop: 2,
                                    }}>
                                        {liveTabCountdownSeconds}s
                                    </span>
                                )}
                            </button>
                            );
                        })}
                        <div style={{
                            marginLeft: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            height: 'var(--tab-height)',
                            padding: '0 10px 0 16px',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 11,
                            letterSpacing: '0.06em',
                            color: 'var(--text-secondary)',
                            whiteSpace: 'nowrap',
                        }}>
                            <span style={{ color: 'var(--text-muted)' }}>NEXT MATCH</span>
                            <span style={{ color: 'var(--accent)' }}>{nextMatchLabel}</span>
                        </div>
                    </div>
                </div>
                <div style={{
                    maxWidth: 1100, margin: '0 auto', padding: '28px 20px 80px',
                }}>
                    <div style={{
                        marginBottom: 24,
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 16,
                            flexWrap: 'wrap',
                        }}>
                            <h2 style={{
                                fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: '0.06em', color: 'var(--text-primary)',
                            }}>
                                {currentTabLabel.toUpperCase()}
                            </h2>
                            {activeTab === MOD_TABS.BRACKET && (
                                <button onClick={handleShuffleBracket} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '11px 16px',
                                    borderRadius: 10,
                                    background: 'var(--accent)',
                                    color: '#080A0F',
                                    fontSize: 12,
                                    fontWeight: 800,
                                    letterSpacing: '0.08em',
                                    cursor: 'pointer',
                                    border: 'none',
                                }}>
                                    SHUFFLE BRACKET
                                </button>
                            )}
                        </div>
                        {/* instruction text for tabs + display */}
                        {activeTab === MOD_TABS.PROPOSALS && ( <p style={{
                            fontSize: 13, color: 'var(--text-secondary)', marginTop: 4,
                        }}>Review and activate bet proposals submitted by users.</p>
                        )}
                        {[MOD_TABS.PLAYERS, MOD_TABS.TEAMS, MOD_TABS.GAMES].includes(activeTab) &&(
                            <p style={{
                            fontSize: 13, color: 'var(--text-secondary)', marginTop: 4,
                        }}>Cancel active stakes to remove them from the board.</p>
                        )}
                        {activeTab === MOD_TABS.BRACKET && (
                            <p style={{
                                fontSize: 13, color: 'var(--text-secondary)', marginTop: 4,
                            }}>Moderator view of brackets - shuffle beginning placements and simulate matches.</p>
                        )}
                    </div>
                    {renderContent()}
                </div>
            </div>
        </>
    );
}
