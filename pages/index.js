import { useState, useCallback, useEffect, useRef } from 'react';
import Head from 'next/head';
import { LoginScreen, SignUpScreen } from './auth';
import {
    LogOut, Settings, User, Mail, 
    CreditCard, Lock, ChevronRight, 
    TrendingUp, Users, Shield, Zap, 
    Star, Radio, Trophy, BarChart2, 
    Activity} from 'lucide-react';

// constants here
import ProposalForm from '../components/proposalForm';
import ModDash from '../components/modDash';
import worldcupData from '../worldcup.json';

const SCREENS = {
    LANDING: 'landing',
    LOGIN: 'login',
    SIGNUP: 'signup',
    DASHBOARD: 'dashboard',
    PROFILE: 'profile',
};

const TABS = {
    PICKS: 'picks',
    PLAYERS: 'players',
    TEAMS: 'teams',
    GAMES: 'games',
    BRACKET: 'bracket',
    LIVE: 'live',
};

const BETTING_PHASES = {
    PROPOSALS_OPEN: 'PROPOSALS_OPEN',
    SIMULATION_RUNNING: 'SIMULATION_RUNNING',
    MODERATOR_LOCKED: 'MODERATOR_LOCKED',
};

const MODERATOR_CREDENTIALS = [
    {
        username: 'moderator01',
        password: 'moderator01Auth',
    },
    {
        username: 'moderator02',
        password: 'moderator02Auth',
    },
];

// seed messages so App can own chatMessages state and pass it down for mod deletion
// static messages for global chat
const SEED_MESSAGES = [
    { id: 1, user: 'GamabaGuoba01', initials: 'GG', color: '#C6F135', text: 'Have they tried scoring?'},
    { id: 2, user: 'SwedishGuy', initials: 'SG', color: '#38BDF8', text: 'dw we got this trust'},
    { id: 3, user: 'GambaGuoba01', initials: 'GG', color: '#C6F135', text: 'Mexico sweep :muscle:'},
    { id: 4, user: 'ImJustKen', initials: 'IJ', color: '#FB923C', text: 'Amerika ya :3'},
];

const CHAT_COLORS = ['#C6F135', '#38BDF8', '#FB923C', '#F43F5E', '#A78BFA', '#10B981'];
const DEFAULT_CHAT_TEXT = 'Waiting for latest message...';
const CHAT_USER_ROSTER = Array.from(new Set([...(worldcupData?.usernames || []), ...SEED_MESSAGES.map(msg => msg.user)]));
const CHAT_USER_SET = new Set(CHAT_USER_ROSTER);
const SEED_BY_USER = SEED_MESSAGES.reduce((acc, msg) => {
    acc[msg.user] = msg;
    return acc;
}, {});
const CHAT_COLOR_BY_USER = CHAT_USER_ROSTER.reduce((acc, user, index) => {
    acc[user] = CHAT_COLORS[index % CHAT_COLORS.length];
    return acc;
}, {});
const INITIAL_CHAT_MESSAGES = CHAT_USER_ROSTER.map(user => {
    const seed = SEED_BY_USER[user];
    return {
        id: user,
        user,
        initials: seed?.initials || user.slice(0, 2).toUpperCase(),
        color: seed?.color || CHAT_COLOR_BY_USER[user],
        text: seed?.text || DEFAULT_CHAT_TEXT,
    };
});

const LANDING_STATS = [
    { label: '37% Win Rate', value: '94%', icon: <TrendingUp size={18} /> },
    { label: '5K+ Players', value: 'OVER 3 MILLION\nPLAYERS!', icon: <Users size={18} /> },
    { label: 'Live Betting', value: 'WORLD CUP\nODDS HOT!', icon: <Radio size={18} /> },
];

const LANDING_PROMOS = [
    {
        title: '1000% MATCH BONUS INSIDE!',
        copy: 'Create an account and jump into the board.',
        accent: 'var(--accent)',
    },
    {
        title: 'LIVE USER COUNTER',
        copy: '104,231 bettors online right now.',
        accent: '#86efac',
    },
    {
        title: 'BET BRA (+1.5) @ +250',
        copy: 'BET GER (+1.5) @ -300',
        accent: '#fbbf24',
    },
];

const LANDING_TICKER = [
    'USER99 won $50,000 on a 12-fold World Cup parlay!',
    'USERP1 won $50,000 on a 12-fold World Cup parlay!',
    'JONES hit a 19-leg accumulator for $14,240!',
    'HUGE LIVE CASHOUT CONFIRMED ON BRAZIL VS SPAIN!',
];

const FIFA_TOP_25 = [
    { rank: 1, team: 'France', record: '1877.32 pts' },
    { rank: 2, team: 'Spain', record: '1876.40 pts' },
    { rank: 3, team: 'Argentina', record: '1874.81 pts' },
    { rank: 4, team: 'England', record: '1825.97 pts' },
    { rank: 5, team: 'Portugal', record: '1763.83 pts' },
    { rank: 6, team: 'Brazil', record: '1761.16 pts' },
    { rank: 7, team: 'Netherlands', record: '1757.87 pts' },
    { rank: 8, team: 'Morocco', record: '1755.87 pts' },
    { rank: 9, team: 'Belgium', record: '1734.71 pts' },
    { rank: 10, team: 'Germany', record: '1730.37 pts' },
    { rank: 11, team: 'Croatia', record: '1717.07 pts' },
    { rank: 12, team: 'Italy', record: '1700.37 pts' },
    { rank: 13, team: 'Colombia', record: '1693.09 pts' },
    { rank: 14, team: 'Senegal', record: '1688.99 pts' },
    { rank: 15, team: 'Mexico', record: '1681.03 pts' },
    { rank: 16, team: 'United States', record: '1673.13 pts' },
    { rank: 17, team: 'Uruguay', record: '1673.07 pts' },
    { rank: 18, team: 'Japan', record: '1660.43 pts' },
    { rank: 19, team: 'Switzerland', record: '1649.40 pts' },
    { rank: 20, team: 'Denmark', record: '1620.81 pts' },
    { rank: 21, team: 'Iran', record: 'Top 25' },
    { rank: 22, team: 'Türkiye', record: 'Top 25' },
    { rank: 23, team: 'Ecuador', record: 'Top 25' },
    { rank: 24, team: 'Austria', record: 'Top 25' },
    { rank: 25, team: 'South Korea', record: 'Top 25' },
];

// Betting feature: normalize Player bet documents into card-ready UI data.
function mapPlayerBetToPlayerCard(playerBet, index) {
    const name = String(playerBet?.name || '').trim() || 'Unknown Player';
    const number = String(playerBet?.number || '').trim() || '--';
    const team = String(playerBet?.team || playerBet?.pos || '').trim() || 'N/A';
    const payoutMultRaw = playerBet?.payout_mult;
    const payoutMultNum = Number(payoutMultRaw);
    const stake = Number.isFinite(payoutMultNum)
        ? `x${payoutMultNum}`
        : String(payoutMultRaw || '--');

    return {
        id: playerBet?.id || playerBet?.playerId || playerBet?._id || `${name}-${number}-${index}`,
        name,
        number,
        pos: team,
        stake,
        stat: playerBet?.stat,
        range: playerBet?.range,
        stat_num: playerBet?.stat_num ?? playerBet?.stat_num,
        payout_mult: playerBet?.payout_mult,
    };
}

// Betting feature: normalize Team bet documents into card-ready UI data.
function mapTeamBetToTeamCard(teamBet, index) {
    const country = String(teamBet?.country || teamBet?.name || '').trim() || 'Unknown Team';
    const record = String(teamBet?.record || '').trim() || '--';
    const payoutMultRaw = teamBet?.payout_mult;
    const payoutMultNum = Number(payoutMultRaw);
    const stake = Number.isFinite(payoutMultNum)
        ? `x${payoutMultNum}`
        : String(payoutMultRaw || '--');

    return {
        id: teamBet?.id || teamBet?.teamId || teamBet?._id || `${country}-${record}-${index}`,
        name: country,
        record,
        stake,
        outcome: teamBet?.outcome,
        range: teamBet?.range,
        points: teamBet?.points,
        payout_mult: teamBet?.payout_mult,
    };
}

// Betting feature: normalize Game bet documents into row-ready UI data.
function mapGameBetToGameRow(gameBet, index) {
    const awayTeam = String(gameBet?.away_team || gameBet?.away || '').trim() || 'Away Team';
    const homeTeam = String(gameBet?.home_team || gameBet?.home || '').trim() || 'Home Team';
    const time = String(gameBet?.time || '').trim() || '--:--';
    const winner = String(gameBet?.winner || '').trim() || '--';
    const selectedTeam = String(gameBet?.selected_team || gameBet?.selectedTeam || '').trim() || '';
    const odds = String(gameBet?.odds || gameBet?.spread || '').trim() || '--';
    const payoutMultRaw = gameBet?.payout_mult;
    const payoutMultNum = Number(payoutMultRaw);
    const stake = Number.isFinite(payoutMultNum)
        ? `x${payoutMultNum}`
        : String(payoutMultRaw || '--');

    return {
        id: gameBet?.id || gameBet?.gameId || gameBet?._id || `${awayTeam}-${homeTeam}-${time}-${index}`,
        away: awayTeam,
        home: homeTeam,
        time,
        winner,
        selected_team: selectedTeam,
        odds,
        spread: odds,
        payout_mult: gameBet?.payout_mult,
        stake,
    };
}

// Betting feature: stable key for matching available Player bets against confirmed picks.
function getPlayerBetMatchKey(playerBetLike) {
    if (!playerBetLike || typeof playerBetLike !== 'object') {
        return '';
    }

    const id = String(playerBetLike.id || playerBetLike.playerId || '').trim();
    if (id) {
        return `id:${id}`;
    }

    const name = String(playerBetLike.name || '').trim().toLowerCase();
    const number = String(playerBetLike.number || '').trim();
    const team = String(playerBetLike.pos || playerBetLike.team || '').trim().toLowerCase();
    const stat = String(playerBetLike.stat || '').trim().toLowerCase();
    const range = String(playerBetLike.range || '').trim().toLowerCase();
    const statNum = String(playerBetLike.stat_num ?? playerBetLike.state_num ?? '').trim();

    return `meta:${name}|${number}|${team}|${stat}|${range}|${statNum}`;
}

// Betting feature: stable key for matching available Team bets against confirmed picks.
function getTeamBetMatchKey(teamBetLike) {
    if (!teamBetLike || typeof teamBetLike !== 'object') {
        return '';
    }

    const id = String(teamBetLike.id || teamBetLike.teamId || '').trim();
    if (id) {
        return `id:${id}`;
    }

    const country = String(teamBetLike.name || teamBetLike.country || '').trim().toLowerCase();
    const record = String(teamBetLike.record || '').trim().toLowerCase();
    const outcome = String(teamBetLike.outcome || '').trim().toLowerCase();
    const range = String(teamBetLike.range || '').trim().toLowerCase();
    const points = String(teamBetLike.points ?? '').trim();

    return `meta:${country}|${record}|${outcome}|${range}|${points}`;
}

// Betting feature: stable key for matching available Game bets against confirmed picks.
function getGameBetMatchKey(gameBetLike) {
    if (!gameBetLike || typeof gameBetLike !== 'object') {
        return '';
    }

    const id = String(gameBetLike.id || gameBetLike.gameId || '').trim();
    if (id) {
        return `id:${id}`;
    }

    const away = String(gameBetLike.away || gameBetLike.away_team || '').trim().toLowerCase();
    const home = String(gameBetLike.home || gameBetLike.home_team || '').trim().toLowerCase();
    const time = String(gameBetLike.time || '').trim().toLowerCase();
    const winner = String(gameBetLike.winner || '').trim().toLowerCase();
    const odds = String(gameBetLike.odds || gameBetLike.spread || '').trim().toLowerCase();

    return `meta:${away}|${home}|${time}|${winner}|${odds}`;
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

function normalizeBettingPhase(rawPhase) {
    const phase = String(rawPhase || '').trim().toUpperCase();
    if (Object.values(BETTING_PHASES).includes(phase)) {
        return phase;
    }

    return BETTING_PHASES.PROPOSALS_OPEN;
}

function parseReplayMinuteValue(minuteValue) {
    const raw = String(minuteValue ?? '').trim().replace(/'/g, '');
    const plusMatch = raw.match(/^(\d{1,3})\+(\d{1,2})$/);
    if (plusMatch) {
        return Number(plusMatch[1]) + Number(plusMatch[2]);
    }

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
}

function parseReplayRevealMinute(minuteValue) {
    const raw = String(minuteValue ?? '').trim().replace(/'/g, '');
    const plusMatch = raw.match(/^(\d{1,3})\+(\d{1,2})$/);
    if (plusMatch) {
        const base = Number(plusMatch[1]);
        const extra = Number(plusMatch[2]);

        if (base === 45) {
            return 45;
        }

        return base + extra;
    }

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
}

function formatMatchEventMinute(minuteValue) {
    const raw = String(minuteValue ?? '').trim();
    const base = raw.endsWith("'") ? raw.slice(0, -1).trim() : raw;
    return `${base}'`;
}

function formatReplayClock(minuteValue) {
    const safeMinute = Math.max(0, minuteValue);
    const wholeMinute = Math.floor(safeMinute);
    if (wholeMinute > 90) {
        return `90+${wholeMinute - 90}'`;
    }
    return `${wholeMinute}'`;
}

function buildReplaySnapshot(liveReplay, nowMs = Date.now()) {
    if (!liveReplay?.result) {
        return null;
    }

    const startedAtMs = new Date(liveReplay.startedAt).getTime();
    if (!Number.isFinite(startedAtMs)) {
        return null;
    }

    const durationMs = Number.isFinite(Number(liveReplay.durationMs))
        ? Number(liveReplay.durationMs)
        : 60000;
    const rawEvents = Array.isArray(liveReplay.result.match_events) ? liveReplay.result.match_events : [];
    const maxEventMinute = rawEvents.reduce((maxMinute, event) => (
        Math.max(maxMinute, parseReplayMinuteValue(event?.minute))
    ), 90);
    const totalReplayMinutes = Math.max(90, maxEventMinute);
    const elapsedMs = Math.max(0, nowMs - startedAtMs);
    const clampedElapsedMs = Math.min(durationMs, elapsedMs);
    const progress = durationMs > 0 ? (clampedElapsedMs / durationMs) : 1;
    const currentMinute = totalReplayMinutes * progress;
    const visibleEvents = rawEvents.filter(event => parseReplayRevealMinute(event?.minute) <= currentMinute + 0.0001);
    const homeScore = visibleEvents.filter(event => (
        (event?.event === 'goal' || event?.event === 'penalty_scored') && event?.team === 'home'
    )).length;
    const awayScore = visibleEvents.filter(event => (
        (event?.event === 'goal' || event?.event === 'penalty_scored') && event?.team === 'away'
    )).length;

    return {
        isActive: elapsedMs < durationMs,
        clockLabel: formatReplayClock(currentMinute),
        visibleEvents,
        homeScore,
        awayScore,
    };
}

function upsertLatestChatByUser(prevMessages, incomingMessage) {
    if (!incomingMessage || typeof incomingMessage !== 'object') {
        return prevMessages;
    }

    const user = String(incomingMessage.user || '').trim();
    if (!user || !CHAT_USER_SET.has(user)) {
        return prevMessages;
    }

    const text = String(incomingMessage.text || '').trim();
    const nextText = text || DEFAULT_CHAT_TEXT;
    const nextInitials = String(incomingMessage.initials || user.slice(0, 2)).slice(0, 2).toUpperCase();
    const nextColor = incomingMessage.color || CHAT_COLOR_BY_USER[user] || CHAT_COLORS[0];

    const index = prevMessages.findIndex(msg => msg.user === user);
    if (index === -1) {
        return [
            ...prevMessages,
            {
                id: user,
                user,
                initials: nextInitials,
                color: nextColor,
                text: nextText,
            },
        ];
    }

    const current = prevMessages[index];
    if (current.text === nextText && current.initials === nextInitials && current.color === nextColor) {
        return prevMessages;
    }

    const next = [...prevMessages];
    next[index] = {
        ...current,
        initials: nextInitials,
        color: nextColor,
        text: nextText,
    };
    return next;
}

// avatar placeholder
function Avatar({ size = 36, initials = 'U', style = {} } ) {
    return (
        <div style ={{
            width: size, height: size, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: size * 0.38, color: '#080A0F', letterSpacing: '0.02em',
            flexShrink: 0, userSelect: 'none', ...style,
        }}>
            {initials}

        </div>
    );
}

// app logo!
function Logo({ onClick, style = {} }) {
    return(
        <button onClick={onClick} style={{
            background: 'none', border: 'none', cursor: 'pointer', display: 'flex', 
            alignItems: 'center', gap: 10, padding: '4px 0', ...style,
        }}>
            <div style={{
                width: 36, height: 36, borderRadius: 10, background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 16px var(--accent-glow)',
            }}>

                <img 
                    src="/gator_gambling_logo.png" 
                    alt="Logo" 
                    style={{ width: '100%', height: '100%', borderRadius: 10, objectFit: 'contain' }} 
                />
            </div>
            <span style={{
                fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--text-primary)', letterSpacing: '0.06em',
            }}>GATORGAMBLING</span>
        </button>
    );
}

// header

function Header({ screen, onLogoClick, onAvatarClick, username, isModerator = false}) {
    if (screen === SCREENS.LANDING || screen === SCREENS.LOGIN || screen === SCREENS.SIGNUP) {
        return null;
    }
    return (
        <header style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 'var(--header-height)',
            background: 'rgba(8, 10, 15, 0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
        }}>
            <Logo onClick={onLogoClick} />
            <div style={{ 
                display: 'flex', alignItems: 'center', gap: 12,
            }}>
                {isModerator && ( <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(198, 241, 53, 0.08)',
                    border: '1px solid rgba(198, 241, 53, 0.25)', borderRadius: 8, padding: '4px 10px', fontSize: 10, 
                    fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.1em', fontFamily: 'var(--font-mono)',
                }}>
                    <Shield size={11} />
                    MODERATOR
                    </div>
                )}
            <button onClick={onAvatarClick} style={{
                background: 'none', border: `2px solid ${isModerator ? 'rgba(198,241,53,0.4)' : 'var(--border-bright)'}`,
                borderRadius: '50%', cursor: 'pointer', padding: 2, transition: 'border-color 0.2s',
            }}

            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = isModerator ? 'rgba(198, 241, 53, 0.4)' : 'var(--border-bright)'}
            >
                <Avatar size={34} initials={username ? username[0].toUpperCase() : 'U'}/>
            </button>
            </div>
        </header>
    );
}


