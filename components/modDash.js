// sets up the moderator dashboard - will be rendered in place of the standard dashboard when the user role is set to moderator
import {useState} from 'react';
import ConfirmModal from './confirmModal';

// drawing icons
const Icon = {
    Check: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
        </svg>
    ),
    X: ({size = 14}) => (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
    ),
    Trash: () => (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 61-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
        </svg>
    ),
    Ban: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
    ),
    Shield: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V51-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
    ),
    Inbox: () => (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoint="round">
            <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2 v-61-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
        </svg>
    ),
};

// tab configuration
const MOD_TABS = {
    PROPOSALS: 'proposals',
    PLAYERS: 'players',
    TEAMS: 'teams',
    GAMES: 'games',
    LIVE: 'live',
};

const MOD_TAB_CONFIG = [
    {key: MOD_TABS.PROPOSALS, label: 'User Proposals', badge: true},
    {key: MOD_TABS.PLAYERS, label: 'Players'},
    {key: MOD_TABS.TEAMS, label: 'Teams'},
    {key: MOD_TABS.GAMES, label: 'Games'},
    {key: MOD_TABS.LIVE, label: 'Live', live: true},
];

// triggers the confirmmodal and resolves to true or false for the action
function useConfirm() {
    const [state, setState] = useState(null);
    const confirm = ({title, message, confirmLabel = 'CONFIRM', confirmDanger = false}) =>
        new Promise(resolve => {
            setState({
                title, message, confirmLabel, confirmDanger, resolve,
            });
        });
    const handleConfirm = () => {
        state?.resolve(true);
        setState(null);
    };
    const handleCancel = () => {
        state?.resolve(false);
        setState(null);
    };
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
    if (category === 'Player'){
        const {statType, comparator, condVal} = condition;
        if (!condVal){
            return null;
        }
        return `${statType || 'Goals'} - ${comparator || 'Over'} ${condVal}`;
    }
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
function ProposalsTab({proposals, onApprove, onDecline}){
    if (proposals.length === 0){
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
        <div style={{
            display: 'flex', flexDirection: 'column', gap: 14, animation: 'fadeIn 0.4s ease',
        }}>
            {proposals.map((p, i) => (
                <ProposalCard key={p.id} proposal={p} index={i} onApprove={onApprove} onDecline={onDecline} />
            ))}
        </div>
    );
}

// build the proposal card
function ProposalCard({ proposal, index, onApprove, onDecline}) {
    const submittedAt = proposal.proposedAt ? new Date(proposal.proposedAt).toLocaleString() : 'Unknown';
    const detailKeys = Object.entries(proposal).filter(
        ([k]) => !['id', 'category', 'proposedAt', 'status', 'condition'].includes(k)
    );
    return (
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
                        background: 'rgba(198, 241, 53, 0.1)', border: '1px solid rgba(198, 241, 53, 0.25',
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
                    <button onClick={() => onApprove(proposal.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8,
                        background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)',
                        color: 'var(--success)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.1)'}>
                        <Icon.Check />APPROVE
                    </button>
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
                    fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.08)'}
                >
                <Icon.Ban/>CANCEL STAKE 
            </button>
        </div>
    );
}

