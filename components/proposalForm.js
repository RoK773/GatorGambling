// A means for users to create proposal stakes to be sent to the moderator dashboard
import {useState, useEffect, useRef, useCallback } from 'react';
import worldcupData from '../data/worldcup2022.json';
const PLAYER_STATS = ['Goals', 'Fouls'];
const COMPARATORS = ['Over', 'Under', 'Exactly'];
const TEAM_RESULTS = ['Wins', 'Loses'];
const MARGIN_TYPES = ['By More Than', 'By Less Than', 'By Exactly'];
const CATEGORIES = ['Player', 'Team'];

function getNextBracketMatch(bracketState) {
    const rounds = Array.isArray(bracketState?.rounds) ? bracketState.rounds : [];
    for (let roundIndex = 0; roundIndex < rounds.length; roundIndex += 1) {
        const matches = Array.isArray(rounds[roundIndex]?.matches) ? rounds[roundIndex].matches : [];
        for (let matchIndex = 0; matchIndex < matches.length; matchIndex += 1) {
            const match = matches[matchIndex];
            if (match?.home && match?.away && !match?.winner) {
                return {
                    roundIndex,
                    matchIndex,
                    matchId: match.id,
                    home: match.home,
                    away: match.away,
                };
            }
        }
    }
    return null;
}

// tiny selection - allows for dropdown selection
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

// tiny input - allows for numerical input
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