// authorization screens

function InputField({ label, type = 'text', value, onChange, placeholder}){
    return (
        <div style={{ marginBottom: 18}}>
            <label style={{
                display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8,
                letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>{label}</label>
            <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{
                width: '100%', background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '13px 16px', fontSize: 14, color: 'var(--text-primary)',
                transition: 'border-color 0.2s, box-shadow 0.2s', boxSizing: 'border-box', outline: 'none',
            }}
            onFocus={e => {
                e.target.style.borderColor = 'var(--accent)';
                e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
            }}
            onBlur={e => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
            }}
            />
        </div>
    );
}

function AuthButton({ label, primary = false, onClick, disabled = false}){
    const [hover, setHover] = useState(false);
    return (
        <button onClick={onClick} disabled={disabled} onMouseEnter={() => !disabled && setHover(true)} onMouseLeave={() => setHover(false)} style={{
            width: '100%', padding: '14px',
            borderRadius: 10, fontWeight: 600, fontSize: 15,
            letterSpacing: '0.04em', 
            background: primary
                ? hover ? 'var(--accent-dim)' : 'var(--accent)'
                : hover ? 'var(--bg-card-hover)' : 'var(--bg-card)',
            color: primary? '#080A0F' : 'var(--text-primary)',
            border: primary? 'none' : '1px solid var(--border-bright)',
            transform: hover ? 'translateY(-1px)' : 'none',
            boxShadow: primary && hover ? '0 8px 24px var(--accent-glow-strong)' : 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.7 : 1,
            transition: 'all 0.2s', 
        }}
        >{label}</button>
    );
}

function LandingScreen({ onSignUp, onLogin }) {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            backgroundImage: "linear-gradient(135deg, rgba(8, 10, 15, 0.84), rgba(8, 10, 15, 0.62)), url('/images.jpeg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            padding: 24,
        }}>
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at top, rgba(198, 241, 53, 0.15), transparent 42%), linear-gradient(180deg, rgba(8, 10, 15, 0.2), rgba(8, 10, 15, 0.72))',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'relative',
                zIndex: 1,
                width: 'min(980px, 100%)',
                animation: 'slideUp 0.6s ease both',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14,
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 22,
                    width: '100%',
                    flexWrap: 'wrap',
                }}>
                    {['left', 'right'].map(side => (
                        <div key={side} style={{
                            width: 82,
                            height: 120,
                            borderRadius: 22,
                            background: 'linear-gradient(180deg, rgba(255, 196, 77, 0.18), rgba(255, 196, 77, 0.06))',
                            border: '1px solid rgba(255, 196, 77, 0.32)',
                            boxShadow: '0 18px 35px rgba(0, 0, 0, 0.28)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transform: side === 'left' ? 'rotate(-8deg)' : 'rotate(8deg)',
                            position: 'relative',
                            overflow: 'hidden',
                            padding: 8,
                        }}>
                            <img
                                src="/world-cup-trophy-hd-png-704081694879209fseti7gv8k.png"
                                alt="World Cup trophy"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 0 12px rgba(244, 194, 93, 0.45))',
                                }}
                            />
                        </div>
                    ))}
                    <div style={{
                        position: 'relative',
                        width: 'min(560px, 100%)',
                        minHeight: 248,
                        borderRadius: 24,
                        padding: 24,
                        background: 'rgba(8, 10, 15, 0.78)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 30px 90px rgba(0, 0, 0, 0.52)',
                        backdropFilter: 'blur(14px)',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: 14,
                            right: 14,
                            background: '#ef4444',
                            color: '#fff',
                            fontFamily: 'var(--font-mono)',
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '4px 8px',
                            borderRadius: 8,
                            letterSpacing: '0.12em',
                            boxShadow: '0 0 0 1px rgba(255,255,255,0.15) inset',
                        }}>● LIVE</div>
                        <div style={{
                            width: 54,
                            height: 54,
                            borderRadius: 18,
                            margin: '0 auto 10px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 0 1px rgba(0,0,0,0.15) inset',
                        }}>
                            <img
                                src="/gator_gambling_logo.png"
                                alt="Logo"
                                style={{ width: '100%', height: '100%', borderRadius: 18, objectFit: 'contain' }}
                            />
                        </div>
                        <h1 style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 66,
                            lineHeight: 0.95,
                            letterSpacing: '0.09em',
                            color: '#ff4b3f',
                            textAlign: 'center',
                            marginBottom: 10,
                            textShadow: '0 0 8px rgba(255, 59, 48, 0.75), 0 0 22px rgba(255, 59, 48, 0.3), 0 0 34px rgba(255, 255, 255, 0.12)',
                        }}>GATORGAMBLING</h1>
                        <p style={{
                            fontSize: 16,
                            color: 'rgba(255, 255, 255, 0.94)',
                            textAlign: 'center',
                            marginBottom: 18,
                        }}>Chomp at the Bet!</p>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: 10,
                            flexWrap: 'wrap',
                        }}>
                            {['37% Win Rate', '5K+ Players', 'Live Betting'].map((text, index) => (
                                <div key={text} style={{
                                    background: 'rgba(255,255,255,0.12)',
                                    border: '1px solid rgba(255,255,255,0.12)',
                                    borderRadius: 10,
                                    padding: '5px 10px',
                                    fontSize: 12,
                                    fontWeight: 800,
                                    color: '#f7f7f7',
                                    boxShadow: '0 6px 14px rgba(0,0,0,0.18)',
                                }}>{text}</div>
                            ))}
                        </div>
                    </div>
                    {['left', 'right'].map(side => (
                        <div key={`${side}-small`} style={{
                            width: 82,
                            height: 120,
                            borderRadius: 22,
                            background: 'linear-gradient(180deg, rgba(255, 196, 77, 0.18), rgba(255, 196, 77, 0.06))',
                            border: '1px solid rgba(255, 196, 77, 0.32)',
                            boxShadow: '0 18px 35px rgba(0, 0, 0, 0.28)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transform: side === 'left' ? 'rotate(8deg)' : 'rotate(-8deg)',
                            position: 'relative',
                            overflow: 'hidden',
                            padding: 8,
                        }}>
                            <img
                                src="/world-cup-trophy-hd-png-704081694879209fseti7gv8k.png"
                                alt="World Cup trophy"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 0 12px rgba(244, 194, 93, 0.45))',
                                }}
                            />
                        </div>
                    ))}
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: 10,
                    width: 'min(760px, 100%)',
                }}>
                    {LANDING_STATS.map((item, index) => (
                        <div key={item.label} style={{
                            background: 'rgba(15, 18, 25, 0.85)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 14,
                            padding: '10px 12px',
                            boxShadow: '0 16px 40px rgba(0,0,0,0.32)',
                            minHeight: 104,
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.05), transparent 40%)',
                                pointerEvents: 'none',
                            }} />
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 8,
                                marginBottom: 8,
                            }}>
                                <div style={{
                                    fontSize: 11,
                                    color: 'rgba(255,255,255,0.72)',
                                    fontWeight: 800,
                                    letterSpacing: '0.05em',
                                }}>{item.label}</div>
                                <div style={{ color: '#86efac' }}>{item.icon}</div>
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: item.value.includes('\n') ? 26 : 28,
                                lineHeight: 0.9,
                                color: index === 0 ? '#f5f5f5' : '#f7f7f7',
                                textAlign: 'center',
                                textShadow: '0 0 10px rgba(255,255,255,0.08)',
                                whiteSpace: 'pre-line',
                            }}>{item.value}</div>
                            {index === 0 && (
                                <div style={{
                                    fontSize: 10,
                                    color: '#d1d5db',
                                    marginTop: 6,
                                    textAlign: 'center',
                                    fontWeight: 600,
                                }}>(*Results Not Guaranteed)</div>
                            )}
                        </div>
                    ))}
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.4fr 1fr 1fr',
                    gap: 10,
                    width: 'min(820px, 100%)',
                }}>
                    <div style={{
                        background: 'rgba(14, 18, 24, 0.88)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 14,
                        padding: 12,
                        boxShadow: '0 16px 40px rgba(0,0,0,0.32)',
                    }}>
                        <div style={{
                            background: '#ef4444',
                            color: '#fff',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 9px',
                            borderRadius: 8,
                            fontSize: 10,
                            fontWeight: 800,
                            letterSpacing: '0.08em',
                            marginBottom: 8,
                        }}>1000% MATCH BONUS INSIDE!</div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 10,
                        }}>
                            <div>
                                <div style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: 28,
                                    color: '#f7f7f7',
                                    letterSpacing: '0.08em',
                                }}>CREATE ACCOUNT</div>
                                <div style={{
                                    fontSize: 11,
                                    color: 'rgba(255,255,255,0.72)',
                                    marginTop: 2,
                                }}>Unlock live boards, bets, and promos.</div>
                            </div>
                            <div style={{
                                width: 120,
                                height: 72,
                                borderRadius: 12,
                                overflow: 'hidden',
                                background: 'linear-gradient(135deg, rgba(134, 239, 172, 0.24), rgba(255,255,255,0.04))',
                                border: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                            }}>
                                <img
                                    src="/bspin-bspin-casino.gif"
                                    alt="Casino promo gif"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block',
                                    }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    left: 6,
                                    bottom: 6,
                                    background: 'rgba(0,0,0,0.72)',
                                    color: '#fff',
                                    fontSize: 9,
                                    fontWeight: 800,
                                    letterSpacing: '0.08em',
                                    padding: '2px 6px',
                                    borderRadius: 999,
                                }}>PROMO</div>
                            </div>
                        </div>
                    </div>
                    {LANDING_PROMOS.slice(1).map((promo) => (
                        <div key={promo.title} style={{
                            background: 'rgba(14, 18, 24, 0.88)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 14,
                            padding: 12,
                            boxShadow: '0 16px 40px rgba(0,0,0,0.32)',
                        }}>
                            <div style={{
                                fontSize: 10,
                                fontWeight: 800,
                                color: promo.accent,
                                letterSpacing: '0.12em',
                                marginBottom: 6,
                                textTransform: 'uppercase',
                            }}>{promo.title}</div>
                            <div style={{
                                fontSize: 12,
                                color: 'rgba(255,255,255,0.84)',
                                lineHeight: 1.4,
                            }}>{promo.copy}</div>
                        </div>
                    ))}
                </div>

                <div style={{
                    width: 'min(420px, 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    marginTop: 4,
                }}>
                    <button onClick={onSignUp} style={{
                        width: '100%',
                        padding: '16px 20px',
                        borderRadius: 18,
                        border: '1px solid rgba(107, 255, 91, 0.35)',
                        background: 'linear-gradient(180deg, #9bff2a 0%, #6dff16 100%)',
                        color: '#07110a',
                        fontFamily: 'var(--font-display)',
                        fontSize: 22,
                        letterSpacing: '0.1em',
                        boxShadow: '0 18px 40px rgba(109, 255, 22, 0.32)',
                    }}>CREATE ACCOUNT</button>
                    <button onClick={onLogin} style={{
                        width: '100%',
                        padding: '14px 20px',
                        borderRadius: 18,
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(22, 26, 33, 0.96)',
                        color: '#f7f7f7',
                        fontFamily: 'var(--font-display)',
                        fontSize: 22,
                        letterSpacing: '0.08em',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.28)',
                    }}>SIGN IN</button>
                </div>

                <p style={{ 
                    textAlign: 'center',
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.78)',
                    marginTop: 8,
                }}>By continuing, you agree and consent to our Terms and Conditions & Privacy Policy</p>
                </div>
            <div style={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 2,
                background: 'rgba(7, 10, 16, 0.88)',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 -12px 30px rgba(0,0,0,0.32)',
                overflow: 'hidden',
                backdropFilter: 'blur(10px)',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '8px 14px',
                    minWidth: 'max-content',
                    animation: 'ticker-scroll 18s linear infinite',
                    whiteSpace: 'nowrap',
                }}>
                    <span style={{
                        fontFamily: 'var(--font-display)',
                        color: '#bbf7d0',
                        fontSize: 18,
                        letterSpacing: '0.08em',
                    }}>RECENT BIG WINS:</span>
                    {LANDING_TICKER.map((item, index) => (
                        <span key={`${item}-${index}`} style={{
                            color: '#ffffff',
                            fontSize: 14,
                            fontWeight: 600,
                        }}>{item}</span>
                    ))}
                    {LANDING_TICKER.map((item, index) => (
                        <span key={`dup-${item}-${index}`} style={{
                            color: '#ffffff',
                            fontSize: 14,
                            fontWeight: 600,
                        }}>{item}</span>
                    ))}
                </div>
            </div>
        </div>
    );
}

function ConditionSelect({value, onChange, options, minWidth = 100}) {
    return ( 
        <div style={{
            position: 'relative', display: 'inline-flex', alignItems: 'center',
        }}>
            <select value={value} onChange={onChange} style={{
                appearance: 'none', WebkitAppearance: 'none', background: 'var(--bg-primary)', 
                border: '1px solid var(--border)', borderRadius: 7, padding: '6px 26px 6px 10px', 
                fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)',
                cursor: 'pointer', outline: 'none', minWidth, transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
            >
                {options.map(o => (
                    <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
                ))}

            </select>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" style={{
                position: 'absolute', right: 8, pointerEvents: 'none',
            }}>
                <polyline points="6 9 12 15 18 9"/>
            </svg>
        </div>
    );
}

function ConditionNumber({value, onChange, disabled = false, min = 0, max = 999, placeholder = '0'}) {
    return (
        <input type="number" value={value} onChange={onChange} disabled={disabled} min={min} max={max} placeholder={placeholder} style={{
            width: 58, background: disabled ? 'var(--bg-secondary)' : 'var(--bg-primary)', border: '1px solid var(--border)',
            borderRadius: 7, padding: '6px 8px', fontSize: 12, fontWeight: 700, color: disabled? 'var(--text-muted)' : 'var(--text-primary)',
            fontFamily: 'var(--font-mono)', textAlign: 'center', outline: 'none', transition: 'border-color 0.2s',
            opacity: disabled ? 0.45 : 1,
        }}
        onFocus={e => { if (!disabled) {
            e.target.style.borderColor = 'var(--accent)';
        }}}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
    );
}

function ConditionLabel({children}) {
    return (
        <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase',
        }}>{children}</span>
    )
}

function ConditionZone({children}) {
    return (
        <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px',
            marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8,
        }}>
            <ConditionLabel>BetCondition</ConditionLabel>
            {children}
        </div>
    );
}

// Betting feature: shared credit formatting for bet modals.
function formatCreditsDisplay(value) {
    return Number.isFinite(Number(value)) ? Number(value).toFixed(2) : '0.00';
}

// Betting feature: reusable success/error banner shown on bet cards.
function BetStatusBanner({ banner }) {
    if (!banner) {
        return null;
    }

    const isSuccess = banner.type === 'success';

    return (
        <div style={{
            marginBottom: 12,
            background: isSuccess ? 'rgba(16, 185, 129, 0.14)' : 'rgba(255, 71, 87, 0.12)',
            border: isSuccess ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 71, 87, 0.4)',
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 11,
            color: isSuccess ? 'var(--success)' : 'var(--danger)',
            fontWeight: 700,
            letterSpacing: '0.03em',
        }}>
            {banner.message}
        </div>
    );
}

// Betting feature: reusable modal for entering and confirming bet amount.
function BetAmountModal({
    isOpen,
    title,
    availableCredits,
    amountInput,
    amountError,
    isSubmitting,
    onClose,
    onAmountChange,
    onConfirm,
}) {
    if (!isOpen) {
        return null;
    }

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                width: '100%', maxWidth: 420, background: 'var(--bg-card)', border: '1px solid var(--border-bright)',
                borderRadius: 16, boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)', padding: '24px 20px',
            }}>
                <h3 style={{
                    margin: 0, marginBottom: 6, fontFamily: 'var(--font-display)', letterSpacing: '0.06em', fontSize: 20,
                }}>{title}</h3>
                <p style={{
                    margin: 0, marginBottom: 18, fontSize: 12, color: 'var(--text-secondary)',
                }}>Enter how many credits you want to bet.</p>

                <div style={{
                    marginBottom: 12, fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
                }}>
                    AVAILABLE CREDITS: {formatCreditsDisplay(availableCredits)}
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={{
                        display: 'block', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 6,
                    }}>BET AMOUNT (CREDITS)</label>
                    <input
                        type="number"
                        min="1"
                        step="1"
                        value={amountInput}
                        onChange={e => onAmountChange(e.target.value)}
                        placeholder="10"
                        style={{
                            width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                            border: '1px solid var(--border)', borderRadius: 10, padding: '11px 12px', fontSize: 14,
                            outline: 'none', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
                        }}
                    />
                </div>

                {amountError && (
                    <div style={{
                        marginBottom: 14, color: 'var(--danger)', fontSize: 12,
                    }}>{amountError}</div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={onClose} disabled={isSubmitting} style={{
                        flex: 1, padding: '12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                        color: 'var(--text-secondary)', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1,
                    }}>CANCEL</button>
                    <button onClick={onConfirm} disabled={isSubmitting} style={{
                        flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: 'var(--accent)',
                        color: '#080A0F', fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1,
                    }}>{isSubmitting ? 'PLACING...' : 'CONFIRM BET'}</button>
                </div>
            </div>
        </div>
    );
}

