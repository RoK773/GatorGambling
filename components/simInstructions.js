export default function SimInstructions({ compact = false }) {
    return (
        <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: compact ? '10px 12px' : '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
        }}>
            <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.2em',
                color: 'var(--text-secondary)',
            }}>
                BETTING SYSTEM
            </div>
            <div style={{
                fontSize: compact ? 11 : 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.55,
            }}>
                You can only propose bets before a match is simulated. While a match is being simulated, users can place bets. Once the simulation ends, the final result is shown in the Live tab with match events.
            </div>
        </div>
    );
}