// searchable dropdown - allows for searching within a dropdown
function SearchableDropdown({items, onSelect, placeholder = 'Search...', loading = false, disabled = false}){
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const containerRef = useRef(null);

    // filter item list to whose label contains the input string
    const filtered = items
        .filter(item => item.label.toLowerCase().includes(query.toLowerCase()));

    // close dropdown when user clicks outside of the component
    useEffect(() => {
        function handleClickOutside(e) {
            if (containerRef.current && !containerRef.current.contains(e.target)){
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    // lock in chosen item & collapse list
    const handleSelect = (item) => {
        setSelected(item);
        setQuery('');
        setOpen(false);
        onSelect(item);
    };

    // clear current selection
    const handleClear = () => {
        setSelected(null);
        setQuery('');
        onSelect(null);
    };

    const isLocked = Boolean(selected);

    return (
        <div ref={containerRef} style={{
            position: 'relative',
        }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: 6, backgoround: 'var(--bg-primary)', border: `1px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 9, padding: '10px 12px', transition: 'border-color 0.2s', opacity: disabled ? 0.5 : 1,
            }}>
                {/*search icon*/}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                {isLocked ? ( 
                    <span style={{
                        flex: 1, fontSize: 13, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.03em',
                    }}>{selected.label}</span>
                ) : (
                    <input type="text" value={query} placeholder={loading ? 'Loading...' : placeholder} disabled={disabled || loading}
                        onChange={e => {setQuery(e.target.value); setOpen(true);}} onFocus={() => setOpen(true)} style={{
                            flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)',
                        }}
                    />
                )}
                {/* claer button (only available when locked) */}
                {isLocked && (
                    <button onClick={handleClear} style={{
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex', alignItems: 'center', transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    title= "Clear selection"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
                )}
            </div>

            {/* dropdown list, only visible while searching */}
            {open && !isLocked && (
                <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 600, background: 'var(--bg-card)', 
                    border: '1px solid var(--border-bright)', borderRadius: 10, marginTop: 4, overflow: 'hidden', 
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)', maxHeight: 260, overflowY: 'auto',
                }}>
                    {filtered.length === 0 ? (
                        <div style={{
                            padding: '12px 14px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center',
                        }}>
                            {query ? 'No matches found.' : 'Start typing to search.'}
                        </div>
                    ) : filtered.map(item => (
                        <button key={item.id} onMouseDown={() => handleSelect(item)} style={{
                            display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none',
                            border: 'none', borderBottom: '1px solid var(-border)', cursor: 'pointer', fontSize: 13, color: 'var(--text-primary)', transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                        onMouseLeave={e=> e.currentTarget.style.background = 'none'}
                        >
                            <span style={{
                                fontWeight: 700,
                            }}>{item.label}</span>
                            {item.hint && (
                                <span style={{display: 'block', fontSize: 10, color: 'var(--text-muted)', marginTop: 1}}>
                                    {item.hint}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// read=only metarow that renders a label/value pair for auto-populated fields
function MetaRow({label, value}) {
    return(
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-primary', borderRadius: 8, marginBottom: 6,
        }}>
            <span style={{
                fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em',
            }}>
                {label.toUpperCase()}
            </span>
            <span style={{
                fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 60,
            }}>
                {value || '-'}
            </span>
        </div>
    );
}

// player condition builders - condition, comparator, number 
function PlayerConditionBuilder({ value, onChange, disabled}) {
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
                        <PillSelect value={stat} onChange={e => update({statType: e.target.value})} options={PLAYER_STATS} minWidth={118} disabled={disabled}/>
                        <PillSelect value={comparator} onChange={e => update({comparator: e.target.value})} options={COMPARATORS} minWidth={82} disabled={disabled}/>
                        <PillNumber value={condVal} onChange={e => update({condVal: e.target.value})} placeholder="0" disabled={disabled}/>
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

// team condition builder - condition, comparator, number
function TeamConditionBuilder({ value, onChange, disabled}) {
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
                    <PillSelect value={result} onChange={e => update({result: e.target.value})} options={TEAM_RESULTS} minWidth={80} disabled={disabled} />
                    <PillSelect value={margin} onChange={e => update({marginType: e.target.value})} options={MARGIN_TYPES} minWidth={110} disabled={disabled}/>
                    <PillNumber value={isDraw ? '' : condVal} onChange={e => update({condVal: e.target.value})} placeholder="pts" disabled={disabled || isDraw}/>
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

// yippie main export (make it a thing)
export default function ProposalForm({onSubmit, username, isProposalsOpen = true}) {
    // define constants
    const [open, setOpen] = useState(false);
    const [category, setCategory] = useState('Player');
    const [playerOptions, setPlayerOptions] = useState([]);
    const [teamOptions, setTeamOptions] = useState([]);
    const [loadingPlayers, setLoadingPlayers] = useState(false);
    const [loadingTeams, setLoadingTeams] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [condition, setCondition] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [nextMatch, setNextMatch] = useState(null);
    const [loadingNextMatch, setLoadingNextMatch] = useState(false);

    const allowedTeamNames = new Set(
        [nextMatch?.home?.name, nextMatch?.away?.name]
            .map(name => String(name || '').trim())
            .filter(Boolean),
    );

    // load next bracket match so proposals are limited to the current game.
    useEffect(() => {
        if (!open) {
            return;
        }

        let cancelled = false;

        const loadNextMatch = async () => {
            setLoadingNextMatch(true);
            try {
                const response = await fetch('/api/bracket');
                const data = await response.json().catch(() => ({}));
                if (!response.ok || cancelled) {
                    return;
                }

                const upcomingMatch = getNextBracketMatch(data?.bracket?.bracketState);
                if (!cancelled) {
                    setNextMatch(upcomingMatch);
                }
            } catch {
                if (!cancelled) {
                    setNextMatch(null);
                }
            } finally {
                if (!cancelled) {
                    setLoadingNextMatch(false);
                }
            }
        };

        void loadNextMatch();

        return () => {
            cancelled = true;
        };
    }, [open]);

    // load player list from bundled world cup data
    useEffect(() => {
        if (!open || !nextMatch){
            return;
        }

        setLoadingPlayers(true);
        try {
            const teams = Array.isArray(worldcupData?.teams) ? worldcupData.teams : [];
            const playableTeamNames = new Set(
                [nextMatch?.home?.name, nextMatch?.away?.name]
                    .map(name => String(name || '').trim())
                    .filter(Boolean),
            );
            const eligibleTeams = teams.filter(team => playableTeamNames.has(String(team?.name || '').trim()));
            const filteredPlayers = eligibleTeams.flatMap(team => {
                const teamName = String(team?.name || '').trim() || 'Unknown Team';
                const teamPlayers = Array.isArray(team?.players) ? team.players : [];
                return teamPlayers.map((player, playerIndex) => {
                    const playerName = String(player?.name || '').trim() || 'Unknown Player';
                    const id = `${team?.id ?? 'team'}-${playerIndex}-${playerName}`;
                    return {
                        id,
                        label: playerName,
                        hint: `#1 · ${teamName}`,
                        number: '1',
                        team: teamName,
                        raw: player,
                    };
                });
            });
            setPlayerOptions(filteredPlayers);
        } catch (err) {
            console.error('Failed to load player options from worldcup2022.json:', err);
        } finally {
            setLoadingPlayers(false);
        }
    }, [open, nextMatch]);