// Betting feature: Player bet card with fixed condition UI + credit-backed placement flow.
function PlayerBetCard({ playerId, title, subtitle, meta, stake, stat, range, statNum, payoutMult, animDelay, availableCredits = 0, onPlaceBet, confirmed = false, bettingOpen = true }) {
    const [hover, setHover] = useState(false);
    const [betPlaced, setBet] = useState(false);
    const [isSubmittingBet, setIsSubmittingBet] = useState(false);
    const [showBetModal, setShowBetModal] = useState(false);
    const [betAmountInput, setBetAmountInput] = useState('');
    const [betAmountError, setBetAmountError] = useState('');
    const [betBanner, setBetBanner] = useState(null);
    const lockedStat = String(stat || '').trim() || '--';
    const lockedRange = String(range || '').trim() || '--';
    const lockedStatNum = String(statNum ?? '').trim() || '--';
    const hasCondition = lockedStat !== '--' && lockedRange !== '--' && lockedStatNum !== '--';
    const conditionText = hasCondition ? `${lockedStat} - ${lockedRange} ${lockedStatNum}` : 'Condition unavailable';

    const handleBet = () => {
        if (!hasCondition || confirmed){
            return;
        }

        if (!bettingOpen) {
            setBetBanner({
                type: 'error',
                message: 'Bet placement is currently closed for this match.',
            });
            return;
        }

        setBetAmountInput('');
        setBetAmountError('');
        setBetBanner(null);
        setShowBetModal(true);
    };

    const handleConfirmBetAmount = async () => {
        const amount = Number(betAmountInput);
        const credits = Number.isFinite(Number(availableCredits)) ? Number(availableCredits) : 0;

        if (!Number.isFinite(amount) || amount <= 0) {
            setBetAmountError('Enter a valid credit amount greater than 0.');
            return;
        }

        if (amount > credits) {
            setBetAmountError('Not enough credits. Deposit more credits to place this bet.');
            setBetBanner({
                type: 'error',
                message: 'Not enough credits. Please deposit more credits.',
            });
            return;
        }

        try {
            setIsSubmittingBet(true);

            if (typeof onPlaceBet === 'function') {
                await onPlaceBet(amount, {
                    playerId,
                    name: title,
                    number: String(subtitle || '').replace('#', '').trim(),
                    team: meta,
                    stat,
                    range,
                    stat_num: statNum,
                    payout_mult: payoutMult,
                });
            }

            setShowBetModal(false);
            setBetAmountError('');
            setBetBanner({
                type: 'success',
                message: 'Bet successfully placed.',
            });
            setBet(true);
            setTimeout(() => setBet(false), 2000);
        } catch (error) {
            const message = error?.message || 'Unable to place bet right now.';
            setBetAmountError(message);
            setBetBanner({
                type: 'error',
                message,
            });
        } finally {
            setIsSubmittingBet(false);
        }
    };

    const handleCloseBetModal = () => {
        setShowBetModal(false);
        setBetAmountError('');
    };

    return(
        <>
            <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
                background: hover? 'var(--bg-card-hover)' : 'var(--bg-card)',
                border: `1px solid ${hover ? 'var(--border-bright)' : 'var(--border)'}`,
                borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column',
                transition: 'all 0.2s', transform: hover ? 'translateY(-2px)' : 'none',
                boxShadow: hover ? '0 8px 24px rgba(0, 0, 0, 0.3)' : 'none', animation: 'fadeIn 0.4s ease both', animationDelay: animDelay,
            }}>
                {meta && (
                    <div style={{
                        display: 'inline-flex', alignSelf: 'flex-start', background: 'rgba(198, 241, 53, 0.1)', color: 'var(--accent)',
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', padding: '3px 8px',
                        borderRadius: 6, marginBottom: 12, border: '1px solid rgba(198, 241, 52, 0.2)',
                    }}>{meta}</div>
                )}
                    <div style={{
                        fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.04em',
                        color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 4,
                    }}>{title}</div>
                    <div style={{
                        fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
                        fontWeight: 500, marginBottom: 12,
                    }}>{subtitle}</div>

                    <BetStatusBanner banner={betBanner} />

                    <ConditionZone>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                        }}>
                            <div style={{
                                minWidth: 118, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 7,
                                padding: '6px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)',
                            }}>{lockedStat}</div>
                            <div style={{
                                minWidth: 82, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 7,
                                padding: '6px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)',
                            }}>{lockedRange}</div>
                            <div style={{
                                width: 58, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 7,
                                padding: '6px 8px', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)',
                                fontFamily: 'var(--font-mono)', textAlign: 'center',
                            }}>{lockedStatNum}</div>
                        </div>
                        {conditionText && ( <div style={{
                            fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', paddingTop: 2,
                        }}>
                            {conditionText}
                        </div>
                    )}
                    </ConditionZone>
                <div style={{
                    height: 1, background: 'var(--border)', marginBottom: 16,
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
                    <BarChart2 size={20} color="var(--text-muted)"/>
                </div>
                <button onClick={handleBet} disabled={confirmed || !hasCondition || betPlaced || !bettingOpen} title={confirmed ? 'This bet is already confirmed' : (!hasCondition ? 'Condition unavailable for this bet' : (!bettingOpen ? 'Bet placement is currently closed' : ''))} style={{
                    background: confirmed ? 'var(--success)' : (betPlaced ? 'var(--success)' : 'var(--accent)'),
                    color: '#080A0F', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', 
                    padding: '11px', borderRadius: 8, border: (!hasCondition && !confirmed) ? '1px solid var(--border)' : 'none', cursor: (confirmed || !hasCondition || !bettingOpen) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s', opacity: (confirmed || !hasCondition || !bettingOpen) ? 0.75 : 1,
                }}>
                    {confirmed ? 'BET CONFIRMED' : (betPlaced ? '✓ BET PLACED' : (!hasCondition ? 'CONDITION UNAVAILABLE' : (!bettingOpen ? 'BETTING CLOSED' : 'PLACE BET')))}
                </button>
            </div>

            <BetAmountModal
                isOpen={showBetModal && !confirmed}
                title="PLACE PLAYER BET"
                availableCredits={availableCredits}
                amountInput={betAmountInput}
                amountError={betAmountError}
                isSubmitting={isSubmittingBet}
                onClose={handleCloseBetModal}
                onAmountChange={setBetAmountInput}
                onConfirm={handleConfirmBetAmount}
            />
        </>
    );
}

// Betting feature: Team bet card with fixed condition UI + credit-backed placement flow.
function TeamBetCard({ teamId, title, subtitle, stake, outcome, range, points, payoutMult, animDelay, availableCredits = 0, onPlaceBet, confirmed = false, bettingOpen = true }) {
    const [hover, setHover] = useState(false);
    const [betPlaced, setBet] = useState(false);
    const [isSubmittingBet, setIsSubmittingBet] = useState(false);
    const [showBetModal, setShowBetModal] = useState(false);
    const [betAmountInput, setBetAmountInput] = useState('');
    const [betAmountError, setBetAmountError] = useState('');
    const [betBanner, setBetBanner] = useState(null);

    const lockedOutcome = String(outcome || '').trim() || '--';
    const lockedRange = String(range || '').trim() || '--';
    const lockedPoints = String(points ?? '').trim() || '--';
    const hasCondition = lockedOutcome !== '--' && lockedRange !== '--' && lockedPoints !== '--';
    const conditionText = hasCondition ? `${lockedOutcome} - ${lockedRange} ${lockedPoints}` : 'Condition unavailable';

    const handleBet = () => {
        if (!hasCondition || confirmed) {
            return;
        }

        if (!bettingOpen) {
            setBetBanner({
                type: 'error',
                message: 'Bet placement is currently closed for this match.',
            });
            return;
        }

        setBetAmountInput('');
        setBetAmountError('');
        setBetBanner(null);
        setShowBetModal(true);
    };

    const handleConfirmBetAmount = async () => {
        const amount = Number(betAmountInput);
        const credits = Number.isFinite(Number(availableCredits)) ? Number(availableCredits) : 0;

        if (!Number.isFinite(amount) || amount <= 0) {
            setBetAmountError('Enter a valid credit amount greater than 0.');
            return;
        }

        if (amount > credits) {
            setBetAmountError('Not enough credits. Deposit more credits to place this bet.');
            setBetBanner({
                type: 'error',
                message: 'Not enough credits. Please deposit more credits.',
            });
            return;
        }

        try {
            setIsSubmittingBet(true);

            if (typeof onPlaceBet === 'function') {
                await onPlaceBet(amount, {
                    teamId,
                    country: title,
                    record: subtitle,
                    outcome,
                    range,
                    points,
                    payout_mult: payoutMult,
                });
            }

            setShowBetModal(false);
            setBetAmountError('');
            setBetBanner({
                type: 'success',
                message: 'Bet successfully placed.',
            });
            setBet(true);
            setTimeout(() => setBet(false), 2000);
        } catch (error) {
            const message = error?.message || 'Unable to place bet right now.';
            setBetAmountError(message);
            setBetBanner({
                type: 'error',
                message,
            });
        } finally {
            setIsSubmittingBet(false);
        }
    };

    const handleCloseBetModal = () => {
        setShowBetModal(false);
        setBetAmountError('');
    };

    return(
        <>
            <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
                background: hover ? 'var(--bg-card-hover)' : 'var(--bg-card)', border: `1px solid ${hover ? 'var(--border-bright)' : 'var(--border)'}`,
                borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', transition: 'all 0.2s', transform: hover ? 'translateY(-2px)' : 'none',
                boxShadow: hover ? '0 8px 24px rgba(0,0,0,0.3)' : 'none', animation: 'fadeIn 0.4s ease both', animationDelay: animDelay,
            }}>
                <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.04em', color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 4,
                }}>{title}</div>
                <div style={{
                    fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 500, marginBottom: 12,
                }}>{subtitle}</div>

                <BetStatusBanner banner={betBanner} />

                <ConditionZone>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                    }}>
                        <div style={{
                            minWidth: 92, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 7,
                            padding: '6px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)',
                        }}>{lockedOutcome}</div>
                        <div style={{
                            minWidth: 104, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 7,
                            padding: '6px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)',
                        }}>{lockedRange}</div>
                        <div style={{
                            width: 58, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 7,
                            padding: '6px 8px', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)',
                            fontFamily: 'var(--font-mono)', textAlign: 'center',
                        }}>{lockedPoints}</div>
                    </div>
                    {conditionText && ( <div style={{
                        fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', paddingTop: 2,
                    }}>
                        {conditionText}
                    </div>
                )}
                </ConditionZone>
                <div style={{
                    height: 1, background: 'var(--border)', marginBottom: 12,
                }}/>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12,
                }}>
                    <div>
                        <div style={{
                            fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3,
                        }}>STAKE</div>
                        <div style={{fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 500, color: 'var(--accent)',
                        }}>{stake}</div>
                    </div>
                    <BarChart2 size={20} color="var(--text-muted)" />
                </div>
                <button onClick={handleBet} disabled={confirmed || !hasCondition || betPlaced || !bettingOpen} title={confirmed ? 'This bet is already confirmed' : (!hasCondition ? 'Condition unavailable for this bet' : (!bettingOpen ? 'Bet placement is currently closed' : ''))} style={{
                    background: confirmed ? 'var(--success)' : (betPlaced ? 'var(--success)' : 'var(--accent)'),
                    color: '#080A0F', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em',
                    padding: '11px', borderRadius: 8, border: (!hasCondition && !confirmed) ? '1px solid var(--border)' : 'none', cursor: (confirmed || !hasCondition || !bettingOpen) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s', opacity: (confirmed || !hasCondition || !bettingOpen) ? 0.75 : 1,
                }}>
                    {confirmed ? 'BET CONFIRMED' : (betPlaced ? '✓ BET PLACED' : (!hasCondition ? 'CONDITION UNAVAILABLE' : (!bettingOpen ? 'BETTING CLOSED' : 'PLACE BET')))}
                </button>
            </div>

            <BetAmountModal
                isOpen={showBetModal && !confirmed}
                title="PLACE TEAM BET"
                availableCredits={availableCredits}
                amountInput={betAmountInput}
                amountError={betAmountError}
                isSubmitting={isSubmittingBet}
                onClose={handleCloseBetModal}
                onAmountChange={setBetAmountInput}
                onConfirm={handleConfirmBetAmount}
            />
        </>
    );
}

// Betting feature: shared card grid wrapper used across Players/Teams/Picks sections.
function BetGrid({ children }) {
    return (
        <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16,
        }}>
            {children}
        </div>
    );
}

function Top25Rail({ title }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginBottom: 18,
        }}>
            <h3 style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                letterSpacing: '0.06em',
                color: 'var(--text-primary)',
            }}>{title}</h3>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 10,
                paddingBottom: 4,
            }}>
                {FIFA_TOP_25.map((entry, index) => (
                    <div key={entry.rank} style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 14,
                        padding: 14,
                        minHeight: 108,
                        animation: 'fadeIn 0.4s ease both',
                        animationDelay: `${index * 0.03}s`,
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                            marginBottom: 12,
                        }}>
                            <div style={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                background: 'rgba(198, 241, 53, 0.1)',
                                border: '1px solid rgba(198, 241, 53, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontFamily: 'var(--font-display)',
                                color: 'var(--accent)',
                                fontSize: 18,
                            }}>{entry.rank}</div>
                            <div style={{
                                fontSize: 10,
                                fontWeight: 800,
                                letterSpacing: '0.08em',
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                            }}>Current</div>
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 16,
                            letterSpacing: '0.04em',
                            color: 'var(--text-primary)',
                            lineHeight: 1.1,
                            marginBottom: 10,
                        }}>{entry.team}</div>
                        <div style={{
                            fontSize: 11,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--accent)',
                            letterSpacing: '0.04em',
                        }}>{entry.record}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function GifAdSlot({ src, alt, label }) {
    return (
        <div className="dashboard-ad-slot">
            <div style={{
                position: 'relative',
                width: '100%',
            }}>
                <img
                    src={src}
                    alt={alt}
                    style={{
                        width: '100%',
                        display: 'block',
                    }}
                />
                <div style={{
                    position: 'absolute',
                    left: 10,
                    top: 10,
                    background: 'rgba(0,0,0,0.78)',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    padding: '4px 8px',
                    borderRadius: 999,
                }}>{label}</div>
            </div>
        </div>
    );
}

// Betting feature: shared heading + grid wrapper for grouped picks sections.
function PicksSection({ title, children }) {
    return (
        <>
            <h3 style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                letterSpacing: '0.06em',
                color: 'var(--text-primary)',
            }}>{title}</h3>
            <BetGrid>{children}</BetGrid>
        </>
    );
}

// Betting feature: combined picks tab (Player + Team + Game confirmed picks).
function YourPicksTab({playerPicks, teamPicks, gamePicks}){
    const playerPickList = Array.isArray(playerPicks) ? playerPicks : [];
    const teamPickList = Array.isArray(teamPicks) ? teamPicks : [];
    const gamePickList = Array.isArray(gamePicks) ? gamePicks : [];
    const hasAnyPicks = playerPickList.length > 0 || teamPickList.length > 0 || gamePickList.length > 0;

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', gap: 24,
        }}>
            <div className="dashboard-layout">
                <aside className="dashboard-ad-rail">
                    <GifAdSlot src="/place-your-bets-sports-betting.gif" alt="Place your bets gif" label="PLACE BETS" />
                    <GifAdSlot src="/dodep2.gif" alt="Promo gif" label="ODDS BOOST" />
                </aside>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 24,
                }}>
                    {hasAnyPicks ? (
                        <>
                            {playerPickList.length > 0 && (
                                <PicksSection title="PLAYER PICKS">
                                    {playerPickList.map((p, i) => (
                                        <PlayerBetCard key={`player-${p.id || i}`} playerId={p.id} title={p.name} subtitle={`#${p.number}`} meta={p.pos} stake={p.stake} stat={p.stat} range={p.range} statNum={p.stat_num} payoutMult={p.payout_mult} animDelay={`${i*0.05}s`} confirmed />
                                    ))}
                                </PicksSection>
                            )}

                            {teamPickList.length > 0 && (
                                <PicksSection title="TEAM PICKS">
                                    {teamPickList.map((t, i) => (
                                        <TeamBetCard key={`team-${t.id || i}`} teamId={t.id} title={t.name} subtitle={t.record} stake={t.stake} outcome={t.outcome} range={t.range} points={t.points} payoutMult={t.payout_mult} animDelay={`${i * 0.05}s`} confirmed />
                                    ))}
                                </PicksSection>
                            )}

                            {gamePickList.length > 0 && (
                                <div style={{
                                    display: 'flex', flexDirection: 'column', gap: 12,
                                }}>
                                    <h3 style={{
                                        margin: 0,
                                        fontFamily: 'var(--font-display)',
                                        fontSize: 18,
                                        letterSpacing: '0.06em',
                                        color: 'var(--text-primary)',
                                    }}>GAME PICKS</h3>
                                    <GamesTab games={gamePickList} confirmed />
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            minHeight: 400, gap: 16, animation: 'fadeIn 0.4s ease',
                        }}>
                            <div style={{
                                width: 80, height: 80, borderRadius: 20, background: 'var(--bg-card)',
                                border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Star size={32} color="var(--accent)"/>
                            </div>
                            <h3 style={{
                                fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '0.06em',
                            }}>YOUR PICKS</h3>
                            <p style={{
                                fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 280, lineHeight: 1.7,
                            }}>Your saved picks and active bets will appear here. Start browsing to build your lineup.</p>
                            <div style={{
                                background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
                                padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12,
                            }}>
                                <Activity size={18} color="var(--accent)"/>
                                <span style={{
                                    fontSize: 13, color: 'var(--text-secondary)'
                                }}>No active picks yet</span>
                            </div>
                        </div>
                    )}

                    <div style={{
                        background: 'rgba(14, 18, 24, 0.9)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 16,
                        overflow: 'hidden',
                        boxShadow: '0 16px 40px rgba(0,0,0,0.32)',
                    }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(220px, 320px) minmax(0, 1fr)',
                            alignItems: 'stretch',
                        }}>
                            <div style={{
                                minHeight: 150,
                                background: '#111318',
                            }}>
                                <img
                                    src="/jarvis-banner.gif"
                                    alt="Banner ad gif"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block',
                                    }}
                                />
                            </div>
                            <div style={{
                                padding: 18,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                gap: 8,
                            }}>
                                <div style={{
                                    display: 'inline-flex',
                                    alignSelf: 'flex-start',
                                    background: '#ef4444',
                                    color: '#fff',
                                    fontSize: 10,
                                    fontWeight: 800,
                                    letterSpacing: '0.1em',
                                    padding: '4px 8px',
                                    borderRadius: 999,
                                }}>FEATURED</div>
                                <div style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: 28,
                                    letterSpacing: '0.06em',
                                    color: 'var(--text-primary)',
                                    lineHeight: 1,
                                }}>IRON MAN DOESN'T PARLAY THE ARC REACTOR</div>
                                <p style={{
                                    margin: 0,
                                    fontSize: 13,
                                    color: 'var(--text-secondary)',
                                    lineHeight: 1.5,
                                }}>Even Tony Stark would hedge before he bet the suit on one slip.</p>
                            </div>
                        </div>
                    </div>
                </div>
                <aside className="dashboard-ad-rail">
                    <GifAdSlot src="/cat-gamble.gif" alt="Cat gambling gif" label="HOT SLOT" />
                    <GifAdSlot src="/dyd-betting-the-betting-king.gif" alt="Betting king gif" label="BET KING" />
                </aside>
            </div>
        </div>
    );
}

