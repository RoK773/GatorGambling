import { useState } from 'react';
import { useRouter } from 'next/router';
import { Zap } from 'lucide-react';

export default function SimulatePage() {
    const router = useRouter();
    const [team1, setTeam1] = useState(''); //track first input
    const [team2, setTeam2] = useState(''); //second
    const [result, setResult] = useState(''); // simulation result from omalla
    const [loading, setLoading] = useState(false); //waits for api response
    const [error, setError] = useState(''); //stores errors

    const handleSimulate = async () => {
        if (!team1 || !team2) return;  //waits for both inputs
        setLoading(true); //loading state
        setError(''); // these clear previous results when starting a new simulation
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
        } catch (err) {
            setError(err.message || 'Simulation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh', background: 'var(--bg-primary)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: 24,
        }}>
            <button onClick={() => router.push('/')} style={{ //back button
                position: 'fixed', top: 20, left: 20,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '8px 16px', color: 'var(--text-secondary)',
                cursor: 'pointer', fontSize: 13,
            }}>← Back</button>

            <div style={{ maxWidth: 480, width: '100%' }}> 
                <div style={{ textAlign: 'center', marginBottom: 40 }}> 
                    <div style={{
                        width: 64, height: 64, borderRadius: 18, background: 'var(--accent)', //zap icon
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px', boxShadow: '0 0 32px var(--accent-glow)',
                    }}>
                        <Zap size={30} color="#080A0F" strokeWidth={2.5} />
                    </div>
                    <h1 style={{ // title and description
                        fontFamily: 'var(--font-display)', fontSize: 36,
                        letterSpacing: '0.08em', color: 'var(--text-primary)', marginBottom: 8,
                    }}>2026 WC MATCH SIMULATOR</h1>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        Enter two teams below:
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                    <input
                        value={team1} //team 1 input
                        onChange={e => setTeam1(e.target.value)}
                        placeholder="Team 1 (e.g. Brazil)"
                        style={{
                            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                            borderRadius: 10, padding: '13px 16px', fontSize: 14,
                            color: 'var(--text-primary)', outline: 'none',
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                    <input
                        value={team2} //team 2 input
                        onChange={e => setTeam2(e.target.value)}
                        placeholder="Team 2 (e.g. France)"
                        style={{
                            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                            borderRadius: 10, padding: '13px 16px', fontSize: 14,
                            color: 'var(--text-primary)', outline: 'none',
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                    />
                    <button onClick={handleSimulate} disabled={loading || !team1 || !team2} style={{ //simulate button (changes when loading)
                        background: loading ? 'var(--bg-card)' : 'var(--accent)',
                        color: loading ? 'var(--text-muted)' : '#080A0F',
                        fontWeight: 700, fontSize: 15, letterSpacing: '0.06em',
                        padding: '14px', borderRadius: 10, border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                    }}>
                        {loading ? 'SIMULATING...' : 'SIMULATE MATCH'}
                    </button> 
                </div>

                {error && ( //red error box
                    <div style={{
                        background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.25)',
                        borderRadius: 10, padding: '12px 16px', color: 'var(--danger)', fontSize: 13, marginBottom: 16,
                    }}>{error}</div>
                )}

                {result && ( //result box that displays all output
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
                        <p><strong>Winner:</strong>{' '}
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
                                {event.minute}'
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
                                    : event.event === 'yellow_card'
                                    ? 'rgba(250,204,21,0.15)'
                                    : event.event === 'red_card'
                                    ? 'rgba(239,68,68,0.15)'
                                    : event.event === 'injury'
                                    ? 'rgba(249,115,22,0.15)'
                                    : 'rgba(59,130,246,0.15)',
                                color:
                                event.event === 'goal'
                                    ? '#22c55e'
                                    : event.event === 'yellow_card'
                                    ? '#facc15'
                                    : event.event === 'red_card'
                                    ? '#ff0000'
                                    : event.event === 'injury'
                                    ? '#ff9900'
                                    : '#3b82f6',
                                textTransform: 'capitalize',
                                fontWeight: 600,
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
        </div>
    );
}