import { useRouter } from 'next/router';
import MatchSimulationPanel from '../components/matchSimulationPanel';

export default function SimulatePage() {
    const router = useRouter();

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

            <MatchSimulationPanel />
        </div>
    );
}