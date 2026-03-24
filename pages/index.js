import { useState, useCallback } from 'react';
import Head from 'next/head';
import { LoginScreen, SignUpScreen } from './auth';
import {
    LogOut, Settings, User, Mail, 
    CreditCard, Lock, ChevronRight, 
    TrendingUp, Users, Shield, Zap, 
    Star, Radio, Trophy, BarChart2, 
    Activity} from 'lucide-react';

// constants here
import ConfirmModal from './components/confirmModal';
import proposalForm from './components/proposalForm';
import modDash from './components/modDash';

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

const INITIAL_PLAYERS = [
    { id: 1, name: 'Matthew Savoie', number: '22', stake: '$400', pos: 'CAN' },
    { id: 2, name: 'Ryan McDonagh', number: '27', stake: '$400', pos: 'AME'},
    { id: 3, name: 'Sam Bennett', number: '19', stake: '$1', pos: 'CAN' },
    { id: 4, name: 'Jonas Johannson', number: '31', stake: '$20', pos: 'SWE' },
    { id: 5, name: 'Auston Matthews', number: '34', stake: '$15', pos: 'MEX' },
];

const INITIAL_TEAMS = [
    { id: 1, name: 'Canada', record: '4-6', stake: '$50'},
    { id: 2, name: 'United States of America', record: '3-7', stake: '$40'},
    { id: 3, name: 'Sweden', record: '5-5', stake: '$50'},
    { id: 4, name: 'Mexico', record: '6-4', stake: '$50'},
    { id: 5, name: 'England', record: '3-7', stake: '$20'},
];

const INITIAL_GAMES = [
    { id: 1, home: 'Canada', away: 'United States of America', time: '6:00 PM', winner: 'Canada', stake: '$120', spread: '-3.5' },
    { id: 2, home: 'United States of America', away: 'England', time: '4:00 PM', winner: 'United States of America', stake: '$70', spread: '-2.1' },
    { id: 3, home: 'England', away: 'Sweden', time: '5:00 PM', winner: 'Sweden', stake: '$200', spread: '3.0'},
    { id: 4, home: 'Sweden', away: 'Mexico', time: '4:30 PM', winner: 'Mexico', stake: '$250', spread: '-1.6'},
];

// seed messages so App can own chatMessages state and pass it down for mod deletion
// static messages for global chat
const SEED_MESSAGES = [
    { id: 1, user: 'GamabaGuoba01', initials: 'GG', color: '#C6F135', text: 'Have they tried scoring?'},
    { id: 2, user: 'SwedishGuy', initials: 'SG', color: '#38BDF8', text: 'dw we got this trust'},
    { id: 3, user: 'GambaGuoba01', initials: 'GG', color: '#C6F135', text: 'Mexico sweep :muscle:'},
    { id: 4, user: 'ImJustKen', initials: 'IJ', color: '#FB923C', text: 'Amerika ya :3'},
];

