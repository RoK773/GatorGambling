import { useState, useCallback } from 'react';
import Head from 'next/head';
import {
    LogOut, Settings, User, Mail, 
    CreditCard, Lock, ChevronRight, 
    TrendingUp, Users, Shield, Zap, 
    Star, Radio, Trophy, BarChart2, 
    Activity} from 'lucide-react';

// constants here

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

const MOCK_PLAYERS = [
    { id: 1, name: 'Matthew Savoie', number: '22', stake: '$400', pos: 'CAN' },
    { id: 2, name: 'Ryan McDonagh', number: '27', stake: '$400', pos: 'AME'},
    { id: 3, name: 'Sam Bennett', number: '19', stake: '$1', pos: 'CAN' },
    { id: 4, name: 'Jonas Johannson', number: '31', stake: '$20', pos: 'SWE' },
    { id: 5, name: 'Auston Matthews', number: '34', stake: '$15', pos: 'MEX' },
];

const MOCK_TEAMS = [
    { id: 1, name: 'Canada', record: '4-6', stake: '$50'},
    { id: 2, name: 'United States of America', record: '3-7', stake: '$40'},
    { id: 3, name: 'Sweden', record: '5-5', stake: '$50'},
    { id: 4, name: 'Mexico', record: '6-4', sake: '$50'},
    { id: 5, name: 'England', record: '3-7', stake: '$20'},
];

const MOCK_GAMES = [
    { id: 1, home: 'Canada', away: 'United States of America', time: '6:00 PM', winner: 'Canada', stake: '$120', spread: '-3.5' },
    { id: 2, home: 'United States of America', away: 'England', time: '4:00 PM', winner: 'United States of America', stake: '$70', spread: '-2.1' },
    { id: 3, home: 'England', away: 'Sweden', time: '5:00 PM', winner: 'Sweden', stake: '$200', spread: '3.0'},
    { id: 4, home: 'Sweden', away: 'Mexico', time: '4:30 PM', winner: 'Mexico', stake: '$250', spread: '-1.6'},
];

// avatar placeholder
function Avatar({ size = 36, initials = 'U', style = {} } ) {
    return (
        <div style ={{
            width: size, height: size, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dim) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)',
            fontSize: size * 0.38,
            color: '#080A0F',
            letterSpacingL: '0.02em',
            flexShrink: 0,
            userSelect: 'none',
            ...style,
        }}>
            {initials}

        </div>
    );
}

// app logo!
function Logo({ onClick, style = {} }) {
    return(
        <button onClick={onClick} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '4px 0',
            ...style,
        }}>
            <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 16px var(--accent-glow)',
            }}>

                <Trophy size={20} color="#050A0F" strokeWidth={2.5} />
            </div>
            <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                color: 'var(--text-primary)',
                letterSpacing: '0.06em',
            }}>GATORGAMBLING</span>
        </button>
    );
}

// header

function Header({ screen, onLogoClikc, onAvatarClick, username}) {
    if (screen === SCREENS.LANDING || screen === SCREENS.LOGIN || screen === SCREENS.SIGNUP) {
        return null;
    }
    return (
        <header style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
            height: 'var(--header-height)',
            background: 'rgba(8, 10, 15, 0, 0.92)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 24px',
        }}>
            <Logo onClick={onLogoClick} />
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 12,
            }}>
            <span style={{
                fontSize: 13, color: 'var(--text-secondary)',
                fontWeight: 500,  display: 'none',
            }}>{username}</span>
            <button onClick={onAvatarClick} style={{
                background: 'none', border: '2px solid var(--border-bright)',
                borderRadius: '50%', cursor: 'pointer', padding: 2,
                transition: 'border-color 0.2s',
            }}

            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-bright)'}
            >
                <Avatar size={34} initialis={username ? username[0].toUpperCase() : 'U'}/>
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
                display: 'block', fontSize: 11, fontWeight: 60,
                color: 'var(--text-secondary', marignBottom: 8,
                letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>{label}</label>
            <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{
                width: '100%', background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 10, padding: '13px 16px',
                fontsize: 14, color: 'var(--text-primary)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={e => {
                e.target.style.borderColor = 'var(--acent)';
                e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
            }}
            onblur={e => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
            }}
            />
        </div>
    );
}

