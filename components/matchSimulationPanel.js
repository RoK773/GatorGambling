import { useEffect, useState } from 'react';
import SimInstructions from './simInstructions';

export default function MatchSimulationPanel({homeTeam = '', awayTeam = '', initialResult = null, onSimulated}) {
    const [team1, setTeam1] = useState(homeTeam);
    const [team2, setTeam2] = useState(awayTeam);
    const [result, setResult] = useState(initialResult || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setTeam1(homeTeam || '');
        setTeam2(awayTeam || '');
        setResult(initialResult || '');
        setError('');
    }, [awayTeam, homeTeam, initialResult]);

    const formatMinuteLabel = (minute) => {
        const raw = String(minute ?? '').trim();
        const base = raw.endsWith("'") ? raw.slice(0, -1).trim() : raw;
        return `${base}'`;
    };

    const handleSimulate = async () => {
        if (!team1 || !team2) return;
        setLoading(true);
        setError('');
        setResult('');

        try {
            const response = await fetch('/api/simulate_match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ homeTeam: team1, awayTeam: team2 }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            setResult(data);
            if (typeof onSimulated === 'function') {
                onSimulated({homeTeam: team1, awayTeam: team2, result: data});
            }
        } catch (err) {
            setError(err.message || 'Simulation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 480, width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <h1 style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 30,
                    letterSpacing: '0.08em',
                    color: 'var(--text-primary)',
                    marginBottom: 8,
                }}>
                    2026 World Cup MATCH SIMULATOR
                </h1>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                <input
                    value={team1}
                    onChange={e => setTeam1(e.target.value)}
                    placeholder="Team 1 (e.g. Brazil)"
                    readOnly={Boolean(homeTeam)}
                    style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        padding: '13px 16px',
                        fontSize: 14,
                        color: 'var(--text-primary)',
                        outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <input
                    value={team2}
                    onChange={e => setTeam2(e.target.value)}
                    placeholder="Team 2 (e.g. France)"
                    readOnly={Boolean(awayTeam)}
                    style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: 10,
                        padding: '13px 16px',
                        fontSize: 14,
                        color: 'var(--text-primary)',
                        outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                />
                <SimInstructions compact />
                <button
                    onClick={handleSimulate}
                    disabled={loading || !team1 || !team2}
                    style={{
                        background: loading ? 'var(--bg-card)' : 'var(--accent)',
                        color: loading ? 'var(--text-muted)' : '#080A0F',
                        fontWeight: 700,
                        fontSize: 15,
                        letterSpacing: '0.06em',
                        padding: '14px',
                        borderRadius: 10,
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                    }}
                >
                    {loading ? 'SIMULATING...' : 'SIMULATE MATCH'}
                </button>
            </div>

            {error && (
                <div style={{
                    background: 'rgba(255,71,87,0.08)',
                    border: '1px solid rgba(255,71,87,0.25)',
                    borderRadius: 10,
                    padding: '12px 16px',
                    color: 'var(--danger)',
                    fontSize: 13,
                    marginBottom: 16,
                }}>
                    {error}
                </div>
            )}

            {result && (
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: 14,
                    padding: 24,
                    whiteSpace: 'pre-wrap',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    lineHeight: 1.8,
                    animation: 'fadeIn 0.4s ease',
                }}>
                    <p><strong>Score:</strong> {team1} {result.score.split('-')[0]} - {team2} {result.score.split('-')[1]}</p>
                    <p><strong>Ball possession:</strong> {team1} {result.ball_possession.split('-')[0].trim()} - {team2} {result.ball_possession.split('-')[1].trim()}</p>
                    <p><strong>Fouls:</strong> {team1} {result.fouls.split('-')[0].trim()} - {team2} {result.fouls.split('-')[1].trim()}</p>
                    <p>
                        <strong>Winner:</strong>{' '}
                        {result.winner === 'home'
                            ? team1
                            : result.winner === 'away'
                            ? team2
                            : 'Draw'}
                    </p>

                    {result.match_events && result.match_events.length > 0 && (
                        <div style={{ marginTop: 20 }}>
                            <h3 style={{
                                marginBottom: 12,
                                fontSize: 16,
                                color: 'var(--text-primary)',
                                borderBottom: '1px solid var(--border)',
                                paddingBottom: 8,
                            }}>
                                Match Events
                            </h3>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                            }}>
                                {result.match_events.map((event, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            background: 'var(--bg-secondary)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 10,
                                            padding: '10px 14px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <div>
                                            <span style={{
                                                fontWeight: 700,
                                                color: 'var(--accent)',
                                                marginRight: 10,
                                            }}>
                                                {formatMinuteLabel(event.minute)}
                                            </span>

                                            <span style={{ color: 'var(--text-primary)' }}>
                                                {event.description}
                                            </span>
                                        </div>

                                        <span style={{
                                            fontSize: 12,
                                            padding: '4px 8px',
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
                                            marginLeft: 10,
                                        }}>
                                            {event.event.replace('_', ' ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
