// acts as a confirmation before moderator actions take effect
export default function ConfirmModal({
    title = 'CONFIRM ACTION',
    message = 'Are you sure you want to proceed?',
    confirmLabel = 'Confirm',
    confirmDanger = false,
    onConfirm,
    onCancel,
}) {
    return(
        // backdrop setup
        <div onClick={onCancel} style={{
            position: 'fixed', inset: 0, zInded: 1000, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 0.15s ease',
        }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-bright)', borderRadius: 18,
                padding: '32px 28px', maxWidth: 400, width: '100%', boxShadow: '0 32px 80px rgba(0, 0, 0, 0.65)', animation: 'slideUp 0.2s ease',
            }}>
                <div style={{
                    width: 48, height: 48, borderRadius: 14, marginBottom: 18, background: confirmDanger ? 'rgba(255, 71, 87, 0.1)' : 'rgba(198, 241, 53, 0.1)',
                    border: confirmDanger ? '1px solid rgba(255, 71, 87, 0.25)' : '1px solid rgba(198, 241, 53, 0.25)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 22,
                }}>
                    {confirmDanger ? '!' : '-'}
                </div>
                <h3 style={{
                    fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.06em', 
                    marginBottom: 10, color: 'var(--text-primary)',
                }}>{title}</h3>
                <p style={{
                    fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 28,
                }}>{message}</p>
                <div style={{
                    display: 'flex', gap: 10
                }}>
                    <button onClick={onCancel} style={{
                        flex: 1, padding: '13px', borderRadius: 10, fontWeight: 600, fontSize: 13, letterSpacing: '0.05em',
                        background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s'
                    }} onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--bg-card-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                    }} onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                    }}>CANCEL</button>
                    <button onClick={onConfirm} style={{
                        flex: 1, padding: '13px', borderRadius: 10, fontWeight: 700, fontSize: 13, letterSpacing: '0.05em',
                        background: confirmDanger ? 'rgba(255, 71, 87, 0.12)' : 'var(--accent)', 
                        border: confirmDanger ? '1px solid rgba(255, 71, 87, 0.4)' : 'none', color: confirmDanger ? 'var(--danger)' : '#080A0F',
                        pointer: 'cursor', transition: 'all 0.2s',
                    }} onMouseEnter={e => {
                        e.currentTarget.style.opacity = '0.85';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                    }} onMouseLeave={e =>{
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.transform = 'none';
                    }}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
}