// live tab for mod **global chat
function ModLiveTab({chatMessages, onDeleteMessages}) {
    const [inputText, setInputText] = useState('');
    const [messages, setMessages] = useState(chatMessages);
    
    // handle sending 
    const handleSend = () => {
        const trimmed = inputText.trim();
        if (!trimmed){
            return;
        }
        setMessages(prev => [
            ...prev, {id: Date.now(), user: 'MOD', initials: 'MD', color: 'var(--accent)', text: trimmed},
        ]);
        setInputText('');
    };

    const handleDelete = (id) => {
        onDeleteMessages(id);
        setMessages(prev => prev.filter(m => m.id !== id));
    };

    return (
        <div style={{
            display: 'flex',  flexDirection: 'row', gap: 16, alignItems: 'flex-start', animation: 'fadeIn 0.4s ease',
        }}>
            <div style={{
                flex: '0 0 72%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: 520, gap: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 32,
            }}>
                <div style={{
                    width: 72, height: 72, borderRadius: '50%', background: 'rgba(198, 241, 53, 0.08)',
                    border: '1px solid rgba(198, 241, 53, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <Icon.Shield />
                </div>
                <h3 style={{
                    fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: '0.06em', color: 'var(--text-primary)',
                }}>MODERATION VIEW</h3>
                <p style={{
                    fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center;, maxWidth: 30,'
                }}>Monitor the global chat and remove and inappropriate messages.</p>
            </div>
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', border: '1px solid var(--border)',
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
                    flex: 1, overflowY: 'auto', padding: '12px 12px 8px', display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                    {messages.map(msg => (
                        <div key={msg.id} style={{
                            display: 'flex', gap: 8, alignItems: 'flex-start', padding: '4px 6px', borderRadius: 8, transition: 'background 0.2s',
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
                                    fontSize: 10, fontWeight: 700, color: msg.color, fontFamily: 'var(--font-mono)',
                                }}>{msg.user}</span>
                                <span style={{
                                    fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5,
                                }}>{msg.text}</span>
                            </div>
                            <button onClick={() => handleDelete(msg.id)} title="Delete message" style={{
                                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 6,
                                background: 'rgba(255, 71, 87, 0.08)', border: '1px solid rgba(255, 71, 87, 0.2)', color: 'var(--danger)',
                                fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 71, 87, 0.08)'}>
                                <Icon.Trash /> DEL
                            </button>
                        </div>
                    ))}
                </div>
                <div style={{
                    padding: '10px, 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center',
                    flexShrink: 0, background: 'var(--bg-secondary)',
                }}>
                    <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Moderator messgae..." style={{
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
export default function modDash({
    username, proposals, onApprove, onDecline, chatMessages, onDeleteMessage, players, teams, games, onCancelStake,
}) {
    const [activeTab, setActiveTab] = useState(MOD_TABS.PROPOSALS);
    const {confirm, modal} = useConfirm;

    const handleApprove = async (id) => {
        const proposal = proposals.find(p => p.id === id);
        const ok = await confirm({
            title: 'APPROVE PROPOSAL', message: `Approve this ${proposal?.category} bet and move it to the live pool?`, confirmLabel: 'APPROVE',
        });
        if (ok){
            onApprove(id);
        }
    };

    const handleDecline = async (id) => {
        const ok = await confirm({
            title: 'DECLINE PROPOSAL', message: 'Decline and permanently delete this proposal? This cannot be undone.', confirmLabel: 'DECLINE', confrimDanger: true,
        });
        if (ok) {
            onDecline(id);
        }
    };

    const handleCancelStake = async (type, id) => {
        const ok = await confirm({
            title: 'CANCEL STAKE', message: `Remove this ${type} stake from the active pool? All associated bets will be voided.`, confirmLabel: 'CANCEL STAKE', confirmDanger: true,
        });
        if (ok){
            onCancelStake(type, id);
        }
    };

    const handleDeleteMessage = async (msgId) => {
        const ok = await confirm({
            title: 'DELETE MESSAGE', message: 'Permanently delete this chat message? This action cannot be undone.', confirmLabel: 'DELETE', confirmDanger: 'true',
        });
        if (ok) {
            onDeleteMessage(msgId);
        }
    };

    const renderContent = () => {
        switch(activeTab) {
            case MOD_TABS.PROPOSALS:
                return (
                    <ProposalsTab proposals={proposals} onapprove={handleApprove} onDecline={handleDecline} />
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
            case MOD_TABS.LIVE: 
                return(
                    <ModLiveTab chatMessages={chatMessages} onDeleteMessage={handleDeleteMessage} />
                );
            default: 
                return null;
            
        }
    };

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
                        }}>MODERATOR MODE - ELEVATED PERISSIONS ACTIVE</span>
                    </div>
                    <div style={{
                        display: 'flex', padding: '0 20px', minWidth: 'max-content',
                    }}>
                        {MOD_TAB_CONFIG.map(tab => {
                            const isActive = activeTab === tab.key;
                            const pendingCount = tab.badge ? proposals.length : 0;
                            return (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                                    display: 'flex', alignItems: 'center', gap: 7, padding: '0 16px', height: 'var(--tab-height)', background: 'none', 
                                    color: isActive ? 'var(--accent)' : 'var(--text-muted)', letterSpacing: '0.04em', fontSize: 13,
                                    borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent', transition: 'all 0.2s', flexSrhink: 0,
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
                            </button>
                            );
                        })}
                    </div>
                </div>
                <div style={{
                    maxWidth: 1100, margin: '0 auto', padding: '28px 20px 80px',
                }}>
                    <div style={{
                        marginBottom: 24,
                    }}>
                        <h2 style={{
                            fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: '0.06em', color: 'var(--text-primary)',
                        }}>
                            {currentTabLabel.toUpperCase()}
                        </h2>
                        {activeTab === MOD_TABS.PROPOSALS && ( <p style={{
                            fontSize: 13, color: 'var(--text-secondary)', marginTop: 4,
                        }}>Review and activate bet proposals submitted by users.</p>
                        )}
                        {(activeTab === MOD_TABS.PLAYERS || activeTab === MOD_TABS.TEAMS || activeTab === MOD_TABS.GAMES) && ( <p style={{
                            fontSize: 13, color: 'var(--text-secondary)', marginTop: 4,
                        }}>Cancel active stakes to remove them from the board.</p>
                        )}
                    </div>
                    {renderContent()}
                </div>
            </div>
        </>
    );
}