// Betting feature: available Player bets listing.
function PlayersTab({players, availableCredits, onPlaceBet, bettingOpen = true}){
    return(
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
        }}>
            <BetGrid>
                {players.map((p, i) => (
                    <PlayerBetCard key={p.id} playerId={p.id} title={p.name} subtitle={`#${p.number}`} meta={p.pos} stake={p.stake} stat={p.stat} range={p.range} statNum={p.stat_num} payoutMult={p.payout_mult} animDelay={`${i*0.05}s`} availableCredits={availableCredits} onPlaceBet={onPlaceBet} bettingOpen={bettingOpen} />
                ))}
            </BetGrid>
        </div>
    );
}

// Betting feature: available Team bets listing.
function TeamsTab({teams, availableCredits, onPlaceBet, bettingOpen = true}){
    return(
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
        }}>
            <BetGrid>
                {teams.map((t, i) =>(
                        <TeamBetCard key={t.id} teamId={t.id} title={t.name} subtitle={t.record} stake={t.stake} outcome={t.outcome} range={t.range} points={t.points} payoutMult={t.payout_mult} animDelay={`${i * 0.05}s`} availableCredits={availableCredits} onPlaceBet={onPlaceBet} bettingOpen={bettingOpen}/>
                ))}
            </BetGrid>
        </div>
    );
}

function GamesRow({g, i, availableCredits = 0, onPlaceBet, confirmed = false, bettingOpen = true}) {
    const [hover, setHover] = useState(false);
    const [betPlaced, setBetPlaced] = useState(false);
    const [isSubmittingBet, setIsSubmittingBet] = useState(false);
    const [showBetModal, setShowBetModal] = useState(false);
    const [betAmountInput, setBetAmountInput] = useState('');
    const [betAmountError, setBetAmountError] = useState('');
    const [betBanner, setBetBanner] = useState(null);
    const [selectedTeamChoice, setSelectedTeamChoice] = useState(String(g?.selected_team || '').trim());

    const lockedWinner = String(g?.winner || '').trim() || '--';
    const lockedOdds = String(g?.odds || g?.spread || '').trim() || '--';
    const hasCondition = lockedWinner !== '--';
    const hasSelectedTeam = Boolean(selectedTeamChoice);
    const conditionText = hasCondition
        ? `${lockedWinner}${hasSelectedTeam ? ` · ${selectedTeamChoice}` : ''}`
        : 'Condition unavailable';

    useEffect(() => {
        setSelectedTeamChoice(String(g?.selected_team || '').trim());
        setBetBanner(null);
        setBetAmountError('');
    }, [g?.id, g?.selected_team]);

    const handleBet = () => {
        if (!hasCondition || confirmed) {
            return;
        }

        if (!bettingOpen) {
            setBetBanner({
                type: 'error',
                message: 'Bet placement is currently closed for this match.',
            });
            return;
        }

        if (!hasSelectedTeam) {
            setBetBanner({
                type: 'error',
                message: 'Choose one team for this game bet before placing it.',
            });
            return;
        }

        setBetAmountInput('');
        setBetAmountError('');
        setBetBanner(null);
        setShowBetModal(true);
    };

    const handleConfirmBetAmount = async () => {
        const amount = Number(betAmountInput);
        const credits = Number.isFinite(Number(availableCredits)) ? Number(availableCredits) : 0;

        if (!Number.isFinite(amount) || amount <= 0) {
            setBetAmountError('Enter a valid credit amount greater than 0.');
            return;
        }

        if (amount > credits) {
            setBetAmountError('Not enough credits. Deposit more credits to place this bet.');
            setBetBanner({
                type: 'error',
                message: 'Not enough credits. Please deposit more credits.',
            });
            return;
        }

        try {
            setIsSubmittingBet(true);

            if (typeof onPlaceBet === 'function') {
                await onPlaceBet(amount, {
                    gameId: g.id,
                    away_team: g.away,
                    home_team: g.home,
                    time: g.time,
                    winner: g.winner,
                    selected_team: selectedTeamChoice,
                    odds: g.odds || g.spread,
                    payout_mult: g.payout_mult,
                });
            }

            setShowBetModal(false);
            setBetAmountError('');
            setBetBanner({
                type: 'success',
                message: 'Bet successfully placed.',
            });
            setBetPlaced(true);
            setTimeout(() => setBetPlaced(false), 2000);
        } catch (error) {
            const message = error?.message || 'Unable to place bet right now.';
            setBetAmountError(message);
            setBetBanner({
                type: 'error',
                message,
            });
        } finally {
            setIsSubmittingBet(false);
        }
    };

    const handleCloseBetModal = () => {
        setShowBetModal(false);
        setBetAmountError('');
    };

    return(
        <>
            <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
                background: hover ? 'var(--bg-card-hover)' : 'var(--bg-card)', border: `1px solid ${hover ? 'var(--border-bright)' : 'var(--border)'}`,
                borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, transition: 'all 0.2s', animation: 'fadeIn 0.4s ease both', animationDelay: `${i * 0.07}s`,
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
                }}>
                    <div style={{
                        background: 'rgba(198, 241, 53, 0.1)', color: 'var(--accent)', fontSize: 11, fontWeight: 700, padding: '4px 10px',
                        borderRadius: 6, border: '1px solid rgba(198, 241, 53, 0.2)', fontFamily: 'var(--font-mono)', flexShrink: 0,
                    }}>{lockedOdds}</div>
                    <div style={{
                        flex: 1, minWidth: 200,
                    }}>
                        <div style={{
                            fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '0.04em', color: 'var(--text-primary)',
                        }}>
                            {g.away}
                            <span style={{
                                color: 'var(--text-muted)',
                            }}>@</span> {g.home}
                        </div>
                        <div style={{
                            fontSize: 12, color: 'var(--text-secondary)', marginTop: 3, fontFamily: 'var(--font-mono)',
                        }}>
                            {g.time}
                        </div>
                    </div>
                    <div style={{
                        textAlign: 'right', flexShrink: 0,
                    }}>
                        <div style={{
                            fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}>STAKE</div>
                        <div style={{
                            fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--accent)', fontWeight: 500,
                        }}>{g.stake}</div>
                    </div>
                </div>

                <BetStatusBanner banner={betBanner} />

                <ConditionZone>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                    }}>
                        <ConditionLabel>Condition</ConditionLabel>
                        <div style={{
                            minWidth: 160, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 7,
                            padding: '6px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)',
                        }}>{lockedWinner}</div>
                    </div>
                    {confirmed ? (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                        }}>
                            <ConditionLabel>Selected Team</ConditionLabel>
                            <div style={{
                                minWidth: 180, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 7,
                                padding: '6px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)',
                            }}>
                                {selectedTeamChoice || '--'}
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                        }}>
                            <ConditionLabel>Pick Team</ConditionLabel>
                            <select
                                value={selectedTeamChoice}
                                disabled={!hasCondition || !bettingOpen}
                                onChange={event => {
                                    setSelectedTeamChoice(event.target.value);
                                    setBetBanner(null);
                                    setBetAmountError('');
                                }}
                                style={{
                                    minWidth: 180,
                                    background: 'var(--bg-primary)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 7,
                                    padding: '6px 10px',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    letterSpacing: '0.05em',
                                    color: 'var(--text-primary)',
                                    outline: 'none',
                                    cursor: (!hasCondition || !bettingOpen) ? 'not-allowed' : 'pointer',
                                }}
                            >
                                <option value="">Select team...</option>
                                <option value={g.home}>{g.home}</option>
                                <option value={g.away}>{g.away}</option>
                            </select>
                        </div>
                    )}
                    <div style={{
                        fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', paddingTop: 2,
                    }}>
                        {conditionText}
                    </div>
                </ConditionZone>
                <button onClick={handleBet} disabled={confirmed || !hasCondition || betPlaced || !bettingOpen} title={confirmed ? 'This bet is already confirmed' : (!hasCondition ? 'Condition unavailable for this bet' : (!bettingOpen ? 'Bet placement is currently closed' : ''))} style={{
                    background: confirmed ? 'var(--success)' : (betPlaced ? 'var(--success)' : 'var(--accent)'), color: '#080A0F', letterSpacing: '0.08em', padding: '11px 20px',
                    borderRadius: 8, border: (!hasCondition && !confirmed) ? '1px solid var(--border)' : 'none', cursor: (confirmed || !hasCondition || !bettingOpen) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s', fontWeight: 700, fontSize: 13, alignSelf: 'flex-end', opacity: (confirmed || !hasCondition || !bettingOpen) ? 0.75 : 1,
                }}>{confirmed ? 'BET CONFIRMED' : (betPlaced ? '✓ BET PLACED' : (!hasCondition ? 'CONDITION UNAVAILABLE' : (!bettingOpen ? 'BETTING CLOSED' : 'PLACE BET')))}</button>
            </div>

            <BetAmountModal
                isOpen={showBetModal && !confirmed}
                title="PLACE GAME BET"
                availableCredits={availableCredits}
                amountInput={betAmountInput}
                amountError={betAmountError}
                isSubmitting={isSubmittingBet}
                onClose={handleCloseBetModal}
                onAmountChange={setBetAmountInput}
                onConfirm={handleConfirmBetAmount}
            />
        </>
    );
}

function GamesTab({games, availableCredits = 0, onPlaceBet, confirmed = false, bettingOpen = true}){
    return(
        <div style={{
            display: 'flex', flexDirection: 'column', gap: 16,
        }}>
            {games.map((g, i) => (
                <GamesRow key={g.id} g={g} i={i} availableCredits={availableCredits} onPlaceBet={onPlaceBet} confirmed={confirmed} bettingOpen={bettingOpen} />
        ))}
        </div>
    );
}

function GlobalChat({messages, onNewMessage, username}){
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);

    useEffect(() => {
        const container = chatContainerRef.current;
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = () => {
        const trimmed = inputText.trim();
        if (!trimmed || typeof onNewMessage !== 'function'){
            return;
        }
        onNewMessage({
            user: username || 'You',
            initials: (username || 'YO').slice(0, 2).toUpperCase(),
            color: 'var(--accent)',
            text: trimmed,
        });
        setInputText('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter'){
            handleSubmit();
        }
    };

    return(
        <div style={{
            flex: 1, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', height: 520,
            position: 'sticky', top: 'calc(var(--header-height) + var(--tab-height) + 12px)',
        }}>
            <div style={{
                padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex',
                alignItems: 'center', gap: 8, flexShrink: 0,
            }}>
                <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', 
                    animation: 'live-dot 1.2s ease-in-out infinite',
                }}/>
                <span style={{
                    fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: '0.08em', color: 'var(--text-primary)',
                }}>GLOBAL CHAT</span>
                <span style={{
                    marginLeft: 'auto', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                }}>1,204 online</span>
            </div>
            <div ref={chatContainerRef} style={{
                flex: 1, overflowY: 'auto', padding: '12px 12px 8px', display: 'flex', flexDirection: 'column', gap: 10,
            }}>
                {messages.map(msg => (
                    <div key={msg.id} style={{
                        display: 'flex', gap: 8, alignItems: 'flex-start',
                    }}>
                        <div style={{
                            width: 28, height: 28, borderRadius: '50%', background: msg.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9,
                            fontWeight: 700, color: '#080A0F', flexShrink: 0, fontFamily: 'var(--font-display)', letterSpacing: '0.04em',
                        }}>{msg.initials} 
                        </div>
                        <div style={{
                            flex: 1,
                        }}>
                            <span style={{
                                fontSize: 10, fontWeight: 700, color: msg.color, fontFamily: 'var(--font-mono)',
                            }}>{msg.user}</span>
                            <span style={{
                                fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,
                            }}>{msg.text}</span>
                        </div>
                    </div>

                ))}
                <div ref={messagesEndRef} />
            </div>
            <div style={{
                padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8,
                alignItems: 'center', flexShrink: 0, background: 'var(--bg-secondary)',
            }}>
                <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={handleKeyDown} placeholder="Say something..." style={{
                    flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, 
                    padding: '8px 10px', fontSize: 12, color: 'var(--text-primary)', outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)';}}
                onBlur={e => {e.target.style.borderColor = 'var(--border)';}}
                />
                <button onClick={handleSubmit} style={{
                    background: 'var(--accent)', color: '#080A0F', fontWeight: 700, fontSize: 11,
                    padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', 
                    letterSpacing: '0.06em', flexShrink: 0, transition: 'background 0.2s',
                }}
                onMouseEnter={e => {e.currentTarget.style.background = 'var(--accent-dim)';}}
                onMouseLeave={e => {e.currentTarget.style.background = 'var(--accent)';}}
                >SEND</button>
            </div>
        </div>
    );
}

function getLastPlayedMatch(bracketState) {
    if (!bracketState || !Array.isArray(bracketState.rounds)) return null;
    let lastPlayed = null;
    for (const round of bracketState.rounds) {
        for (const match of (round.matches || [])) {
            if (match.played && match.result) {
                lastPlayed = match;
            }
        }
    }
    return lastPlayed;
}

function getNextPlayableMatch(bracketState) {
    if (!bracketState || !Array.isArray(bracketState.rounds)) return null;
    for (const round of bracketState.rounds) {
        for (const match of (round.matches || [])) {
            if (match.home && match.away && !match.winner) {
                return match;
            }
        }
    }
    return null;
}

function TeamSquare({ teamName, score, cards }) {
    const yellowCards = cards.filter(c => c.event === 'yellow_card');
    const redCards = cards.filter(c => c.event === 'red_card');
    return (
        <div style={{
            position: 'relative',
            flex: 1,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '16px 18px',
        }}>
            <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                letterSpacing: '0.06em',
                color: 'var(--text-primary)',
                marginBottom: 4,
            }}>{teamName || 'TBD'}</div>
            <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 32,
                fontWeight: 700,
                color: 'var(--accent)',
            }}>{score ?? '-'}</div>
            {(yellowCards.length > 0 || redCards.length > 0) && (
                <div style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 10,
                    display: 'flex',
                    gap: 3,
                }}>
                    {yellowCards.map((c, i) => (
                        <div key={`y-${i}`} style={{
                            width: 10, height: 14, borderRadius: 2,
                            background: '#FACC15',
                        }} />
                    ))}
                    {redCards.map((c, i) => (
                        <div key={`r-${i}`} style={{
                            width: 10, height: 14, borderRadius: 2,
                            background: '#EF4444',
                        }} />
                    ))}
                </div>
            )}
        </div>
    );
}