// fetch teams list 
useEffect(() => {
    if (!open || !nextMatch) {
        return;
    }
    setLoadingTeams(true);
    try {
        const teams = Array.isArray(worldcupData?.teams) ? worldcupData.teams : [];
        const playableTeamNames = new Set(
            [nextMatch?.home?.name, nextMatch?.away?.name]
                .map(name => String(name || '').trim())
                .filter(Boolean),
        );
        setTeamOptions(teams.filter(team => playableTeamNames.has(String(team?.name || '').trim())).map(team => {
            const group = String(team?.group || '').trim() || '-';
            const placement = Number.isFinite(Number(team?.placement)) ? Number(team.placement) : null;
            const record = placement !== null ? `Group ${group} / Place ${placement}` : `Group ${group}`;
            return {
                id: String(team?.id ?? '').trim() || String(team?.name || '').trim(),
                label: String(team?.name || '').trim() || 'Unknown Team',
                hint: record,
                record,
                raw: team,
            };
        }));
    } catch (err) {
        console.error('Failed to load team options from worldcup2022.json:', err);
    } finally {
        setLoadingTeams(false);
    }
    }, [open, nextMatch]);

    // helpers

    // reset values when a new form is made
    const resetAndClose = useCallback(() => {
        setOpen(false);
        setCategory('Player');
        setSelectedPlayer(null);
        setSelectedTeam(null);
        setCondition({});
        setError('');
        setSubmitted(false);
        setSubmitting(false);
    }, []);

    // category changes (catChange <-- for ctrl+F scrubbing)
    const handleCategoryChange = (cat) => {
        setCategory(cat);
        setSelectedPlayer(null);
        setSelectedTeam(null);
        setCondition({});
        setError('');
    };

    // submission
    const handleSubmit = async () => {
        setError('');

        if (!isProposalsOpen) {
            setError('Proposals are currently closed. They reopen after replay settlement and before the next simulation starts.');
            return;
        }

        if (loadingNextMatch) {
            setError('Loading current bracket matchup. Please wait a moment.');
            return;
        }

        if (!nextMatch) {
            setError('No current bracket matchup is available for proposals right now.');
            return;
        }

        if (category === 'Player' && !selectedPlayer){
            setError('Please select a player from the dropdown before submitting.');
            return;
        }
        if (category === 'Team' && !selectedTeam){
            setError('Please select a team from the dropdown before submitting.');
            return;
        }
        if (category === 'Player' && selectedPlayer && !allowedTeamNames.has(String(selectedPlayer.team || '').trim())) {
            setError('Player proposals are limited to players in the current bracket matchup.');
            return;
        }

        if (category === 'Team' && selectedTeam && !allowedTeamNames.has(String(selectedTeam.label || '').trim())) {
            setError('Team proposals are limited to teams in the current bracket matchup.');
            return;
        }
        
        // proposal payload
        const proposal = {
            category, 
            username: username || 'anonymous',
            condition,
            playerData: category === 'Player' && selectedPlayer ? {
                playerId: selectedPlayer.id,
                name: selectedPlayer.label,
                number: '1',
                team: selectedPlayer.team,
            } : undefined,
            teamData: category === 'Team' && selectedTeam ? {
                teamId: selectedTeam.id,
                country: selectedTeam.label,
                record: selectedTeam.record,
            } : undefined,
        };
        
        setSubmitting(true);

        try{
            await onSubmit(proposal);
            setSubmitted(true);
            setTimeout(resetAndClose, 1600);
        } catch(err) {
            setError(err?.message || 'Failed to submit proposal. Please try again.');
            setSubmitting(false);
        }
    };

    return ( 
        // style main export -- button to expand the proposal form
        <>
        <button onClick={() => {
            if (!isProposalsOpen) {
                return;
            }
            setOpen(true);
        }} disabled={!isProposalsOpen} style={{
            position: 'fixed', bottom: 30, right: 30, zIndex: 30, display: 'flex', alignItems: 'center', gap: 10, background: 'var(--accent)', 
            color: '#080A0F', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', 
            padding: '14px 24px', borderRadius: 50, border: 'none', cursor: isProposalsOpen ? 'pointer' : 'not-allowed', boxShadow: '0 8px 32px var(--accent-glow-strong)', transition: 'all 0.2s', opacity: isProposalsOpen ? 1 : 0.65,
        }} onMouseEnter={e => {
            if (!isProposalsOpen) {
                return;
            }
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
            e.currentTarget.style.boxShadow = '0 14px 44px var(--accent-glow-strong)';
        }} onMouseLeave={e => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 8px 32px var(--accent-glow-strong)';
        }} title={isProposalsOpen ? 'Propose a new bet' : 'Proposals are currently closed'}>
            <svg width="17" height="17" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLineJoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            PROPOSE BET
        </button>
        {/* form settings once form is open */}
        {open && ( <div onClick={resetAndClose} style={{
            position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0, 0, 0, 0.78)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 0.15s ease',
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 18, padding: '28px 26px',
                maxWidth: 440, width: '100%', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 28px rgba(0, 0, 0, 0.7)', animation: 'slideUp 0.22s ease',
            }}>
                {/* inner form styling */}
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
                    marginBottom: 14,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    letterSpacing: '0.06em',
                    color: 'var(--text-secondary)',
                }}>
                    {loadingNextMatch
                        ? 'CURRENT MATCHUP: LOADING...'
                        : nextMatch
                        ? `CURRENT MATCHUP: ${nextMatch.home?.name || 'HOME'} VS ${nextMatch.away?.name || 'AWAY'}`
                        : 'CURRENT MATCHUP: NOT AVAILABLE'}
                </div>
                <div style={{
                    marginBottom: 18,
                }}>
                    {/*Define categories for betting / betCat <-- for ctrl+F scrubbing */}
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

                {/* player category */}
                {category === 'Player' && (
                    <div style={{ 
                        background: 'var(--bg-secondary)', borderRadius: 12, padding: '18px 16px', marginBottom: 14, border: '1px solid var(--border)',
                        }}>
                        <div style={{
                            marginBottom: 10,
                        }}>
                            <label style={{
                                display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6,
                            }}>Player Name</label>
                            <SearchableDropdown items={playerOptions} onSelect={item => {setSelectedPlayer(item); setCondition({});}}
                            placeholder="Search players..." loading={loadingPlayers} disabled={loadingPlayers || !nextMatch} />
                            </div>
                            {selectedPlayer && (
                                <div style={{
                                    marginTop: 12,
                                }}>
                                    <div style={{
                                        fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.01em', textTransform: 'uppercase', marginBottom: 6,
                                    }}>Player Details (auto-filled)</div>
                                    <MetaRow label="Jersey #" value={selectedPlayer.number} />
                                    <MetaRow label="Team / Nat." value={selectedPlayer.team} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* team category */}
                        {category === 'Team' && (
                            <div style={{
                                background: 'var(--bg-secondary)', borderRadius: 12, padding: '18px 16px', marginBottom: 14, border: '1px solid var(--border)',
                            }}>
                                <div style={{
                                    marginBottom: 10,
                                }}>
                                    <label style={{
                                        display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6,
                                    }}>Team Name</label>
                                    <SearchableDropdown items={teamOptions} onSelect={item => {setSelectedTeam(item); setCondition({});}}
                                    placeholder="Search teams..." loading={loadingTeams} disabled={loadingTeams || !nextMatch} />
                                    </div>
                                    {selectedTeam && (
                                        <div style={{
                                            marginTop: 12,
                                        }}>
                                            <div style={{
                                                fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.01em', textTransform: 'uppercase', marginBottom: 6,
                                            }}>Team Details (auto-filled)</div>
                                            <MetaRow label="Record" value={selectedTeam.record} />
                                        </div>
                                    )}
                                </div>
                        )}

                        {/* condition builders */}
                        {category === 'Player' && (
                            <PlayerConditionBuilder value={condition} onChange={setCondition} disabled={!selectedPlayer}/>
                        )}
                        {category === 'Team' && (
                            <TeamConditionBuilder value={condition} onChange={setCondition} disabled={!selectedTeam} />
                        )}
                {error && (
                    <p style={{
                        fontSize: 13, color: 'var(--danger)', fontWeight: 600, marginBottom: 14, padding: '10px 14px', 
                        background: 'rgba(255, 71, 87, 0.08)', border: '1px solid rgba(255, 71, 87, 0.2)', borderRadius: 8,
                    }}>{error}</p>
                )}
                {/* submit button */}
                <button onClick={handleSubmit} disabled={submitted || loadingNextMatch || !nextMatch || !isProposalsOpen} style={{
                    width: '100%', padding: '14px', borderRadius: 11, fontWeight: 700, fontSize: 14, letterSpacing: '0.08em',
                    background: submitted ? 'var(--success)' : 'var(--accent)', color: '#080A0F', border: 'none', 
                    cursor: submitted || loadingNextMatch || !nextMatch || !isProposalsOpen ? 'not-allowed' : 'pointer', transition: 'background 0.3s', opacity: submitting || loadingNextMatch || !nextMatch || !isProposalsOpen ? 0.7 : 1,
                }}
                >
                {submitted ? '✓ PROPOSAL SUBMITTED' : (!isProposalsOpen ? 'PROPOSALS CLOSED' : 'SUBMIT PROPOSAL')}
                </button>
            </div>
        </div>
        )}
    </>
    );

}