// avatar placeholder
function Avatar({ size = 36, initials = 'U', style = {} } ) {
    return (
        <div style ={{
            width: size, height: size, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: size * 0.38, color: '#080A0F', letterSpacingL: '0.02em',
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

                <Trophy size={20} color="#050A0F" strokeWidth={2.5} />
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
            background: 'rgba(8, 10, 15, 0, 0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', 
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
                        margin: '0 auto 20px', boxShadow: '0 0 40px, var(--accent-glow-strong)',
                        animation: 'pulse-glow 3s ease-in-out infinite',
                    }}>
                        <Trophy size={36} color="#080A0F" strokeWidth={2.5} />
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
                            padding: '10px, 8px', display: 'flex', flexDirection: 'column',
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
                    textAilgn: 'center', fontSize: 11, color: 'var(--text-muted)',
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

const PLAYER_STATS = ['Goals', 'Assists', 'Fouls', 'Shots on Target', 'Saves', 'Minutes Played'];
const COMPARATORS = ['Over', 'Under', 'Exactly'];

// bet card
function PlayerBetCard({ title, subtitle, meta, stake, animDelay }) {
    const [hover, setHover] = useState(false);
    const [betPlaced, setBet] = useState(false);
    const [statType, setStat] = useState(PLAYER_STATS[0]);
    const [comparator, setComp] = useState(COMPARATORS[0]);
    const [condVal, setCondVal] = useState('');

    const condition = condVal ? `${statType} - ${comparator} ${condVal}` : null;

    const handleBet = () => {
        if (!condVal || Number(condVal) < 0){
            return;
        }
        setBet(true);
        setTimeout(() => setBet(false), 2000);
    };

    return(
        <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
            background: hover? 'var(--bg-card-hover)' : 'var(--bg-card)',
            border: `1px solid ${hover ? 'var(--border-bright)' : 'var(--border)'}`,
            borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column',
            transition: 'all 0.2s', transform: hover ? 'translateY(-2px)' : 'none',
            boxShadow: hover ? 'o 8px 24px rgba(0, 0, 0, 0.3)' : 'none', animation: 'fadeIn 0.4s ease both', animationDelay: animDelay,
        }}>
            {meta && (
                <div style={{
                    display: 'inline-flex', alignSelf: 'flex-start', background: 'rgba(198, 241, 53, 0.1)', color: 'car(--accent)',
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

                <ConditionZone>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                    }}>
                        <ConditionSelect value={statType} onChange={e => setStat(e.target.value)} options={PLAYER_STATS} minWidth={118} />
                        <ConditionSelect value={comparator} onChange={e => setComp(e.target.value)} options={COMPARATORS} winWidth={82} />
                        <ConditionNumber value={condVal} onChange={e => setCondVal(e.target.value)} placeholder="0" />
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
            <button onClick={handleBet} disabled={!condVal || betPlaced} title={!condVal ? 'Set a condition for your bet' : ''} style={{
                background: betPlaced ? 'var(--success)' : 'var(--accent)',
                color: '#080A0F', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', 
                padding: '11px', borderRadius: 8, border: !condVal ? '1px solid var(--border)' : 'none', cursor: !condVal ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', opacity: !condVal ? 0.6 : 1,
            }}>
                {betPlaced ? '✓ BET PLACED' : !condVal ? 'SET CONDITION FIRST' : 'PLACE BET'}
            </button>
        </div>
    );
}

const TEAM_RESULTS = ['Wins', 'Loses', 'Draws'];
const MARGIN_TYPES = ['By More Than', 'By Less Than', 'By Exactly'];

function TeamBetCard({ title, subtitle, stake, animDelay}) {
    const [hover, setHover] = useState(false);
    const [betPlaced, setBet] = useState(false);
    const [result, setResult] = useState(TEAM_RESULTS[0]);
    const [marginType, setMargin] = useState(MARGIN_TYPES[0]);
    const [condVal, setCondVal] = useState('');

    const isDraw = result === 'Draws';
    const hasCondition = isDraw || (condVal && Number(condVal) >= 0);
    const conditionText = isDraw ? 'Draws' : condVal ? `${result} - ${marginType} ${condVal}` : null;
    const handleBet = () => {
        if (!hasCondition) {
            return;
        }
        setBet(true);
        setTimeout(() => setBet(false), 2000);
    };

    return(
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
            <ConditionZone>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                }}>
                    <ConditionSelect value={result} onChange={e => setResult(e.target.value)} options={TEAM_RESULTS} minWidth={80} />
                    <ConditionSelect value={marginType} onChange={e => setMargin(e.target.value)} options={MARGIN_TYPES} minWidth={118} disabled={isDraw} />
                    <CondiitonNumber value={isDraw ? '' : condVal} onChange={e => setCondVal(e.target.value)} disabled={isDraw} placeholder="pts" />
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
            <button onClick={handleBet} disabled={!hasCondition || betPlaced} title={!hasCondition ? 'Set a condition to place your bet' : ''} style={{
                background: betPlaced ? 'var(--success)' : !hasCondition ? 'var(--bg-secondary)' : 'var(--accent)', 
                color: !hasCondition ? 'var(--text-muted)' : '#080A0F', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em',
                padding: '11px', borderRadius: 8, border: !hasCondition ? '1px solid var(--border)' : 'none', cursor: !hasCondition ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', opacity: !hasCondition ? 0.6 : 1,
            }}>
                {betPlaced ? '✓ BET PLACED' : !condVal ? 'SET CONDITION FIRST' : 'PLACE BET'}
            </button>
        </div>
    );
}

