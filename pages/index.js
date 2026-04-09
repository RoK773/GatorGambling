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
    LIVE: 'live',
};

const MODERATOR_CREDENTIALS ={
    username: 'moderator01',
    password: 'moderator01Auth',
}

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
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--bg-primary)', padding: 24,
        }}>
            <div style={{
                position: 'fixed', top: '-20px', left: '50%', transform: 'translateX(-50%)',
                width: 600, height: 600, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(198, 241, 53, 0.06) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                maxWidth: 420, width: '100%',
                animation: 'slideUp 0.6s ease both',
            }}>
                <div style={{
                    textAlign: 'center', marginBottom: 48,
                }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: 20,
                        background: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 20px', boxShadow: '0 0 40px var(--accent-glow-strong)',
                        animation: 'pulse-glow 3s ease-in-out infinite',
                    }}>
                        <img 
                            src="/gator_gambling_logo.png" 
                            alt="Logo" 
                            style={{ width: '100%', height: '100%', borderRadius: 20, objectFit: 'contain' }} 
                        />
                    </div>
                    <h1 style={{
                        fontFamily: 'var(--font-display)', fontSize: 48,
                        letterSpacing: '0.08em', color: 'var(--text-primary)', lineHeight: 1, marginBottom: 12,
                    }}>GATORGAMBLING</h1>
                    <p style={{
                        fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6,
                        maxWidth: 280, margin: '0 auto',
                    }}>Chomp at the Bet!</p>
                </div>
                <div style={{
                    display: 'flex', gap: 12, marginBottom: 40,
                }}>
                    {[
                        { icon: <TrendingUp size={16} />, label: '87% Win Rate' },
                        { icon: <Users size={16} />, label: '5K+ Players'},
                        { icon: <Zap size={16} />, label: 'Live Betting'},
                    ].map((item, i) => (
                        <div key={i} style={{
                            flex: 1, background: 'var(--bg-card)',
                            border: '1px solid var(--border)', borderRadius: 10,
                            padding: '10px 8px', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', gap: 6, color: 'var(--accent)',
                        }}>
                            {item.icon}
                            <span style={{
                                fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center', fontWeight: 600,
                            }}>{item.label}</span>
                        </div>
                    ))}
                </div>
                <div style={{
                    display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                    <AuthButton label="CREATE ACCOUNT" primary onClick={onSignUp} />
                    <AuthButton label="SIGN IN" onClick={onLogin} />
                </div>
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <button onClick={() => window.location.href = '/test_simulation'} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: 12, fontWeight: 600,
                        textDecoration: 'underline', textUnderlineOffset: 3,
                    }}> TRY MATCH SIMULATION</button>
                </div>
                <p style={{ 
                    textAlign: 'center', fontSize: 11, color: 'var(--text-muted)',
                    marginTop: 28,
                }}>By continuing, you agree and consent to our Terms and Conditions & Privacy Policy</p>
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
function PlayerBetCard({ playerId, title, subtitle, meta, stake, stat, range, statNum, payoutMult, animDelay, availableCredits = 0, onPlaceBet, confirmed = false }) {
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
                <button onClick={handleBet} disabled={confirmed || !hasCondition || betPlaced} title={confirmed ? 'This bet is already confirmed' : (!hasCondition ? 'Condition unavailable for this bet' : '')} style={{
                    background: confirmed ? 'var(--success)' : (betPlaced ? 'var(--success)' : 'var(--accent)'),
                    color: '#080A0F', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', 
                    padding: '11px', borderRadius: 8, border: (!hasCondition && !confirmed) ? '1px solid var(--border)' : 'none', cursor: (confirmed || !hasCondition) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s', opacity: (confirmed || !hasCondition) ? 0.75 : 1,
                }}>
                    {confirmed ? 'BET CONFIRMED' : (betPlaced ? '✓ BET PLACED' : (!hasCondition ? 'CONDITION UNAVAILABLE' : 'PLACE BET'))}
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
function TeamBetCard({ teamId, title, subtitle, stake, outcome, range, points, payoutMult, animDelay, availableCredits = 0, onPlaceBet, confirmed = false }) {
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
                <button onClick={handleBet} disabled={confirmed || !hasCondition || betPlaced} title={confirmed ? 'This bet is already confirmed' : (!hasCondition ? 'Condition unavailable for this bet' : '')} style={{
                    background: confirmed ? 'var(--success)' : (betPlaced ? 'var(--success)' : 'var(--accent)'),
                    color: '#080A0F', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em',
                    padding: '11px', borderRadius: 8, border: (!hasCondition && !confirmed) ? '1px solid var(--border)' : 'none', cursor: (confirmed || !hasCondition) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s', opacity: (confirmed || !hasCondition) ? 0.75 : 1,
                }}>
                    {confirmed ? 'BET CONFIRMED' : (betPlaced ? '✓ BET PLACED' : (!hasCondition ? 'CONDITION UNAVAILABLE' : 'PLACE BET'))}
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

    if (!hasAnyPicks) {
        return(
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
        );
    }

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', gap: 24,
        }}>
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
        </div>
    );
}