function LiveTab({chatMessages, onNewMessage, username, bracketState, liveReplay, replayNowMs}){
    const lastMatch = getLastPlayedMatch(bracketState);
    const nextMatch = getNextPlayableMatch(bracketState);
    const replaySnapshot = buildReplaySnapshot(liveReplay, replayNowMs);
    const isReplayActive = Boolean(replaySnapshot?.isActive);
    const replayEvents = replaySnapshot?.visibleEvents || [];
    const finalEvents = lastMatch?.result?.match_events || [];
    const events = isReplayActive ? replayEvents : finalEvents;
    const homeYellows = events.filter(e => e.event === 'yellow_card' && e.team === 'home').length;
    const homeReds = events.filter(e => e.event === 'red_card' && e.team === 'home').length;
    const awayYellows = events.filter(e => e.event === 'yellow_card' && e.team === 'away').length;
    const awayReds = events.filter(e => e.event === 'red_card' && e.team === 'away').length;

    const scoreParts = (lastMatch?.result?.score || '0 - 0').split('-').map(s => s.trim());
    const homeScore = isReplayActive ? String(replaySnapshot.homeScore) : (scoreParts[0] || '0');
    const awayScore = isReplayActive ? String(replaySnapshot.awayScore) : (scoreParts[1] || '0');
    const homeName = liveReplay?.homeTeam || lastMatch?.home?.name || nextMatch?.home?.name || 'HOME TEAM';
    const awayName = liveReplay?.awayTeam || lastMatch?.away?.name || nextMatch?.away?.name || 'AWAY TEAM';
    const matchClock = isReplayActive ? replaySnapshot.clockLabel : (lastMatch ? "90'" : "0'");
    const liveBadgeLabel = isReplayActive ? 'LIVE REPLAY' : (lastMatch ? 'FULL TIME' : 'PRE-MATCH');
    const liveBadgeColor = isReplayActive ? 'var(--danger)' : (lastMatch ? 'var(--accent)' : 'var(--danger)');

    return(
        <div style={{
            display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'flex-start', animation: 'fadeIn 0.4s ease',
        }}>
            <div style={{
                flex: '0 0 68%', display: 'flex', flexDirection: 'column', gap: 0,
            }}>
                {/* Scoreboard bar */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0,
                    padding: '10px 0', marginBottom: 8,
                }}>
                    <span style={{
                        fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '0.06em',
                        color: 'var(--text-primary)',
                    }}>{homeName}</span>
                    <div style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, margin: '0 14px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <div style={{
                                background: 'var(--bg-card)', border: '1px solid var(--border)',
                                borderRadius: 6, padding: '6px 14px',
                                fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700,
                                color: 'var(--text-primary)', textAlign: 'center', minWidth: 40,
                            }}>{homeScore}</div>
                            <div style={{
                                background: 'var(--bg-card)', border: '1px solid var(--border)',
                                borderRadius: 6, padding: '6px 14px',
                                fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700,
                                color: 'var(--text-primary)', textAlign: 'center', minWidth: 40,
                            }}>{awayScore}</div>
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            color: isReplayActive ? 'var(--accent)' : 'var(--text-secondary)',
                        }}>
                            {matchClock}
                        </div>
                    </div>
                    <span style={{
                        fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '0.06em',
                        color: 'var(--text-primary)',
                    }}>{awayName}</span>
                </div>

                {/* Field image */}
                <div style={{
                    position: 'relative',
                    borderRadius: 14,
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    height: 380,
                }}>
                    <img
                        src="/free-soccer-field-vector.jpg"
                        alt="Soccer field"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                        }}
                    />

                    {/* Live badge */}
                    <div style={{
                        position: 'absolute', top: 10, right: 10,
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: 'rgba(0,0,0,0.7)', padding: '5px 10px', borderRadius: 999,
                    }}>
                        <div style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: liveBadgeColor,
                            animation: 'live-dot 1.2s ease-in-out infinite',
                        }}/>
                        <span style={{
                            fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
                            color: liveBadgeColor,
                            fontFamily: 'var(--font-mono)',
                        }}>{liveBadgeLabel}</span>
                    </div>

                    {/* Pre-match state */}
                    {!lastMatch && !isReplayActive && (
                        <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(8, 10, 15, 0.5)',
                            gap: 10,
                        }}>
                            <Radio size={28} color="var(--danger)"/>
                            <span style={{
                                fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.06em',
                                color: 'var(--text-primary)',
                            }}>WAITING FOR KICKOFF</span>
                            <span style={{
                                fontSize: 11, color: 'var(--text-secondary)',
                            }}>Live match data will show up here once the game begins.</span>
                        </div>
                    )}
                </div>

                {/* Card boxes */}
                <div style={{
                    display: 'flex', flexDirection: 'row', gap: 16, marginTop: 10,
                }}>
                    <div style={{
                        flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 12, padding: '12px 16px',
                    }}>
                        <div style={{
                            fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '0.08em',
                            color: 'var(--text-secondary)', marginBottom: 8,
                        }}>HOME CARDS</div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 14, height: 20, borderRadius: 2, background: '#FACC15' }} />
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{homeYellows}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 14, height: 20, borderRadius: 2, background: '#EF4444' }} />
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{homeReds}</span>
                            </div>
                        </div>
                    </div>
                    <div style={{
                        flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
                        borderRadius: 12, padding: '12px 16px',
                    }}>
                        <div style={{
                            fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: '0.08em',
                            color: 'var(--text-secondary)', marginBottom: 8,
                        }}>AWAY CARDS</div>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 14, height: 20, borderRadius: 2, background: '#FACC15' }} />
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{awayYellows}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 14, height: 20, borderRadius: 2, background: '#EF4444' }} />
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{awayReds}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{
                    marginTop: 12,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '12px 14px',
                }}>
                    <h3 style={{
                        margin: 0,
                        marginBottom: 10,
                        fontSize: 16,
                        color: 'var(--text-primary)',
                        borderBottom: '1px solid var(--border)',
                        paddingBottom: 8,
                    }}>
                        Match Events
                    </h3>

                    {events.length === 0 ? (
                        <div style={{
                            fontSize: 12,
                            color: 'var(--text-secondary)',
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.04em',
                        }}>
                            {isReplayActive ? 'No events yet.' : 'No match events available.'}
                        </div>
                    ) : (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                        }}>
                            {events.map((event, index) => (
                                <div
                                    key={`${event.minute || '0'}-${event.event || 'event'}-${index}`}
                                    style={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 10,
                                        padding: '10px 14px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: 10,
                                    }}
                                >
                                    <div>
                                        <span style={{
                                            fontWeight: 700,
                                            color: 'var(--accent)',
                                            marginRight: 10,
                                        }}>
                                            {formatMatchEventMinute(event.minute)}
                                        </span>
                                        <span style={{ color: 'var(--text-primary)' }}>
                                            {event.description}
                                        </span>
                                    </div>

                                    <span style={{
                                        fontSize: event.event === 'penalty_scored' ? 10 : 12,
                                        padding: event.event === 'penalty_scored' ? '2px 6px' : '4px 8px',
                                        borderRadius: 999,
                                        background:
                                            event.event === 'goal'
                                                ? 'rgba(34,197,94,0.15)'
                                                : event.event === 'penalty_scored'
                                                ? 'rgba(16,185,129,0.16)'
                                                : event.event === 'penalty_missed'
                                                ? 'rgba(245,158,11,0.18)'
                                                : event.event === 'yellow_card'
                                                ? 'rgba(250,204,21,0.15)'
                                                : event.event === 'red_card'
                                                ? 'rgba(239,68,68,0.15)'
                                                : event.event === 'injury'
                                                ? 'rgba(147,51,234,0.18)'
                                                : 'rgba(59,130,246,0.15)',
                                        color:
                                            event.event === 'goal'
                                                ? '#22c55e'
                                                : event.event === 'penalty_scored'
                                                ? '#10b981'
                                                : event.event === 'penalty_missed'
                                                ? '#f59e0b'
                                                : event.event === 'yellow_card'
                                                ? '#facc15'
                                                : event.event === 'red_card'
                                                ? '#ff0000'
                                                : event.event === 'injury'
                                                ? '#9333ea'
                                                : '#3b82f6',
                                        textTransform: 'capitalize',
                                        fontWeight: 600,
                                        whiteSpace: 'nowrap',
                                    }}>
                                        {String(event.event || '').replace('_', ' ')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <GlobalChat messages={chatMessages} onNewMessage={onNewMessage} username={username}/>
        </div>
    );
}

function getBracketChampion(bracketState) {
    const rounds = Array.isArray(bracketState?.rounds) ? bracketState.rounds : [];
    const finalRound = rounds[rounds.length - 1];
    return finalRound?.matches?.[0]?.winner || null;
}

function UserBracketTab({bracket, isLoading = false}) {
    if (isLoading) {
        return (
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: 18,
                fontSize: 12,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.06em',
            }}>
                LOADING LIVE BRACKET...
            </div>
        );
    }

    if (!bracket || !Array.isArray(bracket.rounds) || bracket.rounds.length === 0) {
        return (
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: 18,
                fontSize: 12,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.06em',
            }}>
                LIVE BRACKET HAS NOT BEEN GENERATED YET.
            </div>
        );
    }

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
                                <div key={match.id} style={{
                                    border: '1px solid var(--border)',
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    background: 'var(--bg-secondary)',
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
                                    ) : match.winner ? (
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
                                    ) : (
                                        <div style={{
                                            padding: '12px',
                                            fontSize: 11,
                                            color: 'var(--text-muted)',
                                            fontFamily: 'var(--font-mono)',
                                            letterSpacing: '0.06em',
                                            borderTop: '1px solid var(--border)',
                                        }}>
                                            Awaiting simulation.
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// main dashboard!
const TAB_CONFIG = [
    {key: TABS.PICKS, label: 'Your Picks', icon: <Star size={15} /> },
    {key: TABS.PLAYERS, label: 'Players', icon: <User size={15} /> },
    {key: TABS.TEAMS, label: 'Teams', icon: <Shield size={15} /> },
    {key: TABS.GAMES, label: "Games", icon: <Trophy size={15} /> },
    {key: TABS.BRACKET, label: 'Bracket', icon: <BarChart2 size={15} /> },
    {key: TABS.LIVE, label: "Live", icon: <Radio size={15} />, live:true},
];

function Dashboard({username, players, playerPicks, teams, teamPicks, games, gamePicks, chatMessages, onNewMessage, activeTab, setActiveTab, userCredits, onPlacePlayerBet, onPlaceTeamBet, onPlaceGameBet, showBetSuccessBanner = false, canPlaceBets = true}){
    const [bracketState, setBracketState] = useState(null);
    const [liveReplay, setLiveReplay] = useState(null);
    const [isBracketLoading, setIsBracketLoading] = useState(true);
    const [replayNowMs, setReplayNowMs] = useState(() => Date.now());

    useEffect(() => {
        let isMounted = true;

        const loadBracket = async () => {
            try {
                const response = await fetch('/api/bracket');
                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    return;
                }

                if (isMounted) {
                    setBracketState(data?.bracket?.bracketState || null);
                    setLiveReplay(data?.bracket?.liveReplay || null);
                }
            } catch {
                // keep latest local bracket view if fetch fails
            } finally {
                if (isMounted) {
                    setIsBracketLoading(false);
                }
            }
        };

        void loadBracket();
        const intervalId = setInterval(() => {
            void loadBracket();
        }, 1500);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            setReplayNowMs(Date.now());
        }, 250);

        return () => clearInterval(intervalId);
    }, []);

    // Betting feature: hide already-confirmed bets from available tabs.
    const playerPickKeySet = new Set((playerPicks || []).map(getPlayerBetMatchKey).filter(Boolean));
    const availablePlayers = (players || []).filter(player => !playerPickKeySet.has(getPlayerBetMatchKey(player)));
    const teamPickKeySet = new Set((teamPicks || []).map(getTeamBetMatchKey).filter(Boolean));
    const availableTeams = (teams || []).filter(team => !teamPickKeySet.has(getTeamBetMatchKey(team)));
    const gamePickKeySet = new Set((gamePicks || []).map(getGameBetMatchKey).filter(Boolean));
    const availableGames = (games || []).filter(game => !gamePickKeySet.has(getGameBetMatchKey(game)));

    const renderTabContent = () => {
        switch (activeTab){
            case TABS.PICKS: return <YourPicksTab playerPicks={playerPicks} teamPicks={teamPicks} gamePicks={gamePicks} />;
            case TABS.PLAYERS: return <PlayersTab players={availablePlayers} availableCredits={userCredits} onPlaceBet={onPlacePlayerBet} bettingOpen={canPlaceBets} />;
            case TABS.TEAMS: return <TeamsTab teams={availableTeams} availableCredits={userCredits} onPlaceBet={onPlaceTeamBet} bettingOpen={canPlaceBets}/>;
            case TABS.GAMES: return <GamesTab games={availableGames} availableCredits={userCredits} onPlaceBet={onPlaceGameBet} bettingOpen={canPlaceBets} />;
            case TABS.BRACKET: return <UserBracketTab bracket={bracketState} isLoading={isBracketLoading} />;
            case TABS.LIVE: return <LiveTab chatMessages={chatMessages} onNewMessage={onNewMessage} username={username} bracketState={bracketState} liveReplay={liveReplay} replayNowMs={replayNowMs}/>;
            default: return null;
        }
    };

    return(
        <div style={{
            paddingTop: 'var(--header-height)',
        }}>
            <div style={{
                position: 'sticky', top: 'var(--header-height)', background: 'rgba(8, 10, 15, 0.85)',
                backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', zIndex: 90, overflowX: 'auto',
            }}>
                <div style={{
                    display: 'flex', padding: '0 20px', minWidth: 'max-content',
                }}>
                    {TAB_CONFIG.map(tab => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                                display: 'flex', alignItems: 'center', gap: 7, padding: '0 16px', height: 'var(--tab-height)',
                                background: 'none', color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                                letterSpacing: '0.04em', borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                                transition: 'all 0.2s', flexShrink: 0, cursor: 'pointer',
                            }}
                            onMouseEnter={e => {if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';}}
                            onMouseLeave={e => {if (!isActive) e.currentTarget.style.color = 'var(--text-muted)';}}
                        >
                            <span style={{
                                color: isActive ? 'var(--accent)' : 'inherit',
                            }}>{tab.icon}</span>
                            {tab.label}
                            {tab.live && (
                                <div style={{
                                    width: 6, height: 6, borderRadius: '50%', background: 'var(--danger)', animation: 'live-dot 1.2s ease-in-out infinite',
                                }}/>
                            )}
                        </button>
                        );
                    })}
                </div>
            </div>
            <div style={{
                maxWidth: 1100, margin: '0 auto', padding: '28px 20px 60px',
            }}>
                {showBetSuccessBanner && (
                    <div style={{
                        marginBottom: 16,
                        background: 'rgba(16, 185, 129, 0.14)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        borderRadius: 10,
                        padding: '11px 14px',
                        fontSize: 12,
                        color: '#34D399',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                    }}>
                        Bet successfully placed
                    </div>
                )}
                <div style={{
                    marginBottom: 24,
                }}>
                    <h2 style={{
                        fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: '0.06em', color: 'var(--text-primary)',
                    }}>
                            {TAB_CONFIG.find(t => t.key === activeTab)?.label.toUpperCase()}
                    </h2>
                    {activeTab !== TABS.PICKS && activeTab !== TABS.LIVE && activeTab !== TABS.BRACKET && (
                        <p style={{
                            fontSize: 13, color: 'var(--text-secondary)', marginTop: 4,
                        }}>{canPlaceBets ? 'Select an option and place your bet.' : 'Bet placement is currently closed for this match.'}
                        </p>
                    )}
                </div>
                {renderTabContent()}
            </div>
        </div>
    );
}

function SettingsButton({ icon, label, onClick, disabled = false}){
    const [hover, setHover] = useState(false);
    return (
        <button onClick={onClick} disabled={disabled} onMouseEnter={() => !disabled && setHover(true)} onMouseLeave={() => setHover(false)} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            background: hover ? 'var(--bg-card-hover)' : 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px',
            color: 'var(--text-primary)', fontSize: 14, fontWeight: 500, 
            transition: 'all 0.2s', cursor: disabled ? 'not-allowed' : (onClick ? 'pointer' : 'default'), opacity: disabled ? 0.65 : 1,
        }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-secondary)',
            }}>
                {icon}
                <span style={{
                    color: 'var(--text-primary)',
                }}>{label}</span>
            </div>
            <ChevronRight size={16} color={disabled ? 'var(--border-bright)' : 'var(--text-muted)'}/>
        </button>
    );
}