function AuthButton({ label, primary = false, onClick}){
    const [hover, setHover] = useState(false);
    return (
        <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
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
                position: 'fixed', top: '-20', left: '50%', transform: 'translateX(-50%)',
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
                <div styles={{
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
                <p style={{ 
                    textAilgn: 'center', fontSize: 11, color: 'var(--text-muted)',
                    marginTop: 28,
                }}>By continuing, you agree and consent to our Terms and Conditions & Privacy Policy</p>
        </div>
    </div>
    );
}

function LoginScreen({ onLogin, onBack }){
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    return(
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
            <div style={{
                maxWidth: 400, width: '100%', animation: 'slideUp 0.4s ease both',
            }}>
                <Logo onClick={onBack} style={{
                    marginBottom: 40,
                }}/>
                <h2 style={{
                    fontFamily: 'var(--font-display)', fontSize: 38,
                    letterSpacing: '0.06em', marginBottom: 8,
                }}>WELCOME BACK</h2>
                <p style={{
                    fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32,
                }}>Sign in to your account to continue</p>

                <InputField label="Username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
                <InputField label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
                <div stye={{
                    marginTop: 8, marginBottom: 24,
                }}>
                    <AuthButton label="SIGN IN" primary onClick={() => onLogin(username || 'Player')} />
                </div>

                <p style={{
                    textAlign: 'center', fontSize:  13, color: 'var(--text-secondary)',
                }}> Don't have an account? {' '}
                <button onClick={onBack} style={{
                    background: 'none', color: 'var(--accent)',
                    fontWeight: 600, fontSize: 13,
                }}>Sign Up</button>
                </p>
            </div>
        </div>
    );
}

function SignUpScreen({ onSignUp, onBack }) {
    const [form, setForm] = useState({username: '', password: '', email: '', dob: '', location: ''});
    const set = (key) => (e) => setForm(f => ({...f, [key]: e.target.value}));

    return(
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
            <div style={{
                maxWidth: 400, wodth: '100%', animation: 'slideUp 0.4s ease both',
            }}>
                <Logo onClick={onBack} style={{
                    marginBottom: 40,
                }}/>
                <h2 style={{
                    fontFamily: 'var(--font-display)', fontSize: 38,
                    letterSpacing: '0.06em', marginBottom: 0,
                }}>JOIN THE ACTION</h2>
                <p style={{
                    fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32,
                    }}>
                        Create your account and join the bask!
                    </p>
                    
                    <InputField label="Username" value={form.username} onChange={set('username')} placeholder="Username"/>
                    <InputField label="Password" value={form.password} onChange={set('password')} placeholder="Password"/>
                    <InputField label="Email" value={form.email} onChange={set('email')} placeholder="your@email.com"/>
                    <InputField label="Date of Birth" type="date" value={form.dob} onChange={set('dob')}/>
                    <InputField label="Location" value={form.location} onChange={set('location')} placeholder="Province, Country" />
                    <div style={{
                        marginTop: 8,
                    }}>
                        <AuthButton label="CREATE ACCOUNT" primary onClick={() => onSignUp(form.username || 'Player')}/>
                    </div>
                    <p style={{
                        textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 20}}>
                            Already have an account?{' '}
                            <button onClick={onBack} style={{
                                background: 'none', color: 'var(--accent)', fontWeight: 600, fontSize: 13,
                            }}>Sign In</button>
                    </p>
                </div>
            </div>
    );
}

// bet card
function BetCard({ title, subtitle, meta, stake, onBet }) {
    const [hover, setHover] = useState(false);
    const [betPlaced, setBetPlaced] = useState(false);

    const handleBet = () => {
        setBetPlaced(true);
        onBet && onBet();
        setTimeout(() => setBetPlaced(false), 2000);
    };

    return(
        <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
            background: hover? 'var(--bg-card-hover)' : 'var(--bg-card)',
            border: `1px solid ${hover ? 'var(--border-bright)' : 'var(--border)'}`,
            borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column',
            transition: 'all 0.2s', transform: hover ? 'translateY(-2px)' : 'none',
            boxShadow: hover ? 'o 8px 24px rgba(0, 0, 0, 0.3)' : 'none', animation: 'fadeIn 0.4s ease both',
        }}>
            {meta && (
                <div style={{
                    display: 'inline-flex', alignSelf: 'flex-start', background: 'rgba(198, 241, 53, 0.1)', color: 'car(--accent)',
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', padding: '3px 8px',
                    borderRadius: 6, marginBottom: 12, border: '1px solid rgba(198, 241, 52, 0.2)',
                }}>{meta}</div>
            )}
            <div style={{
                flex: 1,
            }}>
                <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: '0.04em',
                    color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 6,
                }}>{title}</div>
                <div style={{
                    fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
                    fontWeight: 500, marginBottom: 16,
                }}>{subtitle}</div>
            </div>
            <div style={{
                height: 1, background: 'var(--border)', marginBottom: 16,
            }}/>

            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
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
            <button onClick={handleBet} style={{
                background: betPlaced ? 'var(--succeess)' : 'var(--accent)',
                color: '#080A0F', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em', 
                padding: '11px', borderRadius: 8, border: 'none', cursor: 'pointer',
                transition: 'all 0.2s', transform: hover && !betPlaced ? 'none' : 'none',
            }}>
                {betPlaced? '✓ BET PLACED' : 'PLACE BET'}
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
                <Star size={32} color="car(--accent)"/>
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