// Betting feature: available Player bets listing.
function PlayersTab({players, availableCredits, onPlaceBet}){
    return(
        <BetGrid>
            {players.map((p, i) => (
                <PlayerBetCard key={p.id} playerId={p.id} title={p.name} subtitle={`#${p.number}`} meta={p.pos} stake={p.stake} stat={p.stat} range={p.range} statNum={p.stat_num} payoutMult={p.payout_mult} animDelay={`${i*0.05}s`} availableCredits={availableCredits} onPlaceBet={onPlaceBet} />
 
                ))}
        </BetGrid>
    );
}

// Betting feature: available Team bets listing.
function TeamsTab({teams, availableCredits, onPlaceBet}){
    return(
        <BetGrid>
            {teams.map((t, i) =>(
                    <TeamBetCard key={t.id} teamId={t.id} title={t.name} subtitle={t.record} stake={t.stake} outcome={t.outcome} range={t.range} points={t.points} payoutMult={t.payout_mult} animDelay={`${i * 0.05}s`} availableCredits={availableCredits} onPlaceBet={onPlaceBet}/>
            ))}
        </BetGrid>
    );
}

function GamesRow({g, i, availableCredits = 0, onPlaceBet, confirmed = false}) {
    const [hover, setHover] = useState(false);
    const [betPlaced, setBetPlaced] = useState(false);
    const [isSubmittingBet, setIsSubmittingBet] = useState(false);
    const [showBetModal, setShowBetModal] = useState(false);
    const [betAmountInput, setBetAmountInput] = useState('');
    const [betAmountError, setBetAmountError] = useState('');
    const [betBanner, setBetBanner] = useState(null);

    const lockedWinner = String(g?.winner || '').trim() || '--';
    const lockedOdds = String(g?.odds || g?.spread || '').trim() || '--';
    const hasCondition = lockedWinner !== '--' && lockedOdds !== '--';
    const conditionText = hasCondition ? lockedWinner : 'Condition unavailable';

    const handleBet = () => {
        if (!hasCondition || confirmed) {
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
                        <ConditionLabel>Winner</ConditionLabel>
                        <div style={{
                            minWidth: 160, background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 7,
                            padding: '6px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-primary)',
                        }}>{lockedWinner}</div>
                    </div>
                    <div style={{
                        fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', paddingTop: 2,
                    }}>
                        {conditionText}
                    </div>
                </ConditionZone>
                <button onClick={handleBet} disabled={confirmed || !hasCondition || betPlaced} title={confirmed ? 'This bet is already confirmed' : (!hasCondition ? 'Condition unavailable for this bet' : '')} style={{
                    background: confirmed ? 'var(--success)' : (betPlaced ? 'var(--success)' : 'var(--accent)'), color: '#080A0F', letterSpacing: '0.08em', padding: '11px 20px',
                    borderRadius: 8, border: (!hasCondition && !confirmed) ? '1px solid var(--border)' : 'none', cursor: (confirmed || !hasCondition) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s', fontWeight: 700, fontSize: 13, alignSelf: 'flex-end', opacity: (confirmed || !hasCondition) ? 0.75 : 1,
                }}>{confirmed ? 'BET CONFIRMED' : (betPlaced ? '✓ BET PLACED' : (!hasCondition ? 'CONDITION UNAVAILABLE' : 'PLACE BET'))}</button>
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

function GamesTab({games, availableCredits = 0, onPlaceBet, confirmed = false}){
    return(
        <div style={{
            display: 'flex', flexDirection: 'column', gap: 16,
        }}>
            {games.map((g, i) => (
                <GamesRow key={g.id} g={g} i={i} availableCredits={availableCredits} onPlaceBet={onPlaceBet} confirmed={confirmed} />
        ))}
        </div>
    );
}

function GlobalChat({messages, onNewMessage, username}){
    const [inputText, setInputText] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
            width: '25%', flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', height: 520,
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
            <div style={{
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

function LiveTab({chatMessages, onNewMessage, username}){
    return(
        <div style={{
            display: 'flex', flexDirection: 'row', gap: 16, alignItems: 'flex-start', animation: 'fadeIn 0.4s ease',
        }}>
            <div style={{
                flex: '0 0 75%', display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', minHeight: 520, gap: 16, background: 'var(--bg-card)', 
                border: '1px solid var(--border)', borderRadius: 14, padding: 32
            }}>
                <div style={{
                    width: 80, height: 80, borderRadius: '50%', background: 'rgba(255, 71, 87, 0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                }}>
                    <Radio size={32} color="var(--danger)"/>
                    <div style={{
                        position: 'absolute', top: 12, right: 12, width: 10, height: 10, borderRadius: '50%',
                        background: 'var(--danger)', animation: 'live-dot 1.2s ease-in-out infinite',
                    }} />
                </div>
                <h3 style={{
                    fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '0.06em',
                }}>LIVE GAME</h3>
                <p style={{
                    fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 300, lineHeight: 1.7,
                }}>Real-time updates and live global chat.</p>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255, 71, 87, 0.08)',
                    border: '1px solid rgba(255, 71, 87, 0.2)', borderRadius: 10, padding: '10px 18px',
                }}>
                    <div style={{
                        width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)', animation: 'live-dot 1.2s ease-in-out infinite',
                    }}/>
                    <span style={{
                        fontSize: 13, color: 'var(--danger)', fontWeight: 600, fontFamily: 'var(--font-mono)',
                    }}>LIVE FEED LOADING...</span>
                </div>
            </div>
            <GlobalChat messages={chatMessages} onNewMessage={onNewMessage} username={username}/>
        </div>
    );
}

// main dashboard!
const TAB_CONFIG = [
    {key: TABS.PICKS, label: 'Your Picks', icon: <Star size={15} /> },
    {key: TABS.PLAYERS, label: 'Players', icon: <User size={15} /> },
    {key: TABS.TEAMS, label: 'Teams', icon: <Shield size={15} /> },
    {key: TABS.GAMES, label: "Games", icon: <Trophy size={15} /> },
    {key: TABS.LIVE, label: "Live", icon: <Radio size={15} />, live:true},
];

function Dashboard({username, players, playerPicks, teams, teamPicks, games, gamePicks, chatMessages, onNewMessage, activeTab, setActiveTab, userCredits, onPlacePlayerBet, onPlaceTeamBet, onPlaceGameBet, showBetSuccessBanner = false}){
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
            case TABS.PLAYERS: return <PlayersTab players={availablePlayers} availableCredits={userCredits} onPlaceBet={onPlacePlayerBet} />;
            case TABS.TEAMS: return <TeamsTab teams={availableTeams} availableCredits={userCredits} onPlaceBet={onPlaceTeamBet}/>;
            case TABS.GAMES: return <GamesTab games={availableGames} availableCredits={userCredits} onPlaceBet={onPlaceGameBet} />;
            case TABS.LIVE: return <LiveTab chatMessages={chatMessages} onNewMessage={onNewMessage} username={username}/>;
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
                    {activeTab !== TABS.PICKS && activeTab !== TABS.LIVE && (
                        <p style={{
                            fontSize: 13, color: 'var(--text-secondary)', marginTop: 4,
                        }}>Select an option and place your bet.
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

function ProfilePage({ username, email = '', onLogout, isModerator = false, credits = 0, onUpdateCard, onDeposit, notice = ''}){
    const formattedCredits = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(Number.isFinite(Number(credits)) ? Number(credits) : 0);
    const [showCardModal, setShowCardModal] = useState(false);
    const [cardNumberInput, setCardNumberInput] = useState('');
    const [cvvInput, setCvvInput] = useState('');
    const [cardError, setCardError] = useState('');
    const [isSavingCard, setIsSavingCard] = useState(false);
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositAmountInput, setDepositAmountInput] = useState('');
    const [depositError, setDepositError] = useState('');
    const [isDepositing, setIsDepositing] = useState(false);
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
                        { label: 'Total Bets', value: '47'},
                        { label: 'Win Rate', value: '68'},
                        { label: 'Profit', value: '+340'},
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
                        <SettingsButton icon={<User size={16} />} label="Change Username" />
                        <SettingsButton icon={<Mail size={16} />} label="Change Email" />
                        <SettingsButton icon={<Lock size={16} />} label="Change Password" />
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
        </div>
    );
}

// root app (last part <3)
export default function App(){
    const [screen, setScreen] = useState(SCREENS.LANDING);
    const [username, setUsername] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userCredits, setUserCredits] = useState(0);
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
    const [chatMessages, setChatMessages] = useState(SEED_MESSAGES);
    const [moderatorChatMessages, setModeratorChatMessages] = useState(INITIAL_CHAT_MESSAGES);
    const [showBetSuccessBanner, setShowBetSuccessBanner] = useState(false);
    const betSuccessBannerTimeoutRef = useRef(null);
    const previousActiveTabRef = useRef(activeTab);
    const isModerator = userRole === 'moderator';
    const [isLoadingProposals, setIsLoadingProposals] = useState(false);

    // helper for loadPendingProposals
    const loadPendingProposals = useCallback(async () => {
        setIsLoadingProposals(true);
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
            setIsLoadingProposals(false);
        }
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

        if( payload.username === MODERATOR_CREDENTIALS.username && payload.password === MODERATOR_CREDENTIALS.password){
            setUsername(payload.username);
            setUserEmail('');
            setUserCredits(0);
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
        setPlayerPicks([]);
        setTeamPicks([]);
        setGamePicks([]);
        setProfileNotice('');
        setShowBetSuccessBanner(false);
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
    }, [username]);

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
    }, [activeTab, loadPendingProposals]);

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
                body: JSON.stringify({type, betId: id}),
            });

            if (!response.ok){
                const data = await response.json().catch(() => ({}));
                console.error('Cancel stake failed:', data.error);
            }
        } catch (error){
            console.error('Cancel stake network error:', error);
        }
    }, []);

    const handleNewMessage = useCallback((msg) =>{
        if (!msg || typeof msg !== 'object') {
            return;
        }

        const user = String(msg.user || '').trim();
        const text = String(msg.text || '').trim();
        if (!user || !text) {
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
    }, []);

    const handleDeleteMessage = useCallback((id) =>{
        setModeratorChatMessages(prev => prev.map(msg => (
            msg.id === id ? { ...msg, text: '[message removed by moderator]' } : msg
        )));
    }, []);

    useEffect(() => {
        if (!isModerator || screen !== SCREENS.DASHBOARD) {
            return;
        }
        loadPendingProposals();
    }, [isModerator, screen, loadPendingProposals]);

    useEffect(() => {
        const usernames = CHAT_USER_ROSTER;
        const feedMessages = worldcupData?.messages || [];
        if (usernames.length === 0 || feedMessages.length === 0) {
            return;
        }

        const interval = setInterval(() => {
            const randomUser = usernames[Math.floor(Math.random() * usernames.length)];
            const randomText = feedMessages[Math.floor(Math.random() * feedMessages.length)];
            handleNewMessage({
                user: randomUser,
                text: randomText,
            });
        }, 300);

        return () => clearInterval(interval);
    }, [handleNewMessage]);

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
                    onNewMessage={handleNewMessage} onDeleteMessage={handleDeleteMessage} players={players} teams={teams} games={games} onCancelStake={handleCancelStake} isLoadingProposals={isLoadingProposals}/>
        ) : (
            <>
            <Dashboard username={username} players={players} playerPicks={playerPicks} teams={teams} teamPicks={teamPicks} games={games} gamePicks={gamePicks} chatMessages={chatMessages} 
                    onNewMessage={handleNewMessage} activeTab={activeTab} setActiveTab={setActiveTab} userCredits={userCredits} onPlacePlayerBet={handlePlacePlayerBet} onPlaceTeamBet={handlePlaceTeamBet} onPlaceGameBet={handlePlaceGameBet} showBetSuccessBanner={showBetSuccessBanner} />
            <ProposalForm onSubmit={handleAddProposal} username={username}/>
            </>
        )
            
        )}

        {screen === SCREENS.PROFILE && (
            <ProfilePage username={username} email={userEmail} onLogout={handleLogout} isModerator={isModerator} credits={userCredits} onUpdateCard={handleUpdateCard} onDeposit={handleDeposit} notice={profileNotice} hasCardOnFile={hasCardOnFile} />
        )}
        </>
    );
}