function ProfilePage({ username, email = '', onLogout, isModerator = false, credits = 0, totalBets = 0, wins = 0, losses = 0, profit = 0, onUpdateCard, onDeposit, onChangeUsername, onChangeEmail, onChangePassword, notice = ''}){
    const formattedCredits = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(Number.isFinite(Number(credits)) ? Number(credits) : 0);
    const normalizedWins = Number.isFinite(Number(wins)) ? Number(wins) : 0;
    const normalizedLosses = Number.isFinite(Number(losses)) ? Number(losses) : 0;
    const totalSettledBets = normalizedWins + normalizedLosses;
    const winRateDisplay = totalSettledBets > 0
        ? `${((normalizedWins / totalSettledBets) * 100).toFixed(1)}%`
        : '0.0%';
    const normalizedProfit = Number.isFinite(Number(profit)) ? Number(profit) : 0;
    const profitDisplay = normalizedProfit > 0 ? `+${normalizedProfit}` : String(normalizedProfit);
    const [showCardModal, setShowCardModal] = useState(false);
    const [cardNumberInput, setCardNumberInput] = useState('');
    const [cvvInput, setCvvInput] = useState('');
    const [cardError, setCardError] = useState('');
    const [isSavingCard, setIsSavingCard] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositAmountInput, setDepositAmountInput] = useState('');
    const [depositError, setDepositError] = useState('');
    const [isDepositing, setIsDepositing] = useState(false);
    const [showUsernameModal, setShowUsernameModal] = useState(false);
    const [newUsernameInput, setNewUsernameInput] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [isChangingUsername, setIsChangingUsername] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [newEmailInput, setNewEmailInput] = useState('');
    const [emailError, setEmailError] = useState('');
    const [isChangingEmail, setIsChangingEmail] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPasswordInput, setCurrentPasswordInput] = useState('');
    const [newPasswordInput, setNewPasswordInput] = useState('');
    const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showAddCardBanner, setShowAddCardBanner] = useState(false);
    const [isCheckingCard, setIsCheckingCard] = useState(false);

    const openCardModal = () => {
        setCardError('');
        setCardNumberInput('');
        setCvvInput('');
        setShowCardModal(true);
    };

    const closeCardModal = () => {
        if (isSavingCard) {
            return;
        }
        setShowCardModal(false);
    };

    const closeDepositModal = () => {
        if (isDepositing) {
            return;
        }
        setShowDepositModal(false);
    };

    const openUsernameModal = () => {
        setUsernameError('');
        setNewUsernameInput(username || '');
        setShowUsernameModal(true);
    };

    const closeUsernameModal = () => {
        if (isChangingUsername) {
            return;
        }
        setShowUsernameModal(false);
    };

    const openEmailModal = () => {
        setEmailError('');
        setNewEmailInput(email || '');
        setShowEmailModal(true);
    };

    const closeEmailModal = () => {
        if (isChangingEmail) {
            return;
        }
        setShowEmailModal(false);
    };

    const openPasswordModal = () => {
        setPasswordError('');
        setCurrentPasswordInput('');
        setNewPasswordInput('');
        setConfirmPasswordInput('');
        setShowPasswordModal(true);
    };

    const closePasswordModal = () => {
        if (isChangingPassword) {
            return;
        }
        setShowPasswordModal(false);
    };

    const openDepositModal = async () => {
        if (!username || isCheckingCard) {
            return;
        }

        setIsCheckingCard(true);
        setDepositError('');
        setShowAddCardBanner(false);

        try {
            const response = await fetch('/api/card-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.error || 'Unable to verify card status right now.');
            }

            if (!data.hasCardOnFile) {
                setShowAddCardBanner(true);
                return;
            }

            setDepositAmountInput('');
            setShowDepositModal(true);
        } catch (error) {
            setDepositError(error?.message || 'Unable to verify card status right now.');
        } finally {
            setIsCheckingCard(false);
        }
    };

    const handleSaveCard = async () => {
        const normalizedCard = cardNumberInput.replace(/\D/g, '');
        const normalizedCvv = cvvInput.replace(/\D/g, '');

        if (!/^\d{16}$/.test(normalizedCard)) {
            setCardError('Card number must be exactly 16 digits.');
            return;
        }

        if (!/^\d{3}$/.test(normalizedCvv)) {
            setCardError('CVV must be exactly 3 digits.');
            return;
        }

        setIsSavingCard(true);
        setCardError('');

        try {
            if (!onUpdateCard) {
                throw new Error('Card update is unavailable right now.');
            }

            await onUpdateCard(normalizedCard, normalizedCvv);
            setShowCardModal(false);
        } catch (error) {
            setCardError(error?.message || 'Unable to save card right now.');
        } finally {
            setIsSavingCard(false);
        }
    };

    const handleDepositSubmit = async () => {
        const normalizedAmount = Number(depositAmountInput);

        if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
            setDepositError('Enter a valid deposit amount greater than 0.');
            return;
        }

        setIsDepositing(true);
        setDepositError('');

        try {
            if (!onDeposit) {
                throw new Error('Deposit is unavailable right now.');
            }

            await onDeposit(normalizedAmount);
            setShowDepositModal(false);
            setDepositAmountInput('');
        } catch (error) {
            const message = error?.message || 'Unable to process deposit right now.';
            if (message.toLowerCase().includes('card')) {
                setShowDepositModal(false);
                setShowAddCardBanner(true);
            }
            setDepositError(message);
        } finally {
            setIsDepositing(false);
        }
    };

    const handleUsernameSubmit = async () => {
        const normalizedNewUsername = String(newUsernameInput || '').trim();

        if (!normalizedNewUsername) {
            setUsernameError('Username is required.');
            return;
        }

        if (normalizedNewUsername === String(username || '').trim()) {
            setUsernameError('Enter a different username.');
            return;
        }

        setIsChangingUsername(true);
        setUsernameError('');

        try {
            if (!onChangeUsername) {
                throw new Error('Username update is unavailable right now.');
            }

            await onChangeUsername(normalizedNewUsername);
            setShowUsernameModal(false);
        } catch (error) {
            setUsernameError(error?.message || 'Unable to update username right now.');
        } finally {
            setIsChangingUsername(false);
        }
    };

    const handleEmailSubmit = async () => {
        const normalizedNewEmail = String(newEmailInput || '').trim();
        const normalizedCurrentEmail = String(email || '').trim();

        if (!normalizedNewEmail) {
            setEmailError('Email is required.');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedNewEmail)) {
            setEmailError('Use format name@domain.domain.');
            return;
        }

        if (normalizedNewEmail.toLowerCase() === normalizedCurrentEmail.toLowerCase()) {
            setEmailError('Enter a different email address.');
            return;
        }

        setIsChangingEmail(true);
        setEmailError('');

        try {
            if (!onChangeEmail) {
                throw new Error('Email update is unavailable right now.');
            }

            await onChangeEmail(normalizedNewEmail);
            setShowEmailModal(false);
        } catch (error) {
            setEmailError(error?.message || 'Unable to update email right now.');
        } finally {
            setIsChangingEmail(false);
        }
    };

    const handlePasswordSubmit = async () => {
        const normalizedCurrentPassword = String(currentPasswordInput || '').trim();
        const normalizedNewPassword = String(newPasswordInput || '').trim();
        const normalizedConfirmPassword = String(confirmPasswordInput || '').trim();

        if (!normalizedCurrentPassword || !normalizedNewPassword || !normalizedConfirmPassword) {
            setPasswordError('All password fields are required.');
            return;
        }

        if (normalizedCurrentPassword === normalizedNewPassword) {
            setPasswordError('New password must be different from current password.');
            return;
        }

        if (normalizedNewPassword !== normalizedConfirmPassword) {
            setPasswordError('New password and confirmation do not match.');
            return;
        }

        setIsChangingPassword(true);
        setPasswordError('');

        try {
            if (!onChangePassword) {
                throw new Error('Password update is unavailable right now.');
            }

            await onChangePassword(normalizedCurrentPassword, normalizedNewPassword);
            setShowPasswordModal(false);
        } catch (error) {
            setPasswordError(error?.message || 'Unable to update password right now.');
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div style={{
            paddingTop: 'var(--header-height)',
        }}>
            <div style={{
                maxWidth: 520, margin: '0 auto', padding: '40px 20px 80px', animation: 'fadeIn 0.4s ease',
            }}>
                <div style={{
                    textAlign: 'center', marginBottom: 40,
                }}>
                    <div style={{
                        width: 100, height: 100, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                        fontFamily: 'var(--font-display)', fontSize: 42, color: '#080A0F', 
                        boxShadow: '0 0 40px var(--accent-glow)',
                    }}>
                        {username ? username[0].toUpperCase() : 'U'}
                    </div>
                    <h2 style={{
                        fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: '0.06em', marginBottom: 6,
                    }}> {username || 'USERNAME'}</h2>
                    <p style={{
                        fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4,
                    }}>{email || 'No email on file'}</p>
                    {isModerator ? (
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(198, 241, 53, 0.08)',
                        border: '1px solid rgba(198, 241, 53, 0.25)', borderRadius: 10, padding: '8px 18px', marginTop: 16,
                    }}>
                        <Shield size={14} color="var(--accent)" />
                        <span style={{
                            fontSize: 13, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'var(--font-mono)',
                        }}>
                            MODERATOR ACCOUNT
                        </span>
                        </div>
                    ) : (
                        <div style={{
                            marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                        }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(198, 241, 53, 0.08)',
                                border: '1px solid rgba(198, 241, 53, 0.2)', borderRadius: 10, padding: '8px 18px',
                            }}>
                                <span style={{
                                    fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600,
                                }}>CREDITS</span>
                                <span style={{
                                    fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--accent)', fontWeight: 500,
                                }}>{formattedCredits}</span>
                            </div>
                            <button style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                background: 'var(--accent)', color: '#080A0F', border: 'none', borderRadius: 10, padding: '9px 16px',
                                fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.2s',
                            }}
                            onClick={openDepositModal}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'var(--accent-dim)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'var(--accent)';
                            }}
                            >
                                {isCheckingCard ? 'CHECKING...' : 'DEPOSIT'}
                            </button>
                            {showAddCardBanner && (
                                <div style={{
                                    background: 'rgba(255, 71, 87, 0.12)', border: '1px solid rgba(255, 71, 87, 0.4)', borderRadius: 8,
                                    padding: '8px 12px', fontSize: 11, color: 'var(--danger)', fontWeight: 700, letterSpacing: '0.04em',
                                }}>
                                    ADD A CARD ON FILE BEFORE MAKING A DEPOSIT.
                                </div>
                            )}
                            {depositError && !showDepositModal && (
                                <div style={{
                                    background: 'rgba(255, 71, 87, 0.12)', border: '1px solid rgba(255, 71, 87, 0.4)', borderRadius: 8,
                                    padding: '8px 12px', fontSize: 11, color: 'var(--danger)',
                                }}>
                                    {depositError}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {!isModerator && (
                <div style={{
                    display: 'flex', gap: 10, marginBottom: 32,
                }}>
                    {[
                        { label: 'Total Bets', value: String(Number.isFinite(Number(totalBets)) ? Number(totalBets) : 0)},
                        { label: 'Win Rate', value: winRateDisplay},
                        { label: 'Profit', value: profitDisplay},
                    ].map((s, i) => (
                        <div key={i} style={{
                            flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)',
                            borderRadius: 12, padding: '14px 10px', textAlign: 'center',
                        }}>
                            <div style={{
                                fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--text-primary)', fontWeight: 500,
                            }}>{s.value}</div>
                            <div style={{
                                fontSize: 10, color: 'var(--text-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
                            }}>{s.label}</div>
                        </div>
                    ))}
                </div>
                )}

                <div style={{
                    marginBottom: 12,
                }}>
                    <h3 style={{
                        fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', 
                        letterSpacing: '0.12em', fontWeight: 600, marginBottom: 12,
                    }}>ACCOUNT SETTINGS</h3>
                    {notice && (
                        <div style={{
                            marginBottom: 10, background: 'rgba(198, 241, 53, 0.08)', border: '1px solid rgba(198, 241, 53, 0.2)',
                            borderRadius: 8, padding: '10px 12px', fontSize: 12, color: 'var(--accent)',
                        }}>{notice}</div>
                    )}
                    <div style={{
                        display: 'flex', flexDirection: 'column', gap: 8,
                    }}>
                        <SettingsButton icon={<User size={16} />} label="Change Username" onClick={openUsernameModal} disabled={isModerator} />
                        <SettingsButton icon={<Mail size={16} />} label="Change Email" onClick={openEmailModal} disabled={isModerator} />
                        <SettingsButton icon={<Lock size={16} />} label="Change Password" onClick={openPasswordModal} disabled={isModerator} />
                        {!isModerator && (
                        <SettingsButton icon={<CreditCard size={16} />} label="Edit Card on File" onClick={openCardModal} />
                        )}
                    </div>
                </div>
                <div style={{
                    marginTop: 28,
                }}>
                    <button onClick={onLogout} style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                        background: 'rgba(255, 71, 87, 0.08)', border: '1px solid rgba(255, 71, 87, 0.25)',
                        borderRadius: 12, padding: '14px', color: 'var(--danger)', fontSize: 14, fontWeight: 600, 
                        letterSpacing: '0.06em', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255, 71, 87, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(255, 71, 87, 0.45)';
                    }}
                    onMouseLeave={ e=> {
                        e.currentTarget.style.background = 'rgba(255, 71, 87, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(255, 71, 87, 0.25)';
                    }}>
                        <LogOut size={16} />
                        LOG OUT
                    </button>
                </div>
            </div>

            {showCardModal && (
                <div onClick={closeCardModal} style={{
                    position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        width: '100%', maxWidth: 430, background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 16,
                        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)', padding: '24px 20px',
                    }}>
                        <h3 style={{
                            margin: 0, marginBottom: 6, fontFamily: 'var(--font-display)', letterSpacing: '0.06em', fontSize: 20,
                        }}>UPDATE CARD</h3>
                        <p style={{
                            margin: 0, marginBottom: 18, fontSize: 12, color: 'var(--text-secondary)',
                        }}>Enter a 16-digit card number and 3-digit CVV.</p>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{
                                display: 'block', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 6,
                            }}>CARD NUMBER</label>
                            <input
                                type="text"
                                value={cardNumberInput}
                                onChange={e => setCardNumberInput(e.target.value.replace(/\D/g, '').slice(0, 16))}
                                placeholder="1234123412341234"
                                style={{
                                    width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                                    border: '1px solid var(--border)', borderRadius: 10, padding: '11px 12px', fontSize: 14,
                                    outline: 'none', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{
                                display: 'block', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 6,
                            }}>CVV</label>
                            <input
                                type="password"
                                value={cvvInput}
                                onChange={e => setCvvInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
                                placeholder="123"
                                style={{
                                    width: 120, boxSizing: 'border-box', background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                                    border: '1px solid var(--border)', borderRadius: 10, padding: '11px 12px', fontSize: 14,
                                    outline: 'none', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
                                }}
                            />
                        </div>

                        {cardError && (
                            <div style={{
                                marginBottom: 14, color: 'var(--danger)', fontSize: 12,
                            }}>{cardError}</div>
                        )}

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={closeCardModal} disabled={isSavingCard} style={{
                                flex: 1, padding: '12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                                color: 'var(--text-secondary)', fontWeight: 600, cursor: isSavingCard ? 'not-allowed' : 'pointer', opacity: isSavingCard ? 0.6 : 1,
                            }}>CANCEL</button>
                            <button onClick={handleSaveCard} disabled={isSavingCard} style={{
                                flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: 'var(--accent)',
                                color: '#080A0F', fontWeight: 700, cursor: isSavingCard ? 'not-allowed' : 'pointer', opacity: isSavingCard ? 0.7 : 1,
                            }}>{isSavingCard ? 'SAVING...' : 'SAVE CARD'}</button>
                        </div>
                    </div>
                </div>
            )}

            {showDepositModal && (
                <div onClick={closeDepositModal} style={{
                    position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        width: '100%', maxWidth: 430, background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 16,
                        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)', padding: '24px 20px',
                    }}>
                        <h3 style={{
                            margin: 0, marginBottom: 6, fontFamily: 'var(--font-display)', letterSpacing: '0.06em', fontSize: 20,
                        }}>DEPOSIT FUNDS</h3>
                        <p style={{
                            margin: 0, marginBottom: 18, fontSize: 12, color: 'var(--text-secondary)',
                        }}>Enter an amount to add to your account balance.</p>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{
                                display: 'block', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 6,
                            }}>DEPOSIT AMOUNT (USD)</label>
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={depositAmountInput}
                                onChange={e => setDepositAmountInput(e.target.value)}
                                placeholder="50.00"
                                style={{
                                    width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                                    border: '1px solid var(--border)', borderRadius: 10, padding: '11px 12px', fontSize: 14,
                                    outline: 'none', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
                                }}
                            />
                        </div>

                        {depositError && (
                            <div style={{
                                marginBottom: 14, color: 'var(--danger)', fontSize: 12,
                            }}>{depositError}</div>
                        )}

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={closeDepositModal} disabled={isDepositing} style={{
                                flex: 1, padding: '12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                                color: 'var(--text-secondary)', fontWeight: 600, cursor: isDepositing ? 'not-allowed' : 'pointer', opacity: isDepositing ? 0.6 : 1,
                            }}>CANCEL</button>
                            <button onClick={handleDepositSubmit} disabled={isDepositing} style={{
                                flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: 'var(--accent)',
                                color: '#080A0F', fontWeight: 700, cursor: isDepositing ? 'not-allowed' : 'pointer', opacity: isDepositing ? 0.7 : 1,
                            }}>{isDepositing ? 'DEPOSITING...' : 'DEPOSIT'}</button>
                        </div>
                    </div>
                </div>
            )}

            {showUsernameModal && (
                <div onClick={closeUsernameModal} style={{
                    position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        width: '100%', maxWidth: 430, background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 16,
                        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)', padding: '24px 20px',
                    }}>
                        <h3 style={{
                            margin: 0, marginBottom: 6, fontFamily: 'var(--font-display)', letterSpacing: '0.06em', fontSize: 20,
                        }}>CHANGE USERNAME</h3>
                        <p style={{
                            margin: 0, marginBottom: 18, fontSize: 12, color: 'var(--text-secondary)',
                        }}>Choose a new username for your account.</p>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{
                                display: 'block', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 6,
                            }}>NEW USERNAME</label>
                            <input
                                type="text"
                                value={newUsernameInput}
                                onChange={e => setNewUsernameInput(e.target.value)}
                                placeholder="Enter a new username"
                                style={{
                                    width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                                    border: '1px solid var(--border)', borderRadius: 10, padding: '11px 12px', fontSize: 14,
                                    outline: 'none', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
                                }}
                            />
                        </div>

                        {usernameError && (
                            <div style={{
                                marginBottom: 14, color: 'var(--danger)', fontSize: 12,
                            }}>{usernameError}</div>
                        )}

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={closeUsernameModal} disabled={isChangingUsername} style={{
                                flex: 1, padding: '12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                                color: 'var(--text-secondary)', fontWeight: 600, cursor: isChangingUsername ? 'not-allowed' : 'pointer', opacity: isChangingUsername ? 0.6 : 1,
                            }}>CANCEL</button>
                            <button onClick={handleUsernameSubmit} disabled={isChangingUsername} style={{
                                flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: 'var(--accent)',
                                color: '#080A0F', fontWeight: 700, cursor: isChangingUsername ? 'not-allowed' : 'pointer', opacity: isChangingUsername ? 0.7 : 1,
                            }}>{isChangingUsername ? 'SAVING...' : 'SAVE USERNAME'}</button>
                        </div>
                    </div>
                </div>
            )}

            {showEmailModal && (
                <div onClick={closeEmailModal} style={{
                    position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        width: '100%', maxWidth: 430, background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 16,
                        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)', padding: '24px 20px',
                    }}>
                        <h3 style={{
                            margin: 0, marginBottom: 6, fontFamily: 'var(--font-display)', letterSpacing: '0.06em', fontSize: 20,
                        }}>CHANGE EMAIL</h3>
                        <p style={{
                            margin: 0, marginBottom: 18, fontSize: 12, color: 'var(--text-secondary)',
                        }}>Choose a new email address for your account.</p>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{
                                display: 'block', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 6,
                            }}>NEW EMAIL</label>
                            <input
                                type="email"
                                value={newEmailInput}
                                onChange={e => setNewEmailInput(e.target.value)}
                                placeholder="name@domain.com"
                                style={{
                                    width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                                    border: '1px solid var(--border)', borderRadius: 10, padding: '11px 12px', fontSize: 14,
                                    outline: 'none', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em',
                                }}
                            />
                        </div>

                        {emailError && (
                            <div style={{
                                marginBottom: 14, color: 'var(--danger)', fontSize: 12,
                            }}>{emailError}</div>
                        )}

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={closeEmailModal} disabled={isChangingEmail} style={{
                                flex: 1, padding: '12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                                color: 'var(--text-secondary)', fontWeight: 600, cursor: isChangingEmail ? 'not-allowed' : 'pointer', opacity: isChangingEmail ? 0.6 : 1,
                            }}>CANCEL</button>
                            <button onClick={handleEmailSubmit} disabled={isChangingEmail} style={{
                                flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: 'var(--accent)',
                                color: '#080A0F', fontWeight: 700, cursor: isChangingEmail ? 'not-allowed' : 'pointer', opacity: isChangingEmail ? 0.7 : 1,
                            }}>{isChangingEmail ? 'SAVING...' : 'SAVE EMAIL'}</button>
                        </div>
                    </div>
                </div>
            )}

            {showPasswordModal && (
                <div onClick={closePasswordModal} style={{
                    position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
                }}>
                    <div onClick={e => e.stopPropagation()} style={{
                        width: '100%', maxWidth: 430, background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 16,
                        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)', padding: '24px 20px',
                    }}>
                        <h3 style={{
                            margin: 0, marginBottom: 6, fontFamily: 'var(--font-display)', letterSpacing: '0.06em', fontSize: 20,
                        }}>CHANGE PASSWORD</h3>
                        <p style={{
                            margin: 0, marginBottom: 18, fontSize: 12, color: 'var(--text-secondary)',
                        }}>Enter your current password and set a new password.</p>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{
                                display: 'block', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 6,
                            }}>CURRENT PASSWORD</label>
                            <input
                                type="password"
                                value={currentPasswordInput}
                                onChange={e => setCurrentPasswordInput(e.target.value)}
                                placeholder="Current password"
                                style={{
                                    width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                                    border: '1px solid var(--border)', borderRadius: 10, padding: '11px 12px', fontSize: 14,
                                    outline: 'none', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em',
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{
                                display: 'block', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 6,
                            }}>NEW PASSWORD</label>
                            <input
                                type="password"
                                value={newPasswordInput}
                                onChange={e => setNewPasswordInput(e.target.value)}
                                placeholder="Enter new password"
                                style={{
                                    width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                                    border: '1px solid var(--border)', borderRadius: 10, padding: '11px 12px', fontSize: 14,
                                    outline: 'none', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em',
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: 12 }}>
                            <label style={{
                                display: 'block', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: 6,
                            }}>CONFIRM NEW PASSWORD</label>
                            <input
                                type="password"
                                value={confirmPasswordInput}
                                onChange={e => setConfirmPasswordInput(e.target.value)}
                                placeholder="Re-enter new password"
                                style={{
                                    width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                                    border: '1px solid var(--border)', borderRadius: 10, padding: '11px 12px', fontSize: 14,
                                    outline: 'none', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em',
                                }}
                            />
                        </div>

                        {passwordError && (
                            <div style={{
                                marginBottom: 14, color: 'var(--danger)', fontSize: 12,
                            }}>{passwordError}</div>
                        )}

                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={closePasswordModal} disabled={isChangingPassword} style={{
                                flex: 1, padding: '12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-secondary)',
                                color: 'var(--text-secondary)', fontWeight: 600, cursor: isChangingPassword ? 'not-allowed' : 'pointer', opacity: isChangingPassword ? 0.6 : 1,
                            }}>CANCEL</button>
                            <button onClick={handlePasswordSubmit} disabled={isChangingPassword} style={{
                                flex: 1, padding: '12px', borderRadius: 10, border: 'none', background: 'var(--accent)',
                                color: '#080A0F', fontWeight: 700, cursor: isChangingPassword ? 'not-allowed' : 'pointer', opacity: isChangingPassword ? 0.7 : 1,
                            }}>{isChangingPassword ? 'SAVING...' : 'SAVE PASSWORD'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// root app (last part <3)
export default function App(){
    const [screen, setScreen] = useState(SCREENS.LANDING);
    const [username, setUsername] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userCredits, setUserCredits] = useState(0);
    const [userTotalBets, setUserTotalBets] = useState(0);
    const [userWins, setUserWins] = useState(0);
    const [userLosses, setUserLosses] = useState(0);
    const [userProfit, setUserProfit] = useState(0);
    const [userRole, setUserRole] = useState('user');
    const [hasCardOnFile, setHasCardOnFile] = useState(false);
    const [activeTab, setActiveTab] = useState(TABS.PICKS);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [signupError, setSignupError] = useState('');
    const [profileNotice, setProfileNotice] = useState('');
    const profileNoticeTimeoutRef = useRef(null);
    const [players, setPlayers] = useState([]);
    const [playerPicks, setPlayerPicks] = useState([]);
    const [teams, setTeams] = useState([]);
    const [teamPicks, setTeamPicks] = useState([]);
    const [games, setGames] = useState([]);
    const [gamePicks, setGamePicks] = useState([]);
    const [proposals, setProposals] = useState([]);
    const [bettingPhase, setBettingPhase] = useState(BETTING_PHASES.PROPOSALS_OPEN);
    const [chatMessages, setChatMessages] = useState(SEED_MESSAGES);
    const [moderatorChatMessages, setModeratorChatMessages] = useState(INITIAL_CHAT_MESSAGES);
    const [bannedUsernames, setBannedUsernames] = useState([]);
    const [showBetSuccessBanner, setShowBetSuccessBanner] = useState(false);
    const betSuccessBannerTimeoutRef = useRef(null);
    const previousActiveTabRef = useRef(activeTab);
    const isModerator = userRole === 'moderator';
    const [isLoadingProposals, setIsLoadingProposals] = useState(false);

    // helper for loadPendingProposals
    const loadPendingProposals = useCallback(async ({ silent = false } = {}) => {
        if (!silent) {
            setIsLoadingProposals(true);
        }
        try{
            const response = await fetch('/api/pending-bets');
            const data = await response.json().catch(()=> ({}));
            if (!response.ok){
                console.error('Failed to load pending proposals:', data.error);
                return;
            }

            if (Array.isArray(data.proposals)){
                setProposals(data.proposals);
            }
        } catch (error){
            console.error('Pending proposals fetch error:', error);
        } finally {
            if (!silent) {
                setIsLoadingProposals(false);
            }
        }
    }, []);

    const loadActiveBets = useCallback(async () => {
        const [playerRes, teamRes, gameRes] = await Promise.all([
            fetch('/api/player-bets', { method: 'GET' }),
            fetch('/api/team-bets', { method: 'GET' }),
            fetch('/api/game-bets', { method: 'GET' }),
        ]);

        const [playerData, teamData, gameData] = await Promise.all([
            playerRes.json().catch(() => ({})),
            teamRes.json().catch(() => ({})),
            gameRes.json().catch(() => ({})),
        ]);

        if (!playerRes.ok || !teamRes.ok || !gameRes.ok) {
            throw new Error(
                playerData.error || teamData.error || gameData.error || 'Unable to load active bets right now.',
            );
        }

        setPlayers(Array.isArray(playerData.players) ? playerData.players.map(mapPlayerBetToPlayerCard) : []);
        setTeams(Array.isArray(teamData.teams) ? teamData.teams.map(mapTeamBetToTeamCard) : []);
        setGames(Array.isArray(gameData.games) ? gameData.games.map(mapGameBetToGameRow) : []);
    }, []);

    // Betting feature: shared success-banner trigger for Player/Team bet placement.
    const triggerBetSuccessBanner = useCallback(() => {
        setShowBetSuccessBanner(true);

        if (betSuccessBannerTimeoutRef.current) {
            clearTimeout(betSuccessBannerTimeoutRef.current);
        }

        betSuccessBannerTimeoutRef.current = setTimeout(() => {
            setShowBetSuccessBanner(false);
            betSuccessBannerTimeoutRef.current = null;
        }, 2500);
    }, []);
    
    const handleLogin = useCallback(async (loginData) => {
        const payload = typeof loginData === 'string'
            ? { username: loginData, password: '' }
            : loginData;

        setLoginError('');

        const isValidModerator = MODERATOR_CREDENTIALS.some(credentials => (
            payload.username === credentials.username && payload.password === credentials.password
        ));

        if (isValidModerator) {
            setUsername(payload.username);
            setUserEmail('');
            setUserCredits(0);
            setUserTotalBets(0);
            setUserWins(0);
            setUserLosses(0);
            setUserProfit(0);
            setPlayerPicks([]);
            setTeamPicks([]);
            setGamePicks([]);
            setUserRole('moderator');
            setHasCardOnFile(false);
            setScreen(SCREENS.DASHBOARD);
            return;
        }

        setIsLoggingIn(true);

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setLoginError('The username or password is incorrect');
                    return;
                }

                const data = await response.json().catch(() => ({}));
                setLoginError(data.error || 'Unable to sign in right now');
                return;
            }

            const data = await response.json().catch(() => ({}));

            setUsername(data.username || payload.username || 'Player');
            setUserEmail(String(data.email || '').trim());
            setUserCredits(Number.isFinite(Number(data.credits)) ? Number(data.credits) : 0);
            setUserTotalBets(Number.isFinite(Number(data.total_bets)) ? Number(data.total_bets) : 0);
            setUserWins(Number.isFinite(Number(data.wins)) ? Number(data.wins) : 0);
            setUserLosses(Number.isFinite(Number(data.losses)) ? Number(data.losses) : 0);
            setUserProfit(Number.isFinite(Number(data.profit)) ? Number(data.profit) : 0);
            setPlayerPicks(Array.isArray(data.player_picks) ? data.player_picks.map(mapPlayerBetToPlayerCard) : []);
            setTeamPicks(Array.isArray(data.team_picks) ? data.team_picks.map(mapTeamBetToTeamCard) : []);
            setGamePicks(Array.isArray(data.game_picks) ? data.game_picks.map(mapGameBetToGameRow) : []);
            setUserRole('user');
            setHasCardOnFile(Boolean(data.hasCardOnFile));
            setScreen(SCREENS.DASHBOARD);
        } catch (error) {
            setLoginError('Unable to sign in right now');
        } finally {
            setIsLoggingIn(false);
        }
    }, []);

    const handleSignUp = useCallback(async (signupData) => {
        const payload = typeof signupData === 'string'
            ? { username: signupData } : signupData;

        setSignupError('');
        setIsSigningUp(true);

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                setSignupError(data.error || 'Invalid account information.');
                return;
            }

            setUsername(payload.username || 'Player');
            setUserEmail(String(payload.email || '').trim());
            setUserCredits(Number.isFinite(Number(payload.credits)) ? Number(payload.credits) : 0);
            setUserTotalBets(0);
            setUserWins(0);
            setUserLosses(0);
            setUserProfit(0);
            setPlayerPicks([]);
            setTeamPicks([]);
            setGamePicks([]);
            setUserRole('user');
            setHasCardOnFile(false);
            setScreen(SCREENS.DASHBOARD);
        } catch (error) {
            setSignupError('Invalid account information.');
        } finally {
            setIsSigningUp(false);
        }
    }, []);

    const handleLogout = useCallback(() => {
        if (profileNoticeTimeoutRef.current) {
            clearTimeout(profileNoticeTimeoutRef.current);
            profileNoticeTimeoutRef.current = null;
        }

        setUsername('');
        setUserEmail('');
        setUserCredits(0);
        setUserTotalBets(0);
        setUserWins(0);
        setUserLosses(0);
        setUserProfit(0);
        setPlayerPicks([]);
        setTeamPicks([]);
        setGamePicks([]);
        setProfileNotice('');
        setShowBetSuccessBanner(false);
        setBettingPhase(BETTING_PHASES.PROPOSALS_OPEN);
        setUserRole('user');
        setHasCardOnFile(false);
        setScreen(SCREENS.LANDING);
    }, []);

    const handleUpdateCard = useCallback(async (cardNumber, cvv) => {
        if (!username) {
            throw new Error('You must be logged in to update a card.');
        }

        const response = await fetch('/api/update-card', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, cardNumber, cvv }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || 'Unable to update card right now.');
        }

        if (profileNoticeTimeoutRef.current) {
            clearTimeout(profileNoticeTimeoutRef.current);
            profileNoticeTimeoutRef.current = null;
        }

        setHasCardOnFile(true);
        setProfileNotice(data.message || 'Card updated successfully.');
    }, [username]);

    const handleDeposit = useCallback(async (amount) => {
        if (!username) {
            throw new Error('You must be logged in to make a deposit.');
        }

        const response = await fetch('/api/deposit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, amount }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || 'Unable to process deposit right now.');
        }

        if (profileNoticeTimeoutRef.current) {
            clearTimeout(profileNoticeTimeoutRef.current);
        }

        setUserCredits(Number.isFinite(Number(data.credits)) ? Number(data.credits) : 0);
        setProfileNotice(data.message || 'Deposit successful.');
        profileNoticeTimeoutRef.current = setTimeout(() => {
            setProfileNotice('');
            profileNoticeTimeoutRef.current = null;
        }, 3000);
    }, [username]);

    const handleChangeUsername = useCallback(async (newUsername) => {
        const normalizedNewUsername = String(newUsername || '').trim();

        if (!username) {
            throw new Error('You must be logged in to change your username.');
        }

        if (!normalizedNewUsername) {
            throw new Error('Username is required.');
        }

        const response = await fetch('/api/update-username', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentUsername: username, newUsername: normalizedNewUsername }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || 'Unable to update username right now.');
        }

        if (profileNoticeTimeoutRef.current) {
            clearTimeout(profileNoticeTimeoutRef.current);
            profileNoticeTimeoutRef.current = null;
        }

        const updatedUsername = String(data.username || normalizedNewUsername).trim();
        setUsername(updatedUsername);
        setProfileNotice(data.message || 'Username updated successfully.');
        profileNoticeTimeoutRef.current = setTimeout(() => {
            setProfileNotice('');
            profileNoticeTimeoutRef.current = null;
        }, 3000);
    }, [username]);

    const handleChangeEmail = useCallback(async (newEmail) => {
        const normalizedNewEmail = String(newEmail || '').trim();

        if (!username) {
            throw new Error('You must be logged in to change your email.');
        }

        if (!normalizedNewEmail) {
            throw new Error('Email is required.');
        }

        const response = await fetch('/api/update-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, newEmail: normalizedNewEmail }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || 'Unable to update email right now.');
        }

        if (profileNoticeTimeoutRef.current) {
            clearTimeout(profileNoticeTimeoutRef.current);
            profileNoticeTimeoutRef.current = null;
        }

        setUserEmail(String(data.email || normalizedNewEmail).trim());
        setProfileNotice(data.message || 'Email updated successfully.');
        profileNoticeTimeoutRef.current = setTimeout(() => {
            setProfileNotice('');
            profileNoticeTimeoutRef.current = null;
        }, 3000);
    }, [username]);

    const handleChangePassword = useCallback(async (currentPassword, newPassword) => {
        const normalizedCurrentPassword = String(currentPassword || '').trim();
        const normalizedNewPassword = String(newPassword || '').trim();

        if (!username) {
            throw new Error('You must be logged in to change your password.');
        }

        if (!normalizedCurrentPassword || !normalizedNewPassword) {
            throw new Error('Current and new password are required.');
        }

        const response = await fetch('/api/update-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, currentPassword: normalizedCurrentPassword, newPassword: normalizedNewPassword }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || 'Unable to update password right now.');
        }

        if (profileNoticeTimeoutRef.current) {
            clearTimeout(profileNoticeTimeoutRef.current);
            profileNoticeTimeoutRef.current = null;
        }

        setProfileNotice(data.message || 'Password updated successfully.');
        profileNoticeTimeoutRef.current = setTimeout(() => {
            setProfileNotice('');
            profileNoticeTimeoutRef.current = null;
        }, 3000);
    }, [username]);

    // Betting feature: place Player bet, persist to DB, sync credits + picks locally.
    const handlePlacePlayerBet = useCallback(async (amount, pickData = {}) => {
        const normalizedAmount = Number(amount);

        if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
            throw new Error('Enter a valid credit amount greater than 0.');
        }

        if (!username) {
            throw new Error('You must be logged in to place a bet.');
        }

        const response = await fetch('/api/place-player-bet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, amount: normalizedAmount, pick: pickData }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || 'Unable to place bet right now.');
        }

        setUserCredits(Number.isFinite(Number(data.credits)) ? Number(data.credits) : 0);
        if (Number.isFinite(Number(data.total_bets))) {
            setUserTotalBets(Number(data.total_bets));
        } else {
            setUserTotalBets(prev => prev + 1);
        }
        if (data.placedPick && typeof data.placedPick === 'object') {
            setPlayerPicks(prev => [...prev, mapPlayerBetToPlayerCard(data.placedPick, prev.length)]);
        }

        triggerBetSuccessBanner();
    }, [triggerBetSuccessBanner, username]);

    // Betting feature: place Team bet, persist to DB, sync credits + picks locally.
    const handlePlaceTeamBet = useCallback(async (amount, pickData = {}) => {
        const normalizedAmount = Number(amount);

        if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
            throw new Error('Enter a valid credit amount greater than 0.');
        }

        if (!username) {
            throw new Error('You must be logged in to place a bet.');
        }

        const response = await fetch('/api/place-team-bet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, amount: normalizedAmount, pick: pickData }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || 'Unable to place bet right now.');
        }

        setUserCredits(Number.isFinite(Number(data.credits)) ? Number(data.credits) : 0);
        if (Number.isFinite(Number(data.total_bets))) {
            setUserTotalBets(Number(data.total_bets));
        } else {
            setUserTotalBets(prev => prev + 1);
        }
        if (data.placedPick && typeof data.placedPick === 'object') {
            setTeamPicks(prev => [...prev, mapTeamBetToTeamCard(data.placedPick, prev.length)]);
        }

        triggerBetSuccessBanner();
    }, [triggerBetSuccessBanner, username]);

    // Betting feature: place Game bet, persist to DB, sync credits + picks locally.
    const handlePlaceGameBet = useCallback(async (amount, pickData = {}) => {
        const normalizedAmount = Number(amount);

        if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
            throw new Error('Enter a valid credit amount greater than 0.');
        }

        if (!username) {
            throw new Error('You must be logged in to place a bet.');
        }

        const response = await fetch('/api/place-game-bet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, amount: normalizedAmount, pick: pickData }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || 'Unable to place bet right now.');
        }

        setUserCredits(Number.isFinite(Number(data.credits)) ? Number(data.credits) : 0);
        if (Number.isFinite(Number(data.total_bets))) {
            setUserTotalBets(Number(data.total_bets));
        } else {
            setUserTotalBets(prev => prev + 1);
        }
        if (data.placedPick && typeof data.placedPick === 'object') {
            setGamePicks(prev => [...prev, mapGameBetToGameRow(data.placedPick, prev.length)]);
        }

        triggerBetSuccessBanner();
    }, [triggerBetSuccessBanner, username]);

    const handleLogoClick = useCallback(() => {
        setScreen(SCREENS.DASHBOARD);
        setActiveTab(TABS.PICKS);
    }, []);

    const handleAvatarClick = useCallback(() => {
        setScreen(SCREENS.PROFILE);
    }, []);

    const handleAddProposal = useCallback(async (proposal) => {
         if (bettingPhase !== BETTING_PHASES.PROPOSALS_OPEN) {
          throw new Error('Proposals are closed right now. Wait for replay settlement before proposing a new bet.');
         }

       try{
        const response = await fetch('/api/propose-bet', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({...proposal, username}),
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok){
            throw new Error(data.error || 'Failed to submit proposal.');
        }
        setProposals(prev => [
        ...prev,
        {
            ...proposal, 
            id: data.proposalId,
            proposedAt: new Date().toISOString(),
            status: 'pending',
        },
       ]);
       } catch (error){
        throw error;
       }
     }, [bettingPhase, username]);

    const handleApproveProposal = useCallback(async (id) => {
        setProposals(prev => prev.filter(p => p.id !== id));

        try{
            const response = await fetch('/api/approve-bet',{
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({proposalId: id}),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok){
                console.error('Approval failed:', data.error);
                loadPendingProposals();
                return;
            }

            if (isModerator) {
                try {
                    await loadActiveBets();
                } catch (error) {
                    console.error('Failed to refresh active bets after approval:', error);
                }
                return;
            }

            if (activeTab === TABS.PLAYERS){
                setActiveTab(null);
                setTimeout(() => setActiveTab(TABS.PLAYERS), 0);
            } else if (activeTab === TABS.TEAMS){
                setActiveTab(null);
                setTimeout(() => setActiveTab(TABS.TEAMS), 0);
            } else if (activeTab === TABS.GAMES){
                setActiveTab(null);
                setTimeout(() => setActiveTab(TABS.GAMES), 0);
            }
        } catch (error){
            console.error('Approval network error:', error);
            loadPendingProposals();
        }
    }, [activeTab, isModerator, loadActiveBets, loadPendingProposals]);

    const handleDeclineProposal = useCallback(async (id) => {
        setProposals(prev => prev.filter(p => p.id !== id));
        try{
            const response = await fetch('/api/decline-bet', {
                method: 'POST',
                headers: {'Content-Type': 'application/JSON'},
                body: JSON.stringify({proposalId: id}),
            });

            if (!response.ok){
                const data = await response.json().catch(() => ({}));
                console.error('Decline failed:', data.error);
                loadPendingProposals();
            }
        } catch (error){
            console.error('Decline network error:', error);
            loadPendingProposals();
        }
    }, [loadPendingProposals]);

    const handleCancelStake = useCallback(async (type, id) => {
        if (type === 'player') setPlayers(prev => prev.filter(p => p.id !== id));
        if (type === 'team') setTeams(prev => prev.filter(t => t.id !== id));
        if (type === 'game') setGames(prev => prev.filter(g => g.id !== id));

        try{
            const response = await fetch('/api/cancel-bet', {
                method: 'POST',
                headers: {'Content-Type': 'application/JSON'},
                body: JSON.stringify({type, betId: id, canceledBy: username}),
            });

            if (!response.ok){
                const data = await response.json().catch(() => ({}));
                console.error('Cancel stake failed:', data.error);
            }
        } catch (error){
            console.error('Cancel stake network error:', error);
        }
    }, [username]);

    const handleNewMessage = useCallback((msg) =>{
        if (!msg || typeof msg !== 'object') {
            return;
        }

        const user = String(msg.user || '').trim();
        const text = String(msg.text || '').trim();
        const isBannedUser = bannedUsernames.includes(user);
        if (!user || !text || isBannedUser) {
            return;
        }

        const normalizedMessage = {
            id: msg.id || Date.now() + Math.random(),
            user,
            initials: String(msg.initials || user.slice(0, 2)).slice(0, 2).toUpperCase(),
            color: msg.color || CHAT_COLOR_BY_USER[user] || CHAT_COLORS[0],
            text,
        };

        setChatMessages(prev => {
            const next = [...prev, normalizedMessage];
            return next.length > 100 ? next.slice(next.length - 100) : next;
        });

        setModeratorChatMessages(prev => upsertLatestChatByUser(prev, normalizedMessage));
    }, [bannedUsernames]);

    const handleDeleteMessage = useCallback((id) =>{
        setModeratorChatMessages(prev => prev.map(msg => (
            msg.id === id ? { ...msg, text: '[message removed by moderator]' } : msg
        )));
    }, []);

    const handleBanUser = useCallback(async (bannedUsername) => {
        const normalizedUsername = String(bannedUsername || '').trim();
        if (!normalizedUsername) {
            return;
        }

        const previousChatMessages = chatMessages;
        const previousModeratorMessages = moderatorChatMessages;
        const previousBannedUsernames = bannedUsernames;

        setBannedUsernames(prev => normalizeUsernameList([...prev, normalizedUsername]));
        setChatMessages(prev => prev.filter(msg => msg.user !== normalizedUsername));
        setModeratorChatMessages(prev => prev.filter(msg => msg.user !== normalizedUsername));

        try {
            const response = await fetch('/api/ban-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: normalizedUsername }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || 'Unable to ban user right now.');
            }
        } catch (error) {
            setBannedUsernames(previousBannedUsernames);
            setChatMessages(previousChatMessages);
            setModeratorChatMessages(previousModeratorMessages);
            throw error;
        }
    }, [bannedUsernames, chatMessages, moderatorChatMessages]);

    // Moderator dashboard polling: keep proposals + active pools fresh without manual navigation.
    useEffect(() => {
        if (!isModerator || screen !== SCREENS.DASHBOARD) {
            return;
        }

        let isCancelled = false;
        let isRefreshing = false;

        const refreshModeratorData = async () => {
            if (isCancelled || isRefreshing) {
                return;
            }

            isRefreshing = true;
            try {
                await Promise.allSettled([
                    loadPendingProposals({ silent: true }),
                    loadActiveBets(),
                ]);
            } finally {
                isRefreshing = false;
            }
        };

        void refreshModeratorData();
        const intervalId = setInterval(() => {
            void refreshModeratorData();
        }, 2000);

        return () => {
            isCancelled = true;
            clearInterval(intervalId);
        };
    }, [isModerator, loadActiveBets, loadPendingProposals, screen]);

    useEffect(() => {
        if (screen !== SCREENS.DASHBOARD) {
            return;
        }

        let isCancelled = false;

        const loadModerationState = async () => {
            try {
                const response = await fetch('/api/bracket');
                const data = await response.json().catch(() => ({}));
                if (!response.ok || isCancelled) {
                    return;
                }

                setBannedUsernames(normalizeUsernameList(data?.bracket?.bannedUsernames));
                setBettingPhase(normalizeBettingPhase(data?.bracket?.matchLifecycle?.phase));
            } catch (error) {
                if (!isCancelled) {
                    console.error('Failed to sync moderation state:', error);
                }
            }
        };

        void loadModerationState();
        const intervalId = setInterval(() => {
            void loadModerationState();
        }, 2000);

        return () => {
            isCancelled = true;
            clearInterval(intervalId);
        };
    }, [screen]);

    useEffect(() => {
        const usernames = CHAT_USER_ROSTER;
        const feedMessages = worldcupData?.messages || [];
        const allowedUsernames = usernames.filter(user => !bannedUsernames.includes(user));
        if (allowedUsernames.length === 0 || feedMessages.length === 0) {
            return;
        }

        const interval = setInterval(() => {
            const randomUser = allowedUsernames[Math.floor(Math.random() * allowedUsernames.length)];
            const randomText = feedMessages[Math.floor(Math.random() * feedMessages.length)];
            handleNewMessage({
                user: randomUser,
                text: randomText,
            });
        }, 300);

        return () => clearInterval(interval);
    }, [bannedUsernames, handleNewMessage]);

    // Betting feature: refresh available Player bets from Mongo when Players tab opens.
    useEffect(() => {
        if (screen !== SCREENS.DASHBOARD || isModerator || activeTab !== TABS.PLAYERS) {
            return;
        }

        let isCancelled = false;

        const loadPlayerBets = async () => {
            try {
                const response = await fetch('/api/player-bets', {
                    method: 'GET',
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.error || 'Unable to load player bets right now.');
                }

                if (!Array.isArray(data.players)) {
                    return;
                }

                if (isCancelled) {
                    return;
                }

                setPlayers(data.players.map(mapPlayerBetToPlayerCard));
            } catch (error) {
                console.error('Failed to refresh player bets:', error);
            }
        };

        loadPlayerBets();

        return () => {
            isCancelled = true;
        };
    }, [activeTab, isModerator, screen]);

    // Keep user credits and picks in sync without requiring a full page refresh.
    useEffect(() => {
        if (screen !== SCREENS.DASHBOARD || isModerator || !username) {
            return;
        }

        let isCancelled = false;

        const syncUserState = async () => {
            try {
                const response = await fetch('/api/user-state', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username }),
                });

                const data = await response.json().catch(() => ({}));
                if (!response.ok || isCancelled) {
                    return;
                }

                setUserCredits(Number.isFinite(Number(data.credits)) ? Number(data.credits) : 0);
                setUserTotalBets(Number.isFinite(Number(data.total_bets)) ? Number(data.total_bets) : 0);
                setUserWins(Number.isFinite(Number(data.wins)) ? Number(data.wins) : 0);
                setUserLosses(Number.isFinite(Number(data.losses)) ? Number(data.losses) : 0);
                setUserProfit(Number.isFinite(Number(data.profit)) ? Number(data.profit) : 0);
                setPlayerPicks(Array.isArray(data.player_picks) ? data.player_picks.map(mapPlayerBetToPlayerCard) : []);
                setTeamPicks(Array.isArray(data.team_picks) ? data.team_picks.map(mapTeamBetToTeamCard) : []);
                setGamePicks(Array.isArray(data.game_picks) ? data.game_picks.map(mapGameBetToGameRow) : []);
            } catch (error) {
                if (!isCancelled) {
                    console.error('Failed to sync user state:', error);
                }
            }
        };

        void syncUserState();
        const intervalId = setInterval(() => {
            void syncUserState();
        }, 1500);

        return () => {
            isCancelled = true;
            clearInterval(intervalId);
        };
    }, [isModerator, screen, username]);

    // Betting feature: refresh available Team bets from Mongo when Teams tab opens.
    useEffect(() => {
        if (screen !== SCREENS.DASHBOARD || isModerator || activeTab !== TABS.TEAMS) {
            return;
        }

        let isCancelled = false;

        const loadTeamBets = async () => {
            try {
                const response = await fetch('/api/team-bets', {
                    method: 'GET',
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.error || 'Unable to load team bets right now.');
                }

                if (!Array.isArray(data.teams)) {
                    return;
                }

                if (isCancelled) {
                    return;
                }

                setTeams(data.teams.map(mapTeamBetToTeamCard));
            } catch (error) {
                console.error('Failed to refresh team bets:', error);
            }
        };

        loadTeamBets();

        return () => {
            isCancelled = true;
        };
    }, [activeTab, isModerator, screen]);

    // Betting feature: refresh available Game bets from Mongo when Games tab opens.
    useEffect(() => {
        if (screen !== SCREENS.DASHBOARD || isModerator || activeTab !== TABS.GAMES) {
            return;
        }

        let isCancelled = false;

        const loadGameBets = async () => {
            try {
                const response = await fetch('/api/game-bets', {
                    method: 'GET',
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(data.error || 'Unable to load game bets right now.');
                }

                if (!Array.isArray(data.games)) {
                    return;
                }

                if (isCancelled) {
                    return;
                }

                setGames(data.games.map(mapGameBetToGameRow));
            } catch (error) {
                console.error('Failed to refresh game bets:', error);
            }
        };

        loadGameBets();

        return () => {
            isCancelled = true;
        };
    }, [activeTab, isModerator, screen]);

    // Betting feature: dismiss global success banner when user switches tabs.
    useEffect(() => {
        const previousTab = previousActiveTabRef.current;
        const didTabChange = previousTab !== activeTab;
        previousActiveTabRef.current = activeTab;

        if (!didTabChange || !showBetSuccessBanner) {
            return;
        }

        setShowBetSuccessBanner(false);

        if (betSuccessBannerTimeoutRef.current) {
            clearTimeout(betSuccessBannerTimeoutRef.current);
            betSuccessBannerTimeoutRef.current = null;
        }
    }, [activeTab, showBetSuccessBanner]);

    useEffect(() => {
        return () => {
            if (profileNoticeTimeoutRef.current) {
                clearTimeout(profileNoticeTimeoutRef.current);
            }

            if (betSuccessBannerTimeoutRef.current) {
                clearTimeout(betSuccessBannerTimeoutRef.current);
            }
        };
    }, []);

    return (
        <>
        <Head>
            <title>GatorGambling</title>
            <meta name="description" content="Chomp at the bet!" />
            <meta name = "viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="/favicon.ico" />
        </Head>

        <Header screen={screen} onLogoClick={handleLogoClick} onAvatarClick={handleAvatarClick} username={username} isModerator={isModerator} />
        {screen === SCREENS.LANDING && (
            <LandingScreen onSignUp={() => {
                setSignupError('');
                setScreen(SCREENS.SIGNUP);
            }} onLogin={() => {
                setLoginError('');
                setScreen(SCREENS.LOGIN);
            }}
            />
        )}

        {screen === SCREENS.LOGIN && (
            <LoginScreen onLogin={handleLogin} onBack={() => {
                setLoginError('');
                setScreen(SCREENS.LANDING);
            }} LogoComponent={Logo} isLoading={isLoggingIn} errorMessage={loginError}
            />
        )}

        {screen === SCREENS.SIGNUP && (
            <SignUpScreen onSignUp={handleSignUp} onBack={() => {
                setSignupError('');
                setScreen(SCREENS.LANDING);
            }} LogoComponent={Logo} isLoading={isSigningUp} errorMessage={signupError}
                />
        )}

        {screen === SCREENS.DASHBOARD && ( isModerator ? (
            <ModDash username={username} proposals={proposals} onApprove={handleApproveProposal} onDecline={handleDeclineProposal} chatMessages={moderatorChatMessages} 
                    onNewMessage={handleNewMessage} onDeleteMessage={handleDeleteMessage} onBanUser={handleBanUser} players={players} teams={teams} games={games} onCancelStake={handleCancelStake} bannedUsernames={bannedUsernames} isLoadingProposals={isLoadingProposals}/>
        ) : (
            <>
            <Dashboard username={username} players={players} playerPicks={playerPicks} teams={teams} teamPicks={teamPicks} games={games} gamePicks={gamePicks} chatMessages={chatMessages} 
                    onNewMessage={handleNewMessage} activeTab={activeTab} setActiveTab={setActiveTab} userCredits={userCredits} onPlacePlayerBet={handlePlacePlayerBet} onPlaceTeamBet={handlePlaceTeamBet} onPlaceGameBet={handlePlaceGameBet} showBetSuccessBanner={showBetSuccessBanner} canPlaceBets={bettingPhase === BETTING_PHASES.SIMULATION_RUNNING} />
                <ProposalForm onSubmit={handleAddProposal} username={username} isProposalsOpen={bettingPhase === BETTING_PHASES.PROPOSALS_OPEN}/>
            </>
        )
            
        )}

        {screen === SCREENS.PROFILE && (
            <ProfilePage username={username} email={userEmail} onLogout={handleLogout} isModerator={isModerator} credits={userCredits} totalBets={userTotalBets} wins={userWins} losses={userLosses} profit={userProfit} onUpdateCard={handleUpdateCard} onDeposit={handleDeposit} onChangeUsername={handleChangeUsername} onChangeEmail={handleChangeEmail} onChangePassword={handleChangePassword} notice={profileNotice} hasCardOnFile={hasCardOnFile} />
        )}
        </>
    );
}