// tab contents 
function YourPicksTab(){
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
                fontFamily: 'var(--font-display', fontSize: 28, letterSpacing: '0.06em',
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

function PlayersTab({players}){
    return(
        <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16,
        }}>
            {players.map((p, i) => (
                <PlayerBetCard key={p.id} title={p.name} subtitle={`#${p.number}`} meta={p.pos} stake={p.stake} animDelay={`${i*0.05}s`} />
 
                ))}
        </div>
    );
}

function TeamsTab({teams}){
    return(
        <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16,
        }}>
            {teams.map((t, i) =>(
                    <TeamBetCard key={t.id} title={t.name} subtitle={t.record} stake={t.stake} animDelay={`${i * 0.05}s`}/>
            ))}
        </div>
    );
}

const GAME_OUTCOMES = ['Home Team Wins', 'Away Team Wins', 'Draw'];

function GamesRow({g, i}) {
    const [hover, setHover] = useState(false);
    const [betPlaced, setBetPlaced] = useState(false);
    const [outcome, setOutcome] = useState(GAME_OUTCOMES[0]);
    const [homeScore, setHomeScore] = useState('');
    const [awayScore, setAwayScore] = useState('');
    const [showScore, setShowScore] = useState(false);
    const hasScore = showScore && homeScore !== '' && awayScore !== '';
    const outcomeLabel = outcome === 'Home Team Wins' ? g.home : outcome === 'Away Team Wins' ? g.away : 'Draw';
    const conditionText = hasScore ? `${outcomeLabel} - ${g.home} ${homeScore} : ${awayScore} ${g.away}` :  `${outcomeLabel} wins`;

    const handleBet = () => {
        setBet(true);
        setTimeout(() => setBet(false), 2000);
    }

    return(
        <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
            background: hover ? 'var(--bg-card-hover)' : 'var(--bg-card)', border: `1px solid ${hover ? 'var(--border-bright)' : 'var(--border)'}`,
            borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14, transaction: 'all 0.2s', animation: 'fadeIn 0.4s ease both', animationDelay: `${i * 0.07}s`,
        }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}>
                <div style={{
                    background: 'rgba(198, 241, 53, 0.1)', color: 'var(--accent)', fontSize: 11, fontWeight: 700, padding: '4px 10px', 
                    borderRadius: 6, border: '1px solid rgba(198, 241, 53, 0.2', fontFamily: 'var(--font-mono)', flexShrink: 0,
                }}>{g.spread}</div>
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
            <ConditionZone>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                }}>
                    <ConditionLabel>Winner</ConditionLabel>
                    <ConditionSelect value={outcome} onChange={e => setOutcome(e.target.value)} options={[
                        {value: 'Home Team Wins', label: `${g.home} wins`},
                        {value: 'Away Team Wins', label: `${g.away} wins`},
                        {value: 'Draw', label: 'Draw'},
                    ]}
                    minWidth={160}
                    />
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                }}>
                    <button onClick={() => setShowScore(s => !s)} style={{
                        display: 'flex', alignItems: 'center', gap: 5, background: showScore ? 'rgba(198, 241, 53, 0.1)' : 'transparent',
                        border: showScore ? '1 px solid rgba(198, 241, 53, 0.3)' : '1px solid var(--border)', borderRadius: 6,
                        padding: '5px 10px', cursor: 'pointer', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', 
                        color: showScore ? 'var(--accent)' : 'var(--text-muted)', transition: 'all 0.2s',
                    }}>
                        {showScore ? 'SCORE' : '+ PREDICT SCORE'}
                    </button>
                    {showScore && ( <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <ConditionLabel>{g.home}</ConditionLabel>
                        <ConditionNumber value={homeScore} onChange={e => setHomeScore(e.target.value)} placeholder="0" min={0} />
                            <span style={{
                                color: 'var(--text-muted)', fontWeight: 700,
                            }}>-</span>
                            <ConditionNumber value={awayScore} onChange={e => setAwayScore(e.target.value)} placeholder="0" min={0} />
                            <ConditionLabel>{g.away}</ConditionLabel>
                        </div>
                        )}
                </div>
                <div style={{
                    fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', paddingTop: 2,
                }}>
                    {conditionText}
                </div>
            </ConditionZone>
            <button onClick={handleBet} style={{
                background: betPlaced ? 'var(--success)' : 'var(--accent)', color: '#080A0F', letterSpacing: '0.08em', padding: '11px 20px',
                borderRadius: 8, border: 'none', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 700, fontSize: 13, alignSelf: 'flex-end',
            }}>{betPlaced ? '✓ BET PLACED' : 'PLACE BET'}</button>
        </div>
    );
}