function PlayersTab(){
    return(
        <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16,
        }}>
            {MOCK_PLAYERS.map((p, i) => (
                <div key={p.id} style={{
                    animationDelay: `$i * 0.05}s` }}>
                        <BetCard title={p.name} subtitle={`#${p.number}`} meta={p.pos} stake={p.stake}/>
                </div>
                ))}
        </div>
    );
}

function TeamsTab(){
    return(
        <div styles={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16,
        }}>
            {MOCK_PLAYERS.map((t, i) =>(
                <div key={t.id} style={{
                    animationDelay: `${i * 0.05}s`}}>
                        <BetCard title={t.name} subtitle={`#${t.record}`} stake={t.stake}/>
                </div>
            ))}
        </div>
    );
}

function GamesRow({g, i}) {
    const [hover, setHover] = useState(false);
    const [betPlaced, setBetPlaced] = useState(false);

    return(
        <div key={g.id} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} style={{
            background: hover ? 'var(--bg-card-hover)' : 'var(--bg-card)', 
            border: `1px solid ${hover ? 'var(--border-bright)' : 'var(--border)'}`,
            borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center',
            gap: 20, transition: 'all 0.2s', animation: 'fadeIn 0.4s ease both', 
            animationDelay: `${i * 0.07}s`, flexWrap: 'wrap',
        }}>
            <div style={{
                background: 'rgba(198, 241, 53, 0.1)', color: 'var(--accent)', fontSize: 11,
                fontWeight: 700, padding: '4px 10px', borderRadius: 6, 
                border: '1px solid rgba(198, 241, 53, 0.2)', fontFamily: 'var(--font-mono)', flexShrink: 0,
            }}>{g.spread}</div>
            <div style={{
                flex: 1, minWidth: 200,
            }}>
                <div style={{
                    fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: '0.04em', color: 'var(--text-primary)',
                }}>
                    {g.away} 
                    <span style={{
                        color: 'var(--text-muted)'
                    }}>@</span> {g.home}
                </div>
                <div style={{
                    fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontFamily: 'var(--font-mono)',
                }}>
                    {g.time} - Winner: <span style={{
                        color: 'var(--accent)',
                    }}>{g.winner}</span>
                </div>
            </div>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0,
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
                <button onClick={() => { setBetPlaced(true); setTimeout(() => setBetPlaced(false), 2000);}} style={{
                    background: betPlaced ? 'var(--success)' : 'var(--accent)', color: '#080A0F',
                    letterSpacing: '0.08em', padding: '10px 18px', borderRadius: 8, border: 'none',
                    cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
                }}>
                    {betPlaced ? '✓ PLACED' : 'PLACE BET'}
                </button>
            </div>
        </div>
    );
}

function GamesTab(){
    return(
        <div style={{
            display: 'flex', flexDirection: 'column', gap: 14,
        }}>
            {MOCK_GAMES.map((g, i) => (
                <GameRow key={g.id} g={g} i={i}/>
        ))}
        </div>
    );
}

// static messages for global chat
const SEED_MESSAGES = [
    { id: 1, user: 'GamabaGuoba01', initials: 'GG', color: '#C6F135', text: 'Have they tried scoring?'},
    { id: 2, user: 'SwedishGuy', initials: 'SG', color: '#38BDF8', text: 'dw we got this trust'},
    { id: 3, user: 'GambaGuoba01', initials: 'GG', color: '#C6F135', text: 'Mexico sweep :muscle:'},
    { id: 4, user: 'ImJustKen', initials: 'IJ', color: '#FB923C', text: 'Amerika ya :3'},
];

