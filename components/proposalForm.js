// A means for users to create proposal stakes to be sent to the moderator dashboard
import {useState} from 'react';
const PLAYER_STATS = ['Goals', 'Assists', 'Fouls', 'Shots on Target', 'Saves', 'Minutes Played'];
const COMPARATORS = ['Over', 'Under', 'Exactly'];
const TEAM_RESULTS = ['Wins', 'Losses', 'Draws'];
const MARGIN_TYPES = ['By More Than', 'By Less Than', 'By Exactly'];

// tiny selection 
function PillSelect({value, onChange, options, minWidth = 100, disabled = false}) {
    return (
        <div style ={{
            position: 'relative', display: 'inline-flex', alignItems: 'center',
        }}>
            <select value={value} onChange={onChange} disabled={disabled} style={{
                appearance: 'none', WebkitAppearance: 'none', background: disabled ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                border: '1px solid var(--border)', borderRadius: 7, padding: '7px 26px 7px 10px',
                fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: disabled ? 'var(--text-muted)' : 'var(--text-primary)', 
                cursor: disabled ? 'not-allowed' : 'pointer', outline: 'none', minWidth, opacity: disabled ? 0.5 : 1, transition: 'border-color 0.2s',
            }} onFocus={e => {
                if (!disabled) e.target.style.borderColor = 'var(--accent)'; }}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}>
                {options.map(o =>(
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

function PillNumber({value, onChange, disabled = false, placeholder = '0'}) {
    return (
        <input type="number" value={value} onChange={onChange} disabled={disabled} min={0} max={999} placeholder={placeholder} style={{
            width: 62, background: disabled ? 'var(--bg-secondary)' : 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 7,
            padding: '7px 8px', fontSize: 12, fontWeight: 700, color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
            fontFamily: 'var(--font-mono)', textAlign: 'center', outline: 'none', opacity: disabled ? 0.5 : 1,
        }} onFocus={e => {
            if (!disabled) e.target.style.borderColor = 'var(--accent)';
        }} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
    );
}

// player / team / game condition builders
function PlayerConditionBuilder({ value, onChange}) {
    const stat = value.statType || PLAYER_STATS[0];
    const comparator = value.comparator || COMPARATORS[0];
    const condVal = value.condVal || '';
    const update = (patch) => onChange({...value, statType: stat, comparator, condVal, ...patch});
    const preview = condVal ? `${stat} - ${comparator} ${condVal}` : null;
    return (
        <div style={{
            marginBottom: 14}}>
                <div style={{
                    fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8,
                }}>Bet Condition </div>
                <div style={{
                    background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 12px 10px',
                    display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                    <div style={{
                        display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
                    }}>
                        <PillSelect value={stat} onChange={e => update({statType: e.target.value})} options={PLAYER_STATS} minWidth={118}/>
                        <PillSelect value={comparator} onChange={e => update({comparator: e.target.value})} options={COMPARATORS} minWidth={82} />
                        <PillNumber value={condVal} onChange={e => update({condVal: e.target.value})} placeholder="0" />
                    </div>
                    {preview && (
                        <div style={{
                            fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em'
                        }}>
                            ! {preview}
                            </div>
                    )}
                </div>
            </div>
    );
}

function TeamConditionBuilder({ value, onChange}) {
    const result = value.result || TEAM_RESULTS[0];
    const margin = value.marginType || MARGIN_TYPES[0];
    const condVal = value.condVal || '';
    const isDraw = result === 'Draws';
    const update = (patch) => onChange({...value, result, marginType: margin, condVal, ...patch});
    const preview = isDraw? 'Draws' : condVal ? `${result} - ${margin} ${condVal}` : null;
    return (
        <div style={{
            marginBottom: 14,
        }}>
            <div style={{
                fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8,
            }}>Bet Condition</div>
            <div style={{
                background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 12px 10px',
                display: 'flex', flexDirection: 'column', gap: 8,
            }}>
                <div style={{
                    display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center',
                }}>
                    <PillSelect value={result} onChange={e => update({result: e.target.value})} options={TEAM_RESULTS} minWidth={80} />
                    <PillSelect value={margin} onChange={e => update({marginType: e.target.value})} options={MARGIN_TYPES} minWidth={110} disabled={isDraw}/>
                    <PillNumber value={isDraw ? '' : condVal} onChange={e => update({condVal: e.target.value})} disabled={isDraw} placeholder="pts"/>
                </div>
                {preview && (<div style={{
                    fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em',
                }}>
                    ! {preview}
                </div>
                )}
            </div>
        </div>
    );
}

function GameConditionBuilder({value, onChange, homeTeam, awayTeam}) {
    const outcome = value.outcome || 'Home Team Wins';
    const homeScore = value.homeScore || '';
    const awayScore = value.awayScore || '';
    const showScore = value.showScore || false;
    const update = (patch) => onChange({...value, outcome, homeScore, awayScore, showScore, ...patch});
    const outcomeLabel = outcome === 'Home Team Wins' ? (homeTeam || 'Home') : outcome === 'Away Team Wins' ? (awayTeam || 'Away') : 'Draw';
    const preview = showScore && homeScore !== '' && awayScore !== '' ? `${outcomeLabel} - ${homeTeam || 'Home'} ${homeScore} : ${awayScore} ${awayTeam || 'Away'}` : `${outcomeLabel} wins`;
    return (
        <div style={{
            marginBottom: 14,
        }}>
            <div style={{
                fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.12em', textTransform: 'upperCase', marginBottom: 8,
            }}>Bet Condition</div>
            <div style={{
                background: 'var(--bg-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 12px 10px', display: 'flex', flexDirection: 'column', gap: 8,
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                }}>
                    <span style={{
                        fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em',
                    }}>WINNER</span>
                    <PillSelect value={outcome} onChange={e => update({outcome: e.target.value})} options={[
                        {value: 'Home Team Wins', label: `${homeTeam || 'Home'} wins`},
                        {value: 'Away Team Wins', label: `${awayTeam || 'Away'} wins`},
                        {value: 'Draw', label: `Draw`},
                    ]}
                    minWidth={150}
                    />
                </div>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                }}>
                    <button type="button" onClick={() => update({showScore: !showScore})} style={{
                        display: 'flex', alignItems: 'center', gap: 5, background: showScore ? 'rgba(198, 241, 53, 0.1)' : 'transparent',
                        border: showScore ? '1px solid rgba(198, 241, 53, 0.3)' : '1px solid var(--border)', borderRadius: 6, padding: '5px 10px',
                        cursor: 'pointer', fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', 
                        color: showScore ? 'var(--accent)' : 'var(--text-muted)', transition: 'all 0.2s',
                    }}>{showScore ? '!' : '-'}PREDICT SCORE</button>
                    {showScore && ( <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                        <span style={{
                            fontSize: 9, color: 'var(--text-muted)', fontWeight: 700,
                        }}>{homeTeam || 'HOME'}</span>
                        <PillNumber value={homeScore} onChange={e => update({homeScore: e.target.value})}/>
                        <span style={{
                            color: 'var(--text-muted)', fontWeight: 700,
                        }}>-</span>
                        <PillNumber value={awayScore} onChange={e => update({awayScore: e.target.value})} />
                         <span style={{
                            fontSize: 9, color: 'var(--text-muted)', fontWeight: 700,
                        }}>{awayTeam || 'AWAY'}</span>
                        </div>
                        )}
                </div>
                <div style={{
                    fontSize: 10, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em',
                }}>
                    ! {preview}
                </div>
            </div>
        </div>
    );
}

// field definitions - connection builders are separate, these are text/date fields
const FIELD_CONFIGS ={
    Player: [
        {key: 'playerName', label: 'Player Name', placeholder: 'e.g. Auston Matthews', type: 'text'},
        {key: 'number', label: 'Jersey Number', placeholder: 'e.g. 34', type: 'text'},
        {key: 'nationality', label: 'Nationality', placeholder: 'e.g. MEX', type: 'text'},
        {key: 'stake', label: 'Proposed Stake', placeholder: 'e.g. $10', type: 'text'},
    ],
    Team: [
        {key: 'teamName', label: 'Team Name', placeholder: 'e.g. Canada', type: 'text'},
        {key: 'record', label: 'Record', placeholder: 'e.g. 5-3', type: 'text'},
        {key: 'stake', label: 'Proposed Stake', placeholder: 'e.g. $10', type: 'text'},
    ],
    Game: [
        {key: 'homeTeam', label: 'Home Team', placeholder: 'e.g. Canada', type: 'text'},
        {key: 'awayTeam', label: 'Away Team', placeholder: 'e.g. Sweden', type: 'text'},
        {key: 'gameTime', label: 'Game Time', placeholder: 'e.g. 6:00 PM', type: 'text'},
        {key: 'spread', label: 'Spread', placeholder: 'e.g. -3.5', type: 'text'},
        {key: 'stake', label: 'Proposed Stake', placeholder: 'e.g. $10', type: 'text'},
    ],
};

// for general use
const CATEGORIES = ['Player', 'Team', 'Game'];

// sub components 
function ModalField({label, value, onChange, placeholder, type='text'}) {
    return (
        <div style={{
            marginBottom: 14,
        }}>
            <label style={{
                display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6,
            }}>{label}</label>
            <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{
                width: '100%', boxSizing: 'border-box', background: 'var(--bg-secondary)', borderRadius: 9,
                padding: '11px 14px', fontSize: 13, color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s, box-shadow: 0.2s',
            }} onFocus={e => {
                e.target.style.borderColor = 'var(--accent)';
                e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
            }} onBlur ={e => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'none';
            }} />
        </div>
    );
}

// yippie main export (make it a thing)
export default function ProposalForm({onSubmit}) {
    const [open, setOpen] = useState(false);
    const [category, setCategory] = useState('Player');
    const [fields, setFields] = useState({});
    const [condition, setCondition] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const setField = (key, val) => setFields(prev => ({...prev, [key]: val}));

    // reset values
    const resetAndClose = () => {
        setOpen(false);
        setFields({});
        setCondition({});
        setCategory('Player');
        setError('');
        setSubmitted(false);
    };

    // category changes
    const handleCategoryChange = (cat) => {
        setCategory(cat);
        setFields({});
        setCondition({});
        setError('');
    };

    // submission
    const handleSubmit = () => {
        const config = FIELD_CONFIGS[category];
        const missing = config.filter(f => !fields[f.key]?.trim());
        if (missing.length > 0) {
            setError(`Please fill in: ${missing.map(f => f.label).join(', ')}`);
            return;
        }
        setError('');

        onSubmit({
            id:Date.now(), category, ...fields, condition, proposedAt: new Date().toISOString(), status: 'pending',
        });

        setSubmitted(true);
        setTimeout(resetAndClose, 1600);
    };

    return ( 
        <>
        <button onClick={() => setOpen(true)} style={{
            position: 'fixed', bottom: 30, right: 30, zIndex: 30, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--accent)', 
            color: '#080A0F', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', 
            padding: '14px 24px', borderRadius: 50, border: 'none', cursor: 'pointer', boxShadow: '0 8px 32px var(--accent-glow-strong)', transition: 'all 0.2s',
        }} onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
            e.currentTarget.style.boxShadow = '0 14px 44px var(--accent-glow-strong)';
        }} onMouseLeave={e => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 8px 32px var(--accent-glow-strong)';
        }} title="Propose a new bet">
            <svg width="17" height="17" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLineJoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            PROPOSE BET
        </button>
        {open && ( <div onClick={resetAndClose} style={{
            position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0, 0, 0, 0.78)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 0.15s ease',
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 18, padding: '28px 26px',
                maxWidth: 440, width: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 28px rgba(0, 0, 0, 0.7)', animation: 'slideUp 0.22s ease',
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6,
                }}>
                    <h2 style={{
                        fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: '0.06em', color: 'var(--text-primary)',
                    }}>PROPOSE A BET</h2>
                    <button onClick={resetAndClose} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, transition: 'color 0.2s',
                    }} 
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="10" y1="6" x2="6" y2="10"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <p style={{
                    fontSize: 13, color: 'var(--text-secondary)', marginBottom: 22, lineHeight: 1.5,
                }}>Submit your idea to GatorGambling for moderator approval.</p>
                <div style={{
                    marginBottom: 18,
                }}>
                    <label style={{
                        display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8,
                    }}>Bet Category</label>
                    <div style={{
                        display: 'flex', gap: 8,
                    }}>
                        {CATEGORIES.map(cat => (
                            <button key={cat} onClick={() => handleCategoryChange(cat)} style={{
                                flex: 1, padding: '10px 8px', borderRadius: 9, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', 
                                cursor: 'pointer', transition: 'all 0.2s', background: category === cat ? 'rgba(198, 241, 53, 0.12)' : 'var(--bg-secondary)',
                                border: category === cat ? '1px solid rgba(198, 241, 53, 0.4)' : '1px solid var(--border)',
                                color: category === cat ? 'var(--accent)' : 'var(--text-muted)',
                            }}>{cat.toUpperCase()}</button>
                        ))}
                    </div>
                </div>
                <div style={{
                    background: 'var(--bg-secondary)', borderRadius: 12, padding: '18px 16px', marginBottom: 14, border: '1px solid var(--border)',
                }}>
                    {FIELD_CONFIGS[category].map(f => (
                        <ModalField key={f.key} label={f.label} value={fields[f.key] || ''} onChange={e => setField(f.key, e.target.value)} placeholder={f.placeholder} type={f.type}/>
                    ))}
                </div>
                {category === 'Player' && (
                    <PlayerConditionBuilder value={condition} onChange={setCondition}/>
                )}
                {category === 'Team' && (
                    <TeamConditionBuilder value={condition} onChange={setCondition}/>
                )}
                {category === 'Game' && (
                    <GameConditionBuilder value={condition} onChange={setCondition} homeTeam={fields.homeTeam || ''} awayTeam={fields.awayTeam || ''} />
                )}
                {error && (
                    <p style={{
                        fontSize: 13, color: 'var(--danger)', fontWeight: 600, marginBottom: 14, padding: '10px 14px', 
                        background: 'rgba(255, 71, 87, 0.08)', border: '1px solid rgba(255, 71, 87, 0.2)', borderRadius: 8,
                    }}>{error}</p>
                )}
                <button onClick={handleSubmit} disabled={submitted} style={{
                    width: '100%', padding: '14px', borderRadius: 11, fontWeight: 700, fontSize: 14, letterSpacing: '0.08em',
                    background: submitted ? 'var(--success)' : 'var(--accent)', color: '#080A0F', border: 'none', 
                    cursor: submitted ? 'default' : 'pointer', transition: 'background 0.3s',
                }}
                >
                {submitted ? '✓ PROPOSAL SUBMITTED' : 'SUBMIT PROPOSAL'}
                </button>
            </div>
        </div>
        )}
    </>
    );

}