function GamesTab(){
    return(
        <div style={{
            display: 'flex', flexDirection: 'column', gap: 16,
        }}>
            {games.map((g, i) => (
                <GamesRow key={g.id} g={g} i={i}/>
        ))}
        </div>
    );
}

function GlobalChat({messages, onNewMessage, username}){
    const [inputText, setInputText] = useState('');

    const handleSubmit = () => {
        const trimmed = inputText.trim();
        if (!trimmed){
            return;
        }
        onNewMessage({
            id: Date.now(), user: username || 'You', initials: (username || 'YO').slice(0, 2).toUpperCase(), color: 'var(--accent)', text: trimmed,
        });
        setInputText('');
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
                onBlur={e => {e.target.style.borderColor = 'var(--border_';}}
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
            <GlobalChat message={chatMessages} onNewMessage={onNewMessage} username={username}/>
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

function Dashboard({username, players, teams, games, chatMessages, onNewMessage}){
    const [activeTab, setActiveTab] = useState(TABS.PICKS);
    const renderTabContent = () => {
        switch (activeTab){
            case TABS.PICKS: return <YourPicksTab/>;
            case TABS.PLAYERS: return <PlayersTab players={players}/>;
            case TABS.TEAMS: return <TeamsTab teams={teams}/>;
            case TABS.GAMES: return <GamesTab games={games}/>;
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

function SettingsButton({ icon, label}){
    const [hover, setHover] = useState(false);
    return (
        <button onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
            background: hover ? 'var(--bg-card-hover)' : 'var(--bg-card)',
            border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px',
            color: 'var(--text-primary)', fontSize: 14, fontWeight: 500, 
            transition: 'all 0.2s', cursor: 'default',
        }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-secondary)',
            }}>
                {icon}
                <span style={{
                    color: 'var(--text-primary)',
                }}>{label}</span>
            </div>
            <ChevronRight size={16} color="var(--text-muted)"/>
        </button>
    );
}

function ProfilePage({ username, onLogout, isModerator = false}){
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
                    }}>user@email.com</p>
                    {isModerator ? (
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(198, 241, 53, 0.08)',
                        border: '1px solid rgba(198, 241, 53, 0.25)', borderRadius: 10, padding: '8px 18px', marginTop: 16,
                    }}>
                        <Shield size={14} color="var(--accent)" />
                        <span style={{
                            fontSize: 13, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'var(--font-mono)',
                        }}>
                            MDOERATOR ACCOUNT
                        </span>
                        </div>
                    ) : (
                    
                        <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(198, 241, 53, 0.08)',
                        border: '1px solid rgba(198, 241, 53, 0.2)', borderRadius: 10, padding: '8px 18px', marginTop: 16,
                        }}>
                            <span style={{
                                fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600,
                            }}>BALANCE</span>
                            <span style={{
                                fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--accent)', fontWeight: 500,
                            }}>$1,240.00</span>
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
                    <div style={{
                        display: 'flex', flexDirection: 'column', gap: 8,
                    }}>
                        <SettingsButton icon={<User size={16} />} label="Change Username" />
                        <SettingsButton icon={<Mail size={16} />} label="Change Email" />
                        <SettingsButton icon={<Lock size={16} />} label="Change Password" />
                        {!isModerator && (
                        <SettingsButton icon={<CreditCard size={16} />} label="Edit Card on File" />
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
        </div>
    );
}