function GlobalChat(){
    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState(SEED_MESSAGES);

    const handleSubmit = () => {
        const trimmed = inputText.trim();
        if (!trimmed){
            return;
        }
        setMessages(prev => [
            ...prev,
            {id: Date.now(), user: 'You', initials: 'YO', color: 'var(--accent)', text: trimmed},
        ]);
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
                flex: 1, overflowY: 'auto', padding: '12px 12px 8px', display: 'flex', fledDirection: 'column', gap: 10,
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
            <div styles={{
                padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8,
                alignItems: 'center', flexShrink: 0, background: 'var(--bg-secondary)',
            }}>
                <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={handleKeyDown} placeholder="Say something..." style={{
                    flex: 1, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, 
                    padding: '8px 10px', fontSize: 12, color: 'var(--text-primary)', outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--accent)';}}
                onBlue={e => {e.target.style.borderColor = 'var(--border_';}}
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

function LiveTab(){
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
            <GlobalChat />
        </div>
    );
}

// main dashboard!
const TAB_CONFIG = [
    {key: TABS.PICKS, label: 'Your Picks', icon: <Star size={15} /> },
    {key: TABS.PLAYERS, label: 'Players', icon: <User size={15} /> },
    {key: TABS.TEAMS, label: 'Teams', icon: <Shield size={15} /> },
    {key: TABS.Games, label: "Games", icon: <Trophy size={15} /> },
    {key: TABS.LIVE, label: "Live", icon: <Radio size={15} />, live:true},
];

function Dashboard({username}){
    const [activeTab, setActiveTab] = useState(TABS.PICKS);
    const renderTabContent = () => {
        switch (activeTab){
            case TABS.PICKS: return <YourPicksTab/>;
            case TABS.PLAYERS: return <PlayersTab />;
            case TABS.TEAMS: return <TeamsTab />;
            case TABS.GAMES: return <GamesTab />;
            case TABS>LIVE: return <LiveTab />;
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
                                transition: 'all 0.2s', flexShrink: 0,
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
                        {TAB_CONFIG.findLast(t => t.key === activeTab)?.label.toUpperCase()}
                    </h2>
                    {activeTab !== TABS.PICKS && activeTab !== TABS.LIve && (
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
            background: hover ? 'var(--bg-card-hover)' : 'fontVariant(--bg-card)',
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

function ProfilePage({ username, onLogout}){
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
                </div>
                <div style={{
                    display: flex, gap: 10, marginBottom: 32,
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
                        <SettingsButton icon={<CreditCard size={16} />} label="Edit Card on File" />
                    </div>
                </div>
                <div style={{
                    marginTop: 28,
                }}>
                    <button onClick={onLogout} style={{
                        width: '10%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
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
                        e.currentTarget.style.background = 'rgba(255, 71, 87, 0.25)';
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
    const [activeTab, setActiveTab] = useState(TABS.PICKS);
    
    const handleLogin = useCallback((name) => {
        setUsername(name);
        setScreen(SCREENS.DASHBOARD);
    }, []);

    const handleSignUp = useCallback((name) => {
        setUsername(name);
        setScreen(SCREENS.DASHBOARD);
    }, []);

    const handleLogout = useCallback(() => {
        setUsername('');
        setScreen(SCREENS.LANDING);
    }, []);

    const handleLogoClick = useCallback(() => {
        if (screen === SCREENS.PROFILE){
            setScreen(SCREENS.DASHBOARD);
            setActiveTab(TABS.PICKS);
        }
    }, [screen]);

    const handleAvatarClick = useCallback(() => {
        setScreen(SCREENS.PROFILE);
    }, []);

    return (
        <>
        <Head>
            <title>GatorGambling</title>
            <meta name="description" content="Chomp at the bet!" />
            <meta name = "viewport" content="width=device-width, initial-scale=1" />
            <link rel="icon" href="/favicon.ico" />
        </Head>

        <Header screen={screen} onLogoClick={handleLogoClick} onAvatarClick={handleAvatarClick} username={username} />
        {screen === SCREENS.LANDING && (
            <LandingScreen onSignUp={() => setScreen(SCREENS.SIGNUP)} onLogin={() => setScreen(SCREENS.LOGIN)}
            />
        )}

        {screen === SCREENS.LOGIN && (
            <LoginScreen onLogin={handleLogin} onBack={() => setScreen(SCREENS.LANDING)}
            />
        )}

        {screen === SCREENS.SIGNUP && (
            <SignUpScreen onSignUp={handleSignUp} onBack={() => setScreen(SCREENS.LANDING)}
                />
        )}

        {screen === SCREENS.DASHBOARD && (
            <Dashboard username={username} />
        )}

        {screen === SCREENS.PROFILE && (
            <ProfilePage username={username} onLogout={handleLogout} />
        )}
        </>
    )
}