// root app (last part <3)
export default function App(){
    const [screen, setScreen] = useState(SCREENS.LANDING);
    const [username, setUsername] = useState('');
    const [userRole, setUserRole] = useState('user');
    const [activeTab, setActiveTab] = useState(TABS.PICKS);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [signupError, setSignupError] = useState('');
    const [players, setPlayers] = useState(INITIAL_PLAYERS);
    const [teams, setTeams] = useState(INITIAL_TEAMS);
    const [games, setGames] = useState(INITIAL_GAMES);
    const [proposals, setProposals] = useState([]);
    const [chatMessages, setChatMessages] = useState(SEED_MESSAGES);
    const isModerator = userRole === 'moderator';
    
    const handleLogin = useCallback(async (loginData) => {
        const payload = typeof loginData === 'string'
            ? { username: loginData, password: '' }
            : loginData;

        setLoginError('');

        if( playload.username === MODERATOR_CREDENTIALS.username && payload.password === MODERATOR_CREDENTIALS.password){
            setUsername(payload.username);
            setUserRole('moderator');
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
            setUserRole('user');
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
            setUserRole('user');
            setScreen(SCREENS.DASHBOARD);
        } catch (error) {
            setSignupError('Invalid account information.');
        } finally {
            setIsSigningUp(false);
        }
    }, []);

    const handleLogout = useCallback(() => {
        setUsername('');
        setUserRole('user');
        setScreen(SCREENS.LANDING);
    }, []);

    const handleLogoClick = useCallback(() => {
        if (screen === SCREENS.PROFILE){
            setScreen(SCREENS.DASHBOARD);
        }
    }, [screen]);

    const handleAvatarClick = useCallback(() => {
        setScreen(SCREENS.PROFILE);
    }, []);

    const handleAddProposal = useCallback((proposal) => {
        setProposals(prev => [...prev, proposal]);
    }, []);

    const handleApproveProposal = useCallback((id) => {
        setProposals(prev => prev.filter(p => p.id !== id));
    }, []);

    const handleDeclineProposal = useCallback((id) => {
        setProposals(prev => prev.filter(p => p.id !== id));
    }, []);

    const handleCancelStake = useCallback((type, id) => {
        if (type === 'player') setPlayers(prev => prev.filter(p => p.id !== id));
        if (type === 'team') setTeams(prev => prev.filter(t => t.id !== id));
        if (type === 'game') setGames(prev => prev.filter(g => g.id !== id));
    }, []);

    const handleNewMessage = useCallback((msg) =>{
        setChatMessages(prev => [...prev, msg]);
    }, []);

    const handleDeleteMessage = useCallback((id) =>{
        setChatMessages(prev => prev.filter(m => m.id !== id));
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
            <modDash username={username} proposals={proposals} onApprove={handleApproveProposal} onDecline={handleDeclineProposal} chatMessage={chatMessages} onDeleteMessage={handleDeleteMessage} players={players} teams={teams} games={games} onCancelStake={handleCancelStake} />
        ) : (
            <>
            <Dashboard username={username} players={players} teams={teams} games={games} chatMessages={chatMessages} onNewMessage={handleNewMessage} />
            <proposalForm onSubmit={handleAddProposal} />
            </>
        )
            
        )}

        {screen === SCREENS.PROFILE && (
            <ProfilePage username={username} onLogout={handleLogout} isModerator={isModerator} />
        )}
        </>
    );
}